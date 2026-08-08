'use client';

type Props = {
  verified?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  withLabel?: boolean;
};

const dims = { sm: 14, md: 16, lg: 20 } as const;

/**
 * علامة التوثيق الزرقاء لمقدمي الخدمة المعتمدين.
 */
export function VerifiedBadge({
  verified = false,
  size = 'md',
  className = '',
  withLabel = false,
}: Props) {
  if (!verified) return null;
  const dim = dims[size];

  return (
    <span
      className={`inline-flex items-center gap-1 shrink-0 ${className}`}
      title="حساب موثّق"
      aria-label="حساب موثّق"
    >
      <svg width={dim} height={dim} viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="10" fill="#1D9BF0" />
        <path
          d="M7.5 12.5l2.8 2.8 6.2-6.6"
          stroke="#fff"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {withLabel && (
        <span className="text-[10px] font-semibold text-[#1D9BF0]">موثّق</span>
      )}
    </span>
  );
}
