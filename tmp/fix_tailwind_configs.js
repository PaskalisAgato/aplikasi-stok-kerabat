const fs = require('fs');
const path = require('path');

const appsDir = path.join(process.cwd(), 'apps');
const apps = fs.readdirSync(appsDir);

apps.forEach(app => {
    const configPath = path.join(appsDir, app, 'tailwind.config.js');
    if (fs.existsSync(configPath)) {
        let content = fs.readFileSync(configPath, 'utf8');
        // Look for the specific pattern including the possible backtick and n
        // The grep showed it as "export default {`n"
        const corrupted = 'export default {`n';
        if (content.includes(corrupted)) {
            console.log(`Fixing ${configPath}`);
            content = content.replace(corrupted, 'export default {\n');
            fs.writeFileSync(configPath, content);
        }
    }
});
