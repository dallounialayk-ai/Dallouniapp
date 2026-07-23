'use client';

import { APP_PORTAL_ROOT_ID } from '@/hooks/use-app-portal';

/**
 * MobileShell — يحصر التطبيق في إطار بحجم الموبايل على الشاشات الكبيرة
 * ويملأ الشاشة بالكامل على الموبايل، مع احترام safe area للآيفون والأندرويد.
 *
 * - على الموبايل: يملأ العرض بالكامل (100% × 100dvh) بدون تمرير أفقي
 * - على الديسكتوب: إطار مركزي بعرض ~390–430px لمحاكاة الموبايل
 *
 * #app-portal-root: نقطة تثبيت الـ Sheets/Dialogs داخل الإطار فقط
 */
export function MobileShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mobile-shell-root">
      <div className="mobile-shell-frame">
        <div
          id={APP_PORTAL_ROOT_ID}
          className="relative flex flex-col flex-1 min-h-0 min-w-0 w-full h-full overflow-x-hidden overflow-y-hidden"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
