'use client';

import { useEffect } from 'react';
import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { App as CapApp } from '@capacitor/app';
import { Keyboard } from '@capacitor/keyboard';

/**
 * تهيئة غلاف Capacitor عند التشغيل على Android/iOS:
 * System Bars، إخفاء الـ splash، زر الرجوع، وتثبيت سلوك الكيبورد.
 */
export function CapAppInit() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    document.documentElement.classList.add('capacitor-native');

    const handles: Array<{ remove: () => Promise<void> }> = [];

    const scrollFocusedIntoView = () => {
      const el = document.activeElement;
      if (!(el instanceof HTMLElement)) return;
      const tag = el.tagName;
      if (tag !== 'INPUT' && tag !== 'TEXTAREA' && !el.isContentEditable) return;
      // بعد استقرار الكيبورد حرّك الحقل ليبقى ظاهراً بدون اهتزاز layout
      window.setTimeout(() => {
        el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
      }, 50);
    };

    void (async () => {
      try {
        await SystemBars.setStyle({ style: SystemBarsStyle.Light });
      } catch {
        // بعض الأجهزة لا تدعم ضبط شريط الحالة
      }

      try {
        await SplashScreen.hide();
      } catch {
        // تجاهل
      }

      try {
        handles.push(
          await Keyboard.addListener('keyboardWillShow', () => {
            document.documentElement.classList.add('keyboard-open');
          })
        );
        handles.push(
          await Keyboard.addListener('keyboardDidShow', () => {
            document.documentElement.classList.add('keyboard-open');
            scrollFocusedIntoView();
          })
        );
        handles.push(
          await Keyboard.addListener('keyboardWillHide', () => {
            document.documentElement.classList.remove('keyboard-open');
          })
        );
        handles.push(
          await Keyboard.addListener('keyboardDidHide', () => {
            document.documentElement.classList.remove('keyboard-open');
          })
        );
      } catch {
        // الويب أو أجهزة بدون Keyboard plugin
      }

      handles.push(
        await CapApp.addListener('backButton', ({ canGoBack }) => {
          if (canGoBack) {
            window.history.back();
          } else {
            void CapApp.exitApp();
          }
        })
      );
    })();

    return () => {
      document.documentElement.classList.remove('capacitor-native', 'keyboard-open');
      for (const h of handles) void h.remove();
    };
  }, []);

  return null;
}
