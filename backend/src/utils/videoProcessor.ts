
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from 'ffmpeg-static';

// Set ffmpeg path
if (ffmpegInstaller) {
    ffmpeg.setFfmpegPath(ffmpegInstaller);
}

const TEMP_DIR = path.join(process.cwd(), 'temp');

// Ensure temp dir exists
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

interface DownloadResult {
    filePath: string;
    fileName: string;
}

/**
 * Downloads a video from a URL to a temporary file
 */
export const downloadVideo = async (url: string, referer: string = 'https://www.bilibili.com/'): Promise<DownloadResult> => {
    const fileName = `video-${uuidv4()}.mp4`;
    const filePath = path.join(TEMP_DIR, fileName);

    console.log(`[VideoProcessor] Downloading to ${filePath}...`);

    const writer = fs.createWriteStream(filePath);

    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': referer
        }
    });

    (response.data as NodeJS.ReadableStream).pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve({ filePath, fileName }));
        writer.on('error', reject);
    });
};

/**
 * Extracts a screenshot at a specific timestamp
 */
export const extractFrame = async (videoPath: string, timestampInSeconds: number): Promise<string> => {
    const outputFileName = `frame-${uuidv4()}.jpg`;
    const outputPath = path.join(TEMP_DIR, outputFileName);

    // Safety check: ensure timestamp is valid
    const safeTimestamp = Math.max(0, timestampInSeconds);

    console.log(`[VideoProcessor] Extracting frame at ${safeTimestamp}s from ${videoPath}`);

    return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
            .screenshots({
                timestamps: [safeTimestamp],
                filename: outputFileName,
                folder: TEMP_DIR,
                size: '640x?' // Resize width to 640, keep aspect ratio
            })
            .on('end', () => {
                resolve(outputPath);
            })
            .on('error', (err) => {
                console.error('[VideoProcessor] FFMPEG Error:', err);
                reject(err);
            });
    });
};

/**
 * Deletes a file safely
 */
export const cleanupFile = (filePath: string) => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (e) {
        console.warn(`[VideoProcessor] Failed to cleanup ${filePath}`, e);
    }
};
