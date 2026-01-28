
import axios from 'axios';

const API_URL = 'http://localhost:3001/api/ingredients';

async function run() {
    try {
        console.log('--- Attempting to add "牛里脊" as "meat" ---');
        // First, check if it exists and what category
        const { data: all } = await axios.get(API_URL);
        const existing = all.others?.find((i: any) => i.name === '牛里脊');

        if (existing) {
            console.log('Found "牛里脊" in others:', existing);
        } else {
            console.log('"牛里脊" not found in others. Checking other categories...');
        }

        // Attempt to ADD it as 'meat'
        const res = await axios.post(API_URL, {
            name: '牛里脊',
            category: 'meat',
            icon: '🥩'
        });

        console.log('Add Response Status:', res.status);
        console.log('Add Response Data:', res.data);

    } catch (err: any) {
        console.error('Add Failed:', err.response?.status, err.response?.data || err.message);
    }
}

run();
