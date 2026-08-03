'use client';

import { Capacitor } from '@capacitor/core';

/** هل التطبيق يعمل داخل غلاف Capacitor الأصلي؟ */
export function isNativeApp(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export function getNativePlatform(): string {
  try {
    return Capacitor.getPlatform();
  } catch {
    return 'web';
  }
}
