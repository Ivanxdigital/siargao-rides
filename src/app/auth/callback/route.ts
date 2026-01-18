import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

type AuthIntent = 'tourist' | 'shop_owner';

const normalizeIntent = (raw: string | null): AuthIntent => {
  return raw === 'shop_owner' ? 'shop_owner' : 'tourist';
};

const safeNextPath = (raw: string | null): string => {
  if (!raw) return '/dashboard';
  // Prevent open redirects: only allow same-origin relative paths.
  if (!raw.startsWith('/')) return '/dashboard';
  return raw;
};

const splitName = (fullName: string): { firstName: string; lastName: string } => {
  const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
};

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const intent = normalizeIntent(requestUrl.searchParams.get('intent'));
  const next = safeNextPath(requestUrl.searchParams.get('next'));

  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Best-effort: ensure role/metadata exists for new OAuth users, and create the public.users record.
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const existingRole = (user.user_metadata?.role as string | undefined) || '';
      const roleToUse: AuthIntent = (existingRole === 'shop_owner' || existingRole === 'tourist')
        ? (existingRole as AuthIntent)
        : intent;

      const fullName =
        (user.user_metadata?.full_name as string | undefined) ||
        (user.user_metadata?.name as string | undefined) ||
        '';
      const nameParts = splitName(fullName);
      const firstName =
        (user.user_metadata?.first_name as string | undefined) ||
        nameParts.firstName;
      const lastName =
        (user.user_metadata?.last_name as string | undefined) ||
        nameParts.lastName;

      // Only set role automatically if it's missing.
      if (!existingRole) {
        await supabase.auth.updateUser({
          data: {
            role: roleToUse,
            intent: roleToUse,
            first_name: firstName,
            last_name: lastName,
            ...(roleToUse === 'shop_owner' ? { has_shop: false } : {}),
          },
        });
      }

      // Create/ensure the public.users record exists (uses supabaseAdmin via API route).
      if (user.email) {
        const registerUrl = new URL('/api/auth/register', request.url);
        const res = await fetch(registerUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            email: user.email,
            firstName,
            lastName,
            role: roleToUse,
          }),
        });

        // Ignore duplicate errors; log anything else for investigation.
        if (!res.ok && res.status !== 409) {
          const text = await res.text().catch(() => '');
          console.error('Auth callback: failed to ensure user record exists:', res.status, text);
        }
      }
    }
  } catch (err) {
    console.error('Auth callback: post-auth setup failed (non-blocking):', err);
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL(next, request.url));
} 
