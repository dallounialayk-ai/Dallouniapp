import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(name: string): string {
  if (!name) return '؟';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '؟';
  if (parts.length === 1) return parts[0].charAt(0);
  return parts[0].charAt(0) + parts[1].charAt(0);
}

export function formatRelativeTime(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'الآن';
  if (diffMin < 60) return `قبل ${diffMin} دقيقة`;
  if (diffHr < 24) return `قبل ${diffHr} ساعة`;
  if (diffDay < 7) return `قبل ${diffDay} يوم`;
  if (diffDay < 30) return `قبل ${Math.floor(diffDay / 7)} أسبوع`;
  if (diffDay < 365) return `قبل ${Math.floor(diffDay / 30)} شهر`;
  return `قبل ${Math.floor(diffDay / 365)} سنة`;
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '—';
  return new Intl.NumberFormat('ar-YE', { maximumFractionDigits: 0 }).format(amount) + ' ر.ي';
}
