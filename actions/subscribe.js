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
        let subscription = (await client.api('/subscriptions')
                .get())
                .value
                .find(sub => sub.applicationId === process.env.OAUTH_CLIENT_ID);

        // if a subscription exists, delete it
        if (subscription) {
            await client.api(`/subscriptions/${subscription.id}`)
                .delete();
        }

        // create the new subscription
        subscription = await newSubscription(client, db, false);

        // save the subscription ID
        req.session.subscriptionId = subscription.id;
        console.log(`Subscribed to Teams presence changes (${subscription.id})`);

        res.redirect('/home');
    }
    catch (error) {
        req.session.error = error.message;
        res.redirect('/error');
    }
}
