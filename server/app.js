const express = require("express");
const session = require("express-session");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("./middleware/jwt");

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
    cors: {
        origin: true,
        credentials: true
    }
});

// Make io accessible to routes
app.set('io', io);

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

// Use Routes - Auth and API routes mounted at /api
app.use('/api', authRoutes);
app.use('/api', apiRoutes);
app.use('/', viewRoutes);

// ============================================
// SOCKET.IO WEBSOCKET HANDLERS
// ============================================

// Authenticate socket connections
io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
        // Allow connection without token for initial connection
        socket.user = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        socket.user = decoded;
        next();
    } catch (err) {
        next(new Error('Authentication error'));
    }
});

io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    // Join user-specific room for targeted broadcasts
    if (socket.user) {
        socket.join(`user_${socket.user.id}`);
        console.log(`User ${socket.user.username} joined room user_${socket.user.id}`);
    }

    // Handle authentication after connection
    socket.on('authenticate', (token) => {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            socket.user = decoded;
            socket.join(`user_${decoded.id}`);
            socket.emit('authenticated', { success: true, user: decoded.username });
            console.log(`Socket ${socket.id} authenticated as ${decoded.username}`);
        } catch (err) {
            socket.emit('authenticated', { success: false, error: 'Invalid token' });
        }
    });

    // Timer sync - broadcast timer updates to all user's devices
    socket.on('timer:sync', (data) => {
        if (socket.user) {
            // Broadcast to all other sockets of this user
            socket.to(`user_${socket.user.id}`).emit('timer:update', data);
        }
    });

    // Plant sync - broadcast plant updates
    socket.on('plant:sync', (data) => {
        if (socket.user) {
            socket.to(`user_${socket.user.id}`).emit('plant:update', data);
        }
    });

    socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id);
    });
});

const PORT = 5001;
server.listen(PORT, () => {
    console.log(`SERVER running at http://localhost:${PORT}`);
    console.log("Health check: http://localhost:5001/api/health");
    console.log("WebSocket enabled on same port");
}).on('error', (err) => {
    console.error('Server error:', err);
});