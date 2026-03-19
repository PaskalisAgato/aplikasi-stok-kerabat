const fs = require('fs');
const path = require('path');
const appsDir = path.join(process.cwd(), 'apps');
const apps = fs.readdirSync(appsDir);

apps.forEach(app => {
  const configPathTs = path.join(appsDir, app, 'vite.config.ts');
  const configPathJs = path.join(appsDir, app, 'vite.config.js');
  const configPath = fs.existsSync(configPathTs) ? configPathTs : (fs.existsSync(configPathJs) ? configPathJs : null);

  if (configPath) {
    let content = fs.readFileSync(configPath, 'utf8');
    const baseDir = '/aplikasi-stok-kerabat/' + app + '/';
    
    if (content.includes('base:')) {
      content = content.replace(/base:\s*['\"].*?['\"]/, "base: '" + baseDir + "'");
    } else {
      // Look for export default defineConfig({
      content = content.replace(/(export\s+default\s+defineConfig\(\{)/, "$1\n  base: '" + baseDir + "',");
    }
    
    fs.writeFileSync(configPath, content, 'utf8');
    console.log(`Updated base for ${app} at ${configPath}`);
  }
});
