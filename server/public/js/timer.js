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

// Socket sync flag to prevent infinite loops when receiving updates
let isSyncingFromRemote = false;

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

// Broadcast timer state to other devices
function broadcastTimerState() {
    if (isSyncingFromRemote) return; // Don't broadcast if we're syncing from another device

    if (typeof window.socketClient !== 'undefined' && window.socketClient.isConnected()) {
        window.socketClient.syncTimer({
            seconds: seconds,
            pomodoroCount: pomodoroCount,
            onBreak: onBreak,
            isRunning: isRunning,
            currentFlowerId: currentFlowerId,
            currentFlowerData: currentFlowerData // Sync flower data too
        });
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
        if (stage >= 3 && currentFlowerId) {
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
        timerInterval = null;

        // Play unlock celebration sound (user already interacted on timer page)
        if (typeof soundEffects !== 'undefined') {
            soundEffects.playUnlockSound();
        }

        const flower = (currentFlowerData && currentFlowerData.flower) ? currentFlowerData.flower : null;

        if (typeof notifications !== 'undefined' && flower) {
            notifications.showFlowerUnlocked(flower.name);
        }

        // Redirect to ending page after sound plays
        setTimeout(() => {
            if (flower) {
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

    // Safety: Clear any existing interval before starting a new one
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    isRunning = true;
    toggleBtn.textContent = 'Pause';

    // Broadcast state change to other devices
    broadcastTimerState();

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
            timerInterval = null;
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
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    isRunning = false;
    toggleBtn.textContent = 'Resume';

    // Play pause sound
    if (typeof soundEffects !== 'undefined') {
        soundEffects.playPauseSound();
    }

    // Broadcast state change to other devices
    broadcastTimerState();
}

// Reset
function resetTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    isRunning = false;
    seconds = studyMinutes * 60;
    pomodoroCount = 0;
    onBreak = false;
    currentFlowerData = null;
    toggleBtn.textContent = 'Start';
    updateDisplay();

    // Broadcast reset to other devices
    broadcastTimerState();
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

// Listen for timer updates from other devices
window.addEventListener('socket:timer:update', (event) => {
    const data = event.detail;
    console.log('[Timer] Received timer sync from another device:', data);

    // Validate received data to prevent undefined errors
    if (!data || typeof data.seconds === 'undefined') {
        console.warn('[Timer] Invalid sync data received, ignoring');
        return;
    }

    // Set flag to prevent broadcasting back
    isSyncingFromRemote = true;

    // Update local state from remote with fallbacks
    seconds = typeof data.seconds === 'number' ? data.seconds : seconds;
    pomodoroCount = typeof data.pomodoroCount === 'number' ? data.pomodoroCount : (typeof pomodoroCount === 'number' ? pomodoroCount : 0);
    onBreak = typeof data.onBreak === 'boolean' ? data.onBreak : false;
    currentFlowerId = data.currentFlowerId || currentFlowerId;
    currentFlowerData = data.currentFlowerData || currentFlowerData;

    // Sync running state
    if (data.isRunning && !isRunning) {
        // Other device started, so start here too (without broadcasting)
        isRunning = true;
        toggleBtn.textContent = 'Pause';
        if (!timerInterval) {
            timerInterval = setInterval(() => {
                seconds--;
                if (seconds <= 0) {
                    clearInterval(timerInterval);
                    isRunning = false;
                    timerInterval = null;
                }
                updateDisplay();
            }, 1000);
        }
    } else if (!data.isRunning && isRunning) {
        // Other device paused, so pause here too
        clearInterval(timerInterval);
        timerInterval = null;
        isRunning = false;
        toggleBtn.textContent = data.seconds > 0 ? 'Resume' : 'Start';
    }

    updateDisplay();

    // Reset flag after update
    setTimeout(() => {
        isSyncingFromRemote = false;
    }, 100);
});

// Listen for plant updates from other devices
window.addEventListener('socket:plant:update', (event) => {
    const data = event.detail;
    console.log('[Timer] Received plant sync from another device:', data);

    currentFlowerData = data;
    if (data.flower && data.flower.id) {
        currentFlowerId = data.flower.id;
    }

    // If the plant is fully grown, we might need to trigger completion
    if (data.growth_stage) {
        pomodoroCount = data.growth_stage;
    }

    updateDisplay();

    if (data.is_fully_grown || data.growth_stage >= 4) {
        checkCompletion();
    }
});

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

