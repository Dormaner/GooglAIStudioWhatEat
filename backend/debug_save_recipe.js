
async function testSave() {
    const url = 'http://localhost:3001/api/recipes/save-custom';

    // 1. Test Data - A dummy recipe
    const testRecipe = {
        name: "Debug Test Recipe " + Date.now(),
        image: "http://example.com/image.jpg",
        source: {
            platform: "debug",
            originalUrl: "http://example.com/debug-recipe-" + Date.now().toString(), // Stringify to be safe
            author: "Debug Bot"
        },
        ingredients: {
            main: [{ name: "Debug Ingredient", amount: "100g" }],
            condiments: []
        },
        steps: [{ title: "Step 1", description: "Debug step" }]
    };

    console.log("--- Attempt 1: Saving NEW recipe ---");
    console.log("URL:", testRecipe.source.originalUrl);
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipe: testRecipe,
                userId: 'default-user'
            })
        });

        // Clone response to read text if json fails
        const resClone = res.clone();

        try {
            const data = await res.json();
            console.log("Status:", res.status);
            console.log("Response:", data);

            if (res.status === 200 || res.status === 201) {
                console.log("✅ Save Success!");
            } else {
                console.log("❌ Save Failed!");
            }
        } catch (jsonErr) {
            const text = await resClone.text();
            console.log("Status:", res.status);
            console.log("Response (Text):", text);
            console.log("❌ Non-JSON Response received");
        }

        // 2. Test Duplicate - Try to save SAME recipe again
        console.log("\n--- Attempt 2: Saving DUPLICATE recipe (expecting handled success) ---");
        const res2 = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipe: testRecipe,
                userId: 'default-user'
            })
        });
        const data2 = await res2.json();
        console.log("Status:", res2.status);
        console.log("Response:", data2);

    } catch (e) {
        console.error("Request failed:", e);
    }
}

testSave();
