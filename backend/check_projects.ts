
import { createClient } from '@supabase/supabase-js';

const projects = [
    {
        name: 'Project 1 (Active)',
        url: 'https://naklryyhioikogvpcdxd.supabase.co',
        key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ha2xyeXloaW9pa29ndnBjZHhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0NzM5MzMsImV4cCI6MjA4ODA0OTkzM30.LY0g7HUX1irdlgTaxNc77Xjv64U-XjsoaC5UuJjSZ8w'
    },
    {
        name: 'Project 2 (Commented)',
        url: 'https://lvfqfynqzgxjbkotlccp.supabase.co',
        key: '' // Key not in .env, but let's see if we can list it if we find the key elsewhere or just note it
    }
];

async function check() {
    for (const p of projects) {
        console.log(`\n--- Checking ${p.name}: ${p.url} ---`);
        if (!p.key) {
            console.log('Skipping: No key found for this project.');
            continue;
        }
        const supabase = createClient(p.url, p.key);
        const { data: buckets, error } = await supabase.storage.listBuckets();
        if (error) {
            console.error('Error:', error.message);
        } else {
            console.log('Buckets found:', buckets.length);
            buckets.forEach(b => console.log(` - ${b.name}`));
        }
    }
}

check();
