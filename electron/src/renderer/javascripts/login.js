document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("login-form");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value.trim();

        if (!username || !password) {
            alert("Please enter username and password.");
            return;
        }

        try {
            // Use Express server instead of Electron SQLite
            const response = await window.api.serverPost("http://localhost:5000/login", {
                username,
                password
            });

            if (response.ok) {
                const data = await response.json();
                alert(`Login successful! Welcome ${data.username}`);
                window.location.href = "menu.html";
            } else {
                const error = await response.json();
                alert(error.error || "Login failed");
            }
        } catch (error) {
            alert("Network error: " + error.message);
        }
    });

    // Optional: Test server connection on load
    window.addEventListener('load', async () => {
        try {
            const response = await fetch("http://localhost:5000/health");
            if (response.ok) {
                console.log('Express server is running');
            } else {
                console.log('Express server not responding properly');
            }
        } catch (error) {
            console.log('Cannot reach Express server - make sure it\'s running on port 5000');
        }
    });
});