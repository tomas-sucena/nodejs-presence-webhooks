// GET /home
module.exports = function (req, res) {
    const user = req.session.user;
    const db = req.app.locals.db;

    // ensure the user is logged in
    if (!user) {
        return res.redirect('/');
    }

    res.set('Content-Type', 'text/html');
    res.write(`
        <h1 style="color:blue">Presence POC</h1>
        <p>
            Logged in as <strong>${user.displayName}</strong> (${user.mail})
        </p>
        <form method="POST" action="/logout">
            <button>Logout</button>
        </form>
        <h2>Subscriptions</h2>
        <form method="POST" action="/subscribe">
            <label>
                <strong>Email:</strong>
                <input name="mail" placeholder="example@criticalmanufacturing.com">
            </label>
            <button>Subscribe</button>
        </form>
    `);

    // verify if we are subscribed to any presence changes
    if (db.countUsers() === 0) {
        return res.write('It seems there are no subscriptions...');
    }

    // display the users whose presence changes we are subscribed to
    const users = db.getUsers();

    res.write(`
        <p>
            <strong>Users: </strong> ${users.length}
        </p>
        <ul>
    `)
    
    for (const user of db.getUsers()) {
        res.write(`
            <li>
                <strong>${user.displayName}</strong> (${user.mail})
                <form method="POST" action="/unsubscribe">
                    <button name=mail value=${user.mail}>Unsubscribe</button>
                </form>
            </li>    
        `)
    }

    return res.write('</ul>');
}
