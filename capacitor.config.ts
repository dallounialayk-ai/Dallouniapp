import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

/**
 * غلاف Android يفتح تطبيق Next.js المنشور على Vercel.
 * عيّن NEXT_PUBLIC_APP_URL بعد أول نشر (مثال: https://dallouniapp.vercel.app)
 * لاحقاً استبدله بالنطاق المخصص دون تغيير appId.
 *
 * مهم: يجب أن يبقى server.url موجوداً في بناء Android وإلا يظهر www المحلي فقط.
 */
const appUrl = (
  process.env.NEXT_PUBLIC_APP_URL || 'https://dallouniapp.vercel.app'
).replace(/\/$/, '');

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
    url: appUrl,
    cleartext: false,
    allowNavigation,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#FFFFFFFF',
      androidScaleType: 'CENTER_INSIDE',
      showSpinner: false,
      // تجنب APIs المهملة للوضع immersive على Android 15+
      splashFullScreen: false,
      splashImmersive: false,
    },
    // Capacitor 8: SystemBars بدل StatusBar.setBackgroundColor (مهمل)
    SystemBars: {
      insetsHandling: 'css',
      style: 'LIGHT',
      hidden: false,
    },
    Keyboard: {
      // على Android المهم resizeOnFullScreen — تفعيله مع edge-to-edge يسبب اهتزازاً وتعارضاً
      resize: KeyboardResize.Body,
      resizeOnFullScreen: false,
    },
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#ffffff',
  },
};

export default config;
