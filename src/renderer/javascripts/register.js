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

        // Wrap in object to match main.js IPC handler
        const result = await window.api.register({ username, password });

        if (result) {
            alert("Registration successful! Please login.");
            window.location.href = "login.html";
        } else {
            alert("Username already exists.");
        }
    });
});
