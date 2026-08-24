import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Protect /admin/dashboard and all its subroutes
  if (pathname.startsWith('/admin/dashboard')) {
    const session = await getAdminSession();
    
    // Redirect to admin login if no valid session
    if (!session) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }
  }

  // If trying to access login page while already authenticated, redirect to dashboard
  if (pathname === '/admin/login') {
    const session = await getAdminSession();
    if (session) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/dashboard';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
