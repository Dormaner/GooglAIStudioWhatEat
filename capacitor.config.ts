import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'cooking-assistant---what-to-eat?',
  webDir: 'dist',
  plugins: {
    CapacitorHttp: {
      enabled: true,
    }
  }
};

export default config;
