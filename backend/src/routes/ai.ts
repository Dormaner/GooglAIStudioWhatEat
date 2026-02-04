import { Router, Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from "@google/generative-ai/server";

const router = Router();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY || '');

router.post('/analyze', async (req: Request, res: Response) => {
    try {
        const { bvid } = req.body;

        if (!bvid) {
            return res.status(400).json({ error: 'bvid is required' });
        }

        console.log(`[AI] Starting analysis for BVID: ${bvid}`);

        // 1. Fetch Bilibili Video Details
        const biliUrl = `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`;
        let videoInfo;

        try {
            const biliResponse = await fetch(biliUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    'Referer': 'https://www.bilibili.com/',
                    'Cookie': 'buvid3=infoc; PVID=1;'
                }
            });

            if (biliResponse.ok) {
                const biliData: any = await biliResponse.json();
                videoInfo = biliData?.data;
            }
        } catch (err) {
            console.error('[AI] Bilibili fetch warning:', err);
        }

        // Fallback or Basic Context if fetch fails
        const context = videoInfo ? `
        Video Title: ${videoInfo.title}
        Description: ${videoInfo.desc}
        ` : `Video ID: ${bvid} (Metadata fetch failed)`;

        console.log('[AI] Context prepared, calling Gemini...');

        // 3. Call Gemini
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            const prompt = `
            You are a chef assistant. Extract a recipe from this video info:
            ${context}

            Return purely JSON data with NO markdown formatting:
            {
                "ingredients": {
                    "main": [{"name": "Name", "amount": "Qty", "status": "unknown"}],
                    "condiments": [{"name": "Name", "amount": "Qty", "status": "unknown"}]
                },
                "steps": [
                    { "step_order": 1, "title": "Step Title", "description": "Step details...", "image": "" }
                ]
            }
            If info is missing, infer a generic recipe.
            Language: Simplified Chinese (zh-CN).
            `;

            const result = await model.generateContent(prompt);
            const responseText = result.response.text();

            console.log('[AI] Gemini response received');

            // 4. Parse and Return
            // Clean up markdown block if present
            let jsonStr = responseText.trim();
            if (jsonStr.startsWith('```json')) jsonStr = jsonStr.replace(/^```json/, '').replace(/```$/, '');
            if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/^```/, '').replace(/```$/, '');

            const recipeData = JSON.parse(jsonStr);

            // Add image placeholder
            const coverImage = videoInfo?.pic ? (videoInfo.pic.startsWith('//') ? `https:${videoInfo.pic}` : videoInfo.pic) : 'https://i0.hdbsl.com/bfs/archive/placeholder.jpg';

            if (Array.isArray(recipeData.steps)) {
                recipeData.steps = recipeData.steps.map((s: any) => ({
                    ...s,
                    image: coverImage
                }));
            }

            return res.json(recipeData);

        } catch (apiError) {
            console.error('[AI] Gemini/Parsing failed:', apiError);

            // Returning Mock Data as Fallback
            return res.json({
                ingredients: {
                    main: [{ name: "AI分析暂不可用", amount: "请看视频", status: "unknown" }],
                    condiments: []
                },
                steps: [
                    {
                        step_order: 1,
                        title: "自动分析服务繁忙",
                        description: "AI 暂时无法解析该视频，请直接观看视频教程。",
                        image: "https://i0.hdbsl.com/bfs/archive/placeholder.jpg"
                    }
                ]
            });
        }

    } catch (error: any) {
        console.error('AI Analysis Critical Failure:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Helper to wait for file active state
async function waitForFilesActive(files: any[]) {
    console.log("Waiting for file processing...");
    for (const name of files.map((file) => file.name)) {
        let file = await fileManager.getFile(name);
        while (file.state === "PROCESSING") {
            process.stdout.write(".");
            await new Promise((resolve) => setTimeout(resolve, 2000));
            file = await fileManager.getFile(name);
        }
        if (file.state !== "ACTIVE") {
            throw Error(`File ${file.name} failed to process`);
        }
    }
    console.log("...all files ready");
}

router.post('/analyze-video', async (req: Request, res: Response) => {
    try {
        const { filePath, mimeType } = req.body;

        if (!filePath) {
            return res.status(400).json({ error: 'filePath is required' });
        }

        console.log(`[AI Video] Uploading ${filePath} to Gemini...`);

        // 1. Upload to Gemini
        const uploadResponse = await fileManager.uploadFile(filePath, {
            mimeType: mimeType || "video/mp4",
            displayName: "Cooking Video",
        });

        const file = uploadResponse.file;
        console.log(`[AI Video] Uploaded file ${file.uri}, state: ${file.state}`);

        // 2. Wait for processing
        await waitForFilesActive([file]);

        // 3. Generate Content
        console.log('[AI Video] Generating analysis...');
        // Use a model that supports Multimodal (Video)
        // Note: gemini-2.5-flash might not support video yet, verify if needed. 
        // Using gemini-2.0-flash-exp as it is known to support multimodal well.
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

        const prompt = `
        You are an expert chef creating a step-by-step graphic recipe from this cooking video.
        
        Analyze the video and identify the key distinct cooking steps.
        For each step, provide:
        1. "timestamp": The EXACT time (in seconds) where this step is BEST visually represented. This will be used to extract a screenshot. choose a clear, steady frame.
        2. "title": A short, action-oriented title (e.g., "Chop Onions", "Sear Beef").
        3. "description": A detailed instruction for this step.
        
        Also extract the ingredients list.

        Return purely JSON:
        {
            "name": "Recipe Name",
            "ingredients": {
                "main": [{"name": "Name", "amount": "Qty"}],
                "condiments": [{"name": "Name", "amount": "Qty"}]
            },
            "steps": [
                { "step_order": 1, "timestamp": 12.5, "title": "Step Title", "description": "Details..." }
            ]
        }
        Language: Simplified Chinese (zh-CN).
        `;

        const result = await model.generateContent([
            {
                fileData: {
                    mimeType: file.mimeType,
                    fileUri: file.uri
                }
            },
            { text: prompt }
        ]);

        const responseText = result.response.text();
        console.log('[AI Video] Analysis complete');

        // Clean JSON
        let jsonStr = responseText.trim();
        if (jsonStr.startsWith('```json')) jsonStr = jsonStr.replace(/^```json/, '').replace(/```$/, '');
        if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/^```/, '').replace(/```$/, '');

        const recipeData = JSON.parse(jsonStr);

        // Append file URI for cleanup purposes later (optional, or we clean up now)
        try {
            await fileManager.deleteFile(file.name);
            console.log(`[AI Video] Deleted remote file ${file.name}`);
        } catch (e) {
            console.warn(`[AI Video] Failed to delete remote file:`, e);
        }

        return res.json(recipeData);

    } catch (error: any) {
        console.error('Video Analysis Failed:', error);
        res.status(500).json({ error: error.message });
    }
});

// New Endpoint: Semantic Ingredient Matching
router.post('/match-ingredients', async (req: Request, res: Response) => {
    try {
        const { userIngredients, recipeIngredients } = req.body;

        if (!userIngredients || !recipeIngredients) {
            return res.status(400).json({ error: 'Missing ingredients data' });
        }

        console.log(`[AI Match] Comparing ${userIngredients.length} user items vs ${recipeIngredients.length} recipe items`);

        // Prompt engineering for the chef assistant
        const prompt = `
        Role: Expert Chef.
        Task: Check if the user has the required ingredients for a recipe.
        
        User Inventory: ${JSON.stringify(userIngredients)}
        Recipe Requirements: ${JSON.stringify(recipeIngredients)}
        
        Rules:
        1. Semantic Match: "Roasted Sausage" matches "Sausage". "Ribeye" matches "Beef".
        2. Ignore quantities.
        3. Return a JSON object where keys are the EXACT names from "Recipe Requirements" and values are booleans (true if available/substitutable, false if missing).
        
        Example Output JSON:
        {
            "Tomato": true,
            "Beef": false
        }
        `;

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Clean json
        let jsonStr = responseText.trim();
        if (jsonStr.startsWith('```json')) jsonStr = jsonStr.replace(/^```json/, '').replace(/```$/, '');
        if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/^```/, '').replace(/```$/, '');

        const matchResults = JSON.parse(jsonStr);
        console.log('[AI Match] Result:', matchResults);

        res.json(matchResults);

    } catch (error) {
        console.error('[AI Match] Failed:', error);
        res.status(500).json({ error: 'AI matching failed' });
    }
});

export default router;
