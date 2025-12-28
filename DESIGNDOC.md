# Pomodoro Plant - Design Documentation

## 1. Project Overview

**Pomodoro Plant** is a gamified productivity application that uses the Pomodoro technique to help users stay focused. Users grow virtual plants as they complete study sessions - each completed Pomodoro session makes their plant grow through 5 stages (0-4). When a plant reaches full maturity, it gets added to the user's collection, and a new random flower species begins growing.

**Problem**: Students struggle to maintain focus during study sessions  
**Solution**: Gamify productivity with visual plant growth rewards  
**Target Users**: Students and anyone using Pomodoro technique for focused work

## 2. System Architecture

This is a **full-stack web application** with multi-platform client support:

### Backend (`/server`)
- **Framework**: Express.js (Node.js)
- **Database**: SQLite (`users.db`)
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time Sync**: Socket.IO for WebSockets
- **View Engine**: Pug templates compiled to static HTML
- **Port**: `http://localhost:5001`

### Clients
1. **Browser**: Direct web access to server
2. **Electron** (`/electron`): Desktop app loading static HTML files and connecting to local server
3. **Android** (`/android`): Native Android app (in development)

## 3. Core Features & Implementation

### 3.1 User Authentication
- **Registration**: Users create accounts with username/password
- Passwords hashed with bcryptjs
- JWT tokens for authentication
- Session management with express-session
- Database table: `users`

### 3.2 Pomodoro Timer System
- **Default Timing**:
  - Study session: 25 minutes
  - Short break: 5 minutes
  - Long break: 15 minutes
  - Long break after every 4 sessions
- **Implementation**:
  - Timer runs client-side (JavaScript)
  - Session start/complete events recorded to server
  - WebSocket sync keeps timer state synchronized across all user's devices
- **Database table**: `pomodoro_sessions` tracks each session

### 3.3 Virtual Plant Companion
- **30 Different Flower Species** defined in `/server/data/flowers.js`:
  - Each flower has: ID, name, color, center color
  - Examples: Red Rose, Sunflower, Tulip, Daisy, Violet, etc.
- **Growth System**:
  - Stage 0: Seed (starting state)
  - Stages 1-3: Growing plant
  - Stage 4: Fully mature flower
  - Each completed Pomodoro → plant grows 1 stage
- **Plant Generation**:
  - Plants are SVG graphics generated dynamically by `/server/generate-assets.js`
  - Random flower assigned when user starts new growth cycle
- **Database tables**:
  - `plant_states`: Current plant type and growth stage per user
  - `user_plants`: Collection of unlocked/completed plants

### 3.4 Progress Tracking & Statistics
- **Streaks**: Track consecutive days of completed sessions
- **Total Sessions**: Count all completed Pomodoros
- **Collection**: All flowers the user has fully grown
- **Database table**: `user_stats`
- Streak logic:
  - Same day session → maintain streak
  - Next day session → increment streak
  - Missed day → reset streak to 1

### 3.5 Real-Time Synchronization
- **Socket.IO WebSockets** for instant updates
- Users join room `user_{userId}` for targeted broadcasts
- **Events**:
  - `timer:update` - sync timer state (started/completed)
  - `plant:update` - broadcast plant growth changes
- Allows seamless multi-device experience

### 3.6 Static Asset Generation
The server pre-builds static files for offline-capable clients:
- **`build-views.js`**: Compiles Pug templates → HTML files
- **`generate-assets.js`**: Generates SVG flower graphics for all 30 species
- Output stored in `/server/public/` and copied to `/electron/public/`

## 4. Database Schema

### `users`
- `id` (PRIMARY KEY)
- `username` (UNIQUE)
- `password` (hashed)
- `created_at`

### `plant_states`
- `id` (PRIMARY KEY)
- `user_id` (UNIQUE, references users)
- `plant_type` (flower name from flowers.js)
- `growth_stage` (0-4)
- `last_updated`

### `user_plants`
- `id` (PRIMARY KEY)
- `user_id` (references users)
- `plant_id` (flower ID)
- `unlocked_at`
- UNIQUE constraint on (user_id, plant_id)

### `pomodoro_sessions`
- `id` (PRIMARY KEY)
- `user_id` (references users)
- `started_at`
- `completed_at`
- `duration_minutes` (default: 25)
- `session_type` (default: 'study')

### `user_stats`
- `id` (PRIMARY KEY)
- `user_id` (UNIQUE, references users)
- `total_sessions`
- `current_streak`
- `longest_streak`
- `last_session_date`

## 5. API Endpoints

### Authentication (`/api`)
| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/register` | POST | No | Create new user account |
| `/api/login` | POST | No | Login, returns JWT token |
| `/api/logout` | POST | Yes | Logout (session cleanup) |
| `/api/health` | GET | No | Server health check |

### Plant API (`/api/plant`)
| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/plant/state` | GET | Yes | Get current plant type & growth stage |
| `/api/plant/grow` | POST | Yes | Increment growth by 1 stage |
| `/api/plant/new` | POST | Yes | Generate new random plant |

### Pomodoro API (`/api/pomodoro`)
| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/pomodoro/settings` | GET | Yes | Get timer settings (25/5/15 mins) |
| `/api/pomodoro/start` | POST | Yes | Record session start |
| `/api/pomodoro/complete` | POST | Yes | Mark session complete, update stats |

### User Stats (`/api/user`)
| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/user/stats` | GET | Yes | Get streaks & session count |
| `/api/user/collection` | GET | Yes | Get all unlocked flowers |

### WebSocket Events
- `authenticate` - Authenticate socket connection with JWT
- `timer:sync` - Client broadcasts timer state to other devices
- `plant:sync` - Client broadcasts plant updates
- Server emits `timer:update` and `plant:update` to user room

## 6. Technology Stack

### Backend
- **Runtime**: Node.js
- **Web Framework**: Express.js v5.1.0
- **Database**: SQLite3 v5.1.7
- **Authentication**: jsonwebtoken v9.0.2, bcryptjs v3.0.3
- **WebSockets**: socket.io v4.7.4
- **Templating**: Pug v3.0.3
- **Session**: express-session v1.18.2
- **CORS**: cors v2.8.5

### Frontend (Browser/Electron)
- **Core**: HTML5, CSS3, Vanilla JavaScript
- **WebSockets**: Socket.IO client library
- **Graphics**: SVG for plant visuals
- **Storage**: localStorage for browser, SQLite for Electron

### Desktop (Electron)
- Electron app loads pre-built static HTML from `/public`
- Connects to local server at `http://localhost:5001`
- Assets synced via `copy-assets.js` script

### Android
- Native Android implementation (in `/android` directory)
- Uses WebView or native UI to connect to server API

## 7. Build & Asset Pipeline

### Build Scripts (in `/server`)
1. **`npm run build:views`**
   - Runs `build-views.js`
   - Compiles all `.pug` templates to `.html` files
   - Output: `/server/public/*.html`

2. **`npm run build:assets`**
   - Runs `generate-assets.js`
   - Generates 30 SVG flower images (all species)
   - Output: `/server/public/assets/`

### Electron Asset Sync
- `copy-assets.js` copies `/server/public/` → `/electron/public/`
- Runs automatically on `npm start` in electron directory

## 8. User Flow

1. **First Time User**:
   - Register account → Login → Receive JWT token
   - Start first Pomodoro session
   - Random flower assigned at stage 0
   - Complete session → Plant grows to stage 1
   - Repeat 3 more times to reach stage 4 (fully grown)
   - Flower added to collection
   - New random flower begins at stage 0

2. **Returning User**:
   - Login with credentials
   - Continue growing current plant from saved state
   - Timer and plant state sync across all devices via WebSockets
   - View collection of previously grown flowers
   - Track streak and total sessions

## 9. Cross-Platform Feature Matrix

| Feature | Browser | Electron | Android |
|---------|---------|----------|---------|
| User Login/Register | ✅ | ✅ | ✅ |
| Pomodoro Timer | ✅ | ✅ | ✅ |
| Plant Growth Visualization | ✅ | ✅ | ✅ |
| Real-time WebSocket Sync | ✅ | ✅ | ✅ |
| Offline Static Views | ⚠️ | ✅ | ✅ |
| Background Timer | ❌ | ✅ | ✅ |
| Plant Collection | ✅ | ✅ | ✅ |
| Statistics & Streaks | ✅ | ✅ | ✅ |

**Legend**: ✅ Implemented, ⚠️ Partial, ❌ Not available

## 10. Key Design Decisions

1. **SQLite over PostgreSQL/MySQL**: Lightweight, zero-config database suitable for personal productivity app
2. **JWT Authentication**: Stateless auth enables easy multi-device support
3. **Pre-compiled Static HTML**: Enables instant offline loading in Electron
4. **SVG Graphics**: Scalable, small file size, easily generated programmatically
5. **Socket.IO**: Enables real-time sync without constant polling
6. **Random Plant Assignment**: Encourages users to complete cycles to discover all 30 species
7. **5 Growth Stages**: Provides clear visual progression and immediate feedback
