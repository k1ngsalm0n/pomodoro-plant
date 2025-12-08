const express = require('express');
const router = express.Router();
const db = require('../database');
const { generateToken } = require('../middleware/jwt');

// LOGIN - POST /api/login
router.post("/login", (req, res) => {
    try {
        console.log("Login attempt received:", req.body);

        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: "Username and password required" });
        }

        db.get(
            "SELECT * FROM users WHERE username = ? AND password = ?",
            [username, password],
            (err, row) => {
                if (err) {
                    console.error("Database error:", err);
                    return res.status(500).json({ error: "Internal server error" });
                }

                if (!row) {
                    console.log("Invalid login attempt for user:", username);
                    return res.status(401).json({ error: "Invalid login" });
                }

                // Generate JWT token
                const token = generateToken(row);

                // Also set session for SSR views compatibility
                req.session.user = row.username;

                console.log("Login successful for user:", row.username);
                res.json({
                    message: "Login success",
                    username: row.username,
                    token: token
                });
            }
        );
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// REGISTER - POST /api/register
router.post("/register", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
    }

    db.run(
        "INSERT INTO users (username, password) VALUES (?, ?)",
        [username, password],
        function (err) {
            if (err) {
                if (err.message.includes("UNIQUE constraint failed")) {
                    return res.status(400).json({ error: "Username already exists" });
                }
                console.error("Registration error:", err);
                return res.status(500).json({ error: "Internal server error" });
            }

            // Auto-login: generate token for newly registered user
            db.get("SELECT * FROM users WHERE id = ?", [this.lastID], (err, user) => {
                if (err || !user) {
                    return res.json({ message: "Registration successful" });
                }

                const token = generateToken(user);

                // Initialize user stats
                db.run("INSERT INTO user_stats (user_id) VALUES (?)", [user.id]);

                res.json({
                    message: "Registration successful",
                    username: user.username,
                    token: token
                });
            });
        }
    );
});

// LOGOUT - POST /api/logout
router.post("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Logout error:", err);
            return res.status(500).json({ error: "Could not log out" });
        }
        res.json({ message: "Logout success" });
    });
});

module.exports = router;
