const fs = require('fs');
const path = require('path');

const appsDir = path.join(__dirname, 'apps');

const exceptions = ['bg-red-', 'bg-blue-', 'bg-emerald-', 'bg-green-', 'bg-rose-', 'bg-primary', 'bg-amber-', 'bg-yellow-', 'bg-orange-', 'bg-indigo-', 'bg-purple-', 'bg-pink-'];

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let changesCount = 0;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        // Skip lines with explicit button/colored backgrounds
        if (exceptions.some(bg => line.includes(bg))) {
            continue;
        }

        // --- TEXT REPLACEMENTS ---
        // Replace previous var(--text-main) and any lingering hardcoded text
        line = line.replace(/text-\[var\(--text-main\)]/g, 'dark:text-white text-slate-900');
        line = line.replace(/text-\[var\(--text-muted\)]/g, 'dark:text-slate-400 text-slate-500');
        
        line = line.replace(/(?<!dark:)\btext-white\b/g, 'dark:text-white text-slate-900');
        line = line.replace(/(?<!dark:)\btext-slate-100\b/g, 'dark:text-slate-100 text-slate-800');
        line = line.replace(/(?<!dark:)\btext-slate-200\b/g, 'dark:text-slate-200 text-slate-800');
        line = line.replace(/(?<!dark:)\btext-slate-300\b/g, 'dark:text-slate-300 text-slate-800');
        
        line = line.replace(/(?<!dark:)\btext-slate-400\b/g, 'dark:text-slate-400 text-slate-500');
        line = line.replace(/(?<!dark:)\btext-slate-500\b/g, 'dark:text-slate-400 text-slate-500');
        line = line.replace(/(?<!dark:)\btext-gray-400\b/g, 'dark:text-slate-400 text-slate-500');
        line = line.replace(/(?<!dark:)\btext-gray-500\b/g, 'dark:text-slate-400 text-slate-500');

        line = line.replace(/(?<!dark:)\btext-slate-800\b/g, 'dark:text-white text-slate-800');
        line = line.replace(/(?<!dark:)\btext-slate-900\b/g, 'dark:text-white text-slate-900');
        line = line.replace(/(?<!dark:)\btext-slate-950\b/g, 'dark:text-white text-slate-950');
        line = line.replace(/(?<!dark:)\btext-black\b/g, 'dark:text-white text-black');

        // --- PLACEHOLDER REPLACEMENTS ---
        line = line.replace(/placeholder-\[var\(--text-muted\)]/g, 'dark:placeholder-slate-500 placeholder-slate-400');
        line = line.replace(/(?<!dark:)\bplaceholder-white\/[0-9]+\b/g, 'dark:placeholder-white/40 placeholder-slate-400');

        // --- BACKGROUND REPLACEMENTS ---
        line = line.replace(/(?<!dark:)\bbg-slate-900\b/g, 'dark:bg-slate-900 bg-slate-50');
        line = line.replace(/(?<!dark:)\bbg-slate-950\b/g, 'dark:bg-slate-950 bg-slate-50');
        line = line.replace(/(?<!dark:)\bbg-slate-800\b/g, 'dark:bg-slate-800 bg-white');
        line = line.replace(/(?<!dark:)\bbg-black\b/g, 'dark:bg-black bg-white');
        line = line.replace(/(?<!dark:)\bbg-black\/40\b/g, 'dark:bg-black/40 bg-slate-100');
        line = line.replace(/(?<!dark:)\bbg-white\/5\b/g, 'dark:bg-white/5 bg-white shadow-sm border border-slate-200');
        line = line.replace(/(?<!dark:)\bbg-white\/10\b/g, 'dark:bg-white/10 bg-white shadow-md border border-slate-200');
        line = line.replace(/(?<!dark:)\bbg-background-dark\/40\b/g, 'dark:bg-slate-900/40 bg-white/60');
        
        // --- BORDER REPLACEMENTS ---
        line = line.replace(/(?<!dark:)\bborder-white\/10\b/g, 'dark:border-white/10 border-slate-200');
        line = line.replace(/(?<!dark:)\bborder-white\/5\b/g, 'dark:border-white/5 border-slate-200');
        line = line.replace(/(?<!dark:)\bborder-slate-800\b/g, 'dark:border-slate-800 border-slate-200');
        line = line.replace(/(?<!dark:)\bborder-slate-700\b/g, 'dark:border-slate-700 border-slate-200');
        line = line.replace(/(?<!dark:)\bborder-gray-800\b/g, 'dark:border-slate-800 border-slate-200');


        // Ensure no duplicated dark classes exist (e.g., dark:dark:text-white) from double runs
        line = line.replace(/dark:dark:/g, 'dark:');

        if (line !== lines[i]) {
            lines[i] = line;
            changesCount++;
        }
    }

    if (changesCount > 0) {
        fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
        console.log(`Updated ${filePath} (${changesCount} mutations)`);
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
console.log('Complete Deep Theme Sync successful.');
