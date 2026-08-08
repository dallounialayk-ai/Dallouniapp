/**
 * تطبيع أرقام الهاتف اليمنية واستخدامها كهوية مصادقة عبر بريد تقني داخلي.
 * الواجهة تعرض «رقم الهاتف» فقط؛ Supabase Auth ما زال يستخدم حقل email داخلياً.
 */

const AUTH_PHONE_DOMAIN = 'phone.dallouni.app';

export type PhoneNormalizeResult =
  | { ok: true; digits: string; display: string; authEmail: string }
  | { ok: false; message: string };

/** استخراج الأرقام فقط */
export function digitsOnly(input: string): string {
  return (input || '').replace(/\D/g, '');
}

/**
 * يقبل صيغاً شائعة في اليمن:
 * 77xxxxxxx / 71xxxxxxx / 9677... / +9677... / 00967...
 */
export function normalizeYemenPhone(input: string): PhoneNormalizeResult {
  let digits = digitsOnly(input);

  if (!digits) {
    return { ok: false, message: 'أدخل رقم الهاتف' };
  }

  // إزالة أصفار بادئة لصيغة 00
  if (digits.startsWith('00')) digits = digits.slice(2);

  // توحيد إلى أرقام محلية بدون مفتاح الدولة ثم التحقق
  if (digits.startsWith('967')) {
    digits = digits.slice(3);
  }

  // أحياناً يُدخل 0 قبل الرقم المحلي
  if (digits.startsWith('0') && digits.length === 10) {
    digits = digits.slice(1);
  }

  // أرقام الجوال اليمنية: 9 أرقام وتبدأ بـ 7
  if (!/^7\d{8}$/.test(digits)) {
    return {
      ok: false,
      message: 'رقم الهاتف غير صحيح. استخدم رقم يمني من 9 أرقام يبدأ بـ 7',
    };
  }

  const withCountry = `967${digits}`;
  return {
    ok: true,
    digits: withCountry,
    display: `0${digits}`,
    authEmail: `${withCountry}@${AUTH_PHONE_DOMAIN}`,
  };
}

/** هل المدخل يبدو بريداً إلكترونياً (للحسابات القديمة)؟ */
export function looksLikeEmail(input: string): boolean {
  return (input || '').includes('@');
}

/**
 * يحوّل معرّف الدخول (هاتف أو بريد قديم) إلى بريد مصادقة لـ Supabase.
 */
export function identifierToAuthEmail(identifier: string): PhoneNormalizeResult | { ok: true; authEmail: string; digits?: string; display?: string } {
  const trimmed = (identifier || '').trim();
  if (!trimmed) {
    return { ok: false, message: 'أدخل رقم الهاتف' };
  }

  if (looksLikeEmail(trimmed)) {
    return { ok: true, authEmail: trimmed.toLowerCase() };
  }

  return normalizeYemenPhone(trimmed);
}

export function isPhoneAuthEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.toLowerCase().endsWith(`@${AUTH_PHONE_DOMAIN}`);
}
