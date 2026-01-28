
import axios from 'axios';

async function testAdd() {
    try {
        console.log('Attempting to add "厨师机" (Kitchen Machine)...');

        // Attempt to add '厨师机' as kitchenware
        const res = await axios.post('http://localhost:3001/api/ingredients', {
            name: '厨师机',
            category: 'kitchenware',
            icon: '🍳'
        });

        console.log('Success!', res.status, res.data);
    } catch (error: any) {
        if (error.response) {
            console.error('Error Response:', error.response.status, error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

testAdd();
