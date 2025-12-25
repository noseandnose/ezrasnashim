import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff, Calendar, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import BottomNavigation from "@/components/bottom-navigation";
import type { Section } from "@/pages/home";

export default function Login() {
  const [, setLocation] = useLocation();
  const { loginWithGoogle, loginWithEmail, signUpWithEmail, resetPassword, isAuthenticated, isConfigured } = useAuth();
  const { toast } = useToast();
  
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [hebrewName, setHebrewName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (isAuthenticated) {
    setLocation('/profile');
    return null;
  }

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F2DDD4] to-[#E4C5B8]">
        <header 
          className="fixed top-0 left-0 right-0 z-50 px-4"
          style={{ 
            paddingTop: 'calc(var(--safe-area-top, 0px) + 8px)',
            background: 'rgba(186, 137, 160, 0.12)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)'
          }}
        >
          <div className="flex items-center h-12">
            <button 
              onClick={() => setLocation("/")} 
              className="p-2 -ml-2 text-black"
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="flex-1 text-center font-semibold text-black">Sign In</h1>
            <div className="w-9" />
          </div>
        </header>
        
        <div className="flex flex-col items-center justify-center p-6 pt-24 pb-28">
          <div 
            className="w-full max-w-sm rounded-2xl p-6 text-center"
            style={{ 
              background: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)'
            }}
          >
            <p className="text-gray-600 mb-4">
              User accounts are not yet available. Check back soon!
            </p>
            <Button 
              onClick={() => setLocation("/")}
              className="bg-blush hover:bg-blush/90 text-white"
            >
              Return Home
            </Button>
          </div>
        </div>
        
        <BottomNavigation activeSection="home" onSectionChange={(section) => setLocation(`/?section=${section}`)} />
      </div>
    );
  }

  const handleSectionChange = (section: Section) => {
    setLocation(`/?section=${section}`);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
        toast({ title: "Welcome back!", description: "You've been signed in successfully." });
        setLocation('/');
      } else if (mode === 'signup') {
        if (birthday) {
          const selectedDate = new Date(birthday);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (selectedDate > today) {
            toast({
              title: "Invalid date",
              description: "Birthday cannot be in the future.",
              variant: "destructive"
            });
            setIsLoading(false);
            return;
          }
        }
        await signUpWithEmail(email, password, firstName, lastName, hebrewName, birthday);
        toast({ 
          title: "Check your email", 
          description: "We've sent you a confirmation link to complete your registration." 
        });
      } else if (mode === 'forgot') {
        await resetPassword(email);
        toast({ 
          title: "Password reset email sent", 
          description: "Check your inbox for instructions to reset your password." 
        });
        setMode('login');
      }
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await loginWithGoogle();
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to sign in with Google.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F2DDD4] to-[#E4C5B8]">
      <header 
        className="fixed top-0 left-0 right-0 z-50 px-4"
        style={{ 
          paddingTop: 'calc(var(--safe-area-top, 0px) + 8px)',
          background: 'rgba(186, 137, 160, 0.12)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)'
        }}
      >
        <div className="flex items-center h-12">
          <button 
            onClick={() => setLocation("/")} 
            className="p-2 -ml-2 text-black"
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="flex-1 text-center font-semibold text-black">
            {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
          </h1>
          <div className="w-9" />
        </div>
      </header>
      
      <div className="flex flex-col items-center justify-center p-6 pt-24 pb-28">
        <div 
          className="w-full max-w-sm rounded-2xl p-6"
          style={{ 
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)'
          }}
        >
          <Button 
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full bg-white hover:bg-gray-50 text-black border border-gray-200 mb-4"
            data-testid="button-google-login"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>

          <div className="flex items-center my-4">
            <div className="flex-1 h-px bg-gray-300" />
            <span className="px-3 text-sm text-gray-500">or</span>
            <div className="flex-1 h-px bg-gray-300" />
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="First name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="pl-9"
                      data-testid="input-first-name"
                    />
                  </div>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="pl-9"
                      data-testid="input-last-name"
                    />
                  </div>
                </div>
                <div className="relative">
                  <Star className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Hebrew name (optional)"
                    value={hebrewName}
                    onChange={(e) => setHebrewName(e.target.value)}
                    className="pl-9"
                    dir="rtl"
                    data-testid="input-hebrew-name"
                  />
                </div>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                  <Input
                    type="date"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className={`pl-9 ${!birthday ? 'text-transparent' : ''}`}
                    data-testid="input-birthday"
                  />
                  {!birthday && (
                    <span className="absolute left-9 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-sm">
                      Birthday (optional)
                    </span>
                  )}
                </div>
              </>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-9"
                data-testid="input-email"
              />
            </div>

            {mode !== 'forgot' && (
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-9 pr-10"
                  data-testid="input-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            )}

            <Button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-blush hover:bg-blush/90 text-white"
              data-testid="button-submit"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            {mode === 'login' && (
              <>
                <button 
                  onClick={() => setMode('forgot')}
                  className="text-blush hover:underline"
                  data-testid="link-forgot-password"
                >
                  Forgot password?
                </button>
                <p className="mt-2 text-gray-600">
                  Don't have an account?{' '}
                  <button 
                    onClick={() => setMode('signup')}
                    className="text-blush hover:underline font-medium"
                    data-testid="link-signup"
                  >
                    Sign up
                  </button>
                </p>
              </>
            )}
            {mode === 'signup' && (
              <p className="text-gray-600">
                Already have an account?{' '}
                <button 
                  onClick={() => setMode('login')}
                  className="text-blush hover:underline font-medium"
                  data-testid="link-login"
                >
                  Sign in
                </button>
              </p>
            )}
            {mode === 'forgot' && (
              <button 
                onClick={() => setMode('login')}
                className="text-blush hover:underline"
                data-testid="link-back-to-login"
              >
                Back to sign in
              </button>
            )}
          </div>
        </div>
      </div>
      
      <BottomNavigation activeSection="home" onSectionChange={handleSectionChange} />
    </div>
  );
}
