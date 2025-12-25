import { useEffect } from "react";
import { useLocation } from "wouter";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export default function AuthCallback() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const handleCallback = async () => {
      if (!isSupabaseConfigured() || !supabase) {
        setLocation('/login?error=not_configured');
        return;
      }

      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Auth callback error:', error);
        setLocation('/login?error=callback_failed');
        return;
      }

      if (session) {
        setLocation('/');
      } else {
        setLocation('/login');
      }
    };

    handleCallback();
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
