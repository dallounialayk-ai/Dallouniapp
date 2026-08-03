import type { CapacitorConfig } from '@capacitor/cli';

/**
 * غلاف Android يفتح تطبيق Next.js المنشور على Vercel.
 * عيّن NEXT_PUBLIC_APP_URL بعد أول نشر (مثال: https://dallouniapp.vercel.app)
 * لاحقاً استبدله بالنطاق المخصص دون تغيير appId.
 */
const appUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');

const allowNavigation = [
  '*.vercel.app',
  '*.supabase.co',
  'localhost',
  '127.0.0.1',
];

if (appUrl) {
  try {
    allowNavigation.push(new URL(appUrl).hostname);
  } catch {
    // تجاهل رابط غير صالح أثناء الإعداد المحلي
  }
}

const config: CapacitorConfig = {
  appId: 'com.dallounialayk.app',
  appName: 'دلّوني عليك',
  webDir: 'www',
  server: {
    androidScheme: 'https',
    ...(appUrl
      ? {
          url: appUrl,
          cleartext: false,
        }
      : {}),
    allowNavigation,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#FFFFFFFF',
      androidScaleType: 'CENTER_INSIDE',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#ffffff',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#ffffff',
  },
};

export default config;
