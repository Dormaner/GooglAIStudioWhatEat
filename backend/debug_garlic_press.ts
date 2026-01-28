
import axios from 'axios';

async function testGarlicPress() {
    try {
        console.log('Attempting to add "捣蒜器"...');
        const res = await axios.post('http://localhost:3001/api/ingredients', {
            name: '捣蒜器',
            category: 'tool', // Try 'tool' or 'kitchenware' depending on what UI sends. UI map says 'tool' for Kitchenware?
            // UI: category={addCategory === 'condiment' ? '调料' : '厨具'}
            // Wait, AddIngredientModal receives '调料' or '厨具'.
            // Then it calls onConfirm(name, icon).
            // Then WhatIsAvailable handleAddIngredient calls addNewIngredient(name, modalCategory, icon).
            // modalCategory is set via categoryMap: '厨具' -> 'tool'.
            // So payload category is 'tool'.
            icon: '🍳'
        });
        console.log('Success:', res.status, res.data);
    } catch (error: any) {
        console.error('Failed:', error.response ? error.response.status : error.message, error.response ? error.response.data : '');
    }
}

testGarlicPress();
