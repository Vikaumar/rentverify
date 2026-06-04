import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useNotifications } from '../../context/NotificationContext';

export const Login: React.FC = () => {
  const { login, isBiometricsRegistered, loginWithBiometrics } = useStore();
  const { success, error, warning } = useNotifications();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      error('Please enter both username and password.');
      return;
    }

    setLoading(true);
    try {
      const ok = await login(username, password);
      if (ok) {
        success('Logged in successfully!');
      } else {
        error('Invalid credentials.');
      }
    } catch (err: any) {
      error(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    if (!isBiometricsRegistered) {
      warning('Biometrics are not set up yet. Please sign in with your password first, then you can enable native biometrics in one click on your Dashboard.');
      return;
    }

    setLoading(true);
    success('Starting secure biometric verification...');
    try {
      const ok = await loginWithBiometrics();
      if (ok) {
        success('Biometric authentication succeeded!');
      } else {
        error('Biometric authentication rejected by system.');
      }
    } catch (err: any) {
      console.warn('[Login] Biometric error:', err);
      error(err.message || 'Biometric authentication was canceled or failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    warning('Password recovery requires administrator approval. Please contact support@rentverify.com.');
  };

  const handleCreateAccount = (e: React.MouseEvent) => {
    e.preventDefault();
    warning('Account creation is restricted to registered Property Guardians.');
  };

  return (
    <div className="bg-background min-h-screen flex flex-col font-sans w-full relative overflow-hidden">
      
      <main className="flex-grow flex items-center justify-center px-container-margin py-stack-gap-lg z-10">
        <div className="w-full max-w-[480px] fadeIn">
          
          {/* Centered Logo & Brand */}
          <div className="flex flex-col items-center mb-stack-gap-lg">
            <div className="text-primary p-3 rounded-2xl bg-surface-container mb-4 shadow-sm">
              <span className="material-symbols-outlined text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                shield_person
              </span>
            </div>
            <h2 className="text-on-surface text-2xl font-bold tracking-tight">Guardian Verified</h2>
          </div>

          {/* Login Card */}
          <div className="bg-surface-container-lowest rounded-2xl p-8 soft-elevation border border-outline-variant/30 shadow-md">
            <div className="text-center mb-stack-gap-md">
              <h1 className="text-on-surface text-3xl font-bold leading-tight">Welcome Back</h1>
              <p className="text-on-surface-variant text-xs mt-2">Sign in to continue your verifications.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* ID/Email Field */}
              <div className="flex flex-col gap-2">
                <label className="text-on-surface text-xs font-semibold text-left" htmlFor="guardian-id">
                  Guardian ID or Email
                </label>
                <div className="relative">
                  <input
                    className="w-full h-[56px] px-4 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface placeholder:text-outline focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all text-sm font-medium"
                    id="guardian-id"
                    placeholder="Enter your ID or email"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="flex flex-col gap-2">
                <label className="text-on-surface text-xs font-semibold text-left" htmlFor="password">
                  Password
                </label>
                <div className="relative flex items-center">
                  <input
                    className="w-full h-[56px] pl-4 pr-12 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface placeholder:text-outline focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all text-sm font-medium"
                    id="password"
                    placeholder="Enter your password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                  <button
                    className="absolute right-3 p-2 text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center rounded-full hover:bg-surface-container-low"
                    onClick={() => setShowPassword(!showPassword)}
                    type="button"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <span className="material-symbols-outlined text-[20px]" id="password-icon">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Forgot Password */}
              <div className="flex justify-end -mt-2">
                <a
                  onClick={handleForgotPassword}
                  className="text-secondary text-xs hover:underline font-bold"
                  href="#"
                >
                  Forgot Password?
                </a>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-4 mt-8">
                <button
                  type="submit"
                  className="w-full h-[56px] bg-primary text-on-primary hover:bg-primary-container rounded-full font-bold text-sm shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  {loading && !username ? (
                    <>
                      <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">lock_open</span>
                      Sign In
                    </>
                  )}
                </button>

                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-outline-variant/60"></div>
                  <span className="flex-shrink mx-4 text-outline text-[10px] uppercase tracking-widest font-bold">or</span>
                  <div className="flex-grow border-t border-outline-variant/60"></div>
                </div>

                <button
                  type="button"
                  onClick={handleBiometricLogin}
                  className="w-full h-[56px] flex items-center justify-center gap-3 border-2 border-outline-variant text-on-surface rounded-full font-semibold hover:bg-surface-container-low transition-all active:scale-[0.98] text-sm"
                  disabled={loading}
                >
                  <span className="material-symbols-outlined text-[20px]">fingerprint</span>
                  Use Biometric Sign-in
                </button>
              </div>
            </form>
          </div>

          {/* Footer Section */}
          <div className="mt-stack-gap-lg text-center space-y-4">
            <p className="text-on-surface-variant text-xs font-semibold">
              Don't have an account?
              <a
                onClick={handleCreateAccount}
                className="text-secondary font-bold hover:underline ml-1"
                href="#"
              >
                Create Account
              </a>
            </p>
            <div className="flex justify-center gap-6">
              <a
                onClick={handleForgotPassword}
                className="flex items-center gap-1 text-outline text-[11px] font-bold hover:text-on-surface transition-colors"
                href="#"
              >
                <span className="material-symbols-outlined text-[16px]">help_center</span>
                Need help?
              </a>
              <a
                onClick={handleCreateAccount}
                className="flex items-center gap-1 text-outline text-[11px] font-bold hover:text-on-surface transition-colors"
                href="#"
              >
                <span className="material-symbols-outlined text-[16px]">gavel</span>
                Privacy &amp; Terms
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Visual Background Element (Subtle Corner Glows) */}
      <div className="fixed inset-0 -z-10 opacity-[0.03] pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-secondary blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary blur-[120px] rounded-full -translate-x-1/2 translate-y-1/2"></div>
      </div>
    </div>
  );
};

export default Login;
