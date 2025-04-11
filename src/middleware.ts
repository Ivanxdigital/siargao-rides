import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res: response });

  try {
    // This refreshes the user's session if it exists
    await supabase.auth.getSession();
  } catch (error) {
    console.error('Middleware auth error:', error);
    // If there's an auth error, we'll still return the response
    // but we'll clear the auth cookie to force a new login
    if (error.message?.includes('Invalid value for JWT claim')) {
      // Clear the auth cookie to force a new login
      const cookieName = 'sb-' + process.env.NEXT_PUBLIC_SUPABASE_URL?.split('.')?.[0]?.split('//')[1] + '-auth-token';
      response.cookies.delete(cookieName);
    }
  }

  return response;
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes)
     * - public (public assets)
     */
    '/((?!_next/static|_next/image|favicon.ico|api|public).*)',
  ],
}