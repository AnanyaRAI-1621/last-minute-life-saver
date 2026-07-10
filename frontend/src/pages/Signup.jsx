import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, LogIn, Chrome, Flame, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Signup = () => {
  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      return setError('Please fill in all registration fields.');
    }

    try {
      setError('');
      setLoading(true);
      await signup(email, password, name);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to create user account.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle();
      navigate('/');
    } catch (err) {
      console.error(err);
      setError('Google Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg px-4 transition-colors font-sans">
      <div className="max-w-md w-full space-y-8 p-8 rounded-2xl glass shadow-xl border border-white/10 relative overflow-hidden">
        {/* Abstract Background Blurs */}
        <div className="absolute top-0 -left-4 w-40 h-40 bg-brand-500/10 rounded-full filter blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 -right-4 w-40 h-40 bg-rose-500/10 rounded-full filter blur-2xl pointer-events-none" />

        {/* Title / Logo Header */}
        <div className="text-center relative z-10">
          <div className="inline-flex p-3 bg-gradient-to-tr from-rose-500 to-amber-500 rounded-2xl text-white shadow-md mb-3 animate-pulse">
            <Flame className="h-7 w-7" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Register Account
          </h2>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Set up your AI proactive engine companion.
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-xs flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Auth form */}
        <form className="mt-8 space-y-4 relative z-10" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full bg-white/50 dark:bg-dark-input border border-gray-200 dark:border-dark-border text-sm text-gray-800 dark:text-white pl-10 pr-4 py-2.5 rounded-xl outline-none transition-all focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-white/50 dark:bg-dark-input border border-gray-200 dark:border-dark-border text-sm text-gray-800 dark:text-white pl-10 pr-4 py-2.5 rounded-xl outline-none transition-all focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/50 dark:bg-dark-input border border-gray-200 dark:border-dark-border text-sm text-gray-800 dark:text-white pl-10 pr-4 py-2.5 rounded-xl outline-none transition-all focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-brand-500 hover:bg-brand-600 text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-md active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none glow-indigo"
          >
            <LogIn className="h-4.5 w-4.5" />
            <span>{loading ? 'Creating account...' : 'Create Account'}</span>
          </button>
        </form>

        <div className="relative my-6 relative z-10">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-dark-border"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-gray-50 dark:bg-dark-bg px-3 text-gray-500 uppercase font-semibold tracking-wider">
              Or continue with
            </span>
          </div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-white dark:bg-dark-input border border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-border text-gray-700 dark:text-gray-200 font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50"
        >
          <Chrome className="h-4 w-4 text-brand-500" />
          <span>Sign Up with Google</span>
        </button>

        <p className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400 relative z-10">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-bold text-brand-500 hover:underline dark:text-brand-400"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
export default Signup;
