import React, { useState } from 'react';
import { UserAccount, Answer, Challenge, WinnerAnnouncement, VoteType } from '../types';
import {
  getAllUsers,
  getOwnerEmails,
  addOwnerEmail,
  removeOwnerEmail,
  boostAnswerVotes,
  setDailyChallenge,
  setDailyWinner,
  getDailyWinner,
  getUserTotalScore,
  compressImageClient,
  MASTER_OWNER_EMAIL,
  isOwnerForceMidnight,
  setOwnerForceMidnight
} from '../services/storageService';
import { downloadProjectZip, downloadIndex1Html, downloadFullIndexHtml } from '../services/downloadService';
import {
  Crown,
  Users,
  Flame,
  Zap,
  HelpCircle,
  Trophy,
  UserPlus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Search,
  Sparkles,
  Camera,
  Play,
  Download,
  FileCode
} from 'lucide-react';

interface OwnerPanelProps {
  currentUser: UserAccount;
  answers: Answer[];
  activeChallenge: Challenge;
  onChallengeUpdated: (challenge: Challenge) => void;
  onBoostComplete: () => void;
  onPreviewMidnightCeremony: (winner: WinnerAnnouncement) => void;
}

type OwnerTab = 'users' | 'boost' | 'daily_question' | 'winner' | 'co_owners';

export function OwnerPanel({
  currentUser,
  answers,
  activeChallenge,
  onChallengeUpdated,
  onBoostComplete,
  onPreviewMidnightCeremony
}: OwnerPanelProps) {
  const [tab, setTab] = useState<OwnerTab>('users');
  const [usersList, setUsersList] = useState<UserAccount[]>(() => getAllUsers());
  const [ownerEmails, setOwnerEmails] = useState<string[]>(() => getOwnerEmails());
  const [searchQuery, setSearchQuery] = useState('');

  // Notifications
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadCodebase = async () => {
    try {
      setIsDownloading(true);
      await downloadProjectZip();
      setMessage({ text: 'Project ZIP file created and downloaded successfully (includes index-1.html)!', isError: false });
    } catch (e: any) {
      setMessage({ text: 'Failed to download ZIP: ' + (e?.message || 'Error'), isError: true });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadFullHtml = (filename = 'index.html') => {
    try {
      downloadFullIndexHtml(filename);
      setMessage({
        text: `Full standalone ${filename} downloaded! It contains all Owner commands, Co-owners, Users, Answers, Leaderboard, and 12:00 AM Ceremony.`,
        isError: false
      });
    } catch (e: any) {
      setMessage({ text: 'Failed to download HTML: ' + (e?.message || 'Error'), isError: true });
    }
  };

  const handleDownloadIndex1 = () => {
    handleDownloadFullHtml('index.html');
  };

  const [isMidnightForceActive, setIsMidnightForceActive] = useState<boolean>(() => isOwnerForceMidnight());

  const handleToggleMidnightForce = () => {
    const next = !isMidnightForceActive;
    setIsMidnightForceActive(next);
    setOwnerForceMidnight(next);
    setMessage({
      text: next
        ? '⚡ 12:00 AM Midnight Result banner is now forced ON for preview on the main screen!'
        : '⏳ Restored standard mode: Main screen now displays the 12:00 AM countdown timer until midnight.',
      isError: false
    });
  };

  // 1. Co-Owner Management
  const [newOwnerEmail, setNewOwnerEmail] = useState('');

  // 2. Boost System
  const [boostTargetAnswerId, setBoostTargetAnswerId] = useState<string>(
    answers[0]?.id || ''
  );
  const [boostVoteType, setBoostVoteType] = useState<VoteType>('sigma');
  const [boostCount, setBoostCount] = useState<number>(50);

  // 3. Daily Challenge Question
  const [newQuestion, setNewQuestion] = useState('');
  const [newTopic, setNewTopic] = useState('Daily Sigma Arena Challenge');

  // 4. Winner Announcement
  const currentWinner = getDailyWinner();
  const [winnerName, setWinnerName] = useState(currentWinner.name);
  const [winnerUsername, setWinnerUsername] = useState(currentWinner.username);
  const [winnerAvatar, setWinnerAvatar] = useState(currentWinner.avatar_url);
  const [winnerDemonImage, setWinnerDemonImage] = useState(
    currentWinner.demon_image_url || 'https://i.ibb.co/prnXzb0F/Fs-Z7-EXg-AAy-EW0.jpg'
  );
  const [winnerScore, setWinnerScore] = useState(currentWinner.score || 9842);
  const [winnerSigmaVotes, setWinnerSigmaVotes] = useState(currentWinner.sigmaVotes || 1284);
  const [winnerFunnyVotes, setWinnerFunnyVotes] = useState(currentWinner.funnyVotes || 642);
  const [winnerSmartVotes, setWinnerSmartVotes] = useState(currentWinner.smartVotes || 913);
  const [winnerQuote, setWinnerQuote] = useState(
    currentWinner.winning_answer || '“I don\'t chase opportunities… opportunities chase me.”'
  );

  // Filtered Users
  const filteredUsers = usersList.filter(
    (u) =>
      u.profile.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handlers
  const handleAddOwner = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      addOwnerEmail(newOwnerEmail);
      setOwnerEmails(getOwnerEmails());
      setNewOwnerEmail('');
      setMessage({ text: `Owner access granted to ${newOwnerEmail}`, isError: false });
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to add co-owner', isError: true });
    }
  };

  const handleRemoveOwner = (emailToRemove: string) => {
    try {
      removeOwnerEmail(emailToRemove);
      setOwnerEmails(getOwnerEmails());
      setMessage({ text: `Removed owner access for ${emailToRemove}`, isError: false });
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to remove co-owner', isError: true });
    }
  };

  const handleBoostVotes = (e: React.FormEvent) => {
    e.preventDefault();
    if (!boostTargetAnswerId) {
      setMessage({ text: 'Please select an answer to boost', isError: true });
      return;
    }
    try {
      boostAnswerVotes(boostTargetAnswerId, boostVoteType, boostCount);
      onBoostComplete();
      setMessage({
        text: `⚡ Successfully added +${boostCount} ${boostVoteType.toUpperCase()} votes to answer!`,
        isError: false
      });
    } catch (err: any) {
      setMessage({ text: err.message || 'Boost failed', isError: true });
    }
  };

  const handlePostChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = setDailyChallenge(newQuestion, newTopic);
      onChallengeUpdated(created);
      setNewQuestion('');
      setMessage({
        text: '👑 New Daily Challenge published live to community!',
        isError: false
      });
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to post challenge', isError: true });
    }
  };

  const handleCustomAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageClient(file);
      setWinnerAvatar(compressed);
      setMessage({ text: 'Custom winner photo loaded!', isError: false });
    } catch (err: any) {
      setMessage({ text: err.message || 'Photo upload error', isError: true });
    }
  };

  const handleSelectUserForWinner = (u: UserAccount) => {
    setWinnerName(u.profile.username);
    setWinnerUsername(u.profile.username);
    setWinnerAvatar(u.profile.avatar_url);

    // Find top answer if any
    const userAns = answers.find((a) => a.user_id === u.id);
    if (userAns) {
      setWinnerQuote(`“${userAns.answer_text}”`);
    }

    const calculatedScore = getUserTotalScore(u.id);
    if (calculatedScore > 0) {
      setWinnerScore(calculatedScore + 1000);
    }
    setMessage({
      text: `Loaded user @${u.profile.username} into winner announcement form!`,
      isError: false
    });
  };

  const handleSaveAndDeclareWinner = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = winnerUsername.replace(/^@/, '').trim();
    if (!winnerName.trim() || !cleanUsername) {
      setMessage({ text: 'Winner Name and Username are required.', isError: true });
      return;
    }

    const announcement: WinnerAnnouncement = {
      id: 'winner_' + Date.now().toString(36),
      name: winnerName.trim(),
      username: cleanUsername,
      avatar_url: winnerAvatar || 'https://i.ibb.co/prnXzb0F/Fs-Z7-EXg-AAy-EW0.jpg',
      demon_image_url: winnerDemonImage || 'https://i.ibb.co/prnXzb0F/Fs-Z7-EXg-AAy-EW0.jpg',
      score: Number(winnerScore) || 9842,
      sigmaVotes: Number(winnerSigmaVotes) || 1284,
      funnyVotes: Number(winnerFunnyVotes) || 642,
      smartVotes: Number(winnerSmartVotes) || 913,
      winning_answer: winnerQuote.trim() || '“I don\'t chase opportunities… opportunities chase me.”',
      announced_at: new Date().toISOString()
    };

    setDailyWinner(announcement);
    setMessage({
      text: `👑 Winner announced: ${announcement.name} (@${announcement.username})! All users can view the 12:00 AM Midnight Ceremony.`,
      isError: false
    });
  };

  const handlePreviewCeremony = () => {
    const cleanUsername = winnerUsername.replace(/^@/, '').trim();
    const announcement: WinnerAnnouncement = {
      id: 'preview_' + Date.now().toString(36),
      name: winnerName.trim() || '🐸 Shadow',
      username: cleanUsername || 'shadow_sigma',
      avatar_url: winnerAvatar || 'https://i.ibb.co/prnXzb0F/Fs-Z7-EXg-AAy-EW0.jpg',
      demon_image_url: winnerDemonImage || 'https://i.ibb.co/prnXzb0F/Fs-Z7-EXg-AAy-EW0.jpg',
      score: Number(winnerScore) || 9842,
      sigmaVotes: Number(winnerSigmaVotes) || 1284,
      funnyVotes: Number(winnerFunnyVotes) || 642,
      smartVotes: Number(winnerSmartVotes) || 913,
      winning_answer: winnerQuote.trim() || '“I don\'t chase opportunities… opportunities chase me.”',
      announced_at: new Date().toISOString()
    };
    onPreviewMidnightCeremony(announcement);
  };

  return (
    <div className="bg-neutral-900 border-2 border-amber-500/60 rounded-2xl p-5 md:p-6 mb-4 shadow-xl space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <Crown className="w-5 h-5 fill-amber-400" />
            </span>
            <h1 className="text-xl font-black text-white tracking-wide uppercase">
              👑 MASTER OWNER CONTROL PANEL
            </h1>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Logged in as <span className="text-amber-300 font-mono font-bold">{currentUser.email}</span> • Full Arena Command & Midnight Winner Authority
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleDownloadFullHtml('index.html')}
            className="px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer"
            title="Download full standalone index.html with all owner and user data"
          >
            <FileCode className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>📄 index.html (Full App)</span>
          </button>

          <button
            type="button"
            onClick={() => handleDownloadFullHtml('index.htm')}
            className="px-2.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 font-bold text-xs uppercase tracking-wider flex items-center gap-1 shadow-md active:scale-95 transition cursor-pointer"
            title="Download as index.htm"
          >
            <span>.htm</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadCodebase}
            disabled={isDownloading}
            className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer"
            title="Download complete project source code as a ZIP file"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{isDownloading ? 'Downloading...' : '📥 Full Project (.ZIP)'}</span>
          </button>

          <button
            type="button"
            onClick={handlePreviewCeremony}
            className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-black" />
            <span>🌙 Ceremony</span>
          </button>
        </div>
      </div>

      {/* Owner Fast Download Bar */}
      <div className="p-3.5 rounded-2xl bg-neutral-950 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <div className="flex items-center gap-1.5 text-amber-400 font-black uppercase text-[11px]">
            <Crown className="w-3.5 h-3.5" />
            <span>Master Owner Full Data Export (Owner + User Data)</span>
          </div>
          <p className="text-neutral-400 text-[11px] mt-0.5">
            Full standalone <span className="text-amber-300 font-mono font-bold">index.html</span> contains everything: owner commands, user answers, leaderboard, and midnight ceremony.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleDownloadFullHtml('index.html')}
            className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow"
          >
            <FileCode className="w-3.5 h-3.5 text-black" />
            <span>Save index.html</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadCodebase}
            disabled={isDownloading}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Save .ZIP</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-1 rounded-xl bg-neutral-950 border border-neutral-800">
        <button
          type="button"
          onClick={() => {
            setTab('users');
            setUsersList(getAllUsers());
          }}
          className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            tab === 'users' ? 'bg-amber-400 text-black shadow' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>All Users ({usersList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('boost')}
          className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            tab === 'boost' ? 'bg-amber-400 text-black shadow' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Boost Votes</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('daily_question')}
          className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            tab === 'daily_question' ? 'bg-amber-400 text-black shadow' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Daily Question</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('winner')}
          className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            tab === 'winner' ? 'bg-amber-400 text-black shadow' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Midnight Winner</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setTab('co_owners');
            setOwnerEmails(getOwnerEmails());
          }}
          className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 col-span-2 sm:col-span-1 ${
            tab === 'co_owners' ? 'bg-amber-400 text-black shadow' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Owners ({ownerEmails.length})</span>
        </button>
      </div>

      {/* Status message */}
      {message && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
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

      {/* TAB 1: USERS DIRECTORY */}
      {tab === 'users' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-center">
              <span className="text-[11px] text-neutral-400 uppercase font-semibold block">
                Total Registered Accounts
              </span>
              <span className="text-2xl font-black text-amber-400">{usersList.length}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-center">
              <span className="text-[11px] text-neutral-400 uppercase font-semibold block">
                Total Answers in Arena
              </span>
              <span className="text-2xl font-black text-emerald-400">{answers.length}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-center">
              <span className="text-[11px] text-neutral-400 uppercase font-semibold block">
                Active Owner Admins
              </span>
              <span className="text-2xl font-black text-white">{ownerEmails.length}</span>
            </div>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-neutral-400" />
            <input
              type="text"
              placeholder="Search users by username or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-950 text-white border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none focus:border-amber-500"
            />
          </div>

          <div className="rounded-xl border border-neutral-800 overflow-hidden bg-neutral-950">
            <div className="max-h-[380px] overflow-y-auto divide-y divide-neutral-800/80">
              {filteredUsers.length === 0 ? (
                <div className="p-6 text-center text-xs text-neutral-500">No users found.</div>
              ) : (
                filteredUsers.map((u) => {
                  const score = getUserTotalScore(u.id);
                  const userAnswers = answers.filter((a) => a.user_id === u.id);
                  const isOwner = ownerEmails.includes(u.email.toLowerCase());

                  return (
                    <div
                      key={u.id}
                      className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-neutral-900/60 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={u.profile.avatar_url}
                          alt={u.profile.username}
                          className="w-10 h-10 rounded-full object-cover border border-neutral-700 shrink-0 bg-neutral-900"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white">@{u.profile.username}</span>
                            {isOwner && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-amber-400 text-black">
                                OWNER
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-neutral-400 truncate">
                            {u.email} • {u.profile.country || 'Private'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-auto">
                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-emerald-400 block">
                            {score} pts
                          </span>
                          <span className="text-[10px] text-neutral-400">
                            {userAnswers.length} answers
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            handleSelectUserForWinner(u);
                            setTab('winner');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-amber-400 hover:text-black text-amber-300 font-bold text-[11px] transition cursor-pointer"
                          title="Pick this user as Midnight Winner"
                        >
                          Pick Winner
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BOOST VOTES ON ANY ANSWER */}
      {tab === 'boost' && (
        <form onSubmit={handleBoostVotes} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
            <span className="font-black text-amber-300 block mb-0.5">⚡ Instant Vote & Score Multiplier</span>
            As owner, you can directly inject any number of votes into any user's answer or your own photo/answer to boost their score and ranking in the arena.
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">
              Select Answer to Boost ({answers.length} available)
            </label>
            <select
              value={boostTargetAnswerId}
              onChange={(e) => setBoostTargetAnswerId(e.target.value)}
              className="w-full bg-neutral-950 text-white border border-neutral-800 rounded-xl px-3 py-2.5 text-xs focus:border-amber-500 outline-none"
            >
              {answers.map((a) => (
                <option key={a.id} value={a.id} className="bg-neutral-900 text-white">
                  @{a.profiles.username} — “{a.answer_text.slice(0, 60)}...”
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">
                Vote Category
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setBoostVoteType('sigma')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
                    boostVoteType === 'sigma'
                      ? 'bg-amber-400 text-black border-amber-300 shadow'
                      : 'bg-neutral-950 text-neutral-300 border-neutral-800'
                  }`}
                >
                  🔥 Sigma (+3)
                </button>
                <button
                  type="button"
                  onClick={() => setBoostVoteType('smart')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
                    boostVoteType === 'smart'
                      ? 'bg-amber-400 text-black border-amber-300 shadow'
                      : 'bg-neutral-950 text-neutral-300 border-neutral-800'
                  }`}
                >
                  🧠 Smart (+2)
                </button>
                <button
                  type="button"
                  onClick={() => setBoostVoteType('funny')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
                    boostVoteType === 'funny'
                      ? 'bg-amber-400 text-black border-amber-300 shadow'
                      : 'bg-neutral-950 text-neutral-300 border-neutral-800'
                  }`}
                >
                  😂 Funny (+1)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">
                Number of Votes to Add
              </label>
              <div className="flex gap-2">
                {[10, 50, 100, 500].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setBoostCount(count)}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl border transition ${
                      boostCount === count
                        ? 'bg-white text-black border-white'
                        : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
                    }`}
                  >
                    +{count}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min={1}
                max={5000}
                value={boostCount}
                onChange={(e) => setBoostCount(Number(e.target.value))}
                className="w-full mt-2 bg-neutral-950 text-white border border-neutral-800 rounded-xl px-3 py-1.5 text-xs focus:border-amber-500 outline-none"
                placeholder="Or enter custom vote count"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black rounded-xl text-xs uppercase tracking-wider transition cursor-pointer shadow-md"
          >
            ⚡ Boost Answer with +{boostCount} {boostVoteType.toUpperCase()} Votes Now
          </button>
        </form>
      )}

      {/* TAB 3: DAILY QUESTION MANAGEMENT */}
      {tab === 'daily_question' && (
        <form onSubmit={handlePostChallenge} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs">
            <span className="font-bold text-neutral-400 block mb-1">Current Live Challenge:</span>
            <p className="text-white font-semibold text-sm">“{activeChallenge.question}”</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">
              Write New Daily Challenge Question (Personal for Audience)
            </label>
            <textarea
              required
              rows={3}
              placeholder="e.g. When the whole world doubts your vision, what is your ultimate Sigma move?"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              className="w-full bg-neutral-950 text-white border border-neutral-800 rounded-xl p-3 text-sm focus:border-amber-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">
              Challenge Topic Badge
            </label>
            <input
              type="text"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              className="w-full bg-neutral-950 text-white border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs focus:border-amber-500 outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-white hover:bg-neutral-200 text-black font-black rounded-xl text-xs uppercase tracking-wider transition cursor-pointer shadow-md"
          >
            👑 Publish Daily Challenge Live to All Users
          </button>
        </form>
      )}

      {/* TAB 4: DECLARE MIDNIGHT WINNER */}
      {tab === 'winner' && (
        <form onSubmit={handleSaveAndDeclareWinner} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-neutral-950 to-neutral-950 border border-amber-500/40 text-xs text-neutral-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-black text-amber-300 block mb-0.5">🌙 12:00 AM Midnight Result Control</span>
              <p className="text-neutral-400 text-[11px]">
                By rule, the public home screen hides the winner and shows a live countdown until 12:00 AM. At midnight, it automatically reveals the winner and launches the ceremony.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleToggleMidnightForce}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  isMidnightForceActive
                    ? 'bg-amber-400 text-black shadow-md'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
                title="Toggle whether the winner banner is forced ON for preview"
              >
                <span>{isMidnightForceActive ? '⚡ Midnight Mode: ON' : '⏳ Daytime Countdown: ACTIVE'}</span>
              </button>
              <button
                type="button"
                onClick={handlePreviewCeremony}
                className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs shrink-0 transition cursor-pointer"
              >
                Launch Ceremony
              </button>
            </div>
          </div>

          {/* Quick select from registered users */}
          <div>
            <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">
              Quick Autofill From Registered Members
            </label>
            <select
              onChange={(e) => {
                const user = usersList.find((u) => u.id === e.target.value);
                if (user) handleSelectUserForWinner(user);
              }}
              className="w-full bg-neutral-950 text-white border border-neutral-800 rounded-xl px-3 py-2 text-xs focus:border-amber-500 outline-none cursor-pointer"
            >
              <option value="">-- Choose member to populate form --</option>
              {usersList.map((u) => (
                <option key={u.id} value={u.id}>
                  @{u.profile.username} ({u.email})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">
                Winner Display Name
              </label>
              <input
                type="text"
                required
                value={winnerName}
                onChange={(e) => setWinnerName(e.target.value)}
                placeholder="e.g. 🐸 Shadow"
                className="w-full bg-neutral-950 text-white border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">
                Winner Username (@handle)
              </label>
              <input
                type="text"
                required
                value={winnerUsername}
                onChange={(e) => setWinnerUsername(e.target.value)}
                placeholder="e.g. shadow_sigma"
                className="w-full bg-neutral-950 text-white border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          {/* Winner Image Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">
                Winner Photo Image URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={winnerAvatar}
                  onChange={(e) => setWinnerAvatar(e.target.value)}
                  className="flex-1 bg-neutral-950 text-white border border-neutral-800 rounded-xl px-3 py-2 text-xs focus:border-amber-500 outline-none font-mono"
                />
                <label className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1 shrink-0">
                  <Camera className="w-3.5 h-3.5" />
                  <span>Upload</span>
                  <input type="file" accept="image/*" onChange={handleCustomAvatarUpload} className="hidden" />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">
                Demon Stage Character Image URL
              </label>
              <input
                type="text"
                value={winnerDemonImage}
                onChange={(e) => setWinnerDemonImage(e.target.value)}
                className="w-full bg-neutral-950 text-white border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs focus:border-amber-500 outline-none font-mono text-neutral-300"
              />
            </div>
          </div>

          {/* Winner Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-neutral-400 uppercase mb-1">
                Sigma Score
              </label>
              <input
                type="number"
                value={winnerScore}
                onChange={(e) => setWinnerScore(Number(e.target.value))}
                className="w-full bg-neutral-950 text-white border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-400 focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-neutral-400 uppercase mb-1">
                🔥 Sigma Votes
              </label>
              <input
                type="number"
                value={winnerSigmaVotes}
                onChange={(e) => setWinnerSigmaVotes(Number(e.target.value))}
                className="w-full bg-neutral-950 text-white border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-neutral-400 uppercase mb-1">
                😂 Funny Votes
              </label>
              <input
                type="number"
                value={winnerFunnyVotes}
                onChange={(e) => setWinnerFunnyVotes(Number(e.target.value))}
                className="w-full bg-neutral-950 text-white border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-neutral-400 uppercase mb-1">
                🧠 Smart Votes
              </label>
              <input
                type="number"
                value={winnerSmartVotes}
                onChange={(e) => setWinnerSmartVotes(Number(e.target.value))}
                className="w-full bg-neutral-950 text-white border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-300 uppercase mb-1">
              Winner Quote / Sigma Response
            </label>
            <textarea
              rows={2}
              value={winnerQuote}
              onChange={(e) => setWinnerQuote(e.target.value)}
              className="w-full bg-neutral-950 text-white border border-neutral-800 rounded-xl p-3 text-xs focus:border-amber-500 outline-none italic"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black rounded-xl text-xs uppercase tracking-wider transition cursor-pointer shadow-md"
            >
              👑 Save & Declare Daily Winner
            </button>
            <button
              type="button"
              onClick={handlePreviewCeremony}
              className="px-5 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Preview 12:00 AM Ceremony</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 5: CO-OWNERS MANAGEMENT */}
      {tab === 'co_owners' && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-300">
            <span className="font-bold text-amber-300 block mb-0.5">Admin & Co-Owner Delegation</span>
            Add team members or moderators by their registered email address. Any email added here will have full access to this Owner Panel.
          </div>

          <form onSubmit={handleAddOwner} className="flex gap-2">
            <input
              type="email"
              required
              placeholder="e.g. partner@gmail.com"
              value={newOwnerEmail}
              onChange={(e) => setNewOwnerEmail(e.target.value)}
              className="flex-1 bg-neutral-950 text-white border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs focus:border-amber-500 outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-black font-black text-xs rounded-xl transition cursor-pointer flex items-center gap-1 shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Owner</span>
            </button>
          </form>

          <div className="rounded-xl border border-neutral-800 bg-neutral-950 divide-y divide-neutral-800/80">
            {ownerEmails.map((email) => {
              const isMaster = email.toLowerCase() === MASTER_OWNER_EMAIL.toLowerCase();

              return (
                <div
                  key={email}
                  className="p-3 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span className="font-mono text-white font-semibold">{email}</span>
                    {isMaster && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-black">
                        MASTER OWNER
                      </span>
                    )}
                  </div>

                  {!isMaster ? (
                    <button
                      type="button"
                      onClick={() => handleRemoveOwner(email)}
                      className="p-1.5 text-neutral-500 hover:text-rose-400 transition cursor-pointer"
                      title="Revoke owner access"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <span className="text-[11px] text-neutral-500 font-medium">Permanent</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
