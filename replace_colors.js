const fs = require('fs');
const path = require('path');

const appsDir = path.join(__dirname, 'apps');

const mainColors = ['text-white', 'text-black', 'text-slate-100', 'text-slate-200', 'text-slate-300', 'text-slate-700', 'text-slate-800', 'text-slate-900', 'text-slate-950', 'text-gray-900', 'text-gray-800'];
const mutedColors = ['text-slate-400', 'text-slate-500', 'text-gray-400', 'text-gray-500', 'text-slate-600'];

const hardcodedBackgrounds = [
    'bg-red-', 'bg-blue-', 'bg-emerald-', 'bg-green-', 'bg-rose-', 'bg-primary', 'bg-amber-', 'bg-yellow-', 'bg-orange-', 'bg-indigo-', 'bg-purple-', 'bg-pink-'
];

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let changesCount = 0;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        // Skip lines that have a solid primary colored background completely to avoid contrast issues
        if (hardcodedBackgrounds.some(bg => line.includes(bg))) {
            continue;
        }

        // For all other lines, replace all main and muted colors
        mainColors.forEach(mc => {
            line = line.replace(new RegExp(`\\b${mc}\\b`, 'g'), 'text-[var(--text-main)]');
        });
        mutedColors.forEach(mc => {
            line = line.replace(new RegExp(`\\b${mc}\\b`, 'g'), 'text-[var(--text-muted)]');
        });

        // Handle placeholder
        line = line.replace(/\bplaceholder-slate-400\b/g, 'placeholder-[var(--text-muted)]');
        line = line.replace(/\bplaceholder-gray-500\b/g, 'placeholder-[var(--text-muted)]');
        line = line.replace(/\bplaceholder-white\/[0-9]+\b/g, 'placeholder-[var(--text-muted)]');

        if (line !== lines[i]) {
            lines[i] = line;
            changesCount++;
        }
    }

    if (changesCount > 0) {
        fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
        console.log(`Updated ${filePath} (${changesCount} lines modified)`);
    }
}

function traverseDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            if (file !== 'node_modules' && file !== 'dist' && file !== 'build') {
                traverseDir(fullPath);
            }
        } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
            processFile(fullPath);
        }
    }
}

traverseDir(appsDir);
console.log('Theme styling update complete.');
