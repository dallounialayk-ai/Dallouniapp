import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSessionToken, ADMIN_COOKIE } from '@/lib/admin-auth';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/admin/login')) {
    return NextResponse.next();
  }

  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  const session = await verifyAdminSessionToken(token);

  if (!session) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/admin/login';
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
