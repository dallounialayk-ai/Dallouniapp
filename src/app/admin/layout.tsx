import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'لوحة التحكم | دلّوني عليك',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-root h-dvh w-full overflow-hidden bg-[oklch(0.985_0.002_240)] text-foreground">
      {children}
    </div>
  );
}
