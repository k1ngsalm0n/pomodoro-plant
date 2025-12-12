const fs = require('fs');
const path = require('path');

const serverPublicDir = path.join(__dirname, '../server/public');
const electronPublicDir = path.join(__dirname, 'public');

console.log('Copying assets from server to electron...');

// Ensure electron public directory exists
if (fs.existsSync(electronPublicDir)) {
    fs.rmSync(electronPublicDir, { recursive: true, force: true });
}
fs.mkdirSync(electronPublicDir, { recursive: true });

// Check if server public dir exists
if (!fs.existsSync(serverPublicDir)) {
    console.error('Error: server/public directory not found. Run "npm run build:views" in server directory first.');
    process.exit(1);
}

// Recursive copy function
function copyRecursive(src, dest) {
    const stats = fs.statSync(src);
    if (stats.isDirectory()) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest);
        }
        fs.readdirSync(src).forEach(childItemName => {
            copyRecursive(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

try {
    copyRecursive(serverPublicDir, electronPublicDir);
    console.log('Assets copied successfully.');
} catch (err) {
    console.error('Error copying assets:', err);
    process.exit(1);
}
