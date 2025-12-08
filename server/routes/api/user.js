const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middleware/jwt');
const db = require('../../database');

// GET /api/user/stats - Return streaks, total sessions, etc.
router.get("/stats", requireAuth, (req, res) => {
    const userId = req.user.id;

    db.get("SELECT * FROM user_stats WHERE user_id = ?", [userId], (err, stats) => {
        if (err) {
            return res.status(500).json({ error: "Database error" });
        }

        if (!stats) {
            return res.json({
                total_sessions: 0,
                current_streak: 0,
                longest_streak: 0,
                last_session_date: null
            });
        }

        res.json({
            total_sessions: stats.total_sessions,
            current_streak: stats.current_streak,
            longest_streak: stats.longest_streak,
            last_session_date: stats.last_session_date
        });
    });
});

module.exports = router;
