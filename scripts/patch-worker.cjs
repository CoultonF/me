const fs = require('fs');
const path = require('path');

const cfgPath = path.join(__dirname, '..', 'dist', '_worker.js', 'wrangler.json');
const shimPath = path.join(__dirname, '..', 'dist', '_worker.js', 'index.js');

const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
// Remove fields that conflict with Pages deploy
delete cfg.assets;       // Reserved binding in Pages
delete cfg.rules;
delete cfg.main;         // Conflicts with pages_build_output_dir
delete cfg.no_bundle;    // Not used by Pages
// Remove absolute paths that won't work in CI
delete cfg.configPath;
delete cfg.userConfigPath;
// Keep pages_build_output_dir so wrangler recognizes this as a Pages config
// (and applies compatibility_flags like nodejs_compat)
cfg.pages_build_output_dir = '..';
fs.writeFileSync(cfgPath, JSON.stringify(cfg));

// Shim index.js → entry.mjs since Pages expects index.js
fs.writeFileSync(shimPath, 'export { default } from "./entry.mjs";\n');

console.log('Patched dist/_worker.js for Pages deploy');
