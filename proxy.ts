import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

function redirectByRole(request: NextRequest, role: string | null | undefined) {
  switch (role) {
    case 'gizi-katering':
      return NextResponse.redirect(
        new URL('/dashboard/ag-katering/overview/produksi', request.url),
      );
    case 'supervisor':
      return NextResponse.redirect(
        new URL('/dashboard/ag-katering/overview/produksi', request.url),
      );
    case 'gizi-rs':
      return NextResponse.redirect(new URL('/dashboard/ag-rs', request.url));
    default:
      return NextResponse.redirect(new URL('/dashboard', request.url));
  }
}

export async function proxy(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const { pathname } = request.nextUrl;

  if (pathname === '/') {
    if (!session) {
      return NextResponse.next();
    }
    return redirectByRole(request, session.user.role);
  }

  if (pathname === '/dashboard') {
    if (!session) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return redirectByRole(request, session.user.role);
  }

  if (pathname.startsWith('/dashboard/')) {
    if (!session) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard/:path*'],
};
