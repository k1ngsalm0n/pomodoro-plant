document.getElementById("study-btn").addEventListener("click", () => {
    window.location.href = "/timer";
});

document.getElementById("plant-btn").addEventListener("click", () => {
    window.location.href = "/plants";
});

document.getElementById("logout-btn").addEventListener("click", async () => {
    try {
        const response = await fetch("/logout", { method: "POST" });
        if (response.ok) {
            window.location.href = "/login";
        } else {
            alert("Logout failed");
        }
    } catch (error) {
        console.error("Logout error:", error);
    }
});
