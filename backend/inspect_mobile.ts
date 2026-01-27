
import axios from 'axios';
import * as cheerio from 'cheerio';

const url = 'https://m.xiachufang.com/recipe/107686575/';

async function inspect() {
    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
            }
        });
        const $ = cheerio.load(data);

        console.log('--- Ingredients Section ---');
        // Guessing common structures
        console.log($('.ings').html() || $('table').html() || 'No .ings or table found');

        console.log('--- Steps Section ---');
        console.log($('.steps').html() || 'No .steps found');

        console.log('--- Cover Image ---');
        console.log($('img').eq(0).attr('src'));

    } catch (e) {
        console.error(e);
    }
}

inspect();
