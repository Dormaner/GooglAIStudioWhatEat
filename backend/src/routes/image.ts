
import express from 'express';
import axios from 'axios';

const router = express.Router();

router.get('/', async (req, res) => {
    const { url } = req.query;

    if (!url || typeof url !== 'string') {
        return res.status(400).send('Missing url param');
    }

    try {
        // Smart Referer: Use appropriate referer based on image domain
        let referer = 'https://www.xiachufang.com/'; // Default
        if (url.includes('hdslb.com') || url.includes('bilibili.com')) {
            referer = 'https://www.bilibili.com/';
        }

        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream',
            headers: {
                'Referer': referer,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            }
        });

        // Forward content-type (image/jpeg, etc.)
        res.setHeader('Content-Type', response.headers['content-type']);
        (response.data as any).pipe(res);

    } catch (error: any) {
        console.error(`Proxy fail for ${url}:`, error.message);
        res.status(500).send('Failed to fetch image');
    }
});

export default router;
