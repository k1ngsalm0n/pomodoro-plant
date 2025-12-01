function requireLogin(req, res, next) {
    if (!req.session.user) {
        // If it's an API call, return JSON
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(403).json({ error: "Not logged in" });
        }
        // Otherwise redirect to login
        return res.redirect("/login");
    }
    next();
}

module.exports = requireLogin;
