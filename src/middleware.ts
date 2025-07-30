import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // This middleware is now a passthrough.
  // Auth is handled client-side in the dashboard layout.
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
