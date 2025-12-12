1. Project Title: Pomodoro Plant Companion  
2. Overview of the Application  
   It’s a cute and motivational productivity app that helps users stay focused using

the Pomodoro technique. Each time the user completes a Pomodoro session, their plant grows and becomes healthier. If they skip too many sessions, it wilts. The plant type is random each time a new session cycle starts, so users can look forward to discovering different species and appearances. The system supports browser, Electro(desktop), and Android clients, all connected to a common [Express.js](http://Express.js) server that synchronizes user data, timer progress and plant  growth in real time. The goal is to feel playful, rewarding and emotionally engaging across all devices.   
Main Problem: People struggle to stay focused while studying   
Target Users: Students

3. List of Main Features  
   1. User Accounts & Login  
   2. Pomodoro Timer System  
   3. Virtual Plant Companion  
   4. Progress Tracking & Streaks  
   5. Offline Mode  
   6. Cross-Platform Synchronization

4. Client Feature Mapping Table

| Function | Browser | Electron | Android |
| :---- | ----- | ----- | ----- |
| User Login | **✔** | **✔** | **✔** |
| Start/Pause Pomodoro Timer | **✔** | **✔** | **✔** |
| Real-Time Plant Growth Sync | **✔** | **✔** | **✔** |
| Local Offline Timer | **✔** | **✔** | **✔** |
| Push Notifications | **✔** | **✔** | **✔** |
| Upload Custom Plant Images | **✔** | **✔** | \- |
| Sound Effects | **✔** | **✔** | **✔** |
| Background Running Timer | \- | **✔** | **✔** |

   

   

   

   

   

   

   

5. Expected HTML/JSON API Endpoints

| Route | Method | Description |
| :---- | :---- | :---- |
| /api/login | POST | User login, returns JWT |
| /api/register | POST | Create new account |
| /api/logout | POST | Logout user (session invalidation) |
| /api/health | GET | Server health check |
| /api/plant/state | GET | Fetch current plant type \+ growth stage |
| /api/plant/grow | POST | Increment plant growth stage |
| /api/plant/new | POST | Generate random new plant species |
| /api/pomodoro/settings | GET | Get timer settings |
| /api/pomodoro/start | POST | Record start time |
| /api/pomodoro/complete | POST | Record completed Pomodoro session |
| /api/user/stats | GET | Return streaks, total sessions, etc. |
| /api/user/collection | GET | Get user's unlocked plants |

WebSocket Events ([Socket.IO](http://Socket.IO)):

* timer:update: sync timer progress across devices (actions: started, completed)
* plant:update: broadcast plant growth stage changes

6. Technical Notes or Constraints  
   1. Backend Framework: [Express.js](http://Express.js)  
   2. Database: SQLite  
   3. Authentication: JWT  
   4. Communication:   
      1. Rest API for CRUD  
      2. WebSocket for real-time sync   
   5. Client-Side Storage:   
      1. Browser: localStorage  
      2. Electron: SQLite for cached plant/timer data  
      3. Android: SQLite via Room database  
   6. Media Assets:   
      1. Plant growth stages use user-created PNG images  
      2. Images stored in server /assets/plants 

