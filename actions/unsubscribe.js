const auth = require('../utils/auth');
const { newSubscription } = require('../utils/subscription');

module.exports = async function (req, res) {
    const subscriptionId = req.session.subscriptionId;

    // fetch the Microsoft Graph client
    const { msalClient, userAccountId } = req.app.locals;
    const client = auth.getClient(msalClient, userAccountId);
    
    // fetch the database
    const db = req.app.locals.db;

    try {
        // delete the current subscription
        await client.api(`/subscriptions/${subscriptionId}`)
            .delete();

        // remove the user from the database
        db.removeUser(req.body.mail);

        // verify if there are still users whose presence
        // we want to track
        if (db.countUsers() > 0) {
            // create a new subscription
            const subscription = await newSubscription(client, db, false);

            // save the subscription ID
            req.session.subscriptionId = subscription.id;
        }

        res.redirect('/home');
    }
    catch (error) {
        req.session.error = error.message;
        res.redirect('/error'); 
    }
}
