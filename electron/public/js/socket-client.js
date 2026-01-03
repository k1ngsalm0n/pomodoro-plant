// Socket.IO client for real-time synchronization
// This file establishes a WebSocket connection to sync timer and plant state across devices

let socket = null;
let isConnected = false;

// Initialize socket connection
function initializeSocket() {
    if (socket) return; // Already initialized

    const token = localStorage.getItem('token');

    // Connect to the Socket.IO server
    socket = io(API_BASE_URL, {
        auth: {
            token: token || ''
        },
        // Reconnection options
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
    });

    // Connection events
    socket.on('connect', () => {
        console.log('[Socket] Connected to server:', socket.id);
        isConnected = true;

        // If token exists, authenticate
        const currentToken = localStorage.getItem('token');
        if (currentToken && !token) {
            socket.emit('authenticate', currentToken);
        }
    });

    socket.on('disconnect', () => {
        console.log('[Socket] Disconnected from server');
        isConnected = false;
    });

    socket.on('authenticated', (data) => {
        if (data.success) {
            console.log('[Socket] Authenticated as:', data.user);
        } else {
            console.error('[Socket] Authentication failed:', data.error);
        }
    });

    socket.on('connect_error', (error) => {
        console.error('[Socket] Connection error:', error.message);
    });

    // Timer sync events
    socket.on('timer:update', (data) => {
        console.log('[Socket] Received timer update from another device:', data);

        // Dispatch custom event for timer page to listen to
        const event = new CustomEvent('socket:timer:update', { detail: data });
        window.dispatchEvent(event);
    });

    // Plant sync events
    socket.on('plant:update', (data) => {
        console.log('[Socket] Received plant update from another device:', data);

        // Dispatch custom event for plant pages to listen to
        const event = new CustomEvent('socket:plant:update', { detail: data });
        window.dispatchEvent(event);
    });
}

// Sync timer state to other devices
function syncTimer(timerData) {
    if (!socket || !isConnected) {
        console.warn('[Socket] Cannot sync timer - not connected');
        return;
    }

    try {
        socket.emit('timer:sync', timerData);
        console.log('[Socket] Synced timer to other devices:', timerData);
    } catch (err) {
        console.error('[Socket] Failed to sync timer:', err);
    }
}

// Sync plant state to other devices
function syncPlant(plantData) {
    if (!socket || !isConnected) {
        console.warn('[Socket] Cannot sync plant - not connected');
        return;
    }

    try {
        socket.emit('plant:sync', plantData);
        console.log('[Socket] Synced plant to other devices:', plantData);
    } catch (err) {
        console.error('[Socket] Failed to sync plant:', err);
    }
}

// Authenticate socket with new token (e.g., after login)
function authenticateSocket(token) {
    if (!socket) {
        initializeSocket();
    }

    if (socket && token) {
        socket.emit('authenticate', token);
    }
}

// Disconnect socket (e.g., on logout)
function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
        isConnected = false;
        console.log('[Socket] Manually disconnected');
    }
}

// Auto-initialize on page load if user is logged in
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        const token = localStorage.getItem('token');
        if (token) {
            initializeSocket();
        }
    });
}

// Export functions for use in other scripts
if (typeof window !== 'undefined') {
    window.socketClient = {
        initialize: initializeSocket,
        syncTimer: syncTimer,
        syncPlant: syncPlant,
        authenticate: authenticateSocket,
        disconnect: disconnectSocket,
        isConnected: () => isConnected
    };
}
