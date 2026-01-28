
import axios from 'axios';

const API_URL = 'http://localhost:3001';

async function testInsightPersistence() {
    try {
        // 1. Get a recipe ID (assuming at least one exists)
        console.log('Fetching recipes...');
        const recipesRes = await axios.get(`${API_URL}/api/recipes`);
        const recipe = recipesRes.data[0];
        if (!recipe) {
            console.error('No recipes found to test.');
            return;
        }

        const recipeId = recipe.id;
        const testInsight = `Test Insight ${Date.now()}`;
        console.log(`Testing with Recipe ID: ${recipeId}`);
        console.log(`New Insight to save: "${testInsight}"`);

        // 2. Update Insight
        console.log('Updating insight...');
        await axios.put(`${API_URL}/api/recipes/${recipeId}`, {
            insight: testInsight
        });

        // 3. Fetch again to verify
        console.log('Fetching recipe again to verify...');
        const updatedRes = await axios.get(`${API_URL}/api/recipes/${recipeId}`);
        const savedInsight = updatedRes.data.insight;

        console.log(`Saved Insight in DB: "${savedInsight}"`);

        if (savedInsight === testInsight) {
            console.log('✅ SUCCESS: Insight was saved and retrieved correctly.');
        } else {
            console.error('❌ FAILURE: Insight mismatch.');
            console.error(`Expected: "${testInsight}"`);
            console.error(`Received: "${savedInsight}"`);
        }

    } catch (error) {
        console.error('Test failed with error:', error);
    }
}

testInsightPersistence();
