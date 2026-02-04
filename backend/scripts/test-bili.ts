
import axios from 'axios';

const bvid = 'BV1xx411c7XD'; // Standard example
// const bvid = 'BV1em421I7CA'; // User's video

async function run() {
    try {
        console.log('1. Getting CID...');
        const viewUrl = `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`;
        const viewRes = await axios.get(viewUrl);
        const cid = viewRes.data.data.cid;
        console.log('CID:', cid);

        console.log('2. Getting Play URL...');
        const playUrl = `https://api.bilibili.com/x/player/playurl?bvid=${bvid}&cid=${cid}&qn=16&type=mp4&platform=html5`;
        const playRes = await axios.get(playUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                // 'Cookie': 'SESSDATA=...' // Might be needed for 1080p, but maybe 360p works without?
            }
        });

        console.log('Play Response Code:', playRes.data.code);
        if (playRes.data.code !== 0) {
            console.error('Error:', playRes.data.message);
            return;
        }

        const durl = playRes.data.data.durl;
        if (!durl || durl.length === 0) {
            console.log('No durl found (maybe dash?)');
            console.log(JSON.stringify(playRes.data.data, null, 2));
            return;
        }

        const videoUrl = durl[0].url;
        console.log('Video URL found:', videoUrl.substring(0, 50) + '...');

        console.log('3. Testing Video Access...');
        try {
            const videoCheck = await axios.head(videoUrl, {
                headers: {
                    'Referer': 'https://www.bilibili.com/',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });
            console.log('Video Head Status:', videoCheck.status);
            console.log('Content-Type:', videoCheck.headers['content-type']);
            console.log('Content-Length:', videoCheck.headers['content-length']);
        } catch (e: any) {
            console.error('Video Access Failed:', e.message);
            if (e.response) console.error('Status:', e.response.status);
        }

    } catch (e: any) {
        console.error('Script failed:', e.message);
    }
}

run();
