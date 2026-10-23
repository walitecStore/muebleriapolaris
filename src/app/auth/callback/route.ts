import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { safeAuthDestination } from '@/lib/auth-redirect';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error)
      return NextResponse.redirect(
        new URL(safeAuthDestination(request.nextUrl.searchParams.get('next')), request.url)
      );
  }
  return NextResponse.redirect(new URL('/login?error=confirmation', request.url));
}
