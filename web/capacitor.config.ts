import type { CapacitorConfig } from '@capacitor/cli';

// ORIA native shell (iOS + Android) built with Capacitor around the Vite PWA.
// The web build in `dist/` is bundled into the native app; `cap sync` copies it.
const config: CapacitorConfig = {
  appId: 'com.nexofinanzas.app',
  appName: 'ORIA',
  webDir: 'dist',
  backgroundColor: '#081426',
  ios: {
    contentInset: 'always',
    backgroundColor: '#081426',
    // Allow the Gmail OAuth return via the app's custom scheme / universal link.
    limitsNavigationsToAppBoundDomains: false,
  },
  android: {
    backgroundColor: '#081426',
  },
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      backgroundColor: '#081426',
      showSpinner: false,
    },
  },
};

export default config;
