require('dotenv').config();

const auth = require('../utils/auth');
const { newSubscription } = require('../utils/subscription');

// POST /subscribe
module.exports = async function (req, res) {
    // fetch the Microsoft Graph client
    const { msalClient, userAccountId } = req.app.locals;
    const client = auth.getClient(msalClient, userAccountId);

    // fetch the database
    const db = req.app.locals.db;

    try {
        const mail = req.body.mail;

        // ensure there is a user with the requested mail
        const user = await client.api(`/users/${mail}`)
            .select('id, mail, displayName')
            .get();

        // add the user to the database
        db.addUser(user);

        // verify if there is already a subscription
        // if so, delete it
        let subscriptionId = db.getSubscription();

        if (subscriptionId) {
            await client.api(`/subscriptions/${subscriptionId}`)
                .delete();
        }

        subscriptionId = await newSubscription(client, db, false);
        console.log(`Subscribed to Teams presence changes (${subscriptionId})`);

        res.redirect('/home');
    }
    catch (error) {
        console.log(error)
        req.session.error = error.message;
        res.redirect('/error');
    }
}
