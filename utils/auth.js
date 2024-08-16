require('dotenv').config();
require('isomorphic-fetch');

const msal = require('@azure/msal-node');
const { Client } = require('@microsoft/microsoft-graph-client');

/**
 * Creates a new MSAL client, which will be used to retrieve tokens.
 * @returns an MSAL client
 */
function configureMSAL() {
    const msalConfig = {
        auth: {
            clientId: process.env.OAUTH_CLIENT_ID,
            authority: `${process.env.OAUTH_AUTHORITY}/${process.env.OAUTH_TENANT_ID}`,
            clientSecret: process.env.OAUTH_CLIENT_SECRET,
        },
        // I don't know what this property means,
        // but it's in the example, so I decided to keep it
        system: {
            loggerOptions: {
                loggerCallback: (_, message, containsPii) => {
                    if (containsPii) {
                        return;
                    }
                    console.log(message);
                },
                piiLoggingEnabled: false,
                logLevel: msal.LogLevel.Error,
            },
        },
    };

    // create a new MSAL application object
    return new msal.ConfidentialClientApplication(msalConfig);
}

/**
 * Authenticates using Microsoft Authentication Library and returns a new Microsoft Graph client.
 * @param {IConfidentialClientApplication} msalClient - the MSAL client used to retrieve app-only tokens
 * @param {string} userId - The user's account ID
 * @returns the Microsoft Graph client
 */
function getClient(msalClient, userAccountId) {
    // implement an auth provider that gets a token
    // from the app's MSAL client
    const authProvider = async (done) => {
        try {
            // get the user's account
            const userAccount = await msalClient
                .getTokenCache()
                .getAccountByHomeId(userAccountId);

            if (!userAccount) {
                return;
            }

            // get a token using client credentials
            const response = await msalClient.acquireTokenSilent({
                scopes: process.env.OAUTH_SCOPES.split(','),
                redirectUri: process.env.OAUTH_REDIRECT_URI,
                account: userAccount,
            });

            // First param to callback is the error,
            // Set to null in success case
            done(null, response.accessToken);
        }
        catch (err) {
            console.log(err);
            done(err, null);
        }
    };

    // initialize the MS Graph client, configured for delegated authentication
    return Client.init({
        authProvider
    });
}

module.exports = {
    configureMSAL,
    getClient,
};
