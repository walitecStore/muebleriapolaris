import 'server-only';
import { createClient } from '@/lib/supabase/server';
export async function getSellerSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profile: null, active: false };
  const { data: profile } = await supabase
    .from('seller_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();
  return {
    supabase,
    user,
    profile,
    active:
      !!profile &&
      !profile.suspended &&
      new Date(profile.approved_until || 0).getTime() > Date.now(),
  };
}
