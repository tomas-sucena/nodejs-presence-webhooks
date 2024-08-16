/**
 * Prints the availability of a user.
 * @param {string} availability the availability of the user
 * @param {object} user the user
 */
function logAvailability(availability, user) {
    process.stdout.write(`\x1b[1m${user.displayName}\x1b[0m (${user.mail}) is `);

    switch (this.availability) {
        case 'Available':
        case 'AvailbleIdle':
            console.log(`\x1b[32m${availability}\x1b[0m`);
            break;

        case 'Away':
        case 'BeRightBack':
            console.log(`\x1b[33m${availability}\x1b[0m`);
            break;

        case 'Busy':
        case 'BusyIdle':
        case 'DoNotDisturb':
            console.log(`\x1b[31m${availability}\x1b[0m`);
            break;

        case 'Offline':
            console.log(`\x1b[30;1m${availability}\x1b[0m`);
            break;

        default:
            console.log(availability);
    } 
};

function Presence(payload, user) {
    // create the presence object
    this.activity = payload.activity;
    this.availability = payload.availability;
    this.log = logAvailability.bind(this, this.availability, user);
}

module.exports = {
    Presence,
}