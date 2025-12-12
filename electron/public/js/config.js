const IS_ELECTRON = window.location.protocol === 'file:';
const API_BASE_URL = IS_ELECTRON ? 'http://localhost:5001' : '';

// Helper to get the correct URL for a page
function getPageUrl(page) {
    // If we're in Electron or using static HTML files, append .html
    // If we were using server-side routing without extensions, we'd handle that here.
    // Since we converted everything to .html links, we just return the page with .html
    // Split path and query parameters
    const parts = page.split('?');
    const path = parts[0];
    const query = parts[1] ? '?' + parts[1] : '';

    if (!path.endsWith('.html')) {
        return path + '.html' + query;
    }
    return page;
}

// Global error handler for fetch to catch offline issues
function handleFetchError(error) {
    console.error('Fetch error:', error);
    if (IS_ELECTRON && error.message.includes('Failed to fetch')) {
        alert('Cannot connect to server. Please check if the server is running.');
    }
}
