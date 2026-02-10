import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'cooking-assistant---what-to-eat?',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    hostname: 'how2cook.top' // Optional but good for cookies
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    }
  }
};

export default config;
