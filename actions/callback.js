const auth = require('../utils/auth');
const { DB } = require('../utils/db');

// GET /callback
module.exports = async function (req, res) {
    // Microsoft identity platform redirects the browser here with the
    // authorization result
    const tokenRequest = {
      code: req.query.code,
      scopes: process.env.OAUTH_SCOPES.split(','),
      redirectUri: process.env.OAUTH_REDIRECT_URI,
    };

    const msalClient = req.app.locals.msalClient;

    try {
        // fetch the user account ID of the current user
        // NOTE: this identifier is different from the user's ID
        const response = await msalClient.acquireTokenByCode(tokenRequest);
        const userAccountId = response.account.homeAccountId;

        // get the user's profile information from Microsoft Graph
        const client = auth.getClient(msalClient, userAccountId);
        const user = await client.api('me')
            .select('id, displayName, mail')
            .get();
        
        // save the user
        req.session.user = user;

        // save the account ID
        req.app.locals.userAccountId = userAccountId;

        console.log(`Logged in as ${user.displayName} (${user.mail})`);
        res.redirect('/home');
    }
    catch (error) {
        console.error('Failed to login!');
        
        // invalidate the current user
        delete req.session.user;

        // save the error message
        req.session.error = error.toString();
        res.redirect('/error');
    }
}
