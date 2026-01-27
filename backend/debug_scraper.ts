
import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';


// Load env from backend/.env
dotenv.config({ path: './.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
// console.log('Supabase Key:', supabaseKey); // Don't log key

const supabase = createClient(supabaseUrl!, supabaseKey!);

const UA_MOBILE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1';

async function testScrape() {
    // 1. Test Explore Page
    console.log('--- Fetching Explore Page ---');
    try {
        const { data: exploreHtml } = await axios.get('https://www.xiachufang.com/explore/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const $explore = cheerio.load(exploreHtml as string);
        const links: string[] = [];
        $explore('a[href^="/recipe/"]').each((_, el) => {
            links.push($explore(el).attr('href') || '');
        });
        console.log(`Explore Page: Found ${links.length} links.`);
        console.log('Sample links:', links.slice(0, 3));

        if (links.length === 0) {
            console.error('CRITICAL: No links found on Explore page. Selectors might be wrong or we are blocked.');
            return;
        }

        // 2. Test Single Recipe
        const sampleId = links[0].match(/\/recipe\/(\d+)\//)?.[1] || '107686575';
        const mobileUrl = `https://m.xiachufang.com/recipe/${sampleId}/`;

        console.log(`--- Fetching Mobile Recipe: ${mobileUrl} ---`);
        const { data: html } = await axios.get(mobileUrl, {
            headers: { 'User-Agent': UA_MOBILE }
        });

        const $ = cheerio.load(html as string);
        const title = $('h1').first().text().trim();
        console.log('Title:', title);

        // Debug JSON-LD
        console.log('--- JSON-LD Debug ---');
        let jsonLdImage = '';
        $('script[type="application/ld+json"]').each((_, el) => {
            try {
                const jsonStr = $(el).html() || '{}';
                // console.log('JSON Content:', jsonStr.substring(0, 100) + '...'); 
                const data = JSON.parse(jsonStr);

                const checkRecipe = (obj: any) => {
                    if (obj['@type'] === 'Recipe' && obj.image) {
                        console.log('Found Recipe Image in JSON-LD:', obj.image);
                        jsonLdImage = Array.isArray(obj.image) ? obj.image[0] : obj.image;
                    }
                };

                if (Array.isArray(data)) {
                    data.forEach(checkRecipe);
                } else {
                    checkRecipe(data);
                }
            } catch (e) { console.error('JSON Parse Error', e); }
        });

        // Debug Image Selectors
        console.log('--- Image Debug ---');
        console.log('Video Poster:', $('video').attr('poster'));
        console.log('OG Image:', $('meta[property="og:image"]').attr('content'));
        console.log('Cover Image class src:', $('.cover-image img').attr('src'));
        console.log('Cover Image class data-src:', $('.cover-image img').attr('data-src'));
        console.log('First Img src:', $('img').eq(0).attr('src'));
        console.log('First Img data-src:', $('img').eq(0).attr('data-src'));

        let image = $('video').attr('poster')
            || jsonLdImage
            || $('meta[property="og:image"]').attr('content')
            || $('.cover-image img').attr('data-src')
            || $('.cover-image img').attr('src')
            || '';

        if (image && image.startsWith('//')) image = 'https:' + image;
        console.log('Resolved Image:', image);

        const ingredients = $('.recipe-ingredient a').length;
        console.log('Ingredients Found:', ingredients);

        const steps = $('.step').length;
        console.log('Steps Found:', steps);

        if (!title) {
            console.log('DEBUG HTML DUMP (First 500 chars):');
            console.log((html as string).substring(0, 500));
        }


        // 3. Test DB Connection & Write
        console.log('--- Testing Supabase Write ---');

        // Check if exists first to avoid duplicates in test
        const { data: existing } = await supabase.from('recipes').select('id').eq('link', mobileUrl).single();

        if (existing) {
            console.log('Recipe already exists in DB:', existing.id);
        } else {
            const { data: newRecipe, error: chatError } = await supabase.from('recipes').insert({
                name: title,
                image: $('img').first().attr('src') || '',
                link: mobileUrl,
                insight: 'DebugScript Insert'
            }).select().single();

            if (chatError) {
                console.error('Supabase INSERT Error:', chatError);
            } else {
                console.log('Supabase INSERT Success! ID:', newRecipe.id);
            }
        }

    } catch (e) {
        console.error('Test Failed:', e);
    }
}

testScrape();
