const express = require('express');
const router = express.Router();
const requireLogin = require('../middleware/auth');

const db = require('../database');
const flowers = require('../data/flowers');

// Protected timer settings
router.get("/timer-settings", requireLogin, (req, res) => {
    res.json({
        study: 25,
        shortBreak: 5,
        longBreak: 15,
        user: req.session.user
    });
});

// Complete cycle and unlock flower
router.post("/complete-cycle", requireLogin, (req, res) => {
    const username = req.session.user;
    const requestedFlowerId = req.body.flowerId; // The flower shown during the timer

    console.log(`[complete-cycle] Requested flower ID: ${requestedFlowerId}`);

    // Get user ID
    db.get("SELECT id FROM users WHERE username = ?", [username], (err, user) => {
        if (err || !user) return res.status(500).json({ error: "User not found" });

        // Get unlocked plants
        db.all("SELECT plant_id FROM user_plants WHERE user_id = ?", [user.id], (err, rows) => {
            if (err) return res.status(500).json({ error: "Database error" });

            const unlockedIds = rows.map(r => r.plant_id);
            console.log(`[complete-cycle] Already unlocked IDs: ${unlockedIds.join(', ')}`);

            // Check if the requested flower is already unlocked
            const requestedFlower = flowers.find(f => f.id === requestedFlowerId);
            let flowerToUnlock = null;
            let isNew = false;

            if (requestedFlower && !unlockedIds.includes(requestedFlowerId)) {
                // Unlock the flower that was shown during the timer
                flowerToUnlock = requestedFlower;
                isNew = true;
                console.log(`[complete-cycle] Unlocking requested flower: ${flowerToUnlock.name} (ID: ${flowerToUnlock.id})`);

                db.run(
                    "INSERT INTO user_plants (user_id, plant_id) VALUES (?, ?)",
                    [user.id, flowerToUnlock.id],
                    (err) => {
                        if (err) console.error("Error unlocking plant:", err);
                    }
                );
            } else {
                // If already unlocked or invalid, pick a random new flower
                const availableFlowers = flowers.filter(f => !unlockedIds.includes(f.id));
                console.log(`[complete-cycle] Requested flower already unlocked or invalid. Available flowers: ${availableFlowers.length}`);

                if (availableFlowers.length > 0) {
                    const randomIndex = Math.floor(Math.random() * availableFlowers.length);
                    flowerToUnlock = availableFlowers[randomIndex];
                    isNew = true;
                    console.log(`[complete-cycle] Unlocking random flower: ${flowerToUnlock.name} (ID: ${flowerToUnlock.id})`);

                    db.run(
                        "INSERT INTO user_plants (user_id, plant_id) VALUES (?, ?)",
                        [user.id, flowerToUnlock.id],
                        (err) => {
                            if (err) console.error("Error unlocking plant:", err);
                        }
                    );
                } else {
                    // All flowers unlocked, just show the requested one
                    flowerToUnlock = requestedFlower || flowers[0];
                    isNew = false;
                    console.log(`[complete-cycle] All flowers unlocked, showing: ${flowerToUnlock.name} (ID: ${flowerToUnlock.id})`);
                }
            }

            res.json({
                message: "Cycle completed",
                flower: flowerToUnlock,
                isNew: isNew
            });
        });
    });
});

// Get user's unlocked plants
router.get("/my-plants", requireLogin, (req, res) => {
    const username = req.session.user;

    db.get("SELECT id FROM users WHERE username = ?", [username], (err, user) => {
        if (err || !user) return res.status(500).json({ error: "User not found" });

        db.all("SELECT plant_id, unlocked_at FROM user_plants WHERE user_id = ?", [user.id], (err, rows) => {
            if (err) return res.status(500).json({ error: "Database error" });

            const unlockedPlants = rows.map(row => {
                const flower = flowers.find(f => f.id === row.plant_id);
                return { ...flower, unlocked_at: row.unlocked_at };
            });

            res.json({ plants: unlockedPlants, total: flowers.length });
        });
    });
});

// Test route to check if server is running
router.get("/health", (req, res) => {
    res.json({ status: "Server is running!" });
});

module.exports = router;
