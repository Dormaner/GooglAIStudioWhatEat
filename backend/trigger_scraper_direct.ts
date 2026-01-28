
import { scrapeXiachufang } from './src/services/scraper';
import dotenv from 'dotenv';
dotenv.config();

console.log('--- Manually Triggering Scraper Function ---');
scrapeXiachufang().then(() => {
    console.log('--- Done ---');
}).catch(err => {
    console.error('--- CRASH ---', err);
});
