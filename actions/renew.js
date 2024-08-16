require('dotenv').config();

async function renewSubscription(msalClient, subscriptionId) {
    const client = getClient(msalClient, req.session.user.id);

    try {
        await client.api(`subscriptions/${subscriptionId}`)
            .update({
                expirationDateTime: new Date(Date.now() + 3600000).toISOString(),
            });

        console.log(`Renewed subscription ${subscriptionId}`);
    }
    catch (error) {
        console.error(`Error updating subscription ${subscriptionId}!`);
        
        req.session.error = error.message;
        res.redirect('/error');
    }
}

// POST /renew
module.exports = async function (req, res) {
    // verify if Microsoft sent an endpoint validation request
    // if so, return the token as plain text with a 200 response
    if (req.query && req.query.validationToken) {
        res.set('Content-Type', 'text/plain');
        res.send(req.query.validationToken);

        return;
    }

    for (const notification of req.body.value) {
        // verify if the client state matches the expected value
        // and ensure the notification is a lifecycle notification
        if (notification.clientState == process.env.CLIENT_STATE
            && notification.lifecycleEvent == 'reauthorizationRequired') {
                await renewSubscription(req.app.locals.msalClient, notification.subscriptionId);
        }
    }

    return res.status(202).end();
}
