const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middleware/jwt');
const db = require('../../database');
const flowers = require('../../data/flowers');

// GET /api/plant/state - Fetch current plant type + growth stage
router.get("/state", requireAuth, (req, res) => {
    const userId = req.user.id;

    db.get(
        "SELECT * FROM plant_states WHERE user_id = ?",
        [userId],
        (err, plantState) => {
            if (err) {
                return res.status(500).json({ error: "Database error" });
            }

            if (!plantState) {
                // No plant yet, create one
                const randomPlant = flowers[Math.floor(Math.random() * flowers.length)];

                db.run(
                    "INSERT INTO plant_states (user_id, plant_type, growth_stage) VALUES (?, ?, 0)",
                    [userId, randomPlant.name],
                    function (err) {
                        if (err) {
                            return res.status(500).json({ error: "Failed to create plant" });
                        }

                        const flowerData = flowers.find(f => f.name === randomPlant.name);
                        res.json({
                            plant_type: randomPlant.name,
                            growth_stage: 0,
                            max_growth: 4,
                            flower: flowerData
                        });
                    }
                );
            } else {
                const flowerData = flowers.find(f => f.name === plantState.plant_type);
                res.json({
                    plant_type: plantState.plant_type,
                    growth_stage: plantState.growth_stage,
                    max_growth: 4,
                    last_updated: plantState.last_updated,
                    flower: flowerData
                });
            }
        }
    );
});

// POST /api/plant/grow - Increment plant growth stage by 1
// Called after each completed pomodoro - plant grows through stages 1-4
router.post("/grow", requireAuth, (req, res) => {
    const userId = req.user.id;
    const io = req.app.get('io');
    const requestedFlowerId = req.body.flowerId; // Flower ID sent from timer

    // Get the flower to use (either the requested one or random)
    const flowerToUse = requestedFlowerId
        ? flowers.find(f => f.id === requestedFlowerId)
        : flowers[Math.floor(Math.random() * flowers.length)];

    if (!flowerToUse) {
        return res.status(400).json({ error: "Invalid flower ID" });
    }

    db.get(
        "SELECT * FROM plant_states WHERE user_id = ?",
        [userId],
        (err, plantState) => {
            if (err) {
                return res.status(500).json({ error: "Database error" });
            }

            // If no plant state exists, create one at stage 1
            if (!plantState) {
                db.run(
                    "INSERT INTO plant_states (user_id, plant_type, growth_stage) VALUES (?, ?, 1)",
                    [userId, flowerToUse.name],
                    function (err) {
                        if (err) {
                            return res.status(500).json({ error: "Failed to create plant" });
                        }
                        res.json({
                            plant_type: flowerToUse.name,
                            growth_stage: 1,
                            is_fully_grown: false,
                            isNew: false,
                            flower: flowerToUse
                        });
                    }
                );
                return;
            }

            // Increment growth stage (max 4)
            const newStage = Math.min(plantState.growth_stage + 1, 4);
            const isFullyGrown = newStage >= 4;

            db.run(
                "UPDATE plant_states SET growth_stage = ?, last_updated = CURRENT_TIMESTAMP WHERE user_id = ?",
                [newStage, userId],
                function (err) {
                    if (err) {
                        return res.status(500).json({ error: "Failed to grow plant" });
                    }

                    const flowerData = flowers.find(f => f.name === plantState.plant_type);
                    let isNew = false;

                    // If fully grown (stage 4), unlock the flower and reset for next cycle
                    if (isFullyGrown && flowerData) {
                        db.run(
                            "INSERT OR IGNORE INTO user_plants (user_id, plant_id) VALUES (?, ?)",
                            [userId, flowerData.id],
                            (err) => {
                                if (err) {
                                    console.error("Error unlocking plant:", err);
                                } else {
                                    console.log(`[API] Unlocked flower: ${flowerData.name} (ID: ${flowerData.id})`);
                                }
                            }
                        );
                        isNew = true;

                        // Delete plant state so next cycle starts fresh with a new random plant
                        db.run("DELETE FROM plant_states WHERE user_id = ?", [userId], (err) => {
                            if (err) console.error("Error resetting plant state:", err);
                        });
                    }

                    const result = {
                        plant_type: plantState.plant_type,
                        growth_stage: newStage,
                        is_fully_grown: isFullyGrown,
                        isNew: isNew,
                        flower: flowerData
                    };

                    // Broadcast plant update via WebSocket
                    if (io) {
                        io.to(`user_${userId}`).emit('plant:update', result);
                    }

                    res.json(result);
                }
            );
        }
    );
});

// POST /api/plant/new - Generate random new plant species
router.post("/new", requireAuth, (req, res) => {
    const userId = req.user.id;
    const io = req.app.get('io');

    const randomFlower = flowers[Math.floor(Math.random() * flowers.length)];

    db.run(
        `INSERT INTO plant_states (user_id, plant_type, growth_stage) 
         VALUES (?, ?, 0)
         ON CONFLICT(user_id) DO UPDATE SET 
         plant_type = excluded.plant_type, 
         growth_stage = 0,
         last_updated = CURRENT_TIMESTAMP`,
        [userId, randomFlower.name],
        function (err) {
            if (err) {
                console.error("Error creating new plant:", err);
                return res.status(500).json({ error: "Failed to create new plant" });
            }

            const result = {
                plant_type: randomFlower.name,
                growth_stage: 0,
                max_growth: 4,
                flower: randomFlower
            };

            // Broadcast new plant via WebSocket
            if (io) {
                io.to(`user_${userId}`).emit('plant:update', result);
            }

            res.json(result);
        }
    );
});

module.exports = router;
