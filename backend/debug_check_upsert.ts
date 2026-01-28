
import axios from 'axios';

const run = async () => {
    try {
        const name = "SystemTest_" + Date.now();
        console.log(`1. Creating new item: ${name}`);
        const res1 = await axios.post('http://localhost:3001/api/ingredients', {
            name: name,
            category: 'condiment',
            icon: 'A'
        });
        console.log('Created ID:', res1.data.id);

        console.log(`2. Attempting to UPSERT (overwrite) item: ${name}`);
        // Change icon to 'B' to verify update
        const res2 = await axios.post('http://localhost:3001/api/ingredients', {
            name: name,
            category: 'condiment',
            icon: 'B'
        });

        console.log('Result ID:', res2.data.id);
        console.log('Result Icon:', res2.data.icon);

        if (res1.data.id === res2.data.id) {
            console.log('PASS: ID matched. Item was updated.');
        } else {
            console.log('FAIL: ID mismatch. Duplicate created?');
        }

        if (res2.data.icon === 'B') {
            console.log('PASS: Icon updated.');
        } else {
            console.log('FAIL: Icon not updated.');
        }

        // Cleanup
        await axios.delete(`http://localhost:3001/api/ingredients/${res1.data.id}`);
        if (res1.data.id !== res2.data.id) {
            await axios.delete(`http://localhost:3001/api/ingredients/${res2.data.id}`);
        }

    } catch (error: any) {
        console.error('Error:', error.response?.status, error.response?.data);
    }
};

run();
