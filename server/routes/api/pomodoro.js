const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middleware/jwt');
const db = require('../../database');

// GET /api/pomodoro/settings - Get timer settings
router.get("/settings", requireAuth, (req, res) => {
    res.json({
        study: 25,
        short_break: 5,
        long_break: 15,
        sessions_until_long_break: 4,
        user: req.user.username
    });
});

// POST /api/pomodoro/start - Record start time
router.post("/start", requireAuth, (req, res) => {
    const userId = req.user.id;
    const { duration_minutes = 25, session_type = 'study' } = req.body;
    const io = req.app.get('io');

    db.run(
        "INSERT INTO pomodoro_sessions (user_id, started_at, duration_minutes, session_type) VALUES (?, CURRENT_TIMESTAMP, ?, ?)",
        [userId, duration_minutes, session_type],
        function (err) {
            if (err) {
                console.error("Error starting session:", err);
                return res.status(500).json({ error: "Failed to start session" });
            }

            const sessionId = this.lastID;
            const result = {
                session_id: sessionId,
                started_at: new Date().toISOString(),
                duration_minutes,
                session_type
            };

            // Broadcast timer start via WebSocket
            if (io) {
                io.to(`user_${userId}`).emit('timer:update', {
                    action: 'started',
                    ...result
                });
            }

            res.json(result);
        }
    );
});

// POST /api/pomodoro/complete - Record completed Pomodoro session
router.post("/complete", requireAuth, (req, res) => {
    const userId = req.user.id;
    const { session_id } = req.body;
    const io = req.app.get('io');

    // Update the session as completed
    db.run(
        "UPDATE pomodoro_sessions SET completed_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?",
        [session_id, userId],
        function (err) {
            if (err) {
                return res.status(500).json({ error: "Failed to complete session" });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: "Session not found" });
            }

            // Update user stats
            const today = new Date().toISOString().split('T')[0];

            db.get("SELECT * FROM user_stats WHERE user_id = ?", [userId], (err, stats) => {
                if (err) {
                    console.error("Error fetching stats:", err);
                }

                let newStreak = 1;
                if (stats) {
                    const lastDate = stats.last_session_date;
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    const yesterdayStr = yesterday.toISOString().split('T')[0];

                    if (lastDate === today) {
                        newStreak = stats.current_streak;
                    } else if (lastDate === yesterdayStr) {
                        newStreak = stats.current_streak + 1;
                    }
                }

                db.run(
                    `INSERT INTO user_stats (user_id, total_sessions, current_streak, longest_streak, last_session_date)
                     VALUES (?, 1, ?, ?, ?)
                     ON CONFLICT(user_id) DO UPDATE SET
                     total_sessions = total_sessions + 1,
                     current_streak = ?,
                     longest_streak = MAX(longest_streak, ?),
                     last_session_date = ?`,
                    [userId, newStreak, newStreak, today, newStreak, newStreak, today]
                );
            });

            const result = {
                message: "Session completed",
                session_id,
                completed_at: new Date().toISOString()
            };

            // Broadcast timer completion via WebSocket
            if (io) {
                io.to(`user_${userId}`).emit('timer:update', {
                    action: 'completed',
                    ...result
                });
            }

            res.json(result);
        }
    );
});

module.exports = router;
