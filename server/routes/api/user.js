const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middleware/jwt');
const db = require('../../database');
const flowers = require('../../data/flowers');

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

// GET /api/user/collection - Get user's unlocked plants
router.get("/collection", requireAuth, (req, res) => {
    const userId = req.user.id;

    db.all(
        "SELECT plant_id, unlocked_at FROM user_plants WHERE user_id = ?",
        [userId],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ error: "Database error" });
            }

            const unlockedPlants = rows.map(row => {
                const flower = flowers.find(f => f.id === row.plant_id);
                return { ...flower, unlocked_at: row.unlocked_at };
            });

            res.json({
                plants: unlockedPlants,
                total_available: flowers.length,
                unlocked_count: unlockedPlants.length
            });
        }
    );
});

module.exports = router;
