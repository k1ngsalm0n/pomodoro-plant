document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("register-form");

    form.addEventListener("submit", async (e) => {
        e.preventDefault(); // prevent page reload

        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value.trim();
        const confirm = document.getElementById("confirm-password").value.trim();

        if (!username || !password || !confirm) {
            alert("All fields are required.");
            return;
        }

        if (password !== confirm) {
            alert("Passwords do not match.");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                const data = await response.json();
                // Store JWT token if provided (auto-login)
                if (data.token) {
                    localStorage.setItem('token', data.token);
                    alert("Registration successful! You are now logged in.");
                    window.location.href = getPageUrl("menu");
                } else {
                    alert("Registration successful! Please login.");
                    window.location.href = getPageUrl("login");
                }
            } else {
                const error = await response.json();
                alert(error.error || "Registration failed");
            }
        } catch (error) {
            alert("Network error: " + error.message);
        }
    });
});
