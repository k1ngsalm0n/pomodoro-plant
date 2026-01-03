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
            const response = await fetch(`${API_BASE_URL}/api/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                const data = await response.json();
                // Store JWT token for API calls
                if (data.token) {
                    localStorage.setItem('token', data.token);

                    // Authenticate socket for real-time sync
                    if (typeof window.socketClient !== 'undefined') {
                        window.socketClient.authenticate(data.token);
                    }
                }
                alert(`Login successful! Welcome ${data.username}`);
                window.location.href = getPageUrl("menu");
            } else {
                const error = await response.json();
                alert(error.error || "Login failed");
            }
        } catch (error) {
            alert("Network error: " + error.message);
        }
    });
});