// Check if running in Capacitor (Native App) environment
const isCapacitor = typeof window !== 'undefined' && (window as any).Capacitor;

// 1. Web (Vercel): Use relative path '' to avoid domain issues
// 2. Mobile (Capacitor): Must use absolute URL 'https://how2cook.top'
// 3. Local Dev: Use 'http://localhost:3001'
export const API_BASE_URL = import.meta.env.VITE_API_URL ||
    (import.meta.env.PROD
        ? (isCapacitor ? 'https://how2cook.top' : '')
        : 'http://localhost:3001');
