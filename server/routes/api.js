const express = require('express');
const router = express.Router();

// Import route modules
const plantRoutes = require('./api/plant');
const pomodoroRoutes = require('./api/pomodoro');
const userRoutes = require('./api/user');

// Mount routes
router.use('/plant', plantRoutes);
router.use('/pomodoro', pomodoroRoutes);
router.use('/user', userRoutes);

// Health check
router.get("/health", (req, res) => {
    res.json({ status: "Server is running!" });
});

module.exports = router;
