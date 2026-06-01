import React, { useState } from 'react';
import { supabase } from "../../supabaseClient.ts";

interface AuthProps {
  onAuthSuccess?: () => void;
  initialMode?: 'login' | 'signup';
}

export default function Auth({ onAuthSuccess, initialMode = 'login' }: AuthProps) {
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username.trim().toLowerCase(),
              full_name: fullName.trim(),
              avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
            },
          },
        });
        if (error) throw error;
        setSuccessMsg('Registration successful! Please check your email for a verification link.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setSuccessMsg('Login successful!');
        setTimeout(() => onAuthSuccess?.(), 500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-[#d3c5f6] font-['Space_Grotesk']">
      {/* Glassmorphism Auth Card */}
      <div className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-[0_0_50px_rgba(59,42,96,0.3)]">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold font-['Outfit'] text-white tracking-tight">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-sm text-[#d3c5f6]/60 mt-2">
            {isSignUp ? 'Join the collaborative puzzle community' : 'Access your custom puzzle universe'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-sm text-emerald-400">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <>
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#d3c5f6]/80 mb-1.5 font-bold">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[#090b12]/60 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#d3c5f6] transition-colors"
                  placeholder="Edward Mendoza"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#d3c5f6]/80 mb-1.5 font-bold">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#090b12]/60 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#d3c5f6] transition-colors"
                  placeholder="wardy_puzzles"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs uppercase tracking-wider text-[#d3c5f6]/80 mb-1.5 font-bold">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#090b12]/60 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#d3c5f6] transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[#d3c5f6]/80 mb-1.5 font-bold">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#090b12]/60 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#d3c5f6] transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#d3c5f6] text-[#3b2a60] font-['Outfit'] font-bold rounded-lg py-3 hover:bg-white transition-all shadow-[0_0_20px_rgba(211,197,246,0.25)] disabled:opacity-50 mt-6 cursor-pointer"
          >
            {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Log In'}
          </button>
        </form>

        <div className="text-center mt-6 pt-4 border-t border-white/5 text-sm">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className="text-[#d3c5f6]/60 hover:text-white transition-colors cursor-pointer"
          >
            {isSignUp ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}