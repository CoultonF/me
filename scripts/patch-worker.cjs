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
// Remove auto-generated SESSION KV binding (no ID, we don't use astro:session)
if (cfg.kv_namespaces) {
  cfg.kv_namespaces = cfg.kv_namespaces.filter(ns => ns.id);
  if (cfg.kv_namespaces.length === 0) delete cfg.kv_namespaces;
}
// Keep pages_build_output_dir so wrangler recognizes this as a Pages config
// (and applies compatibility_flags like nodejs_compat)
cfg.pages_build_output_dir = '..';
fs.writeFileSync(cfgPath, JSON.stringify(cfg));

// Shim index.js → entry.mjs since Pages expects index.js
fs.writeFileSync(shimPath, 'export { default } from "./entry.mjs";\n');

// Move static assets from dist/client/ to dist/ root so Pages serves them
const distDir = path.join(__dirname, '..', 'dist');
const clientDir = path.join(distDir, 'client');
if (fs.existsSync(clientDir)) {
  const copyRecursive = (src, dest) => {
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
      fs.mkdirSync(dest, { recursive: true });
      for (const child of fs.readdirSync(src)) {
        copyRecursive(path.join(src, child), path.join(dest, child));
      }
    } else {
      fs.copyFileSync(src, dest);
    }
  };
  for (const entry of fs.readdirSync(clientDir)) {
    copyRecursive(path.join(clientDir, entry), path.join(distDir, entry));
  }
  console.log('Copied dist/client/* to dist/ root for Pages static serving');
}

console.log('Patched dist/_worker.js for Pages deploy');
