import { Router, Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = Router();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });

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

export default router;
