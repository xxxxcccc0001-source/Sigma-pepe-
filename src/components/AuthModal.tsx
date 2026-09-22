import React, { useState } from 'react';
import { UserAccount } from '../types';
import {
  firebaseLoginUser,
  firebaseRegisterUser,
  firebaseInstant1SecondLogin,
  firebaseResetPassword
} from '../services/firebaseAuthService';
import { compressImageClient } from '../services/storageService';
import { AVATAR_PRESETS } from '../data/seedData';
import { COUNTRIES } from '../data/countries';
import { Flame, UserPlus, LogIn, KeyRound, Zap, AlertCircle, CheckCircle2, Lock, EyeOff } from 'lucide-react';

interface AuthModalProps {
  onSuccess: (user: UserAccount) => void;
}

type AuthTab = 'login' | 'register' | 'forgot';

export function AuthModal({ onSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<AuthTab>('login');

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regUsername, setRegUsername] = useState('');
  const [regCountry, setRegCountry] = useState('United States');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhoto, setRegPhoto] = useState<string>(AVATAR_PRESETS[0]);

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState('');

  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsProcessing(true);
      const compressed = await compressImageClient(file);
      setRegPhoto(compressed);
      setMessage({ text: 'Profile picture uploaded successfully.', isError: false });
    } catch (err: any) {
      setMessage({ text: err?.message || 'Failed to process photo', isError: true });
    } finally {
      setIsProcessing(false);
    }
  };

  // 1-Second Instant Fast Login
  const handle1SecondInstantLogin = async () => {
    setMessage(null);
    setIsProcessing(true);
    try {
      const user = await firebaseInstant1SecondLogin();
      onSuccess(user);
    } catch (err: any) {
      setMessage({ text: err?.message || 'Instant access failed', isError: true });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsProcessing(true);
    try {
      const user = await firebaseLoginUser(loginEmail, loginPassword);
      onSuccess(user);
    } catch (err: any) {
      setMessage({ text: err?.message || 'Sign in failed. Please check credentials.', isError: true });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsProcessing(true);
    try {
      const user = await firebaseRegisterUser(regEmail, regPassword, regUsername, regCountry, regPhoto);
      onSuccess(user);
    } catch (err: any) {
      setMessage({ text: err?.message || 'Registration failed.', isError: true });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsProcessing(true);
    try {
      await firebaseResetPassword(forgotEmail);
      setMessage({ text: 'Password reset link sent to your email!', isError: false });
    } catch (err: any) {
      setMessage({ text: err?.message || 'Password reset request failed', isError: true });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto my-6 px-4">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <div className="text-6xl mb-2 select-none animate-bounce duration-1000">🐸</div>
        <h1 className="text-3xl font-black tracking-widest text-white">SIGMA PEPE</h1>
        <p className="text-xs font-semibold tracking-wider text-amber-400 mt-1 uppercase flex items-center justify-center gap-1.5">
          <Flame className="w-4 h-4 fill-amber-400 text-amber-500" />
          <span>The Global Arena • English (International)</span>
        </p>
      </div>

      {/* 1-Second Instant Access Hero Button */}
      <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border-2 border-amber-500/50 shadow-lg shadow-amber-500/10 text-center">
        <div className="text-xs font-black text-amber-300 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
          <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>1-Second Instant Access</span>
        </div>
        <p className="text-[12px] text-neutral-300 mb-3">
          Jump right into the arena in 1 second with an instant guest profile!
        </p>
        <button
          type="button"
          disabled={isProcessing}
          onClick={handle1SecondInstantLogin}
          className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black rounded-xl text-sm transition cursor-pointer flex items-center justify-center gap-2 shadow-md active:scale-95 disabled:opacity-50"
        >
          <Zap className="w-4 h-4 fill-black" />
          <span>{isProcessing ? 'Connecting...' : '⚡ 1-Click Instant Access'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl bg-neutral-900 p-1 border border-neutral-800 mb-4">
        <button
          type="button"
          onClick={() => {
            setTab('login');
            setMessage(null);
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            tab === 'login' ? 'bg-white text-black shadow-md' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <LogIn className="w-3.5 h-3.5" /> Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setTab('register');
            setMessage(null);
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            tab === 'register' ? 'bg-white text-black shadow-md' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" /> Create Account
        </button>
      </div>

      {/* Status message */}
      {message && (
        <div
          className={`p-3 rounded-xl mb-4 text-xs font-medium flex items-center gap-2 border ${
            message.isError
              ? 'bg-rose-950/40 border-rose-800/80 text-rose-300'
              : 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
          }`}
        >
          {message.isError ? (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Tab: LOGIN */}
      {tab === 'login' && (
        <form onSubmit={handleLogin} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-3">
          <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" /> Member Sign In
          </h2>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="e.g. user@pepe.com"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              className="w-full bg-neutral-950 text-white border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm focus:border-amber-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              className="w-full bg-neutral-950 text-white border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm focus:border-amber-500 outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full py-3 bg-white hover:bg-neutral-200 text-black font-extrabold rounded-xl text-sm transition cursor-pointer mt-2 disabled:opacity-50"
          >
            {isProcessing ? 'Verifying...' : 'SIGN IN'}
          </button>

          <button
            type="button"
            onClick={() => setTab('forgot')}
            className="w-full text-center text-xs text-neutral-500 hover:text-neutral-300 transition py-1"
          >
            Forgot your password?
          </button>
        </form>
      )}

      {/* Tab: REGISTER */}
      {tab === 'register' && (
        <form onSubmit={handleRegister} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-3">
          <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-emerald-400" /> Create New Account
          </h2>

          {/* Avatar selector */}
          <div className="text-center py-1">
            <div className="relative inline-block">
              <img
                src={regPhoto}
                alt="Selected Avatar"
                className="w-18 h-18 rounded-full border-2 border-amber-500/70 object-cover bg-neutral-950 mx-auto"
              />
            </div>
            <div className="flex justify-center items-center gap-1.5 mt-2">
              {AVATAR_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setRegPhoto(p)}
                  className={`w-7 h-7 rounded-full overflow-hidden border ${
                    regPhoto === p ? 'border-amber-400 scale-110' : 'border-neutral-700 opacity-70'
                  }`}
                >
                  <img src={p} alt="Preset" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            <label className="inline-block mt-2 cursor-pointer text-xs font-semibold text-neutral-400 hover:text-white transition">
              <span>📷 Choose Custom Photo</span>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>
          </div>

          {/* Permanent Username Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold uppercase text-neutral-400">
                Username (Chosen once • Permanent)
              </label>
              <span className="text-[10px] text-amber-400 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Permanent
              </span>
            </div>
            <input
              type="text"
              required
              maxLength={30}
              placeholder="e.g. SigmaKing"
              value={regUsername}
              onChange={(e) => setRegUsername(e.target.value)}
              className="w-full bg-neutral-950 text-white border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm focus:border-amber-500 outline-none transition"
            />
            <span className="text-[10px] text-neutral-400 mt-1 block">
              🔒 Your username is permanent once chosen and cannot be edited later.
            </span>
          </div>

          {/* Permanent Country Dropdown (Private - Hidden from other users) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold uppercase text-neutral-400">
                Select Country
              </label>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                <EyeOff className="w-3 h-3" /> Hidden from Public
              </span>
            </div>
            <select
              value={regCountry}
              onChange={(e) => setRegCountry(e.target.value)}
              className="w-full bg-neutral-950 text-white border border-neutral-800 rounded-xl px-3 py-2.5 text-sm focus:border-amber-500 outline-none transition cursor-pointer"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.name} className="bg-neutral-900 text-white">
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
            <span className="text-[10px] text-neutral-400 mt-1 block">
              🔒 Country is permanent once selected and kept strictly private (not shown to other users).
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="e.g. user@sigma.com"
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
              className="w-full bg-neutral-950 text-white border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm focus:border-amber-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
              Password (Minimum 6 characters)
            </label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
              className="w-full bg-neutral-950 text-white border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm focus:border-amber-500 outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black rounded-xl text-sm transition cursor-pointer mt-2 disabled:opacity-50"
          >
            {isProcessing ? 'Creating Account...' : 'REGISTER & ENTER ARENA'}
          </button>
        </form>
      )}

      {/* Tab: FORGOT PASSWORD */}
      {tab === 'forgot' && (
        <form onSubmit={handleResetPassword} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <KeyRound className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">Password Recovery</h2>
          </div>
          <p className="text-xs text-neutral-400">
            Enter your registered email address to receive password reset instructions.
          </p>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-neutral-400 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="e.g. user@sigma.com"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              className="w-full bg-neutral-950 text-white border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm focus:border-amber-500 outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full py-3 bg-white hover:bg-neutral-200 text-black font-extrabold rounded-xl text-sm transition cursor-pointer mt-2 disabled:opacity-50"
          >
            {isProcessing ? 'Sending...' : 'SEND RESET LINK'}
          </button>

          <button
            type="button"
            onClick={() => setTab('login')}
            className="w-full py-2 text-xs font-semibold text-neutral-400 hover:text-white transition"
          >
            Back to Sign In
          </button>
        </form>
      )}
    </div>
  );
}
