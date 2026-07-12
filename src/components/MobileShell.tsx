'use client';

/**
 * MobileShell — يحصر التطبيق في إطار بحجم الموبايل على الشاشات الكبيرة
 * ويملأ الشاشة بالكامل على الموبايل، مع احترام safe area للآيفون والأندرويد.
 *
 * - على الموبايل: يملأ الشاشة بالكامل (100vw × 100dvh)
 * - على الديسكتوب: يعرض التطبيق في إطار مركزي بعرض 430px (iPhone Pro Max)
 *   مع خلفية رمادية خفيفة حوله لمحاكاة تجربة الموبايل
 *
 * Safe areas:
 * - top: للـ notch و dynamic island
 * - bottom: للـ home indicator
 * - left/right: للـ landscape orientation
 */
export function MobileShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mobile-shell-root">
      <div className="mobile-shell-frame">
        {children}
      </div>
    </div>
  );
}
