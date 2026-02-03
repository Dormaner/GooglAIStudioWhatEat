import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import recipesRouter from './routes/recipes.js';
import ingredientsRouter from './routes/ingredients.js';
import searchRouter from './routes/search.js';
import aiRouter from './routes/ai.js';
import imageRouter from './routes/image.js';
import shoppingCartRouter from './routes/shoppingCart.js';
import { scrapeXiachufang } from './services/scraper.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Schedule Daily Scrape at 3 AM
cron.schedule('0 3 * * *', () => {
    console.log('Running daily scraper job...');
    scrapeXiachufang();
});

// Manual Trigger Route
app.post('/api/scraper/trigger', async (req, res) => {
    console.log('Manual scraper trigger received');
    // Run async without waiting
    scrapeXiachufang();
    res.json({ message: 'Scraper started in background' });
});


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'WhatEat API is running' });
});

// API Routes
app.use('/api/recipes', recipesRouter);
app.use('/api/ingredients', ingredientsRouter);
app.use('/api/search', searchRouter);
app.use('/api/image', imageRouter); // Register here
app.use('/api/shopping-cart', shoppingCartRouter);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
});

// Start server if run directly (not imported)
if (process.env.NODE_ENV !== 'production' || process.argv[1].endsWith('server.ts')) {
    app.listen(PORT, () => {
        console.log(`🚀 WhatEat API server is running on http://localhost:${PORT}`);
        console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });
}

export default app;
