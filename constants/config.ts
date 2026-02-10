import { Capacitor } from '@capacitor/core';

// 1. Web (Vercel): Use relative path '' to avoid domain issues
// 2. Mobile (Capacitor): Must use absolute URL 'https://how2cook.top'
// 3. Local Dev: Use 'http://localhost:3001'
export const API_BASE_URL = import.meta.env.VITE_API_URL ||
    (import.meta.env.PROD
        ? (Capacitor.isNativePlatform() ? 'https://how2cook.top' : '')
        : 'http://localhost:3001');
