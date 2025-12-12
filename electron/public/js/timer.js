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

// Track the flower data received from API
let currentFlowerData = null;

// Format MM:SS
function formatTime(sec) {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

// Call API to grow plant (called after each completed pomodoro)
async function growPlant() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_BASE_URL}/api/plant/grow`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
            },
            body: JSON.stringify({ flowerId: currentFlowerId })
        });

        if (response.ok) {
            const data = await response.json();
            console.log(`[Timer] Plant grew to stage ${data.growth_stage}:`, data.flower);
            currentFlowerData = data;

            // Update the local flower ID to match what the server says (in case we had a random one)
            if (data.flower && data.flower.id) {
                currentFlowerId = data.flower.id;
            }

            // Play grow sound and show notification
            if (typeof soundEffects !== 'undefined') {
                soundEffects.playGrowSound();
            }
            if (typeof notifications !== 'undefined') {
                notifications.showPlantGrown(data.growth_stage);
            }

            return data;
        } else {
            console.error('Error growing plant:', await response.text());
            return null;
        }
    } catch (err) {
        console.error('Error growing plant:', err);
        return null;
    }
}

// Record completed pomodoro session for stats tracking
async function completePomodoro() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        // First start a session (to get session_id)
        const startResponse = await fetch(`${API_BASE_URL}/api/pomodoro/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ duration_minutes: studyMinutes, session_type: 'study' })
        });

        if (startResponse.ok) {
            const startData = await startResponse.json();

            // Then complete it immediately (since we're tracking completed sessions)
            await fetch(`${API_BASE_URL}/api/pomodoro/complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ session_id: startData.session_id })
            });

            console.log('[Timer] Pomodoro session recorded for stats');
        }
    } catch (err) {
        console.error('Error recording pomodoro session:', err);
    }
}

// Load existing plant state on page load
async function loadPlantState() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/plant/state`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('[Timer] Loaded plant state:', data);

            // Restore pomodoro count based on growth stage
            if (data.growth_stage && data.growth_stage > 0 && data.growth_stage < 4) {
                pomodoroCount = data.growth_stage;
                currentFlowerData = data;

                // Use the existing plant's flower for display
                if (data.flower) {
                    currentFlowerId = data.flower.id;
                }

                console.log(`[Timer] Restored progress: ${pomodoroCount} pomodoros completed`);
            }

            updateDisplay();
        }
    } catch (err) {
        console.error('Error loading plant state:', err);
    }
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
            plantImg.src = `assets/plant_stage_${stage}/${currentFlowerId}.svg`;
        } else {
            plantImg.src = `assets/plant_stage_${stage}.svg`;
        }
    } else {
        sessionTypeDisplay.textContent =
            pomodoroCount % 4 === 0 ? 'Long Break' : 'Short Break';
        plantImg.src = "assets/break_icon.svg";
    }
}

// Check if all 4 pomodoros are done
function checkCompletion() {
    if (pomodoroCount >= 4 && !onBreak) {
        clearInterval(timerInterval);
        isRunning = false;

        // Play unlock celebration sound (user already interacted on timer page)
        if (typeof soundEffects !== 'undefined') {
            soundEffects.playUnlockSound();
        }
        if (typeof notifications !== 'undefined' && currentFlowerData && currentFlowerData.flower) {
            notifications.showFlowerUnlocked(currentFlowerData.flower.name);
        }

        // Redirect to ending page after sound plays
        setTimeout(() => {
            if (currentFlowerData && currentFlowerData.flower) {
                const flower = currentFlowerData.flower;
                window.location.href = getPageUrl(`ending?flower=${flower.id}&name=${encodeURIComponent(flower.name)}&isNew=${currentFlowerData.isNew || currentFlowerData.is_fully_grown}`);
            } else {
                window.location.href = getPageUrl('ending');
            }
        }, 800);

        return true;
    }
    return false;
}

// Move to next stage
async function nextSession() {
    if (!onBreak) {
        // Finished study → go to break
        pomodoroCount++;

        // Play session complete sound (no notification - plant growing notification is enough)
        if (typeof soundEffects !== 'undefined') {
            soundEffects.playCompleteSound();
        }

        // 🌱 Call API to grow plant after each completed pomodoro
        await growPlant();

        // 📊 Record completed session for stats tracking
        await completePomodoro();

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

        // Play break over notification
        if (typeof soundEffects !== 'undefined') {
            soundEffects.playStartSound();
        }
        if (typeof notifications !== 'undefined') {
            notifications.showTimerComplete('break');
        }

        // Check for full completion after returning from break
        if (checkCompletion()) return;
    }

    updateDisplay();
}

// Start / Resume
function startTimer() {
    if (isRunning) return;

    isRunning = true;
    toggleBtn.textContent = 'Pause';

    // Request notification permission on first user click
    if (typeof notifications !== 'undefined') {
        notifications.requestPermission();
    }

    // Play start sound on first start
    if (typeof soundEffects !== 'undefined') {
        soundEffects.playStartSound();
    }

    timerInterval = setInterval(async () => {
        seconds--;

        if (seconds <= 0) {
            clearInterval(timerInterval);
            isRunning = false;

            await nextSession();

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

    // Play pause sound
    if (typeof soundEffects !== 'undefined') {
        soundEffects.playPauseSound();
    }
}

// Reset
function resetTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    seconds = studyMinutes * 60;
    pomodoroCount = 0;
    onBreak = false;
    currentFlowerData = null;
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

// Run once on load - just load plant state (permission requested on Start click)
async function init() {
    await loadPlantState();
}

init();

// Events
toggleBtn.addEventListener('click', toggleTimer);
resetBtn.addEventListener('click', resetTimer);
document.getElementById('back-btn').addEventListener('click', () => {
    window.location.href = getPageUrl("menu");
});

