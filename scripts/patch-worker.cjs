const fs = require('fs');
const path = require('path');

const cfgPath = path.join(__dirname, '..', 'dist', '_worker.js', 'wrangler.json');
const shimPath = path.join(__dirname, '..', 'dist', '_worker.js', 'index.js');

const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
delete cfg.assets;
delete cfg.rules;
delete cfg.pages_build_output_dir;
fs.writeFileSync(cfgPath, JSON.stringify(cfg));

// Shim index.js → entry.mjs since Pages expects index.js
fs.writeFileSync(shimPath, 'export { default } from "./entry.mjs";\n');

console.log('Patched dist/_worker.js for Pages deploy');
