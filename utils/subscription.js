const crypto = require('../utils/crypto');

/**
 * Creates a new presence change subscription.
 * @param {*} client the Microsoft Graph client
 * @param {object} db an object that mediates the database access
 * @param {boolean} rich boolean indicating if the notification is a rich notification
 * @returns a subscription
 */
async function newSubscription(client, db, rich) {
    // ensure a certificate exists
    // this is required for rich notifications
    await crypto.createSelfSignedCertificateIfNotExists(
        `../${process.env.CERTIFICATE_PATH}`,
        `../${process.env.PRIVATE_KEY_PATH}`,
        process.env.PRIVATE_KEY_PASSWORD,
    );

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

    return subscription;
}

module.exports = {
    newSubscription,
}
