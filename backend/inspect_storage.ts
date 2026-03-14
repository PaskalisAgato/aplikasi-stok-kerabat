
import { createClient } from '@supabase/supabase-js';

const url = 'https://naklryyhioikogvpcdxd.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ha2xyeXloaW9pa29ndnBjZHhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0NzM5MzMsImV4cCI6MjA4ODA0OTkzM30.LY0g7HUX1irdlgTaxNc77Xjv64U-XjsoaC5UuJjSZ8w';

const supabase = createClient(url, key);

async function inspect() {
    console.log('--- Deep Inspection ---');
    console.log('Listing Buckets...');
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
        console.error('Error listing buckets:', error.message);
    } else {
        console.log('Buckets found:', buckets.length);
        for (const b of buckets) {
            console.log(` - ${b.name} (Public: ${b.public})`);
            const { data: files, error: fileError } = await supabase.storage.from(b.name).list();
            if (fileError) {
                console.error(`   Error listing files in ${b.name}:`, fileError.message);
            } else {
                console.log(`   Files found: ${files.length}`);
            }
        }
    }
}

inspect();
