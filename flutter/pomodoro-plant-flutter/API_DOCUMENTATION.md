# Pomodoro Plant API Documentation

## Overview

The Pomodoro Plant API is a gamified productivity timer system that combines the Pomodoro technique with plant growth mechanics. Users complete focus sessions (Pomodoros) to grow virtual plants and unlock a collection of 30 different flower species.

**Base URL:** `http://localhost:5001`

**Technology Stack:**
- Express.js 5.1.0
- Socket.IO 4.7.4 (real-time communication)
- SQLite3 (database)
- JWT authentication
- bcryptjs (password hashing)

**Supported Platforms:**
- Web browsers
- Electron desktop app
- Android (native Jetpack Compose with WebSocket integration)

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication](#authentication)
3. [REST API Endpoints](#rest-api-endpoints)
4. [WebSocket Communication](#websocket-communication)
5. [Data Models](#data-models)
6. [Client-Side Integration](#client-side-integration)
7. [Error Handling](#error-handling)
8. [Code Examples](#code-examples)

---

## Getting Started

### Server Setup

```bash
cd server
npm install
npm start
```

Server runs on port **5001** by default.

### Environment Variables

```bash
JWT_SECRET=your-secret-key-here  # Default: 'pomodoro-plant-secret-key-change-in-production'
```

### Health Check

```http
GET /api/health
```

**Response:**
```json
{
  "status": "Server is running!"
}
```

No authentication required.

---

## Authentication

### Authentication Methods

The API uses two authentication methods:

1. **JWT (JSON Web Tokens)** - For API requests and WebSocket connections
2. **Session cookies** - For server-rendered views (web interface)

### JWT Token Format

**Header:**
```
Authorization: Bearer <token>
```

**Token Payload:**
```json
{
  "id": 1,
  "username": "john_doe",
  "iat": 1609459200,
  "exp": 1609545600
}
```

**Expiration:** 24 hours

### Password Storage

**Current:** Plaintext (insecure - requires migration to bcrypt)
**Available:** bcryptjs library installed but not yet implemented

---

## REST API Endpoints

### Authentication Endpoints

#### Register New User

```http
POST /api/register
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "securePassword123"
}
```

**Success Response (200):**
```json
{
  "message": "Registration successful",
  "username": "john_doe",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `400 Bad Request` - Username already exists
- `500 Internal Server Error` - Database error

---

#### Login

```http
POST /api/login
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "securePassword123"
}
```

**Success Response (200):**
```json
{
  "message": "Login success",
  "username": "john_doe",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `400 Bad Request` - Missing username or password
- `401 Unauthorized` - Invalid credentials
- `500 Internal Server Error` - Server error

---

#### Logout

```http
POST /api/logout
```

**Success Response (200):**
```json
{
  "message": "Logout success"
}
```

**Note:** Destroys server-side session. Client should also delete stored JWT.

---

### Pomodoro Timer Endpoints

All timer endpoints require JWT authentication.

#### Get Timer Settings

```http
GET /api/pomodoro/settings
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "study": 25,
  "short_break": 5,
  "long_break": 15,
  "sessions_until_long_break": 4,
  "user": "john_doe"
}
```

---

#### Start Pomodoro Session

```http
POST /api/pomodoro/start
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body (optional parameters):**
```json
{
  "duration_minutes": 25,
  "session_type": "study"
}
```

**Parameters:**
- `duration_minutes` (optional, default: 25) - Session duration in minutes
- `session_type` (optional, default: "study") - Type: "study" or "break"

**Success Response (200):**
```json
{
  "session_id": 42,
  "started_at": "2025-01-15T14:30:00.000Z",
  "duration_minutes": 25,
  "session_type": "study"
}
```

**Side Effects:**
- Creates new record in `pomodoro_sessions` table
- Broadcasts `timer:update` event to user's WebSocket room
- All user's connected devices receive timer sync

---

#### Complete Pomodoro Session

```http
POST /api/pomodoro/complete
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "session_id": 42
}
```

**Success Response (200):**
```json
{
  "message": "Session completed",
  "session_id": 42,
  "completed_at": "2025-01-15T14:55:00.000Z"
}
```

**Side Effects:**
- Updates `pomodoro_sessions.completed_at`
- Increments `user_stats.total_sessions`
- Recalculates streaks (`current_streak`, `longest_streak`)
- Updates `user_stats.last_session_date`
- Broadcasts timer completion via WebSocket

**Streak Calculation Logic:**
- If session is on the same day or next consecutive day: increment `current_streak`
- If gap of more than 1 day: reset `current_streak` to 1
- Updates `longest_streak` if `current_streak` exceeds it

**Error Responses:**
- `404 Not Found` - Session ID doesn't exist or doesn't belong to user
- `500 Internal Server Error` - Database error

---

### Plant Endpoints

All plant endpoints require JWT authentication.

#### Get Current Plant State

```http
GET /api/plant/state
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "plant_type": "Red Rose",
  "growth_stage": 2,
  "max_growth": 4,
  "last_updated": "2025-01-15T14:30:00.000Z",
  "flower": {
    "id": 1,
    "name": "Red Rose",
    "color": "#E91E63",
    "center": "#FFEB3B"
  }
}
```

**Growth Stages:**
- `0` - Seed (just planted)
- `1` - Sprout
- `2` - Growing
- `3` - Bud
- `4` - Fully bloomed (gets unlocked to collection)

**Behavior:**
- If user has no active plant, automatically creates one with random flower species
- Returns current growing plant for the authenticated user

---

#### Grow Plant

```http
POST /api/plant/grow
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body (optional):**
```json
{
  "flowerId": 5
}
```

**Parameters:**
- `flowerId` (optional) - Specify flower species (1-30). If omitted, uses current plant.

**Success Response (200):**
```json
{
  "plant_type": "Sunflower",
  "growth_stage": 3,
  "is_fully_grown": false,
  "isNew": false,
  "flower": {
    "id": 2,
    "name": "Sunflower",
    "color": "#FFC107",
    "center": "#795548"
  }
}
```

**When Fully Grown (stage 4):**
```json
{
  "plant_type": "Sunflower",
  "growth_stage": 4,
  "is_fully_grown": true,
  "isNew": true,
  "flower": {
    "id": 2,
    "name": "Sunflower",
    "color": "#FFC107",
    "center": "#795548"
  }
}
```

**Side Effects:**
- Increments `growth_stage` by 1 (max 4)
- At stage 4:
  - Adds flower to `user_plants` collection (if not already unlocked)
  - Deletes `plant_states` entry (user starts fresh with new plant)
  - Sets `isNew: true` in response
- Broadcasts `plant:update` event via WebSocket

**Usage Pattern:**
Call this endpoint after completing each Pomodoro session to reward user with plant growth.

---

#### Start New Plant

```http
POST /api/plant/new
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "plant_type": "Tulip",
  "growth_stage": 0,
  "max_growth": 4,
  "flower": {
    "id": 3,
    "name": "Tulip",
    "color": "#F44336",
    "center": "#FFCDD2"
  }
}
```

**Side Effects:**
- Creates or replaces current plant with new random flower species
- Resets growth to stage 0
- Broadcasts `plant:update` event via WebSocket

**Use Case:**
- User wants to abandon current plant and start fresh
- User completed a plant and wants to begin next one

---

### User Endpoints

All user endpoints require JWT authentication.

#### Get User Statistics

```http
GET /api/user/stats
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "total_sessions": 47,
  "current_streak": 5,
  "longest_streak": 12,
  "last_session_date": "2025-01-15"
}
```

**Field Descriptions:**
- `total_sessions` - Total Pomodoro sessions completed all-time
- `current_streak` - Current consecutive days with at least one session
- `longest_streak` - Best streak ever achieved
- `last_session_date` - Date (YYYY-MM-DD) of most recent session, or `null`

**Behavior:**
- Returns zeros if user has no stats yet
- Auto-creates stats record on first session completion

---

#### Get Plant Collection

```http
GET /api/user/collection
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "plants": [
    {
      "id": 1,
      "name": "Red Rose",
      "color": "#E91E63",
      "center": "#FFEB3B",
      "unlocked_at": "2025-01-10T10:20:30.000Z"
    },
    {
      "id": 2,
      "name": "Sunflower",
      "color": "#FFC107",
      "center": "#795548",
      "unlocked_at": "2025-01-12T14:15:00.000Z"
    }
  ],
  "total_available": 30,
  "unlocked_count": 2
}
```

**Field Descriptions:**
- `plants` - Array of unlocked flowers (sorted by unlock date)
- `total_available` - Total flower species in game (always 30)
- `unlocked_count` - Number of unique flowers user has unlocked

**Use Case:**
Display user's collection, progress toward completing all 30 species, and unlock timestamps.

---

### Dynamic Asset Endpoints

No authentication required for SVG assets.

#### Flower SVG by ID

```http
GET /assets/flower/:id.svg
```

**Parameters:**
- `:id` - Flower species ID (1-30)

**Example:**
```
GET /assets/flower/1.svg
```

**Response:**
- `Content-Type: image/svg+xml`
- SVG image of the flower
- `404 Not Found` if ID out of range

---

#### Plant Stage 3 (Bud) SVG

```http
GET /assets/plant_stage_3/:id.svg
```

Returns SVG showing plant stem with colored bud (pre-bloom state).

---

#### Plant Stage 4 (Fully Bloomed) SVG

```http
GET /assets/plant_stage_4/:id.svg
```

Returns SVG showing fully bloomed flower on stem.

---

## WebSocket Communication

### Connection Setup

**URL:** `http://localhost:5001`

**Library:** Socket.IO 4.7.4

**Client Configuration:**
```javascript
const socket = io('http://localhost:5001', {
  auth: {
    token: localStorage.getItem('token')  // Optional: authenticate on connect
  },
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});
```

**CORS:** Enabled for all origins with credentials support

---

### Authentication

#### Method 1: Authenticate on Connection

Pass JWT token in handshake:
```javascript
const socket = io(SERVER_URL, {
  auth: { token: yourJwtToken }
});
```

#### Method 2: Authenticate After Connection

```javascript
socket.emit('authenticate', yourJwtToken);
```

**Server Response:**
```javascript
socket.on('authenticated', (data) => {
  console.log('User ID:', data.userId);
  console.log('Username:', data.username);
});
```

**Error:**
```javascript
socket.on('authentication_error', (error) => {
  console.error('Auth failed:', error.message);
});
```

---

### Real-Time Events

#### Timer Synchronization

**Client Emits:**
```javascript
socket.emit('timer:sync', {
  action: 'started',  // or 'completed'
  session_id: 42,
  started_at: '2025-01-15T14:30:00.000Z',
  duration_minutes: 25,
  session_type: 'study'
});
```

**Server Broadcasts to User's Devices:**
```javascript
socket.on('timer:update', (data) => {
  // data contains same structure as emitted
  // Update timer UI on all connected devices
});
```

**Use Case:**
Keep timer synchronized across web, Electron, and Android clients. When user starts timer on desktop, mobile app receives update immediately.

---

#### Plant Synchronization

**Client Emits:**
```javascript
socket.emit('plant:sync', {
  plant_type: 'Sunflower',
  growth_stage: 3,
  flower: {
    id: 2,
    name: 'Sunflower',
    color: '#FFC107',
    center: '#795548'
  }
});
```

**Server Broadcasts to User's Devices:**
```javascript
socket.on('plant:update', (plantData) => {
  // Update plant UI across all devices
});
```

**Use Case:**
When plant grows after completing Pomodoro, all user's devices show updated growth stage in real-time.

---

### User Rooms

Upon successful authentication, users automatically join a private room:

**Room Name:** `user_{userId}`

**Purpose:**
- Enables targeted broadcasts only to specific user's devices
- Prevents users from seeing each other's timer/plant updates
- Supports multiple simultaneous sessions per user

---

### Connection Events

```javascript
// Connection established
socket.on('connect', () => {
  console.log('Connected to server');
});

// Disconnected
socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});

// Reconnection attempt
socket.on('reconnect_attempt', (attemptNumber) => {
  console.log('Reconnecting... Attempt', attemptNumber);
});

// Reconnected successfully
socket.on('reconnect', (attemptNumber) => {
  console.log('Reconnected after', attemptNumber, 'attempts');
});
```

---

## Data Models

### Database Schema (SQLite3)

#### Users Table

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

#### Plant States Table

Stores each user's currently growing plant.

```sql
CREATE TABLE plant_states (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    plant_type TEXT NOT NULL,
    growth_stage INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);
```

**Constraints:**
- One active plant per user (`user_id UNIQUE`)
- Deleted when plant reaches stage 4 (full bloom)

---

#### User Plants Table

Stores unlocked flower collection.

```sql
CREATE TABLE user_plants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    plant_id INTEGER NOT NULL,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    UNIQUE(user_id, plant_id)
);
```

**Constraints:**
- One entry per flower species per user
- `plant_id` corresponds to flower species ID (1-30)

---

#### Pomodoro Sessions Table

```sql
CREATE TABLE pomodoro_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    duration_minutes INTEGER DEFAULT 25,
    session_type TEXT DEFAULT 'study',
    FOREIGN KEY(user_id) REFERENCES users(id)
);
```

**Session Types:**
- `study` - Focus work session
- `break` - Short or long break

---

#### User Stats Table

```sql
CREATE TABLE user_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    total_sessions INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_session_date TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
);
```

**Constraints:**
- One stats record per user
- `last_session_date` format: `YYYY-MM-DD`

---

### Flower Species Data

Located in `/data/flowers.js`:

```javascript
[
  { id: 1, name: "Red Rose", color: "#E91E63", center: "#FFEB3B" },
  { id: 2, name: "Sunflower", color: "#FFC107", center: "#795548" },
  { id: 3, name: "Tulip", color: "#F44336", center: "#FFCDD2" },
  // ... 27 more species (30 total)
]
```

**Fields:**
- `id` - Unique identifier (1-30)
- `name` - Display name
- `color` - Primary petal color (hex)
- `center` - Flower center color (hex)

---

## Client-Side Integration

### Configuration Detection

From `public/js/config.js`:

```javascript
const IS_ELECTRON = window.location.protocol === 'file:';
const API_BASE_URL = IS_ELECTRON ? 'http://localhost:5001' : '';
```

**Logic:**
- Electron apps use `file://` protocol, need full URL
- Web apps use relative paths (same origin)

---

### Socket Client Library

The server provides `/public/js/socket-client.js` with global API:

```javascript
// Initialize connection
window.socketClient.initialize();

// Authenticate with token
window.socketClient.authenticate(token);

// Sync timer state to other devices
window.socketClient.syncTimer({
  action: 'started',
  session_id: 42,
  started_at: new Date().toISOString(),
  duration_minutes: 25,
  session_type: 'study'
});

// Sync plant state to other devices
window.socketClient.syncPlant({
  plant_type: 'Sunflower',
  growth_stage: 3,
  flower: { ... }
});

// Disconnect
window.socketClient.disconnect();

// Check connection status
if (window.socketClient.isConnected()) {
  // Connected
}
```

---

### Custom Events

The socket client dispatches custom window events:

```javascript
// Listen for timer updates from other devices
window.addEventListener('socket:timer:update', (event) => {
  const { action, session_id, started_at, duration_minutes } = event.detail;
  // Update timer UI
});

// Listen for plant updates from other devices
window.addEventListener('socket:plant:update', (event) => {
  const { plant_type, growth_stage, flower } = event.detail;
  // Update plant UI
});
```

---

### Integration Checklist

For new frontend implementations:

- [ ] Import `config.js` for environment detection
- [ ] Store JWT token in `localStorage` after login/register
- [ ] Include `Authorization: Bearer <token>` header in all API requests
- [ ] Initialize Socket.IO connection with token
- [ ] Listen for `socket:timer:update` and `socket:plant:update` events
- [ ] Call `syncTimer()` after starting/completing sessions
- [ ] Call `syncPlant()` after plant growth
- [ ] Handle offline scenarios (queue actions, retry on reconnect)
- [ ] Implement token refresh or re-login on 401 responses

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 200  | Success | Request completed |
| 400  | Bad Request | Missing parameters, duplicate username |
| 401  | Unauthorized | Invalid token, wrong password |
| 404  | Not Found | Session/plant doesn't exist, invalid asset ID |
| 500  | Internal Server Error | Database error, server crash |

---

### Error Response Format

```json
{
  "message": "Error description here"
}
```

**Example:**
```json
{
  "message": "Username already exists"
}
```

---

### Common Error Scenarios

#### Authentication Errors

**Invalid Token:**
```javascript
// Response: 401 Unauthorized
{
  "message": "Invalid or expired token"
}
```

**Solution:** Redirect to login, clear localStorage token

---

**Missing Authorization Header:**
```javascript
// Response: 401 Unauthorized
{
  "message": "No token provided"
}
```

**Solution:** Ensure all API calls include `Authorization: Bearer <token>`

---

#### Session Errors

**Session Not Found:**
```javascript
// POST /api/pomodoro/complete
// Response: 404 Not Found
{
  "message": "Session not found"
}
```

**Causes:**
- Incorrect `session_id`
- Session belongs to different user
- Session already completed

---

#### Database Errors

```javascript
// Response: 500 Internal Server Error
{
  "message": "Database error"
}
```

**Solution:** Retry request, check server logs, verify database file integrity

---

### WebSocket Error Handling

```javascript
socket.on('authentication_error', (error) => {
  console.error('Auth failed:', error.message);
  // Redirect to login
});

socket.on('connect_error', (error) => {
  console.error('Connection failed:', error);
  // Show offline mode UI
});

socket.on('reconnect_failed', () => {
  console.error('Reconnection failed after max attempts');
  // Notify user to check connection
});
```

---

## Code Examples

### Complete Login Flow

```javascript
async function login(username, password) {
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const { token, username: user } = await response.json();

    // Store token
    localStorage.setItem('token', token);
    localStorage.setItem('username', user);

    // Initialize WebSocket with token
    window.socketClient.authenticate(token);

    return { success: true, username: user };
  } catch (error) {
    console.error('Login failed:', error);
    return { success: false, error: error.message };
  }
}
```

---

### Complete Pomodoro Flow

```javascript
class PomodoroTimer {
  constructor() {
    this.token = localStorage.getItem('token');
    this.currentSessionId = null;
  }

  async startSession(durationMinutes = 25) {
    try {
      const response = await fetch('/api/pomodoro/start', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          duration_minutes: durationMinutes,
          session_type: 'study'
        })
      });

      const data = await response.json();
      this.currentSessionId = data.session_id;

      // Sync to other devices
      window.socketClient.syncTimer({
        action: 'started',
        session_id: data.session_id,
        started_at: data.started_at,
        duration_minutes: data.duration_minutes,
        session_type: data.session_type
      });

      // Start local countdown timer
      this.startCountdown(durationMinutes * 60);

      return data;
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  }

  async completeSession() {
    try {
      const response = await fetch('/api/pomodoro/complete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_id: this.currentSessionId
        })
      });

      const data = await response.json();

      // Sync completion to other devices
      window.socketClient.syncTimer({
        action: 'completed',
        session_id: this.currentSessionId,
        completed_at: data.completed_at
      });

      // Grow plant as reward
      await this.growPlant();

      this.currentSessionId = null;
      return data;
    } catch (error) {
      console.error('Failed to complete session:', error);
    }
  }

  async growPlant() {
    const response = await fetch('/api/plant/grow', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });

    const plantData = await response.json();

    // Sync plant growth to other devices
    window.socketClient.syncPlant({
      plant_type: plantData.plant_type,
      growth_stage: plantData.growth_stage,
      flower: plantData.flower
    });

    // Show celebration if fully grown
    if (plantData.is_fully_grown && plantData.isNew) {
      this.showUnlockCelebration(plantData.flower);
    }

    return plantData;
  }

  startCountdown(seconds) {
    // Implementation for local timer UI
  }

  showUnlockCelebration(flower) {
    // Show animation for new flower unlock
  }
}
```

---

### Listening for Real-Time Updates

```javascript
// Listen for timer updates from other devices
window.addEventListener('socket:timer:update', (event) => {
  const { action, session_id, started_at, duration_minutes } = event.detail;

  if (action === 'started') {
    // Another device started timer - sync local UI
    console.log('Timer started on another device');
    updateTimerUI(started_at, duration_minutes);
  } else if (action === 'completed') {
    // Another device completed timer
    console.log('Timer completed on another device');
    resetTimerUI();
  }
});

// Listen for plant updates from other devices
window.addEventListener('socket:plant:update', (event) => {
  const { plant_type, growth_stage, flower } = event.detail;

  console.log(`Plant grew to stage ${growth_stage} on another device`);
  updatePlantUI(plant_type, growth_stage, flower);
});
```

---

### Fetching and Displaying Collection

```javascript
async function loadPlantCollection() {
  try {
    const token = localStorage.getItem('token');

    const response = await fetch('/api/user/collection', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const { plants, total_available, unlocked_count } = await response.json();

    // Display progress
    const progress = (unlocked_count / total_available) * 100;
    document.getElementById('progress').textContent =
      `${unlocked_count} / ${total_available} (${progress.toFixed(0)}%)`;

    // Display unlocked flowers
    const container = document.getElementById('collection');
    plants.forEach(plant => {
      const img = document.createElement('img');
      img.src = `/assets/flower/${plant.id}.svg`;
      img.alt = plant.name;
      img.title = `${plant.name} - Unlocked ${new Date(plant.unlocked_at).toLocaleDateString()}`;
      container.appendChild(img);
    });

    // Display locked flowers (grayed out)
    const allFlowerIds = Array.from({ length: 30 }, (_, i) => i + 1);
    const unlockedIds = plants.map(p => p.id);
    const lockedIds = allFlowerIds.filter(id => !unlockedIds.includes(id));

    lockedIds.forEach(id => {
      const img = document.createElement('img');
      img.src = `/assets/flower/${id}.svg`;
      img.alt = 'Locked';
      img.className = 'locked';
      img.style.opacity = '0.3';
      img.style.filter = 'grayscale(100%)';
      container.appendChild(img);
    });

  } catch (error) {
    console.error('Failed to load collection:', error);
  }
}
```

---

### Android/Mobile Integration Example

For native mobile apps using WebSocket:

```kotlin
// Kotlin example for Android Jetpack Compose

import io.socket.client.IO
import io.socket.client.Socket
import org.json.JSONObject

class SocketManager(private val token: String) {
    private lateinit var socket: Socket

    fun connect() {
        val options = IO.Options().apply {
            auth = mapOf("token" to token)
            reconnection = true
            reconnectionDelay = 1000
            reconnectionAttempts = 5
        }

        socket = IO.socket("http://localhost:5001", options)

        socket.on(Socket.EVENT_CONNECT) {
            println("Connected to server")
        }

        socket.on("timer:update") { args ->
            val data = args[0] as JSONObject
            val action = data.getString("action")
            val sessionId = data.getInt("session_id")

            // Update UI on main thread
            handleTimerUpdate(action, sessionId, data)
        }

        socket.on("plant:update") { args ->
            val data = args[0] as JSONObject
            val plantType = data.getString("plant_type")
            val growthStage = data.getInt("growth_stage")

            // Update UI on main thread
            handlePlantUpdate(plantType, growthStage, data)
        }

        socket.connect()
    }

    fun syncTimer(action: String, sessionId: Int, data: Map<String, Any>) {
        val json = JSONObject(data).apply {
            put("action", action)
            put("session_id", sessionId)
        }
        socket.emit("timer:sync", json)
    }

    fun disconnect() {
        socket.disconnect()
    }
}
```

---

## Security Considerations

### Current Vulnerabilities

1. **Plaintext Passwords** - Passwords stored unencrypted in database
   - **Fix:** Implement bcryptjs hashing before storage

2. **Hardcoded Secrets** - Session and JWT secrets in code
   - **Fix:** Use environment variables

3. **Permissive CORS** - `origin: true` allows any origin
   - **Fix:** Whitelist specific domains in production

4. **No Rate Limiting** - Vulnerable to brute force attacks
   - **Fix:** Implement express-rate-limit middleware

5. **No Input Validation** - SQL injection and XSS risks
   - **Fix:** Use express-validator or joi for input sanitization

---

### Recommended Security Improvements

```javascript
// Example: Bcrypt password hashing (not yet implemented)
const bcrypt = require('bcryptjs');

// On registration
const hashedPassword = await bcrypt.hash(password, 10);
db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);

// On login
const isValid = await bcrypt.compare(password, user.password);
```

---

## Performance Considerations

### Database

- **Current:** SQLite (single file)
- **Concurrency:** Limited write concurrency
- **Scalability:** Suitable for small-medium user bases
- **Recommendation:** Migrate to PostgreSQL for production with >1000 users

### Caching

- **Current:** No caching implemented
- **Recommendations:**
  - Cache flower species data in memory (static data)
  - Implement Redis for session storage
  - Cache user stats with TTL

### WebSocket Scaling

- **Current:** In-memory Socket.IO adapter
- **Limitation:** Single server instance only
- **Solution:** Use Redis adapter for multi-server deployments

---

## API Versioning

**Current Version:** Unversioned (v1 implicit)

**Future Recommendation:**
```
/api/v1/login
/api/v1/pomodoro/start
/api/v2/pomodoro/start
```

---

## Support & Resources

### Server Routes Reference

View routes (web interface):
- `GET /` - Redirects to login or menu
- `GET /login` - Login page
- `GET /register` - Registration page
- `GET /menu` - Main menu (authenticated)
- `GET /timer` - Timer page (authenticated)
- `GET /plants` - Collection page (authenticated)
- `GET /ending` - Completion screen (authenticated)

### File Structure

```
server/
├── app.js                  # Main server (port 5001)
├── database.js             # Schema & init
├── users.db                # SQLite database
├── package.json
├── middleware/
│   ├── jwt.js              # Token generation & verification
│   └── auth.js             # Session authentication
├── routes/
│   ├── api/
│   │   ├── index.js        # API router
│   │   ├── plant.js        # Plant endpoints
│   │   ├── pomodoro.js     # Timer endpoints
│   │   └── user.js         # User endpoints
│   ├── auth.js             # Auth endpoints
│   ├── views.js            # View routes
│   └── assets.js           # SVG generation
├── data/
│   └── flowers.js          # 30 flower species
└── public/
    ├── js/
    │   ├── socket-client.js    # WebSocket library
    │   ├── config.js           # Environment config
    │   └── [page scripts]
    ├── css/
    └── [HTML views]
```

---

## Changelog & Migration Notes

### Recent Updates (from git history)

- **eb8b61d** - Android app rewrite with native Jetpack Compose
- **b424f9d** - Electron login HTML update
- **fd8d61b** - General updates
- **312b7d9** - Static assets for Electron app
- **20b16de** - Refactoring

### Breaking Changes

None currently. API is in initial version.

---

## License & Attribution

**Project:** Pomodoro Plant
**Type:** Gamified productivity timer
**Platform:** Web, Electron, Android

---

## Quick Reference

### Base URL
```
http://localhost:5001
```

### Authentication Header
```
Authorization: Bearer <token>
```

### WebSocket Connection
```javascript
io('http://localhost:5001', { auth: { token } })
```

### Key Endpoints
```
POST   /api/login
POST   /api/register
GET    /api/pomodoro/settings
POST   /api/pomodoro/start
POST   /api/pomodoro/complete
GET    /api/plant/state
POST   /api/plant/grow
GET    /api/user/stats
GET    /api/user/collection
```

### WebSocket Events
```
Emit:   timer:sync, plant:sync, authenticate
Listen: timer:update, plant:update, authenticated, authentication_error
```

---

**Document Version:** 1.0
**Last Updated:** 2025-01-15
**Server Version:** 1.0.0
