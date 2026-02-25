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

    // Check URL immediately for recovery indicators before any auth events fire.
    // This prevents an existing SIGNED_IN session from overriding a recovery flow.
    const hash = window.location.hash.substring(1);
    const hashParams = new URLSearchParams(hash);
    const queryParams = new URLSearchParams(window.location.search);

    const isRecovery =
      hashParams.get("type") === "recovery" ||
      queryParams.get("type") === "recovery";

    if (isRecovery) {
      sessionStorage.setItem('passwordRecovery', '1');
      setLocation('/reset-password');
      return;
    }

    let handled = false;

    // Listen for auth state changes — catches PASSWORD_RECOVERY for cases
    // where Supabase processes the code internally before we can read the URL.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (handled) return;

      if (event === 'PASSWORD_RECOVERY') {
        handled = true;
        sessionStorage.setItem('passwordRecovery', '1');
        setLocation('/reset-password');
      } else if (event === 'SIGNED_IN') {
        // Delay SIGNED_IN handling slightly to allow PASSWORD_RECOVERY to fire first
        // in case both events are emitted for the same session exchange.
        setTimeout(() => {
          if (!handled) {
            handled = true;
            setLocation('/');
          }
        }, 500);
      }
    });

    // Fallback: if no auth event fires within 4s, check session directly.
    const fallback = setTimeout(async () => {
      if (handled) return;
      handled = true;
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        setLocation('/login?error=callback_failed');
      } else {
        setLocation('/');
      }
    }, 4000);

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
