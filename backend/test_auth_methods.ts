import { auth } from './src/config/auth';
import * as fs from 'fs';

if ((auth as any).$context) {
    const keys = Object.keys((auth as any).$context).sort();
    fs.writeFileSync('context_keys.txt', keys.join('\n'));
    console.log("Written all context keys to context_keys.txt");
} else {
    console.log("auth.$context is not defined");
}

process.exit(0);
