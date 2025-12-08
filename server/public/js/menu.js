// Load user stats on page load
async function loadStats() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch('/api/user/stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const stats = await response.json();
            document.getElementById('total-sessions').textContent = stats.total_sessions || 0;
            document.getElementById('current-streak').textContent = stats.current_streak || 0;
            document.getElementById('longest-streak').textContent = stats.longest_streak || 0;
        }
    } catch (err) {
        console.error('Error loading stats:', err);
    }
}

// Load stats on page load
loadStats();

document.getElementById("study-btn").addEventListener("click", () => {
    window.location.href = "/timer";
});

document.getElementById("plant-btn").addEventListener("click", () => {
    window.location.href = "/plants";
});

document.getElementById("logout-btn").addEventListener("click", async () => {
    try {
        const response = await fetch("/api/logout", { method: "POST" });
        // Clear JWT token on logout
        localStorage.removeItem('token');
        if (response.ok) {
            window.location.href = "/login";
        } else {
            alert("Logout failed");
        }
    } catch (error) {
        console.error("Logout error:", error);
    }
});

