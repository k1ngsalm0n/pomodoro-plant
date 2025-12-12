const fs = require('fs');
const path = require('path');
const pug = require('pug');

const viewsDir = path.join(__dirname, 'views');
const publicDir = path.join(__dirname, 'public');

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}

// Configuration for each view
const views = [
    { name: 'login', locals: { title: 'Login - Pomodoro Plant' } },
    { name: 'register', locals: { title: 'Register - Pomodoro Plant' } },
    { name: 'menu', locals: { title: 'Menu - Pomodoro Plant' } },
    { name: 'timer', locals: { title: 'Timer - Pomodoro Plant' } },
    { name: 'ending', locals: { title: 'Done - Pomodoro Plant' } },
    { name: 'plants', locals: { title: 'My Garden - Pomodoro Plant' } }
];

console.log('Building static views...');

views.forEach(view => {
    const templatePath = path.join(viewsDir, `${view.name}.pug`);
    const outputPath = path.join(publicDir, `${view.name}.html`);

    try {
        const compiledFunction = pug.compileFile(templatePath);
        const html = compiledFunction(view.locals);
        fs.writeFileSync(outputPath, html);
        console.log(`✓ Generated ${view.name}.html`);
    } catch (err) {
        console.error(`✗ Error generating ${view.name}.html:`, err);
        process.exit(1);
    }
});

console.log('Build complete.');
