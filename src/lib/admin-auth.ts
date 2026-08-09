import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const ADMIN_COOKIE = 'dallouni_admin_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 ساعة

type AdminSessionPayload = {
  email: string;
  exp: number;
};

function getAdminCredentials() {
  // إزالة المسافات الطرفية من .env (سبب شائع لفشل الدخول رغم «صحة» البيانات)
  const email = process.env.ADMIN_EMAIL?.trim() || '';
  const password = (process.env.ADMIN_PASSWORD ?? '').trim();
  const secret =
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    (email && password ? `${email}:${password}` : '');

  return { email, password, secret };
}

function toBase64Url(bytes: ArrayBuffer | Uint8Array) {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = '';
  for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]!);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(input: string) {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function sign(value: string, secret: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(value));
  return toBase64Url(sig);
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export async function createAdminSessionToken(email: string): Promise<string> {
  const { secret } = getAdminCredentials();
  if (!secret) throw new Error('Admin session secret is not configured');

  const payload: AdminSessionPayload = {
    email,
    exp: Date.now() + SESSION_TTL_MS,
  };
  const body = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = await sign(body, secret);
  return `${body}.${sig}`;
}

export async function verifyAdminSessionToken(
  token: string | undefined | null
): Promise<AdminSessionPayload | null> {
  if (!token) return null;
  const { secret, email: expectedEmail } = getAdminCredentials();
  if (!secret || !expectedEmail) return null;

  const [body, sig] = token.split('.');
  if (!body || !sig) return null;

  const expectedSig = await sign(body, secret);
  if (!safeEqual(sig, expectedSig)) return null;

  try {
    const json = new TextDecoder().decode(fromBase64Url(body));
    const payload = JSON.parse(json) as AdminSessionPayload;
    if (!payload?.email || !payload?.exp) return null;
    if (payload.exp < Date.now()) return null;
    if (payload.email.toLowerCase() !== expectedEmail.toLowerCase()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function validateAdminLogin(email: string, password: string): boolean {
  const creds = getAdminCredentials();
  if (!creds.email || !creds.password) return false;

  const inputEmail = email.trim().toLowerCase();
  const inputPassword = password.trim();
  const emailOk = inputEmail === creds.email.toLowerCase();
  // مقارنة بعد توحيد الطول عبر البادئة لتجنّب فشل safeEqual عند اختلاف الطول فقط
  if (!emailOk) return false;
  if (inputPassword.length !== creds.password.length) return false;
  return safeEqual(inputPassword, creds.password);
}

export async function getAdminSessionFromCookies() {
  const jar = await cookies();
  return verifyAdminSessionToken(jar.get(ADMIN_COOKIE)?.value);
}

export function adminUnauthorized() {
  return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
}

export async function requireAdminApi() {
  const session = await getAdminSessionFromCookies();
  if (!session) return null;
  return session;
}

export function setAdminSessionCookie(res: NextResponse, token: string) {
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export function clearAdminSessionCookie(res: NextResponse) {
  res.cookies.set(ADMIN_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

export function isAdminConfigured() {
  const { email, password } = getAdminCredentials();
  return Boolean(email && password);
}
