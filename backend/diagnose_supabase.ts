
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Credentials from apps/expenses/.env
const url = 'https://naklryyhioikogvpcdxd.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ha2xyeXloaW9pa29ndnBjZHhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0NzM5MzMsImV4cCI6MjA4ODA0OTkzM30.LY0g7HUX1irdlgTaxNc77Xjv64U-XjsoaC5UuJjSZ8w';

const supabase = createClient(url, key);

async function diagnose() {
    console.log('--- Supabase Diagnostic ---');
    console.log('Project URL:', url);
    console.log('Testing connection...');

    // 1. Check if we can at least reach the API
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
        console.error('❌ Error listing buckets:', bucketError.message);
        console.log('This usually means the URL or Key is wrong, or the project is paused.');
    } else {
        console.log('✅ Connection successful!');
        console.log('Total Buckets found:', buckets?.length || 0);
        buckets?.forEach(b => {
            console.log(` - Bucket: "${b.name}" (Public: ${b.public})`);
        });

        const exists = buckets?.some(b => b.name.toLowerCase() === 'expenses');
        if (exists) {
            console.log('✅ Found "expenses" bucket!');
        } else {
            console.log('❌ "expenses" bucket is MISSING from this project.');
            console.log('PROBABLE CAUSE: You added the bucket to a DIFFERENT project than the one configured in the app.');
        }
    }

    // 2. Try to get public URL for a dummy file to see if it generates a valid-looking URL
    const { data: { publicUrl } } = supabase.storage.from('expenses').getPublicUrl('test.jpg');
    console.log('Sample Public URL generated:', publicUrl);
}

diagnose();
