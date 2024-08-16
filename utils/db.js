const Database = require('better-sqlite3');

/**
 * Adds a new user to the list of users whose presences changes we are subscribing to.
 * @param {Database} db the database
 * @param {string} id the ID of the user whose presence changes we subscribed to  
 * @param {string} mail the email of the user whose presence changes we subscribed to 
 * @param {string} displayName the display name of the user whose presence changes we subscribed to 
 */
function addUser(db, {id, mail, displayName}) {
    // store the subscription in the table
    db.prepare('INSERT INTO subscriptions (id, mail, displayName) VALUES (?, ?, ?)')
        .run([id, mail, displayName]);
};

/**
 * Removes a user from the list of users whose presence changes we are subscribing to.
 * @param {Database} db the database
 * @param {string} mail the email of the user whose presence changes we want to unsubscribe 
 */
function removeUser(db, mail) {
    // prepare the INSERT statement
    const subscription = db.prepare('SELECT id FROM subscriptions WHERE mail = ?')
        .get(mail);
    
    // if a subscription exists, delete it
    // and return its ID
    if (subscription) {
        db.prepare('DELETE FROM subscriptions WHERE mail = ?')
            .run(mail);
    }

    return subscription.id;
}

/**
 * Returns the profile information (email and display name) of the users whose presence changes we are subscribed to.
 * @param {Database} db the database 
 * @returns an array containing the profile information (email and display name) of the users whose presence changes we are subscribed to
 */
function getUsers(db) {
    return db.prepare('SELECT mail, displayName from subscriptions')
        .all();
}

/**
 * Counts the number of users whose presence changes we are currently subscribed to.
 * @param {Database} db the database 
 * @returns the number of users whose presence changes we are currently subscribed to
 */
function countUsers(db) {
    return db.prepare('SELECT count(*) FROM subscriptions')
        .get()
        ["count(*)"];
}

/**
 * Returns a comma-separated string containing the IDs of the users whose presence changes we are subscribing to.
 * @param {Database} db the database
 */
function listUserIDs(db) {
    return db.prepare('SELECT id FROM subscriptions')
        .all()
        .map(obj => `'${obj.id}'`)
        .join(',');
}

function DB(filePath) {
    // initialize the database
    const db = new Database(filePath ?? ':memory:');

    // create the table
    db.exec(`DROP TABLE IF EXISTS subscriptions;
        CREATE TABLE subscriptions (
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
