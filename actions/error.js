const router = require('express').Router();

// GET /error
module.exports = async function (req, res) {
    const error = req.session.error;

    // if there is no error to display,
    // go back to the beginning
    if (!error) {
        console.log('No errors to display!');
        return res.redirect('/');
    }

    res.set('Content-Type', 'text/html');
    return res.status(500).send(`
        <h1 style="color:red">Error!</h1>
        <p>
            <strong>Details:</strong>
            ${error}
        </p>
        <a href="/">
            <input type="button" value="Go back">
        </a>`
    );
}
