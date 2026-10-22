import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tactileatelier.screwjam',
  appName: 'Screw Jam: Tactile Workshop',
  webDir: 'dist',
  server: {
    iosScheme: 'capacitor',
    cleartext: false,
  },
  ios: {
    backgroundColor: '#0D121C',
    contentInset: 'never',
    preferredContentMode: 'mobile',
    scrollEnabled: false,
    limitsNavigationsToAppBoundDomains: true,
  },
  plugins: {
    CapacitorUpdater: {
      autoUpdate: true,
      resetWhenUpdate: false,
      updateUrl: 'https://api.capgo.app/updates',
      statsUrl: 'https://api.capgo.app/stats',
      channelUrl: 'https://api.capgo.app/channel_self',
    },
  },
};

export default config;
