import { Capacitor } from '@capacitor/core';

// 1. Production (Web & App): Always use absolute URL to ensure consistency
// 2. Local Dev: Use 'http://localhost:3001'
export const API_BASE_URL = import.meta.env.VITE_API_URL ||
    (import.meta.env.PROD
        ? 'https://how2cook.top'
        : 'http://localhost:3001');
