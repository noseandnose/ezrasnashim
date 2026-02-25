import { useEffect } from "react";
import { useLocation } from "wouter";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export default function AuthCallback() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      setLocation('/login?error=not_configured');
      return;
    }

    let handled = false;

    // Listen for auth state changes FIRST — catches PASSWORD_RECOVERY before
    // anything else so we can redirect to the reset-password page correctly.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (handled) return;

      if (event === 'PASSWORD_RECOVERY') {
        handled = true;
        // Signal to the reset-password page that the session is ready
        sessionStorage.setItem('passwordRecovery', '1');
        setLocation('/reset-password');
      } else if (event === 'SIGNED_IN') {
        handled = true;
        setLocation('/');
      }
    });

    // Fallback: if no auth event fires within 3 s (e.g., session already
    // established), check the session directly and navigate accordingly.
    const fallback = setTimeout(async () => {
      if (handled) return;
      handled = true;
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        setLocation('/login?error=callback_failed');
      } else {
        setLocation('/');
      }
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(fallback);
    };
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#F2DDD4] to-[#E4C5B8]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blush border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-black font-medium">Completing sign in...</p>
      </div>
    </div>
  );
}
