
import axios from 'axios';

const run = async () => {
    try {
        console.log('Attempting to add "排骨" (Pai gu)...');
        const res = await axios.post('http://localhost:3001/api/ingredients', {
            name: '排骨',
            category: 'meat', // Assuming meat
            icon: '🥩'
        });
        console.log('Success:', res.data);
    } catch (error: any) {
        console.error('Error Status:', error.response?.status);
        console.error('Error Data:', error.response?.data);
    }
};

run();
