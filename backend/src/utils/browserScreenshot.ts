import puppeteer, { Browser, Page } from 'puppeteer';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Browser-based video screenshot utility
 * Uses Puppeteer to play Bilibili videos and capture screenshots at specific timestamps
 */

let browserInstance: Browser | null = null;

/**
 * Get or create a shared browser instance
 */
async function getBrowser(): Promise<Browser> {
    if (!browserInstance) {
        browserInstance = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-blink-features=AutomationControlled',
                '--disable-features=IsolateOrigins,site-per-process',
                '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            ]
        });
    }
    return browserInstance;
}

/**
 * Close the browser instance
 */
export async function closeBrowser(): Promise<void> {
    if (browserInstance) {
        await browserInstance.close();
        browserInstance = null;
    }
}

/**
 * Capture a screenshot from a Bilibili video at a specific timestamp
 * @param bvid - Bilibili video ID (e.g., "BV1xx411c7XZ")
 * @param timestamp - Time in seconds to capture screenshot
 * @returns Path to the saved screenshot file
 */
export async function captureVideoFrame(bvid: string, timestamp: number): Promise<string> {
    const browser = await getBrowser();
    const page = await browser.newPage();

    try {
        // Set viewport for consistent screenshot size
        await page.setViewport({ width: 1280, height: 720 });

        // Anti-detection: Remove webdriver flag
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', {
                get: () => false,
            });
        });

        // Navigate to Bilibili video page
        const videoUrl = `https://www.bilibili.com/video/${bvid}`;
        console.log(`[Puppeteer] Loading video: ${videoUrl}`);

        await page.goto(videoUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });

        console.log(`[Puppeteer] Page loaded successfully`);

        // Wait a bit for dynamic content to load
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Wait for video player to load
        await page.waitForSelector('video', { timeout: 10000 });

        // Get video element
        const videoElement = await page.$('video');
        if (!videoElement) {
            throw new Error('Video element not found');
        }

        // CRITICAL FIX: Play video first to ensure it's loaded, then seek
        console.log(`[Puppeteer] Starting video playback...`);
        await page.evaluate(() => {
            const video = document.querySelector('video') as any;
            if (video) {
                video.play();
            }
        });

        // Wait for video to start playing
        await page.waitForFunction(
            () => {
                const video = document.querySelector('video') as any;
                return video && !video.paused && video.readyState >= 2;
            },
            { timeout: 8000 }
        );

        // Now seek to the target timestamp
        console.log(`[Puppeteer] Seeking to ${timestamp}s...`);
        await page.evaluate((time) => {
            const video = document.querySelector('video') as any;
            if (video) {
                video.currentTime = time;
            }
        }, timestamp);

        // Wait for video to seek to the correct position
        await page.waitForFunction(
            (targetTime) => {
                const video = document.querySelector('video') as any;
                return video && Math.abs(video.currentTime - targetTime) < 0.5;
            },
            { timeout: 8000 },
            timestamp
        );

        // VERIFY: Log actual video position after seek
        const actualTime = await page.evaluate(() => {
            const video = document.querySelector('video') as any;
            return video ? video.currentTime : -1;
        });
        console.log(`[Puppeteer] ✅ Video seeked to ${actualTime}s (target: ${timestamp}s)`);

        // Pause to freeze the frame
        await page.evaluate(() => {
            const video = document.querySelector('video') as any;
            if (video) {
                video.pause();
            }
        });

        // Wait for frame to render after seek
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log(`[Puppeteer] Capturing frame at ${timestamp}s...`);

        // Take screenshot of video element only
        const screenshotBuffer = await videoElement.screenshot({ type: 'jpeg', quality: 85 });

        // Save to temp directory
        const tempDir = path.join(process.cwd(), 'temp');
        await fs.mkdir(tempDir, { recursive: true });

        const filename = `frame_${bvid}_${timestamp}_${Date.now()}.jpg`;
        const filepath = path.join(tempDir, filename);

        await fs.writeFile(filepath, screenshotBuffer);
        console.log(`[Puppeteer] ✅ Screenshot saved: ${filepath}`);

        return filepath;

    } catch (error) {
        console.error('[Puppeteer] Screenshot failed:', error);
        throw error;
    } finally {
        await page.close();
    }
}

/**
 * Batch capture multiple screenshots from a video
 * @param bvid - Bilibili video ID
 * @param timestamps - Array of timestamps in seconds
 * @returns Array of file paths to saved screenshots
 */
export async function captureMultipleFrames(
    bvid: string,
    timestamps: number[]
): Promise<string[]> {
    const results: string[] = [];

    for (const timestamp of timestamps) {
        try {
            const filepath = await captureVideoFrame(bvid, timestamp);
            results.push(filepath);
        } catch (error) {
            console.error(`Failed to capture frame at ${timestamp}s:`, error);
            results.push(''); // Empty string indicates failure
        }
    }

    return results;
}

/**
 * Clean up a screenshot file
 */
export async function cleanupScreenshot(filepath: string): Promise<void> {
    try {
        await fs.unlink(filepath);
        console.log(`[Cleanup] Deleted: ${filepath}`);
    } catch (error) {
        console.warn(`[Cleanup] Failed to delete ${filepath}:`, error);
    }
}
