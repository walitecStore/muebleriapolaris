'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AuthCallbackPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const handleAuth = async () => {
      await supabase.auth.exchangeCodeForSession(window.location.href);
      router.replace('/');
    };

    handleAuth();
  }, [router, supabase]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Confirmando tu cuenta...</p>
    </div>
  );
}