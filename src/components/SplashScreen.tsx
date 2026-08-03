'use client';

import Image from 'next/image';
import { APP_NAME, APP_TAGLINE } from '@/lib/constants';

/**
 * شاشة البداية أثناء تهيئة الجلسة / الاتصال بقاعدة البيانات
 */
export function SplashScreen({
  message = 'جاري التحميل…',
}: {
  message?: string;
}) {
  return (
    <div className="h-full w-full min-h-0 flex flex-col items-center justify-center bg-gradient-to-b from-background via-background to-primary/[0.06] px-6 overflow-hidden">
      <div className="flex flex-col items-center gap-5 animate-fade-rise">
        <div className="relative">
          <div className="absolute inset-0 rounded-[28px] bg-primary/15 blur-2xl scale-110" />
          <div className="relative w-[148px] h-[148px] rounded-[32px] bg-white border border-border/50 shadow-[0_12px_40px_-12px_rgba(32,99,155,0.35)] flex items-center justify-center overflow-hidden">
            <Image
              src="/logo.png"
              alt={APP_NAME}
              width={136}
              height={136}
              priority
              className="object-contain p-1.5"
            />
          </div>
        </div>

        <div className="text-center space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {APP_NAME}
          </h1>
          <p className="text-xs text-muted-foreground max-w-[240px] leading-relaxed">
            {APP_TAGLINE}
          </p>
        </div>

        <div className="flex flex-col items-center gap-3 mt-2">
          <div className="w-8 h-8 rounded-full border-2 border-primary/25 border-t-primary animate-spin" />
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    </div>
  );
}
