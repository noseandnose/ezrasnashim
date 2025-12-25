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
  const { loginWithEmail, signUpWithEmail, resetPassword, isAuthenticated, isConfigured } = useAuth();
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
                  {birthday ? (
                    <Input
                      type="date"
                      value={birthday}
                      onChange={(e) => setBirthday(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className="pl-9"
                      data-testid="input-birthday"
                    />
                  ) : (
                    <Input
                      type="text"
                      placeholder="Birthday (optional)"
                      onFocus={(e) => {
                        e.target.type = 'date';
                        e.target.max = new Date().toISOString().split('T')[0];
                      }}
                      className="pl-9"
                      data-testid="input-birthday"
                      onChange={(e) => setBirthday(e.target.value)}
                    />
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
