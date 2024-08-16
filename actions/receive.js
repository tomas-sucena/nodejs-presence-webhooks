require("dotenv").config();

const auth = require('../utils/auth');
const crypto = require('../utils/crypto.js');
const { isValidToken } = require('../utils/token');
const { Presence } = require('../utils/presence')

function decryptPayload(payload) {
    // decrypt the symmetric key sent by Microsoft Graph
    const symmetricKey = crypto.decryptSymmetricKey(
        payload.dataKey,
        `../${process.env.PRIVATE_KEY_PATH}`,
    );

    // validate the signature on the encrypted payload
    const isSignatureValid = crypto.verifySignature(
        payload.dataSignature,
        payload.data,
        symmetricKey,
    );

    if (!isSignatureValid) {
        return;
    }

    // decrypt the notification
    return JSON.parse(
        crypto.decryptPayload(
            payload.data,
            symmetricKey,
        )
    );
}

// POST /receive
module.exports = async function (req, res) {
    // verify if Microsoft sent an endpoint validation request
    // if so, return the token as plain text with a 200 response
    if (req.query && req.query.validationToken) {
        res.set('Content-Type', 'text/plain');
        res.send(req.query.validationToken);

        return;
    }

    res.status(202).end();

    // validate any validation tokens
    if (req.body.validationTokens) {
        const appId = process.env.CLIENT_ID;
        const tenantId = process.env.TENANT_ID;

        // terminate if any of the tokens is invalid
        for (const token of req.body.validationTokens) {
            if (!await isValidToken(token, appId, tenantId)) { 
                return;
            }
        }
    }

    // fetch the Microsoft Graph client
    const { msalClient, userAccountId } = req.app.locals;
    const client = auth.getClient(msalClient, userAccountId);

    // process the notifications
    for (const notification of req.body.value) {
        // ensure the client state matches the expected value
        if (notification.clientState != process.env.OAUTH_CLIENT_STATE) {
            continue;
        }

        // verify if the notification is a rich notification
        // if so, decrypt it
        const payload = notification.encryptedContent
            ? decryptPayload(notification.encryptedContent)
            : notification.resourceData;

        // fetch the profile information of the user whose presence changed
        const user = await client.api(`users/${payload.id}`)
            .select('displayName, mail')
            .get();

        // log the presence information
        await new Presence(payload, user).log();
    }
};
