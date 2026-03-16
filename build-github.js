const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPO_NAME = 'aplikasi-stok-kerabat';
const APPS_DIR = path.join(__dirname, 'apps');
const DIST_DIR = path.join(__dirname, 'dist-pages');

// Remove old dist
if (fs.existsSync(DIST_DIR)) {
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
}
fs.mkdirSync(DIST_DIR, { recursive: true });

// Create index.html at root to redirect to dashboard
const rootIndex = `
<!DOCTYPE html>
<html>
  <head>
    <meta http-equiv="refresh" content="0; url=/${REPO_NAME}/dashboard/" />
    <title>Sistem Stock Kerabat</title>
  </head>
  <body style="background-color: #0f172a; color: white; display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif;">
    <p>Mengalihkan ke Dashboard (GitHub Pages)...</p>
  </body>
</html>
`;
fs.writeFileSync(path.join(DIST_DIR, 'index.html'), rootIndex);
fs.writeFileSync(path.join(DIST_DIR, '404.html'), rootIndex);

const FOLDER_TO_URL = {
  'hpp': 'analisis-hpp',
  'opname': 'stok-opname',
  'employees': 'karyawan',
  'settings': 'pengaturan',
  'cogs': 'analisis-cogs',
  'expenses': 'pengeluaran',
  'waste': 'analisis-pemborosan',
  'activity-history': 'activity-history'
};

const apps = fs.readdirSync(APPS_DIR).filter(file => {
  return fs.statSync(path.join(APPS_DIR, file)).isDirectory() && file !== 'shared';
});

for (const app of apps) {
  const urlSegment = FOLDER_TO_URL[app] || app;
  
  console.log(`\n================================`);
  console.log(`Building ${app} (URL Segment: ${urlSegment})...`);
  console.log(`================================\n`);
  const appPath = path.join(APPS_DIR, app);
  const base = `/${REPO_NAME}/${urlSegment}/`;

  // Support customs API URL for production
  // Read from VITE_API_URL (set by GitHub Actions) or API_URL, with a correct default including /api
  const apiUrl = process.env.VITE_API_URL || process.env.API_URL || "https://aplikasi-stok-kerabat.onrender.com/api";
  const buildEnv = `VITE_API_URL="${apiUrl}" `;

  try {
    execSync(`${buildEnv}npx vite build --base=${base}`, { cwd: appPath, stdio: 'inherit' });

    // Copy the dist folder
    const sourceDist = path.join(appPath, 'dist');
    const targetDist = path.join(DIST_DIR, urlSegment);

    if (fs.existsSync(sourceDist)) {
      fs.cpSync(sourceDist, targetDist, { recursive: true });
    }
  } catch (error) {
    console.error(`Failed to build ${app}`);
  }
}

console.log('\n>>> Build Selesai!');
console.log('>>> Folder "dist-pages" sudah siap untuk didorong (push) ke GitHub Pages.');
console.log(`>>> Deploy ke: https://paskalisagato.github.io/${REPO_NAME}/`);
