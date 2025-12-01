const express = require('express');
const router = express.Router();
const db = require('../database');

// LOGIN
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

                req.session.user = row.username;
                console.log("Login successful for user:", row.username);
                res.json({ message: "Login success", username: row.username });
            }
        );
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// REGISTER
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
            res.json({ message: "Registration successful" });
        }
    );
});

// LOGOUT
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
