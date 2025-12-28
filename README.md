# Pomodoro Plant

A gamified productivity application that helps you stay focused using the Pomodoro technique. Grow virtual plants as you complete study sessions - each completed session makes your plant grow until it fully matures and joins your collection!

## What This App Does

**Pomodoro Plant** combines the proven Pomodoro technique with a fun plant-growing mechanic to make studying more engaging:

- **Focus Timer**: 25-minute study sessions with 5-minute breaks
- **Growing Plants**: Your plant grows through 5 stages as you complete sessions
- **Collect Flowers**: Unlock 30 different flower species by completing growth cycles
- **Track Streaks**: Monitor your daily consistency and total sessions
- **Multi-Device Sync**: Real-time synchronization across all your devices
- **Cross-Platform**: Works in browser, desktop (Electron), and Android

## How It Works

1. **Start a Study Session**: Begin a 25-minute Pomodoro timer
2. **Watch Your Plant Grow**: Each completed session advances your plant by 1 stage (0→1→2→3→4)
3. **Unlock Flowers**: When your plant reaches stage 4, it's added to your collection
4. **New Growth Cycle**: A new random flower species starts growing from stage 0
5. **Build Your Collection**: Discover all 30 unique flower species!

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   CLIENTS                               │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐           │
│  │ Browser  │   │ Electron │   │ Android  │           │
│  │  (Web)   │   │ (Desktop)│   │  (App)   │           │
│  └────┬─────┘   └────┬─────┘   └────┬─────┘           │
│       │              │              │                   │
│       └──────────────┼──────────────┘                   │
│                      │                                   │
│         HTTP/REST + WebSocket (Socket.IO)               │
│                      │                                   │
└──────────────────────┼───────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────┐
│              EXPRESS.JS SERVER                           │
│  - REST API (Authentication, Timer, Plants, Stats)       │
│  - WebSocket (Real-time sync)                           │
│  - JWT Authentication                                    │
│  - SQLite Database                                       │
│  - Asset Generation (Pug → HTML, SVG flowers)           │
│                                                          │
│  Port: localhost:5001                                    │
└──────────────────────────────────────────────────────────┘
```

## Project Structure

```
pomodoro-plant/
├── server/               # Backend (Express.js + SQLite)
│   ├── app.js            # Main server entry point
│   ├── database.js       # SQLite database setup
│   ├── users.db          # SQLite database file
│   ├── routes/           # API endpoints
│   │   ├── auth.js       # Login/register/logout
│   │   └── api/          # REST API routes
│   │       ├── plant.js     # Plant state & growth
│   │       ├── pomodoro.js  # Timer sessions
│   │       └── user.js      # Stats & collection
│   ├── middleware/       # JWT authentication
│   ├── data/
│   │   └── flowers.js    # 30 flower species definitions
│   ├── views/            # Pug templates (source)
│   ├── public/           # Generated static files (HTML/CSS/JS/SVG)
│   ├── build-views.js    # Compile Pug → HTML
│   └── generate-assets.js # Generate SVG flower graphics
│
├── electron/             # Desktop app (Electron)
│   ├── src/main.js       # Electron main process
│   ├── public/           # Static HTML/assets (copied from server)
│   └── copy-assets.js    # Sync script
│
└── android/              # Android native app
```

## Technology Stack

### Backend
- **Node.js** + **Express.js** - Web server
- **SQLite3** - Lightweight database
- **Socket.IO** - Real-time WebSocket communication
- **JWT** - Token-based authentication
- **Pug** - Template engine (compiled to HTML)
- **bcryptjs** - Password hashing

### Frontend
- **Vanilla JavaScript** - Client-side logic
- **HTML5/CSS3** - UI structure and styling
- **Socket.IO Client** - Real-time sync
- **SVG** - Scalable flower graphics

### Platforms
- **Browser** - Direct web access
- **Electron** - Desktop application
- **Android** - Native mobile app

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm

### 1. Install Dependencies

```bash
# Install server dependencies
cd server
npm install

# Install Electron dependencies
cd ../electron
npm install
```

### 2. Build Static Assets

Before running the app, generate the static views and flower graphics:

```bash
cd server

# Compile Pug templates to HTML
npm run build:views

# Generate SVG flower graphics for all 30 species
npm run build:assets
```

## Running the Application

You need **two terminal windows** - one for the server and one for the client:

### Terminal 1: Start the Server

```bash
cd server
npm start
```

Server starts at `http://localhost:5001`

### Terminal 2: Start the Electron App

```bash
cd electron
npm start
```

*(Note: `npm start` automatically runs the asset sync script before launching)*

### Browser Access

Alternatively, open your browser to: `http://localhost:5001`

## Database Schema

The SQLite database (`users.db`) contains:

| Table | Purpose |
|-------|---------|
| `users` | User accounts (username, hashed password) |
| `plant_states` | Current plant type & growth stage per user |
| `user_plants` | Collection of unlocked flowers |
| `pomodoro_sessions` | Record of all completed study sessions |
| `user_stats` | Streaks, total sessions, achievements |

## API Endpoints

### Authentication
- `POST /api/register` - Create account
- `POST /api/login` - Login (returns JWT)
- `POST /api/logout` - Logout
- `GET /api/health` - Server health check

### Plant Management
- `GET /api/plant/state` - Get current plant & growth stage
- `POST /api/plant/grow` - Increment growth by 1 stage
- `POST /api/plant/new` - Start new random plant

### Pomodoro Sessions
- `GET /api/pomodoro/settings` - Get timer durations
- `POST /api/pomodoro/start` - Start a session
- `POST /api/pomodoro/complete` - Mark session complete

### User Stats
- `GET /api/user/stats` - Get streaks and totals
- `GET /api/user/collection` - Get all unlocked flowers

### WebSocket Events
- `timer:sync` / `timer:update` - Sync timer across devices
- `plant:sync` / `plant:update` - Sync plant growth
- `authenticate` - Authenticate WebSocket with JWT

## Features in Detail

### 30 Unique Flowers
The app includes 30 different flower species with unique colors:
- Red Rose, Sunflower, Tulip, Daisy, Violet, Bluebell, Lily
- Orchid, Daffodil, Cherry Blossom, Lavender, Marigold, Hibiscus
- Jasmine, Lotus, Poppy, Pansy, Peony, Chrysanthemum, Dahlia
- Hydrangea, Iris, Magnolia, Camellia, Azalea, Begonia, Carnation
- Petunia, Zinnia, Cactus Flower

Each flower is randomly assigned when starting a new growth cycle!

### Progress Tracking
- **Total Sessions**: Count of all completed Pomodoros
- **Current Streak**: Consecutive days with completed sessions
- **Longest Streak**: Best streak achieved
- **Plant Collection**: Gallery of all flowers you've fully grown

### Real-Time Sync
Using Socket.IO, your timer and plant state synchronize instantly across:
- Multiple browser tabs
- Desktop and mobile simultaneously
- Electron app and web browser

When you complete a session on your phone, your desktop app updates immediately!

### Dynamic SVG Generation
Flowers are generated as SVG graphics with code:
- Lightweight file sizes
- Infinite scalability
- Programmatically created from flower data
- Stored in `/server/public/assets/`

## Development Notes

### Build Process
1. **Pug Templates** (`/server/views/*.pug`) → Compiled to HTML → `/server/public/*.html`
2. **Flower Data** (`/server/data/flowers.js`) → SVG generation → `/server/public/assets/`
3. **Asset Sync**: `/server/public/` → `/electron/public/` for offline Electron access

### Workflow
```bash
# Make changes to Pug templates
cd server
npm run build:views

# Make changes to flower data
npm run build:assets

# Changes auto-sync to Electron when it starts
cd ../electron
npm start
```

### Adding New Flowers
Edit `/server/data/flowers.js` and add a new entry:
```javascript
{ id: 31, name: "New Flower", color: "#FF1234", center: "#ABCDEF" }
```
Then run `npm run build:assets` to generate the SVG.

## FAQ

**Q: Do I need internet to use the Electron app?**  
A: The Electron app loads static HTML files locally, but you need the server running on `localhost:5001` for data persistence and sync.

**Q: Can multiple users use the same server?**  
A: Yes! Each user has their own account, plants, and progress.

**Q: What happens if I close the app mid-session?**  
A: The session won't count as complete. Only fully finished sessions grow your plant.

**Q: How do I reset my plant?**  
A: Use the `/api/plant/new` endpoint to start a fresh random plant.

**Q: Is my data stored locally?**  
A: Yes, everything is in the SQLite database (`users.db`) on your machine.

## License

ISC

---
