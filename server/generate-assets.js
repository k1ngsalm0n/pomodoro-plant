const fs = require('fs');
const path = require('path');
const flowers = require('./data/flowers');

const assetsDir = path.join(__dirname, 'public/assets');

// Ensure assets directory exists
if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
}

// Ensure subdirectories exist
const stage3Dir = path.join(assetsDir, 'plant_stage_3');
const stage4Dir = path.join(assetsDir, 'plant_stage_4');

if (!fs.existsSync(stage3Dir)) {
    fs.mkdirSync(stage3Dir);
}
if (!fs.existsSync(stage4Dir)) {
    fs.mkdirSync(stage4Dir);
}

console.log('Generating plant assets...');

function generateStage3Svg(flower) {
    return `
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="100" fill="transparent"/>
  <!-- Soil -->
  <rect x="20" y="80" width="60" height="10" fill="#8D6E63"/>
  <!-- Plant -->
  <rect x="45" y="30" width="10" height="50" fill="#4CAF50"/>
  <rect x="25" y="40" width="20" height="10" fill="#4CAF50"/>
  <rect x="55" y="30" width="20" height="10" fill="#4CAF50"/>
  <rect x="25" y="20" width="20" height="10" fill="#4CAF50"/>
  <!-- Bud -->
  <rect x="40" y="10" width="20" height="20" fill="${flower.color}"/>
</svg>
    `.trim();
}

function generateStage4Svg(flower) {
    return `
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="100" fill="transparent"/>
  <!-- Soil -->
  <rect x="20" y="80" width="60" height="10" fill="#8D6E63"/>
  <!-- Plant -->
  <rect x="45" y="30" width="10" height="50" fill="#4CAF50"/>
  <rect x="25" y="40" width="20" height="10" fill="#4CAF50"/>
  <rect x="55" y="30" width="20" height="10" fill="#4CAF50"/>
  <!-- Flower -->
  <rect x="30" y="5" width="40" height="40" fill="${flower.color}"/>
  <rect x="40" y="15" width="20" height="20" fill="${flower.center}"/>
</svg>
    `.trim();
}

function generateFlowerSvg(flower) {
    // Stage 4 generic flower svg used in some contexts
    return `
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="100" fill="transparent"/>
  <!-- Soil -->
  <rect x="20" y="80" width="60" height="10" fill="#8D6E63"/>
  <!-- Plant -->
  <rect x="45" y="30" width="10" height="50" fill="#4CAF50"/>
  <rect x="25" y="40" width="20" height="10" fill="#4CAF50"/>
  <rect x="55" y="30" width="20" height="10" fill="#4CAF50"/>
  <!-- Flower Petals -->
  <circle cx="50" cy="25" r="15" fill="${flower.color}"/>
  <circle cx="35" cy="25" r="10" fill="${flower.color}"/>
  <circle cx="65" cy="25" r="10" fill="${flower.color}"/>
  <circle cx="50" cy="10" r="10" fill="${flower.color}"/>
  <circle cx="50" cy="40" r="10" fill="${flower.color}"/>
  <!-- Center -->
  <circle cx="50" cy="25" r="8" fill="${flower.center}"/>
</svg>
    `.trim();
}

flowers.forEach(flower => {
    // Generate Stage 3 (Bud)
    const stage3Svg = generateStage3Svg(flower);
    fs.writeFileSync(path.join(stage3Dir, `${flower.id}.svg`), stage3Svg);

    // Generate Stage 4 (Full Flower)
    const stage4Svg = generateStage4Svg(flower);
    fs.writeFileSync(path.join(stage4Dir, `${flower.id}.svg`), stage4Svg);

    // Generate 'flower' asset (might be redundant with stage 4, but assets logic had it)
    const flowerSvg = generateFlowerSvg(flower);
    fs.writeFileSync(path.join(assetsDir, `flower_${flower.id}.svg`), flowerSvg);
});

console.log(`Generated assets for ${flowers.length} flowers.`);
