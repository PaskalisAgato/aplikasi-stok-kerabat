import { auth } from './src/config/auth';

console.log('--- AUTH INTERNAL DIAGNOSTIC ---');
console.log('Auth keys:', Object.keys(auth));
if (auth.internalAdapter) {
    console.log('InternalAdapter keys:', Object.keys(auth.internalAdapter));
} else {
    console.log('InternalAdapter is UNDEFINED');
}

// Check context
if (auth.$context) {
    console.log('Context keys:', Object.keys(auth.$context));
}
process.exit(0);
