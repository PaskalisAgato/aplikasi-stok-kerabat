import { auth } from './src/config/auth';

console.log('--- AUTH OBJECT DIAGNOSTIC ---');
console.log('Keys:', Object.keys(auth));
if (auth.api) {
    console.log('API Keys:', Object.keys(auth.api));
} else {
    console.log('API is UNDEFINED');
}

if (auth.session) {
    console.log('Session Keys:', Object.keys(auth.session));
}
process.exit(0);
