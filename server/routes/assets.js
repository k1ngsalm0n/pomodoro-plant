const express = require('express');
const router = express.Router();
const flowers = require('../data/flowers');

router.get('/assets/flower/:id.svg', (req, res) => {
    const flowerId = parseInt(req.params.id);
    const flower = flowers.find(f => f.id === flowerId);

    if (!flower) {
        return res.status(404).send('Flower not found');
    }

    const svg = `
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
    `;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg.trim());
});

// Dynamic plant_stage_3 (bud) with flower colors
router.get('/assets/plant_stage_3/:id.svg', (req, res) => {
    const flowerId = parseInt(req.params.id);
    const flower = flowers.find(f => f.id === flowerId);

    if (!flower) {
        return res.status(404).send('Flower not found');
    }

    const svg = `
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
    `;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg.trim());
});

// Dynamic plant_stage_4 (flower) with flower colors
router.get('/assets/plant_stage_4/:id.svg', (req, res) => {
    const flowerId = parseInt(req.params.id);
    const flower = flowers.find(f => f.id === flowerId);

    if (!flower) {
        return res.status(404).send('Flower not found');
    }

    const svg = `
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
    `;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg.trim());
});

module.exports = router;
