
import { supabase } from './src/config/supabase.js';

const run = async () => {
    try {
        console.log('Checking recipes table schema...');
        const { data, error } = await supabase
            .from('recipes')
            .select('*')
            .limit(1);

        if (error) throw error;

        if (data && data.length > 0) {
            console.log('Columns:', Object.keys(data[0]));
        } else {
            console.log('No recipes found to check columns.');
        }
    } catch (error: any) {
        console.error('Error:', error.message);
    }
};

run();
