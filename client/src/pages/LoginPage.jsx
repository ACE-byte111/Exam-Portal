import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../stores/toastStore';
import Button from '../components/Button';
import Input from '../components/Input';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { KeyRound, Shield, Code2, Lock, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const { user, otpSent, error, sendOtp, verifyOtp, clearError } = useAuthStore();
  const { success, error: showError } = useToastStore();
  const navigate = useNavigate();
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (user) {
      navigate(user.role === 'instructor' ? '/instructor' : '/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (error) {
      showError(error);
      clearError();
    }
  }, [error]);

  const handleGoogleLogin = async (e) => {
    if (e) e.preventDefault();
    setSending(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const userEmail = result.user.email;
      setEmail(userEmail); // Save for OTP verification
      await sendOtp(userEmail);
      if (!useAuthStore.getState().error) {
        success('Verified! OTP has been sent for final confirmation.');
      }
    } catch (err) {
      showError('Google Sign-In failed: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim()) return;
    setVerifying(true);
    const result = await verifyOtp(email.trim(), otp.trim());
    setVerifying(false);
    if (result) {
      success(`Welcome, ${result.name || result.email}!`);
    }
  };

  return (
    <div className="h-full w-full gradient-bg flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-accent-blue/5 blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-accent-purple/5 blur-3xl" />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full bg-accent-green/3 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md animate-slide-up">
        <div className="flex flex-col items-center text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-accent-blue/10 border border-accent-blue/20 mb-5 shadow-lg shadow-accent-blue/5">
            <Shield size={40} className="text-accent-blue" />
          </div>
          <h1 className="text-4xl font-extrabold text-text-primary tracking-tight mb-2">
            Exam Portal
          </h1>
          <p className="text-text-secondary text-base font-medium tracking-wide">
            Secure Coding Examination System
          </p>
        </div>

        {/* Login Card */}
        <div className="glass rounded-3xl p-10 shadow-2xl">
          {!otpSent ? (
            <div className="flex flex-col gap-6">
              <div className="text-center mb-2">
                <h2 className="text-2xl font-bold text-text-primary mb-2">Sign In</h2>
                <p className="text-sm text-text-secondary">
                  Please sign in with your verified university Google account to proceed
                </p>
              </div>

              <Button
                type="button"
                onClick={handleGoogleLogin}
                loading={sending}
                className="w-full bg-white text-black hover:bg-gray-100 flex items-center justify-center gap-3"
                size="lg"
              >
                {!sending && (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                )}
                Continue with Google
              </Button>
            </div>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent-green/10 border border-accent-green/20 mb-3">
                  <KeyRound size={24} className="text-accent-green" />
                </div>
                <h2 className="text-lg font-semibold text-text-primary">Enter OTP</h2>
                <p className="text-sm text-text-secondary mt-1">
                  Code sent to <span className="text-accent-blue">{email}</span>
                </p>
              </div>

              <Input
                label="One-Time Password"
                type="text"
                icon={Lock}
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                required
                autoFocus
              />

              <Button
                type="submit"
                loading={verifying}
                className="w-full"
                size="lg"
                icon={ArrowRight}
              >
                Verify & Login
              </Button>

              <button
                type="button"
                onClick={() => {
                  useAuthStore.setState({ otpSent: false });
                  setOtp('');
                }}
                className="w-full text-sm text-text-muted hover:text-text-secondary transition-colors text-center"
              >
                ← Use a different email
              </button>
            </form>
          )}
        </div>

        {/* Footer features */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          {[
            { icon: Code2, label: 'Monaco Editor' },
            { icon: Shield, label: 'Secure Exams' },
            { icon: Lock, label: 'Auto-Save' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2 text-center">
              <div className="w-10 h-10 rounded-xl bg-bg-secondary border border-border flex items-center justify-center">
                <Icon size={18} className="text-text-muted" />
              </div>
              <span className="text-xs text-text-muted">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
