'use client';

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { App as CapApp } from '@capacitor/app';

/**
 * تهيئة غلاف Capacitor عند التشغيل على Android/iOS:
 * شريط الحالة، إخفاء الـ splash، ومعالجة زر الرجوع.
 */
export function CapAppInit() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let backHandle: { remove: () => Promise<void> } | undefined;

    void (async () => {
      try {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#ffffff' });
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
