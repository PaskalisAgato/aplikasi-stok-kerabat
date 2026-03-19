
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Try to use backend if possible or hardcode from what we saw in apps/expenses/.env
const supabaseUrl = 'https://naklryyhioikogvpcdxd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ha2xyeXloaW9pa29ndnBjZHhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0NzM5MzMsImV4cCI6MjA4ODA0OTkzM30.LY0g7HUX1irdlgTaxNc77Xjv64U-XjsoaC5UuJjSZ8w';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkBuckets() {
    console.log('Checking Supabase Storage buckets for project naklryyhioikogvpcdxd...');
    const { data, error } = await supabase.storage.listBuckets();

    if (error) {
        console.error('Error fetching buckets:', error.message);
        console.error('Full error:', JSON.stringify(error, null, 2));
    } else {
        console.log('Available Buckets:');
        if (data.length === 0) {
            console.log('-> No buckets found! (Check if you are in the right project)');
        }
        data.forEach(b => {
            console.log(`- Name: "${b.name}", Public: ${b.public}`);
        });
    }
}

checkBuckets();
