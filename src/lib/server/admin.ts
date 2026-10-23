import 'server-only';
import { createClient } from '@/lib/supabase/server';

/** Uses the caller's cookies and database policies, never a privileged service key. */
export async function getAdminSession() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return { supabase, user: null, isAdmin: false };
  const { data, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  return { supabase, user, isAdmin: !profileError && data?.role === 'admin' };
}
