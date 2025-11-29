const timerDisplay = document.getElementById('timer');
const sessionTypeDisplay = document.querySelector('.study-txt');
const pomodoroCounterDisplay = document.getElementById('pomodoro-count');
const toggleBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');

let studyMinutes = 25;       // for testing
let shortBreakMinutes = 5;
let longBreakMinutes = 15;

let timerInterval = null;
let seconds = studyMinutes * 60;
let pomodoroCount = 0;
let onBreak = false;
let isRunning = false;

// Format seconds into MM:SS
function formatTime(sec) {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

// Update display
function updateDisplay() {
    timerDisplay.textContent = formatTime(seconds);
    pomodoroCounterDisplay.textContent = `Pomodoros completed: ${pomodoroCount} / 4`;

    // Update session type display
    if (!onBreak) {
        sessionTypeDisplay.textContent = 'Study Mode';
    } else {
        if (pomodoroCount % 4 === 0) {
            sessionTypeDisplay.textContent = 'Long Break';
        } else {
            sessionTypeDisplay.textContent = 'Short Break';
        }
    }
}

// Check if pomodoro cycle is complete and redirect
function checkCompletion() {
    if (pomodoroCount >= 4 && !onBreak) {
        // Clear the timer and redirect to ending page
        clearInterval(timerInterval);
        isRunning = false;
        setTimeout(() => {
            window.location.href = 'ending.html';
        }, 1000); // Small delay to show the completion state
        return true;
    }
    return false;
}

// Transition to next session
function nextSession() {
    if (!onBreak) {
        // Study session finished
        pomodoroCount++;

        // Check if we've completed the cycle after incrementing count
        if (checkCompletion()) {
            return; // Stop further execution if redirecting
        }

        if (pomodoroCount % 4 === 0) {
            seconds = longBreakMinutes * 60;
        } else {
            seconds = shortBreakMinutes * 60;
        }
        onBreak = true;
    } else {
        // Break finished
        seconds = studyMinutes * 60;
        onBreak = false;

        // Check completion after returning from break
        checkCompletion();
    }

    updateDisplay();
}

// Start / Resume timer
function startTimer() {
    if (isRunning) return;

    isRunning = true;
    toggleBtn.textContent = 'Pause';

    timerInterval = setInterval(() => {
        seconds--;

        if (seconds <= 0) {
            clearInterval(timerInterval);
            isRunning = false;
            nextSession();

            // Only auto-start if we're not redirecting
            if (pomodoroCount < 4 || onBreak) {
                startTimer();
            }
        }

        updateDisplay();
    }, 1000);
}

// Pause timer
function pauseTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    toggleBtn.textContent = 'Resume';
}

// Reset timer
function resetTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    seconds = studyMinutes * 60;
    onBreak = false;
    pomodoroCount = 0;
    toggleBtn.textContent = 'Start';
    updateDisplay();
}

// Toggle timer function
function toggleTimer() {
    if (!isRunning) {
        startTimer();
    } else {
        pauseTimer();
    }
}

// Initial display
updateDisplay();

// Button events
toggleBtn.addEventListener('click', toggleTimer);
resetBtn.addEventListener('click', resetTimer);