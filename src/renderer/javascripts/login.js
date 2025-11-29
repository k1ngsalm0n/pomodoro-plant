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

        const success = await window.api.login({ username, password });

        if (success) {
            window.location.href = "menu.html";
        } else {
            alert("Invalid login. Try again.");
        }
    });
});
