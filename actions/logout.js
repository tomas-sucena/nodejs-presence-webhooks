const auth = require('../utils/auth');

// POST /logout
module.exports = async function (req, res) {
    // fetch the Microsoft Graph client
    const { msalClient, userAccountId } = req.app.locals;
    const client = auth.getClient(msalClient, userAccountId);

    // fetch the database
    const db = req.app.locals.db;

    try {
        // cancel the subscription, if it exists
        const subscriptionId = db.removeSubscription();

        if (subscriptionId) {
            await client.api(`/subscriptions/${subscriptionId}`)
                .delete();
        }

        // remove the user's account from MSAL cache
        const userAccount = await msalClient
            .getTokenCache()
            .getAccountByHomeId(userAccountId);

        if (userAccount) {
            await msalClient.getTokenCache()
                .removeAccount(userAccount);
        }

        // invalidate the user and their account ID
        delete req.session.user;
        delete req.app.locals.userAccountId;

        res.redirect('/');
    }
    catch (error) {
        console.error(`Could not logout!`);

        req.session.error = error.message;
        res.redirect('/error');
    }
}
