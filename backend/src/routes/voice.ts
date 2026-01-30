
import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '../config/supabase';

const router = express.Router();

// Initialize Gemini
// Ensure GEMINI_API_KEY is in .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

router.post('/command', async (req, res) => {
    try {
        const { text, recipeId, currentInsight, currentStep, totalSteps } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'No voice text provided' });
        }

        console.log(`[Voice] Processing: "${text}" | Recipe: ${recipeId}`);

        // System Prompt for Intent Classification
        const prompt = `
    You are a cooking assistant AI. Access the user's voice command and return a JSON object with the intent.
    
    Current Logic Context:
    - User is in "Cooking Mode" for a recipe.
    - Current Step Index: ${currentStep} (0-indexed)
    - Total Steps: ${totalSteps}
    
    Intents:
    1. "NAV": Navigation commands (next, prev, back, forward, go to step X).
    2. "NOTE": User wants to record a cooking note/insight/reminder.
    
    Output Format (JSON ONLY, no markdown):
    {
      "intent": "NAV" | "NOTE",
      "action": "next" | "prev" | "jump" | "exit" (Only for NAV),
      "value": number (Only for 'jump' or 'multiple steps' e.g. 'go back 2 steps' -> value: 2, default 1),
      "noteContent": string (Only for NOTE, authorized corrected text of the note)
    }

    Examples:
    - "Next step" -> {"intent": "NAV", "action": "next"}
    - "Go back" -> {"intent": "NAV", "action": "prev"}
    - "Skip to step 5" -> {"intent": "NAV", "action": "jump", "value": 4} (0-indexed)
    - "Remind me to use less salt" -> {"intent": "NOTE", "noteContent": "Next time use less salt."}
    - "Reminder: Fry for 5 mins" -> {"intent": "NOTE", "noteContent": "Fry for 5 mins."}
    - "Go back 2 steps" -> {"intent": "NAV", "action": "prev", "value": 2}
    - "Quit" -> {"intent": "NAV", "action": "exit"}

    User Voice Command: "${text}"
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const jsonString = response.text().replace(/```json|```/g, '').trim();

        let parsedData;
        try {
            parsedData = JSON.parse(jsonString);
        } catch (e) {
            console.error("Failed to parse Gemini response:", jsonString);
            return res.status(500).json({ error: 'AI processing failed' });
        }

        // Handle NOTE intent directly on backend
        if (parsedData.intent === 'NOTE' && recipeId) {
            const timestamp = new Date().toLocaleDateString();
            const newNote = `[${timestamp}] ${parsedData.noteContent}`;
            const updatedInsight = currentInsight ? `${currentInsight}\n${newNote}` : newNote;

            const { error } = await supabase
                .from('recipes')
                .update({ insight: updatedInsight })
                .eq('id', recipeId);

            if (error) {
                console.error("Supabase update error:", error);
                return res.status(500).json({ error: 'Failed to save note' });
            }

            // Return updated insight so frontend can update state
            return res.json({ ...parsedData, updatedInsight });
        }

        // Return NAV intent or success NOTE
        res.json(parsedData);

    } catch (error) {
        console.error('[Voice] Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
