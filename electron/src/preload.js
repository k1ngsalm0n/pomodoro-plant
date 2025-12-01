const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
    // Fetch to Express backend (optional helper, but standard fetch works too)
    serverFetch: async (url, options = {}) => {
        const response = await fetch(url, {
            ...options,
            credentials: "include",
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        // Handle session/auth errors
        if (response.status === 403) {
            throw new Error('Not authenticated');
        }

        return response;
    }
});