const auth = require('../utils/auth');

// GET /login
module.exports = async function login(req, res) {
    const msalClient = auth.configureMSAL();
    
    // save the MSAL client
    req.app.locals.msalClient = msalClient;

    // Start the authorization code flow by redirecting the
    // browser to Microsoft identity platforms authorization URL
    const urlParameters = {
        scopes: process.env.OAUTH_SCOPES.split(','),
        redirectUri: process.env.OAUTH_REDIRECT_URI,
        prompt: 'select_account',
    };

    try {
        const authUrl = await msalClient.getAuthCodeUrl(urlParameters);
        res.redirect(authUrl);
    }
    catch (error) {
        console.log(error);
    }
}
