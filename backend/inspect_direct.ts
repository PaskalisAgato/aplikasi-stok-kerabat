
import { createClient } from '@supabase/supabase-js';

const url = 'https://naklryyhioikogvpcdxd.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ha2xyeXloaW9pa29ndnBjZHhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0NzM5MzMsImV4cCI6MjA4ODA0OTkzM30.LY0g7HUX1irdlgTaxNc77Xjv64U-XjsoaC5UuJjSZ8w';

const supabase = createClient(url, key);

async function directCheck() {
    console.log('--- Direct Bucket Check ---');
    console.log('Project:', url);
    
    // 1. Try to get details of the 'expenses' bucket directly
    const { data: bucket, error: bucketError } = await supabase.storage.getBucket('expenses');
    
    if (bucketError) {
        console.error('❌ Error getting "expenses" bucket details:', bucketError.message);
        console.log('Error code:', (bucketError as any).status || 'N/A');
    } else {
        console.log('✅ Found "expenses" bucket!');
        console.log('Public:', bucket.public);
    }

    // 2. Try to list files in it anyway
    const { data: files, error: listError } = await supabase.storage.from('expenses').list();
    if (listError) {
        console.error('❌ Error listing files in "expenses":', listError.message);
    } else {
        console.log('✅ Successfully listed files! Count:', files.length);
    }
}

directCheck();
