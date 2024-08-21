const crypto = require('../utils/crypto');

/**
 * Creates a new presence change subscription.
 * @param {*} client the Microsoft Graph client
 * @param {object} db an object that mediates the database access
 * @param {boolean} rich boolean indicating if the notification is a rich notification
 * @returns the ID of the newly created subscription
 */
async function newSubscription(client, db, rich) {
    // ensure a certificate exists
    // this is required for rich notifications
    if (rich) {
        await crypto.createSelfSignedCertificateIfNotExists(
            `../${process.env.CERTIFICATE_PATH}`,
            `../${process.env.PRIVATE_KEY_PATH}`,
            process.env.PRIVATE_KEY_PASSWORD,
        );
    }

    // write the payload
    const host = process.env.NGROK_PROXY;
    const payload = {
        changeType: 'updated',
        notificationUrl: `${host}/receive`,
        lifecycleNotificationUrl: `${host}/renew`,
        resource: `/communications/presences?$filter=id in (${db.listUserIDs()})`,
        expirationDateTime: new Date(Date.now() + 3600000).toISOString(),
        clientState: process.env.OAUTH_CLIENT_STATE,
        includeResourceData: rich,
    };

    // to get resource data, we must provide a public key that
    // Microsoft Graph will use to encrypt the notifications
    // See https://learn.microsoft.com/graph/webhooks-with-resource-data#creating-a-subscription
    if (rich) {
        payload.encryptionCertificate = crypto.getSerializedCertificate(
            `../${process.env.CERTIFICATE_PATH}`,
        );
        payload.encryptionCertificateId = process.env.CERTIFICATE_ID;
    }

    // create the subscription
    const subscription = await client.api('/subscriptions')
        .post(payload);

    // add the subscription to the database
    db.addSubscription(subscription.id);

    return subscription.id;
}

/**
 * Cancels the current presence change subscription.
 * @param {*} client the Microsoft Graph client
 * @param {object} db an object that mediates the database access
 */
async function cancelSubscription(client, db) {
    // verify if there is an active subscription
    // if so, retrieve its ID
    const subscriptionId = db.getSubscription();

    // cancel the subscription, if it exists
    if (subscriptionId) {
        await client.api(`/subscriptions/${subscriptionId}`)
            .delete();
            
        // remove the subscription from the database
        db.removeSubscription();
    }
}

module.exports = {
    newSubscription,
    cancelSubscription,
}
