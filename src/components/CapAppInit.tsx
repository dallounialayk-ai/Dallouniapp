'use client';

import { useEffect } from 'react';
import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { App as CapApp } from '@capacitor/app';

/**
 * تهيئة غلاف Capacitor عند التشغيل على Android/iOS:
 * System Bars (edge-to-edge)، إخفاء الـ splash، ومعالجة زر الرجوع.
 */
export function CapAppInit() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let backHandle: { remove: () => Promise<void> } | undefined;

    void (async () => {
      try {
        // SystemBars بدل StatusBar.setBackgroundColor (مهمل على Android 15+)
        // Light = أيقونات داكنة فوق خلفية فاتحة
        await SystemBars.setStyle({ style: SystemBarsStyle.Light });
      } catch {
        // بعض الأجهزة لا تدعم ضبط شريط الحالة
      }

      try {
        await SplashScreen.hide();
      } catch {
        // تجاهل
      }

      backHandle = await CapApp.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) {
          window.history.back();
        } else {
          void CapApp.exitApp();
        }
      });
    })();

    return () => {
      void backHandle?.remove();
    };
  }, []);

  return null;
}
