/**
 * ترجمة أخطاء Supabase Auth إلى رسائل عربية واضحة وقابلة للفعل
 * تُستخدم لعرض رسائل خطأ ودودة في واجهة المستخدم
 */
export function translateAuthError(error: unknown): string {
  if (!error) return 'حدث خطأ غير معروف';

  const err = error as { message?: string; code?: string; status?: number };
  const msg = (err.message || '').toLowerCase();
  const code = err.code || '';

  // Rate limits
  if (code === 'over_email_send_rate_limit' || msg.includes('email rate limit')) {
    return 'تم تجاوز حد إرسال رسائل التأكيد. لحل هذه المشكلة:\n• انتظر ساعة ثم حاول مجددًا، أو\n• أوقف تأكيد البريد من Supabase Dashboard (راجع دليل الإعداد في التطبيق)';
  }
  if (code === 'over_request_rate_limit' || msg.includes('rate limit')) {
    return 'طلبات كثيرة في وقت قصير. انتظر دقيقة ثم حاول مجددًا.';
  }

  // Credentials
  if (code === 'invalid_credentials' || msg.includes('invalid credentials')) {
    return 'رقم الهاتف أو كلمة السر غير صحيحة. تأكد من بياناتك وحاول مجددًا.';
  }
  if (code === 'email_not_confirmed' || msg.includes('email not confirmed')) {
    return 'لم يُفعَّل الحساب بعد. أوقف تأكيد البريد من إعدادات Supabase ثم أعد المحاولة.';
  }
  if (code === 'user_already_exists' || msg.includes('user already registered') || msg.includes('already registered')) {
    return 'رقم الهاتف مسجّل مسبقًا. جرّب تسجيل الدخول بدلاً من ذلك.';
  }
  if (code === 'weak_password' || msg.includes('weak password') || msg.includes('password should be')) {
    return 'كلمة السر ضعيفة. استخدم 6 أحرف على الأقل، ويفضّل دمج أحرف وأرقام.';
  }
  if (msg.includes('password') && msg.includes('at least')) {
    return 'كلمة السر يجب أن تكون 6 أحرف على الأقل.';
  }

  // Email / phone format (Supabase ما زال يتحقق من صيغة البريد التقني)
  if (msg.includes('invalid email') || msg.includes('unable to validate email')) {
    return 'رقم الهاتف غير صالح. تحقق منه وحاول مجددًا.';
  }

  // Signup disabled
  if (code === 'signup_disabled' || msg.includes('signups not allowed') || msg.includes('signup disabled')) {
    return 'التسجيل معطّل حاليًا في إعدادات Supabase. تواصل مع مدير المشروع.';
  }

  // Network
  if (msg.includes('failed to fetch') || msg.includes('network') || msg.includes('fetch')) {
    return 'تعذّر الاتصال بالخادم. تحقق من اتصالك بالإنترنت وحاول مجددًا.';
  }

  // Database / RLS
  if (msg.includes('permission denied') || msg.includes('rls') || msg.includes('policy')) {
    return 'تعذّر حفظ البيانات (سياسة أمان). تأكد من تطبيق مخطط قاعدة البيانات في Supabase.';
  }
  if (msg.includes('could not find the table') || msg.includes('schema cache') || msg.includes('does not exist')) {
    return 'الجداول غير موجودة في قاعدة البيانات. راجع دليل الإعداد في التطبيق لتطبيق مخطط SQL.';
  }

  // Generic auth errors
  if (msg.includes('jwt expired') || msg.includes('token')) {
    return 'انتهت الجلسة. أعد تسجيل الدخول.';
  }

  // Default
  return err.message || 'حدث خطأ غير متوقع. حاول مرة أخرى.';
}

/**
 * أنواع أخطاء Supabase المعروفة للتمييز البرمجي
 */
export const AUTH_ERROR_CODES = {
  EMAIL_RATE_LIMIT: 'over_email_send_rate_limit',
  REQUEST_RATE_LIMIT: 'over_request_rate_limit',
  INVALID_CREDENTIALS: 'invalid_credentials',
  EMAIL_NOT_CONFIRMED: 'email_not_confirmed',
  USER_EXISTS: 'user_already_exists',
  WEAK_PASSWORD: 'weak_password',
  SIGNUP_DISABLED: 'signup_disabled',
} as const;

export function isErrorCode(error: unknown, code: string): boolean {
  const err = error as { code?: string };
  return err?.code === code;
}

export function isRateLimitError(error: unknown): boolean {
  const err = error as { code?: string; message?: string };
  return (
    err?.code === AUTH_ERROR_CODES.EMAIL_RATE_LIMIT ||
    err?.code === AUTH_ERROR_CODES.REQUEST_RATE_LIMIT ||
    (err.message || '').toLowerCase().includes('rate limit')
  );
}
