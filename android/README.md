# Pomodoro Plant - Android App

This is the Android wrapper for the Pomodoro Plant web application.

## Prerequisites
1.  **Android Studio**: You must have Android Studio installed.
2.  **Running Server**: The Node.js server must be running on your computer.

## How to Run
1.  **Start the Server**:
    Open a terminal in the `server` folder and run:
    ```bash
    npm start
    ```
    *Note: The app expects the server to be at `http://localhost:5001`.*

2.  **Open in Android Studio**:
    *   Open Android Studio.
    *   Select **Open**.
    *   Navigate to and select the `pomodoro-plant/android` folder.

3.  **Run the App**:
    *   Wait for Gradle to sync (this might take a few minutes the first time).
    *   Select an Emulator (e.g., Pixel 3a API 34).
    *   Click the green **Run** (▶) button.

## Troubleshooting
*   **White Screen / Connection Error**: Ensure your server is running. The app tries to connect to `http://10.0.2.2:5001`, which is the special IP address for the Android Emulator to talk to your computer's `localhost`.
*   **Gradle Errors**: Try doing `File > Sync Project with Gradle Files`.
