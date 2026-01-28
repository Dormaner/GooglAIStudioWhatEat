
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: './.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

// 1. Try with ANON Key first (Simulate current backend)
const supabaseAnon = createClient(supabaseUrl, supabaseKey);

async function testUpdate() {
    const id = "664cfbf6-4988-4638-b205-e4b93f6d2848"; // Specific ID from user
    const newInsight = "TEST_INSIGHT_UPDATE_" + Date.now();

    console.log(`[ANON KEY] Attempting update on ID: ${id}`);

    const { data, error, count } = await supabaseAnon
        .from('recipes')
        .update({ insight: newInsight })
        .eq('id', id)
        .select(); // Select to see returned data

    if (error) {
        console.error('[ANON KEY] Error:', error);
    } else {
        console.log(`[ANON KEY] Success? Data returned: ${data?.length}, Content: ${data?.[0]?.insight}`);
        if (data?.length === 0) {
            console.warn("[ANON KEY] WARNING: Update returned 0 rows. This likely means RLS blocked the update or ID not found.");
        }
    }

    // 2. If Service Key exists, try that too for comparison
    if (supabaseServiceKey) {
        console.log('\n[SERVICE KEY] Attempting update...');
        const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
        const { data: data2, error: error2 } = await supabaseService
            .from('recipes')
            .update({ insight: newInsight + "_SERVICE" })
            .eq('id', id)
            .select();

        if (error2) console.error('[SERVICE KEY] Error:', error2);
        else console.log(`[SERVICE KEY] Success! Data returned: ${data2?.length}, Content: ${data2?.[0]?.insight}`);
    } else {
        console.log("\n[SERVICE KEY] No Service Role Key found in .env to test bypass.");
    }
}

testUpdate();
