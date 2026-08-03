import { NextResponse } from 'next/server';
import {
  createAdminSessionToken,
  isAdminConfigured,
  setAdminSessionCookie,
  validateAdminLogin,
} from '@/lib/admin-auth';

export async function POST(req: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: 'لم يتم ضبط ADMIN_EMAIL و ADMIN_PASSWORD في البيئة' },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? '');
  const password = String(body.password ?? '');

  if (!validateAdminLogin(email, password)) {
    return NextResponse.json({ error: 'بيانات الدخول غير صحيحة' }, { status: 401 });
  }

  const token = await createAdminSessionToken(email.trim());
  const res = NextResponse.json({ ok: true });
  setAdminSessionCookie(res, token);
  return res;
}
