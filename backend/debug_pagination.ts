
import axios from 'axios';
import * as cheerio from 'cheerio';

const UA_DESKTOP = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function testPagination() {
    console.log('--- Testing Explore Pagination ---');
    const allIds: string[] = [];

    for (let page = 1; page <= 5; page++) {
        const url = `https://www.xiachufang.com/explore/?page=${page}`;
        console.log(`Fetching ${url} ...`);
        try {
            const { data: html } = await axios.get(url, { headers: { 'User-Agent': UA_DESKTOP } });
            const $ = cheerio.load(html);

            const ids: string[] = [];
            $('a[href^="/recipe/"]').each((_, el) => {
                const href = $(el).attr('href');
                const match = href?.match(/\/recipe\/(\d+)\//);
                if (match) ids.push(match[1]);
            });

            const uniquePageIds = [...new Set(ids)];
            console.log(`   -> Found ${uniquePageIds.length} unique IDs`);
            allIds.push(...uniquePageIds);

            // Log first few IDs to compare
            if (uniquePageIds.length > 0) {
                console.log(`   -> Sample: ${uniquePageIds.slice(0, 3).join(', ')}`);
            }

            await new Promise(r => setTimeout(r, 1000));
        } catch (e: any) {
            console.error(`   -> Failed: ${e.message}`);
        }
    }

    const finalUnique = [...new Set(allIds)];
    console.log('--- Summary ---');
    console.log(`Total Unique IDs Found: ${finalUnique.length}`);
}

testPagination();
