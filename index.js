require('dotenv').config();

const express = require('express');
const session = require('express-session');

const callback = require('./actions/callback');
const error = require('./actions/error');
const login = require('./actions/login');
const receive = require('./actions/receive');
const renew = require('./actions/renew');
const home = require('./actions/home');
const logout = require('./actions/logout');
const subscribe = require('./actions/subscribe')
const unsubscribe = require('./actions/unsubscribe');

const auth = require('./utils/auth');
const { DB } = require('./utils/db');

// initialize the application
const app = express();

// initialize the database
app.locals.db = new DB(process.env.DATABASE_PATH);

// set up the middleware
app.use(
    session({
        secret: 'keyboard cat',
        resave: false,
        saveUninitialized: true,
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// set up the routes
app.get('/callback', callback);
app.get('/error', error);
app.get('/home', home);
app.get('/login', login);
app.post('/logout', logout);
app.post('/receive', receive);
app.post('/renew', renew);
app.post('/subscribe', subscribe);
app.post('/unsubscribe', unsubscribe);

// GET /
app.get('/', function (req, res) {
    return res.redirect(req.session.user
        ? '/home'   
        : '/login');
});

// default
app.use(function (req, res) {
    req.session.error = `No webpage was found for the web address: ${req.url}`;
    return res.status(404).redirect('/error');
});

// initialize the server
const port = process.env.PORT || 8080;
const server = app.listen(port, () => console.log(`Listening on port ${port}...`));

server.on('close', async function (_) {
    // fetch the database
    const db = app.locals.db;

    // if there is an active subscription when the server ends,
    // cancel it
    const subscriptionId = db.removeSubscription();

    if (subscriptionId) {
        // fetch the Microsoft Graph client
        const { msalClient, userAccountId } = app.locals;
        const client = auth.getClient(msalClient, userAccountId);

        await client.api(`/subscriptions/${subscriptionId}`)
            .delete();
    }
});

process.on('SIGTERM', () => server.close());
process.on('SIGINT', () => server.close());
