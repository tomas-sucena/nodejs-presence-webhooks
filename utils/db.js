const Database = require('better-sqlite3');

/**
 * Adds the new active subscription to the database.
 * @param {Database} db the database
 * @param {string} id the ID of the subscription 
 */
function addSubscription(db, id) {
    db.prepare('INSERT INTO subscriptions (id) VALUES (?)')
        .run(id);
}

function removeSubscription(db) {
    const subscription = db.prepare('SELECT * FROM subscriptions')
        .get();

    // if a subscription exists, delete it
    if (subscription) {
        db.prepare('DELETE FROM subscriptions where id = ?')
            .run(subscription.id);

        // clear the user's table
        db.prepare('DELETE FROM users')
            .run();
    }
}

/**
 * Returns the ID of the current active subscription, if any.
 * @param {Database} db the database 
 * @returns the ID of the current active subscription, 'undefined' otherwise
 */
function getSubscription(db) {
    const subscription = db.prepare('SELECT * FROM subscriptions')
        .get();

    if (subscription) {
        return subscription.id;
    }
}

/**
 * Adds a new user to the list of users whose presences changes we are subscribing to.
 * @param {Database} db the database
 * @param {string} id the ID of the user whose presence changes we subscribed to  
 * @param {string} mail the email of the user whose presence changes we subscribed to 
 * @param {string} displayName the display name of the user whose presence changes we subscribed to 
 */
function addUser(db, {id, mail, displayName}) {
    // store the subscription in the table
    db.prepare('INSERT INTO users (id, mail, displayName) VALUES (?, ?, ?)')
        .run([id, mail, displayName]);
};

/**
 * Removes a user from the list of users whose presence changes we are subscribing to.
 * @param {Database} db the database
 * @param {string} mail the email of the user whose presence changes we want to unsubscribe 
 */
function removeUser(db, mail) {
    // prepare the INSERT statement
    const subscription = db.prepare('SELECT id FROM users WHERE mail = ?')
        .get(mail);
    
    // if a subscription exists, delete it
    if (subscription) {
        db.prepare('DELETE FROM users WHERE mail = ?')
            .run(mail);
    }
}

/**
 * Returns the profile information (email and display name) of the users whose presence changes we are subscribed to.
 * @param {Database} db the database 
 * @returns an array containing the profile information (email and display name) of the users whose presence changes we are subscribed to
 */
function getUsers(db) {
    return db.prepare('SELECT mail, displayName from users')
        .all();
}

/**
 * Counts the number of users whose presence changes we are currently subscribed to.
 * @param {Database} db the database 
 * @returns the number of users whose presence changes we are currently subscribed to
 */
function countUsers(db) {
    return db.prepare('SELECT count(*) FROM users')
        .get()
        ["count(*)"];
}

/**
 * Returns a comma-separated string containing the IDs of the users whose presence changes we are subscribing to.
 * @param {Database} db the database
 */
function listUserIDs(db) {
    return db.prepare('SELECT id FROM users')
        .all()
        .map(obj => `'${obj.id}'`)
        .join(',');
}

function DB(filePath) {
    // initialize the database
    const db = new Database(filePath ?? ':memory:');

    // create the subscriptions' table
    db.exec(`
        DROP TABLE IF EXISTS subscriptions;
        CREATE TABLE subscriptions (
            id TEXT PRIMARY KEY
        );
    `);

    this.addSubscription = addSubscription.bind(null, db);
    this.removeSubscription = removeSubscription.bind(null, db);
    this.getSubscription = getSubscription.bind(null, db);

    // create the users' table
    db.exec(`
        DROP TABLE IF EXISTS users;
        CREATE TABLE users (
            id TEXT PRIMARY KEY,
            mail TEXT NOT NULL UNIQUE,
            displayName TEXT NOT NULL
        );
    `);

    this.addUser = addUser.bind(null, db);
    this.removeUser = removeUser.bind(null, db);
    this.getUsers = getUsers.bind(null, db);
    this.countUsers = countUsers.bind(null, db);
    this.listUserIDs = listUserIDs.bind(null, db);
}

module.exports = {
    DB
};
