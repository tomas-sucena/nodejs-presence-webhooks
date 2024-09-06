/**
 * Prints the availability of a user.
 * @param {string} availability the availability of the user
 * @param {object} user the user
 */
function logAvailability(availability, user) {
    process.stdout.write(`\x1b[1m${user.displayName}\x1b[0m (${user.mail}) is `);

    switch (availability) {
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

/**
 * Publishes an MQTT message to change the color of a smart lamp to the color corresponding to the user's availability.
 * @param {string} availability the availability of the user
 * @param {*} mqttClient the MQTT client
 */
function changeColorWithMQTT(availability, mqttClient) {
    // NOTE: The smart lamp has been flashed with Tasmota.
    switch (availability) {
        case 'Available':
        case 'AvailbleIdle':
            mqttClient.publish('cmnd/cmf/lamp/color', '2');
            break;

        case 'Away':
        case 'BeRightBack':
            mqttClient.publish('cmnd/cmf/lamp/color', '10');
            break;

        case 'Busy':
        case 'BusyIdle':
        case 'DoNotDisturb':
            mqttClient.publish('cmnd/cmf/lamp/color', '1');
            break;
    }
}

function Presence(payload, user, mqttClient) {
    // create the presence object
    this.activity = payload.activity;
    this.availability = payload.availability;
    this.log = logAvailability.bind(this, this.availability, user);
    this.changeColor = changeColorWithMQTT.bind(this, this.availability, mqttClient);
}

module.exports = {
    Presence,
}