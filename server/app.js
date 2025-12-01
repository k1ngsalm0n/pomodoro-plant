const express = require("express");
const session = require("express-session");
const cors = require("cors");
const path = require("path");

const app = express();

// Import Routes
const authRoutes = require('./routes/auth');
const viewRoutes = require('./routes/views');
const apiRoutes = require('./routes/api');
const assetRoutes = require('./routes/assets');

// Add global error handler for uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: true, // Allow all origins for now
    credentials: true
}));

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(
    session({
        secret: "mySecret123",
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: false,
            maxAge: 1000 * 60 * 60 * 24 // 24 hours
        }
    })
);

// IMPORTANT: Register dynamic asset routes BEFORE static middleware
app.use('/', assetRoutes);

// Static files - this should come AFTER dynamic routes
app.use(express.static(path.join(__dirname, 'public')));

// Use Routes
app.use('/', authRoutes);
app.use('/', viewRoutes);
app.use('/', apiRoutes);

const PORT = 5001;
app.listen(PORT, () => {
    console.log(`SERVER running at http://localhost:${PORT}`);
    console.log("Health check: http://localhost:5001/health");
}).on('error', (err) => {
    console.error('Server error:', err);
});