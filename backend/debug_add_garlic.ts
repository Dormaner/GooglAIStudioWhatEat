
import axios from 'axios';

const run = async () => {
    try {
        console.log('Checking Server Status...');
        const statusRes = await axios.get('http://localhost:3001/api/ingredients/debug-status');
        console.log('Server Version:', statusRes.data);

        console.log('Attempting to add "大蒜" (Garlic)...');
        const res = await axios.post('http://localhost:3001/api/ingredients', {
            name: '大蒜',
            category: 'condiment',
            icon: '🧄'
        });
        console.log('Success:', res.data);
    } catch (error: any) {
        console.error('Error Status:', error.response?.status);
        console.error('Error Data:', error.response?.data);
    }
};

run();
