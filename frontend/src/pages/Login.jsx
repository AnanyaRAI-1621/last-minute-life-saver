import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn, Chrome, Flame, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // FIXED LOGIN HANDLER
  const handleSubmit = async (e) => {
    console.log("BUTTON CLICKED");
    e.preventDefault();

    if (!email || !password) {
      return setError('Please fill in all credentials.');
    }

    try {
      setError('');
      setLoading(true);

      await login(email, password);

      console.log("LOGIN SUCCESS");
      navigate('/');
    } catch (err) {
      console.error("LOGIN ERROR:", err);
      setError(err.message || 'Failed to authenticate user.');
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

        {/* Background */}
        <div className="absolute top-0 -left-4 w-40 h-40 bg-brand-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 -right-4 w-40 h-40 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="text-center relative z-10">
          <div className="inline-flex p-3 bg-gradient-to-tr from-rose-500 to-amber-500 rounded-2xl text-white shadow-md mb-3">
            <Flame className="h-7 w-7" />
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Welcome Back
          </h2>

          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Gain control before deadlines strike.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form className="mt-8 space-y-4 relative z-10" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
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
                className="w-full border text-sm pl-10 pr-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
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
                className="w-full border text-sm pl-10 pr-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <LogIn className="h-4 w-4" />
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6 z-10">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t"></div>
          </div>

          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-3 text-gray-500 uppercase font-semibold tracking-wider">
              Or continue with
            </span>
          </div>
        </div>

        {/* Google */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-white border hover:bg-gray-50 text-gray-700 font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2"
        >
          <Chrome className="h-4 w-4 text-blue-500" />
          <span>Sign In with Google</span>
        </button>

        {/* Signup link */}
        <p className="mt-8 text-center text-xs text-gray-500 relative z-10">
          Don't have an account?{' '}
          <Link to="/signup" className="font-bold text-blue-500 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;