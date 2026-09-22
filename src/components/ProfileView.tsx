import React, { useState } from 'react';
import { UserAccount } from '../types';
import {
  updateProfile,
  compressImageClient
} from '../services/storageService';
import { logTrackingEvent } from '../lib/firebase';
import { DEFAULT_AVATAR, AVATAR_PRESETS } from '../data/seedData';
import { COUNTRIES } from '../data/countries';
import {
  User,
  Camera,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Lock,
  BadgeDollarSign,
  ExternalLink,
  ShieldCheck,
  EyeOff,
  Sparkles
} from 'lucide-react';

interface ProfileViewProps {
  currentUser: UserAccount;
  totalScore: number;
  answersCount: number;
  onUpdate: (updated: UserAccount) => void;
  onLogout: () => void;
}

export function ProfileView({
  currentUser,
  totalScore,
  answersCount,
  onUpdate,
  onLogout
}: ProfileViewProps) {
  const isGuest =
    currentUser.profile.username.startsWith('SigmaGuest_') ||
    currentUser.profile.username.startsWith('SigmaPepe_');

  // Username and Country are locked once set by the user
  const isUsernameLocked = Boolean(currentUser.profile.username_locked || !isGuest);
  const isCountryLocked = Boolean(currentUser.profile.country_locked || (!isGuest && currentUser.profile.country));

  const [country, setCountry] = useState(currentUser.profile.country || 'United States');
  const [username, setUsername] = useState(currentUser.profile.username);
  const [avatarUrl, setAvatarUrl] = useState(currentUser.profile.avatar_url || DEFAULT_AVATAR);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Profile Photo Edit (File Upload)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsProcessing(true);
      const compressed = await compressImageClient(file);
      setAvatarUrl(compressed);
      const updated = updateProfile(currentUser.id, { avatar_url: compressed });
      onUpdate({ ...currentUser, profile: updated });
      logTrackingEvent('photo_updated', { user_id: currentUser.id });
      setMessage({ text: 'Profile photo updated successfully!', isError: false });
    } catch (err: any) {
      setMessage({ text: err?.message || 'Error processing photo', isError: true });
    } finally {
      setIsProcessing(false);
    }
  };

  // Profile Photo Edit (Preset Selection)
  const handlePresetSelect = (preset: string) => {
    setAvatarUrl(preset);
    const updated = updateProfile(currentUser.id, { avatar_url: preset });
    onUpdate({ ...currentUser, profile: updated });
    logTrackingEvent('avatar_preset_selected', { user_id: currentUser.id });
    setMessage({ text: 'Avatar photo updated successfully!', isError: false });
  };

  // Profile Details Form Submission
  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updates: any = {};

      if (!isUsernameLocked) {
        const cleanU = username.trim();
        if (!cleanU) throw new Error('Username cannot be empty.');
        updates.username = cleanU;
        updates.username_locked = true;
      }

      if (!isCountryLocked) {
        const cleanC = country.trim();
        if (!cleanC) throw new Error('Please select a country.');
        updates.country = cleanC;
        updates.country_locked = true;
      }

      if (Object.keys(updates).length === 0) {
        setMessage({ text: 'Your username and country are already permanent.', isError: false });
        return;
      }

      const updated = updateProfile(currentUser.id, updates);
      onUpdate({ ...currentUser, profile: updated });
      logTrackingEvent('permanent_profile_saved', { user_id: currentUser.id });
      setMessage({
        text: 'Permanent details saved securely! Your country remains strictly private.',
        isError: false
      });
    } catch (err: any) {
      setMessage({ text: err?.message || 'Could not update profile', isError: true });
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 md:p-6 mb-4 space-y-6">
      {/* Profile Header & Photo Editor */}
      <div className="text-center">
        <div className="relative inline-block mb-3">
          <img
            src={avatarUrl}
            alt={username}
            onError={(e) => {
              (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
            }}
            className="w-24 h-24 rounded-full object-cover border-3 border-amber-500/70 bg-neutral-950 mx-auto shadow-lg"
          />

          {/* Quick Photo Upload Trigger */}
          <label
            className="absolute bottom-0 right-0 p-2 rounded-full bg-white text-black hover:bg-neutral-200 transition cursor-pointer shadow-lg active:scale-95"
            title="Edit Profile Photo"
          >
            <Camera className="w-4 h-4" />
            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
          </label>
        </div>

        {/* Username Display with Permanent Lock indicator */}
        <div className="flex items-center justify-center gap-1.5">
          <h2 className="text-xl font-black text-white">@{currentUser.profile.username}</h2>
          <span
            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-800 text-amber-400 border border-neutral-700 select-none"
            title="Username is permanent and cannot be modified"
          >
            <Lock className="w-3 h-3 text-amber-400" />
            <span>Permanent</span>
          </span>
        </div>

        {/* Private Country Badge (Hidden from others) */}
        <div className="mt-1 flex items-center justify-center gap-1 text-xs text-neutral-400">
          <span>Country: {currentUser.profile.country || 'International (Global)'}</span>
          <span className="text-[10px] text-neutral-500 flex items-center gap-0.5 ml-1 bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800">
            <EyeOff className="w-3 h-3 text-neutral-400" /> Private
          </span>
        </div>

        {/* Edit Photo Action Button */}
        <div className="mt-3 flex items-center justify-center">
          <label className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 cursor-pointer bg-neutral-950 px-3.5 py-1.5 rounded-full border border-neutral-800 transition shadow-sm">
            <Camera className="w-3.5 h-3.5" />
            <span>Change Profile Photo</span>
            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
          </label>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto mt-4">
          <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-center">
            <span className="block text-[11px] text-neutral-400 uppercase font-semibold">
              Sigma Score
            </span>
            <span className="text-xl font-mono font-black text-emerald-400">{totalScore}</span>
          </div>
          <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-center">
            <span className="block text-[11px] text-neutral-400 uppercase font-semibold">
              Answers Posted
            </span>
            <span className="text-xl font-mono font-black text-white">{answersCount}</span>
          </div>
        </div>
      </div>

      {/* ⭐ SELL YOUR USERNAME CARD ⭐ */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-emerald-950/40 to-amber-950/40 border-2 border-emerald-500/50 shadow-lg text-center space-y-2.5">
        <div className="flex items-center justify-center gap-1.5 text-xs font-black tracking-wider text-emerald-300 uppercase">
          <BadgeDollarSign className="w-4 h-4 text-emerald-400" />
          <span>USERNAME MARKETPLACE</span>
        </div>

        <p className="text-xs text-neutral-200 leading-snug max-w-sm mx-auto">
          Want to monetize your unique username <span className="text-white font-mono font-bold bg-neutral-800 px-1.5 py-0.5 rounded">@{currentUser.profile.username}</span>? List it on the public exchange:
        </p>

        {/* Requested Button: "sell your username" -> redirects to www.sellyouname.com */}
        <a
          href="https://www.sellyouname.com"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            logTrackingEvent('sell_username_click', {
              username: currentUser.profile.username,
              destination: 'www.sellyouname.com'
            });
          }}
          className="inline-flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-emerald-400 via-amber-400 to-emerald-400 hover:from-emerald-300 hover:to-amber-300 text-black font-black text-sm uppercase tracking-wide rounded-xl transition cursor-pointer shadow-md active:scale-95 no-underline"
        >
          <BadgeDollarSign className="w-5 h-5 fill-black" />
          <span>sell your username</span>
          <ExternalLink className="w-4 h-4 stroke-[2.5]" />
        </a>

        <div className="text-[11px] text-neutral-400 flex items-center justify-center gap-1.5">
          <span>Opens external platform:</span>
          <a
            href="https://www.sellyouname.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-emerald-400 underline hover:text-emerald-300"
          >
            www.sellyouname.com
          </a>
        </div>
      </div>

      {/* Preset Avatars for Instant Photo Swapping */}
      <div>
        <label className="block text-xs font-bold text-neutral-300 uppercase mb-2 text-center">
          Choose Quick Avatar Preset
        </label>
        <div className="flex justify-center items-center gap-2">
          {AVATAR_PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handlePresetSelect(p)}
              title="Select this avatar"
              className={`w-9 h-9 rounded-full overflow-hidden border-2 transition cursor-pointer ${
                avatarUrl === p
                  ? 'border-emerald-400 scale-110 shadow-sm shadow-emerald-500/30'
                  : 'border-neutral-700 opacity-70 hover:opacity-100'
              }`}
            >
              <img src={p} alt="Preset" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* Status message */}
      {message && (
        <div
          className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 border ${
            message.isError
              ? 'bg-rose-950/40 border-rose-800 text-rose-300'
              : 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
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

      {/* Edit Details Form */}
      <form onSubmit={handleSaveDetails} className="space-y-4 pt-4 border-t border-neutral-800">
        <h3 className="text-xs font-bold uppercase text-neutral-400 flex items-center gap-1.5">
          <User className="w-3.5 h-3.5" /> Identity & Privacy Settings
        </h3>

        {/* Username Field */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-semibold text-neutral-300">
              Username
            </label>
            {isUsernameLocked ? (
              <span className="text-[10px] text-amber-400 flex items-center gap-1 font-medium">
                <Lock className="w-3 h-3" /> Permanent • Cannot be edited
              </span>
            ) : (
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                <Sparkles className="w-3 h-3" /> Set once permanently
              </span>
            )}
          </div>

          <div className="relative">
            <input
              type="text"
              required
              maxLength={30}
              value={username}
              disabled={isUsernameLocked}
              readOnly={isUsernameLocked}
              onChange={(e) => setUsername(e.target.value)}
              className={`w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition ${
                isUsernameLocked
                  ? 'bg-neutral-950/70 text-neutral-400 border border-neutral-800 cursor-not-allowed'
                  : 'bg-neutral-950 text-white border border-amber-500/60 focus:border-amber-400'
              }`}
            />
            {isUsernameLocked && (
              <div className="absolute right-3 top-3 text-neutral-500">
                <Lock className="w-4 h-4" />
              </div>
            )}
          </div>
          <p className="text-[10px] text-neutral-500 mt-1">
            {isUsernameLocked
              ? 'Rule: Your username is locked and cannot be changed.'
              : 'Notice: Set your unique username once. It will be permanent.'}
          </p>
        </div>

        {/* Country Field (Permanent & Private) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-semibold text-neutral-300">
              Country
            </label>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
              <EyeOff className="w-3 h-3" /> Private (Hidden from others)
            </span>
          </div>

          {isCountryLocked ? (
            <div className="relative">
              <input
                type="text"
                disabled
                readOnly
                value={country}
                className="w-full bg-neutral-950/70 text-neutral-400 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm cursor-not-allowed outline-none"
              />
              <div className="absolute right-3 top-3 text-neutral-500">
                <Lock className="w-4 h-4" />
              </div>
            </div>
          ) : (
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full bg-neutral-950 text-white border border-amber-500/60 rounded-xl px-3 py-2.5 text-sm focus:border-amber-400 outline-none cursor-pointer"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.name} className="bg-neutral-900 text-white">
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
          )}

          <p className="text-[10px] text-neutral-500 mt-1">
            🔒 Rule: Your country is permanent once selected and never shown to other users in public feeds or leaderboards.
          </p>
        </div>

        {(!isUsernameLocked || !isCountryLocked) && (
          <button
            type="submit"
            disabled={isProcessing}
            className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Save Permanent Details
          </button>
        )}
      </form>

      {/* Privacy Guarantee Card */}
      <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-400 space-y-1">
        <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Country Privacy & Permanent Identity</span>
        </div>
        <p className="text-[11px] leading-relaxed text-neutral-400">
          Your country is strictly private to your own account and is completely hidden from public answer feeds and community rankings. Your profile photo can be edited at any time.
        </p>
      </div>

      {/* Sign Out & Permanent Account Notice */}
      <div className="space-y-2 pt-2 border-t border-neutral-800">
        <button
          type="button"
          onClick={onLogout}
          className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <LogOut className="w-4 h-4" /> SIGN OUT
        </button>

        <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-center">
          <p className="text-[11px] text-amber-400 font-semibold flex items-center justify-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            <span>Account Deletion is Permanently Disabled</span>
          </p>
          <p className="text-[10px] text-neutral-400 mt-0.5">
            Enforced platform-wide for all members and owners. Your identity and rank are permanent.
          </p>
        </div>
      </div>
    </div>
  );
}
