import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import { getUserSession } from '@/lib/user-auth';

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

  // If trying to access admin login page while already authenticated, redirect to admin dashboard
  if (pathname === '/admin/login') {
    const session = await getAdminSession();
    if (session) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/dashboard';
      return NextResponse.redirect(url);
    }
  }

  // Protect regular user /dashboard
  if (pathname.startsWith('/dashboard')) {
    const session = await getUserSession();
    if (!session) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  // Protect /quiz/ routes (playing a quiz)
  if (pathname.startsWith('/quiz/') && pathname !== '/quiz/create' && !pathname.startsWith('/quiz/share/')) {
    const session = await getUserSession();
    if (!session) {
      const url = request.nextUrl.clone();
      // Extract the shareToken from the path
      const token = pathname.replace('/quiz/', '');
      url.pathname = '/login';
      url.searchParams.set('playQuiz', token);
      return NextResponse.redirect(url);
    }
  }

  // Redirect to dashboard if trying to access /login while authenticated
  if (pathname === '/login') {
    const session = await getUserSession();
    if (session) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/login', '/quiz/:path*'],
};
