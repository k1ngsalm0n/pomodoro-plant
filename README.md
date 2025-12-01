# Pomodoro Plant

A Pomodoro timer application built with Electron and Express.

## Architecture

This project uses a **Client-Server** architecture:

*   **Backend (`server/`)**: An Express.js server that handles:
    *   **View Rendering**: Uses **Pug** templates to render HTML on the server side (SSR).
    *   **Database**: Uses **SQLite** (`users.db`) to store user credentials.
    *   **Authentication**: Session-based authentication.
    *   **API**: Endpoints for data retrieval.
*   **Frontend (`electron/`)**: An Electron application acting as a thin client. It simply loads the web application hosted by the Express server.

## Prerequisites

*   Node.js (v14 or higher)
*   npm

## Installation

1.  **Install Server Dependencies**:
    ```bash
    cd server
    npm install
    ```

2.  **Install Electron Dependencies**:
    ```bash
    cd electron
    npm install
    ```

## Running the Application

You need to run both the server and the Electron app.

1.  **Start the Server**:
    Open a terminal and run:
    ```bash
    cd server
    npm start
    ```
    The server will start on `http://localhost:5001`.

2.  **Start the Electron App**:
    Open a second terminal and run:
    ```bash
    cd electron
    npm start
    ```

## Project Structure

### `server/`
*   `app.js`: Main entry point for the Express server.
*   `routes/`: Route definitions.
    *   `auth.js`: Login, Register, Logout logic.
    *   `views.js`: Renders Pug templates.
    *   `api.js`: JSON API endpoints.
*   `middleware/`: Express middleware (e.g., `auth.js` for session checking).
*   `views/`: Pug templates for the UI (`login.pug`, `timer.pug`, etc.).
*   `public/`: Static assets (CSS, JS, Images).
*   `users.db`: SQLite database file (created automatically).

### `electron/`
*   `src/main.js`: Main process that creates the browser window and loads the server URL.
*   `src/preload.js`: Preload script (minimal usage since logic is on the server).

## Features
*   **User Accounts**: Register and Login to save your progress.
*   **Pomodoro Timer**: Standard 25/5/15 minute intervals.
*   **Plant Theme**: Grow plants as you study!
