const timerDisplay = document.getElementById('timer');
const sessionTypeDisplay = document.querySelector('.study-txt');
const pomodoroCounterDisplay = document.getElementById('pomodoro-count');
const toggleBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');

let studyMinutes = 0.10;
let shortBreakMinutes = 0.10;
let longBreakMinutes = 0.10;

let timerInterval = null;
let seconds = studyMinutes * 60;
let pomodoroCount = 0;
let onBreak = false;
let isRunning = false;

// Assign a random flower ID for this session (stays consistent)
let currentFlowerId = Math.floor(Math.random() * 30) + 1;

// Format MM:SS
function formatTime(sec) {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

// Update screen
function updateDisplay() {
    timerDisplay.textContent = formatTime(seconds);
    pomodoroCounterDisplay.textContent = `Pomodoros completed: ${pomodoroCount} / 4`;

    const plantImg = document.getElementById('plant-img');

    if (!onBreak) {
        sessionTypeDisplay.textContent = 'Study Mode';
        // Show plant stage based on progress (1 to 4)
        const stage = Math.min(pomodoroCount + 1, 4);

        // For stages 3 and 4, use the consistent flower ID for this session
        if (stage >= 3) {
            plantImg.src = `/assets/plant_stage_${stage}/${currentFlowerId}.svg`;
        } else {
            plantImg.src = `/assets/plant_stage_${stage}.svg`;
        }
    } else {
        sessionTypeDisplay.textContent =
            pomodoroCount % 4 === 0 ? 'Long Break' : 'Short Break';
        plantImg.src = "/assets/break_icon.svg";
    }
}

// NEW IMPORTANT FIX — check only after returning to STUDY MODE
function checkCompletion() {
    if (pomodoroCount >= 4 && !onBreak) {
        clearInterval(timerInterval);
        isRunning = false;

        setTimeout(() => {
            window.location.href = '/ending';
        }, 500);

        return true;
    }
    return false;
}

// Move to next stage
function nextSession() {
    if (!onBreak) {
        // Finished study → go to break
        pomodoroCount++;

        // 🔥 FIX: do NOT check until AFTER you return from break
        if (pomodoroCount % 4 === 0) {
            seconds = longBreakMinutes * 60;
        } else {
            seconds = shortBreakMinutes * 60;
        }

        onBreak = true;

    } else {
        // Finished break → return to study
        seconds = studyMinutes * 60;
        onBreak = false;

        // 🔥 NOW we check for full completion
        if (checkCompletion()) return;
    }

    updateDisplay();
}

// Start / Resume
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

            // if finished whole cycle (4 pomodoros), unlock a flower
            if (pomodoroCount >= 4 && !onBreak) {
                console.log(`[Timer] Sending flower ID ${currentFlowerId} to complete-cycle`);
                fetch('/complete-cycle', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ flowerId: currentFlowerId })
                })
                    .then(res => res.json())
                    .then(data => {
                        console.log(`[Timer] Received flower:`, data.flower);
                        window.location.href = `/ending?flower=${data.flower.id}&name=${encodeURIComponent(data.flower.name)}&isNew=${data.isNew}`;
                    })
                    .catch(err => {
                        console.error('Error completing cycle:', err);
                        window.location.href = '/ending';
                    });
                return;
            }

            // if not finished whole cycle, auto continue
            if (pomodoroCount < 4 || onBreak) {
                startTimer();
            }

            return;
        }

        updateDisplay();
    }, 1000);
}

// Pause
function pauseTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    toggleBtn.textContent = 'Resume';
}

// Reset
function resetTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    seconds = studyMinutes * 60;
    pomodoroCount = 0;
    onBreak = false;
    toggleBtn.textContent = 'Start';
    updateDisplay();
}

// Start/Pause/Resume button
function toggleTimer() {
    if (!isRunning && toggleBtn.textContent === 'Resume') {
        startTimer();
    } else if (!isRunning) {
        startTimer();
    } else {
        pauseTimer();
    }
}

// Run once on load
updateDisplay();

// Events
toggleBtn.addEventListener('click', toggleTimer);
resetBtn.addEventListener('click', resetTimer);
document.getElementById('back-btn').addEventListener('click', () => {
    window.location.href = "/menu";
});
