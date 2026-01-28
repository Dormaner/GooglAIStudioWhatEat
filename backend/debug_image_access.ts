
import axios from 'axios';

const imgUrl = 'https://i2.chuimg.com/b71a85b08c9a4253bc849aea51d0e7c0_1080w_1920h.jpg';

async function checkAccess() {
    console.log('Testing Image Access...');

    // 1. Clean Request (Like no-referrer)
    try {
        await axios.head(imgUrl, { headers: { 'Referer': '' } });
        console.log('[SUCCESS] Access with empty Referer');
    } catch (e: any) {
        console.log('[FAILED] Access with empty Referer:', e.message, e.response?.status);
    }

    // 2. Localhost Request (Like standard app)
    try {
        await axios.head(imgUrl, { headers: { 'Referer': 'http://localhost:3000/' } });
        console.log('[SUCCESS] Access with Localhost Referer');
    } catch (e: any) {
        console.log('[FAILED] Access with Localhost Referer:', e.message, e.response?.status);
    }
}

checkAccess();
