const auth = require('../utils/auth');
const { newSubscription, cancelSubscription } = require('../utils/subscription');

module.exports = async function (req, res) {
    // fetch the Microsoft Graph client
    const { msalClient, userAccountId } = req.app.locals;
    const client = auth.getClient(msalClient, userAccountId);
    
    // fetch the database
    const db = req.app.locals.db;

    try {
        // delete the current subscription
        await cancelSubscription(client, db);

        // remove the user from the database
        db.removeUser(req.body.mail);

        // verify if there are still users whose presence
        // we want to track
        if (db.countUsers() > 0) {
            // create a new subscription
            await newSubscription(client, db, false);
        }

        res.redirect('/home');
    }
    catch (error) {
        req.session.error = error.message;
        res.redirect('/error'); 
    }
}
