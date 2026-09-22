import { useState, useEffect, useCallback, useRef } from 'react';
import { UserAccount, Challenge, Answer, Vote, VoteType, LeaderboardEntry, WinnerAnnouncement } from './types';
import {
  initLocalDatabase,
  getCurrentUser,
  getActiveChallenge,
  getChallenges,
  getAnswers,
  getVotes,
  postAnswer,
  voteAnswer,
  getLeaderboard,
  hasAnsweredChallenge,
  getUserTotalScore,
  logoutUser,
  setCurrentUser as persistCurrentUser,
  isOwnerUser,
  getDailyWinner,
  calculateMidnightCountdown,
  MidnightCountdown,
  isOwnerForceMidnight,
  setOwnerForceMidnight
} from './services/storageService';
import { auth, logTrackingEvent } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { mapFirebaseUserToAccount, firebaseLogout } from './services/firebaseAuthService';
import { PrivacyBanner } from './components/PrivacyBanner';
import { AuthModal } from './components/AuthModal';
import { ChallengeCard } from './components/ChallengeCard';
import { AnswerForm } from './components/AnswerForm';
import { FeedTicker } from './components/FeedTicker';
import { LeaderboardView } from './components/LeaderboardView';
import { ProfileView } from './components/ProfileView';
import { OwnerPanel } from './components/OwnerPanel';
import { MidnightCeremonyModal } from './components/MidnightCeremonyModal';
import { downloadProjectZip, downloadIndex1Html, downloadFullIndexHtml } from './services/downloadService';
import { Users, Trophy, User, Flame, Crown, Moon, Sparkles, Download, Check, FileCode, Clock, Timer } from 'lucide-react';

type MainTab = 'community' | 'leaderboard' | 'profile' | 'owner';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [activeTab, setActiveTab] = useState<MainTab>('community');

  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [allChallenges, setAllChallenges] = useState<Challenge[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [userScore, setUserScore] = useState(0);

  // Midnight Winner Ceremony & Owner Authority
  const [isCeremonyOpen, setIsCeremonyOpen] = useState(false);
  const [ceremonyWinner, setCeremonyWinner] = useState<WinnerAnnouncement>(() => getDailyWinner());
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // 12:00 AM Midnight Automation & Countdown
  const [countdown, setCountdown] = useState<MidnightCountdown>(() => calculateMidnightCountdown());
  const [ownerForceMidnight, setOwnerForceMidnightState] = useState<boolean>(() => isOwnerForceMidnight());
  const hasAutoTriggeredMidnightRef = useRef<boolean>(false);

  // Update countdown every second and trigger ceremony automatically at 12:00 AM
  useEffect(() => {
    const tick = () => {
      const cd = calculateMidnightCountdown();
      setCountdown(cd);
      const force = isOwnerForceMidnight();
      setOwnerForceMidnightState(force);

      // Auto-launch ceremony modal when 12:00 AM arrives
      if (cd.isMidnightNow && !hasAutoTriggeredMidnightRef.current) {
        hasAutoTriggeredMidnightRef.current = true;
        const latestWinner = getDailyWinner();
        setCeremonyWinner(latestWinner);
        setIsCeremonyOpen(true);
        logTrackingEvent('midnight_auto_trigger', { winner: latestWinner.username });
      }
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  const isMidnightActive = countdown.isMidnightNow || ownerForceMidnight;

  const isOwner = isOwnerUser(currentUser);

  const handleDownloadProjectZip = async () => {
    if (!isOwner) return;
    try {
      setIsDownloadingZip(true);
      setDownloadSuccess(false);
      await downloadProjectZip();
      setDownloadSuccess(true);
      logTrackingEvent('download_project_zip');
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to download project zip:', err);
      alert('Could not package ZIP. Please check your browser settings.');
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const handleDownloadFullHtml = (filename = 'index.html') => {
    if (!isOwner) return;
    try {
      downloadFullIndexHtml(filename);
      logTrackingEvent('download_full_index_html', { filename });
    } catch (err) {
      console.error('Failed to download HTML:', err);
      alert('Could not download HTML file');
    }
  };

  const handleDownloadIndex1 = () => {
    handleDownloadFullHtml('index.html');
  };

  // Initialize and load data
  const refreshData = useCallback(() => {
    initLocalDatabase();
    const user = getCurrentUser();
    setCurrentUser(user);

    const challenges = getChallenges();
    setAllChallenges(challenges);
    const active = getActiveChallenge();
    setActiveChallenge(active);

    const ans = getAnswers();
    setAnswers(ans);

    const v = getVotes();
    setVotes(v);

    const lb = getLeaderboard();
    setLeaderboard(lb);

    if (user && active) {
      setHasAnswered(hasAnsweredChallenge(user.id, active.id));
      setUserScore(getUserTotalScore(user.id));
    }
  }, []);

  useEffect(() => {
    refreshData();

    // Firebase Auth State Listener
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        const account = mapFirebaseUserToAccount(fbUser);
        setCurrentUser(account);
        persistCurrentUser(account);
        logTrackingEvent('session_start', { uid: fbUser.uid });
      }
    });

    return () => unsubscribe();
  }, [refreshData]);

  // Handle post answer
  const handlePostAnswer = (text: string) => {
    if (!currentUser || !activeChallenge) return;
    postAnswer(currentUser.id, activeChallenge.id, text);
    logTrackingEvent('post_answer', {
      challenge_id: activeChallenge.id,
      user_id: currentUser.id
    });
    refreshData();
  };

  // Handle vote (enforces 1-vote-per-question and no-self-voting)
  const handleVote = (answerId: string, type: VoteType) => {
    if (!currentUser) return;
    try {
      voteAnswer(answerId, currentUser.id, type);
      logTrackingEvent('vote_cast', {
        answer_id: answerId,
        vote_type: type,
        user_id: currentUser.id
      });
      // Re-read answers and votes to reflect live state
      const v = getVotes();
      setVotes(v);
      const lb = getLeaderboard();
      setLeaderboard(lb);
      if (currentUser) {
        setUserScore(getUserTotalScore(currentUser.id));
      }
    } catch (e: any) {
      alert(e?.message || 'Vote failed');
    }
  };

  // Handle logout
  const handleLogout = async () => {
    await firebaseLogout();
    logoutUser();
    setCurrentUser(null);
    setActiveTab('community');
    logTrackingEvent('user_logout');
  };

  // If no user is logged in, show Auth
  if (!currentUser) {
    return (
      <main className="min-h-screen bg-black text-white p-4 flex flex-col justify-center items-center">
        <AuthModal
          onSuccess={(user) => {
            setCurrentUser(user);
            persistCurrentUser(user);
            refreshData();
          }}
        />
      </main>
    );
  }

  const userAnswersCount = answers.filter((a) => a.user_id === currentUser.id).length;

  return (
    <div className="min-h-screen bg-black text-white antialiased flex flex-col items-center">
      <div className="w-full max-w-2xl px-3 py-4 md:py-6 pb-20">
        {/* Top Firebase Status Banner */}
        <PrivacyBanner />

        {/* Brand Header */}
        <header className="text-center mb-4">
          <div className="text-4xl select-none">🐸</div>
          <h1 className="text-2xl md:text-3xl font-black tracking-widest text-white mt-1">
            SIGMA PEPE
          </h1>
          <p className="text-[11px] font-bold tracking-widest text-amber-400 uppercase mt-0.5 flex items-center justify-center gap-1.5">
            <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>POWERED BY FIREBASE • REAL-TIME ANALYTICS</span>
          </p>
        </header>

        {/* Action Banners */}
        <div className={`grid gap-2.5 mb-4 ${isOwner ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
          {isMidnightActive ? (
            /* 12:00 AM Midnight Result Banner (Active automatically at 12:00 AM or Owner Preview) */
            <button
              type="button"
              onClick={() => {
                const latestWinner = getDailyWinner();
                setCeremonyWinner(latestWinner);
                setIsCeremonyOpen(true);
                logTrackingEvent('view_ceremony', { winner: latestWinner.username });
              }}
              className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-neutral-900 to-amber-500/20 border border-amber-500/50 hover:border-amber-400 flex items-center justify-between gap-3 text-left transition shadow-lg group cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="p-2 rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/30 group-hover:scale-105 transition shrink-0">
                  <Moon className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400 text-black">
                      🌙 MIDNIGHT RESULT
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white truncate mt-0.5">
                    Winner: <span className="text-amber-300">@{ceremonyWinner.username}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-400 text-black font-black text-xs uppercase tracking-wider shrink-0 group-hover:bg-amber-300 transition">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Watch</span>
              </div>
            </button>
          ) : (
            /* Daytime Countdown Banner until 12:00 AM Midnight */
            <div className="p-3 rounded-2xl bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 border border-neutral-800 flex items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="p-2 rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/20 shrink-0">
                  <Clock className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-neutral-800 text-amber-400 border border-amber-400/30">
                      🌙 RESULT AT 12:00 AM
                    </span>
                    <span className="text-[10px] text-neutral-400 font-semibold hidden sm:inline">
                      VOTING LIVE
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-neutral-300 truncate mt-0.5">
                    Winner announced in <span className="font-mono text-amber-300 font-bold">{countdown.hours}:{countdown.minutes}:{countdown.seconds}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <div className="px-2.5 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-amber-300 font-mono font-black text-xs flex items-center gap-1 shadow-inner">
                  <Timer className="w-3.5 h-3.5 text-amber-400" />
                  <span>{countdown.hours}:{countdown.minutes}:{countdown.seconds}</span>
                </div>

                {isOwner && (
                  <button
                    type="button"
                    onClick={() => {
                      const latestWinner = getDailyWinner();
                      setCeremonyWinner(latestWinner);
                      setIsCeremonyOpen(true);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-[11px] uppercase tracking-wider flex items-center gap-1 transition shadow active:scale-95 cursor-pointer"
                    title="Master Owner Privilege: Preview Midnight Winner Ceremony anytime"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span className="hidden sm:inline">Preview</span>
                    <span className="sm:hidden">Test</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Owner Only Download Command */}
          {isOwner && (
            <div className="p-3 rounded-2xl bg-neutral-900/90 border border-emerald-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-lg">
              <div className="min-w-0 pl-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-400 text-black">
                    👑 MASTER OWNER EXPORT
                  </span>
                  <span className="text-[10px] text-amber-300 font-bold">ALL OWNER & USER DATA</span>
                </div>
                <p className="text-xs font-semibold text-neutral-200 mt-0.5">
                  Full standalone <span className="font-mono text-amber-300 font-bold">index.html</span> with complete arena code & all live data
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleDownloadFullHtml('index.html')}
                  className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs flex items-center justify-center gap-1 transition cursor-pointer shadow active:scale-95"
                  title="Download full standalone index.html with all owner and user data"
                >
                  <FileCode className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>index.html (Full)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadFullHtml('index.htm')}
                  className="px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer shadow active:scale-95"
                  title="Download as index.htm"
                >
                  <span>.htm</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadProjectZip}
                  disabled={isDownloadingZip}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs flex items-center justify-center gap-1 transition cursor-pointer shadow active:scale-95"
                  title="Download complete project ZIP including source files and index.html"
                >
                  <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{isDownloadingZip ? '...' : '.ZIP'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <nav className="flex rounded-xl bg-neutral-900/90 p-1 border border-neutral-800 mb-5 sticky top-2 z-20 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setActiveTab('community')}
            className={`flex-1 py-2.5 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'community'
                ? 'bg-white text-black shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>COMMUNITY</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('leaderboard');
              setLeaderboard(getLeaderboard());
              logTrackingEvent('view_leaderboard');
            }}
            className={`flex-1 py-2.5 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'leaderboard'
                ? 'bg-white text-black shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>LEADERBOARD</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('profile');
              if (currentUser) {
                setUserScore(getUserTotalScore(currentUser.id));
              }
              logTrackingEvent('view_profile');
            }}
            className={`flex-1 py-2.5 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-white text-black shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>PROFILE</span>
          </button>

          {isOwner && (
            <button
              type="button"
              onClick={() => {
                setActiveTab('owner');
                logTrackingEvent('view_owner_panel');
              }}
              className={`flex-1 py-2.5 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'owner'
                  ? 'bg-amber-400 text-black shadow-md'
                  : 'text-amber-400 hover:text-amber-300'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>OWNER</span>
            </button>
          )}
        </nav>

        {/* Tab 1: COMMUNITY */}
        {activeTab === 'community' && activeChallenge && (
          <section className="space-y-4">
            <ChallengeCard
              challenge={activeChallenge}
              hasAnswered={hasAnswered}
              allChallenges={allChallenges}
              onSelectChallenge={(c) => {
                setActiveChallenge(c);
                if (currentUser) {
                  setHasAnswered(hasAnsweredChallenge(currentUser.id, c.id));
                }
                logTrackingEvent('select_challenge', { challenge_id: c.id });
              }}
            />

            <AnswerForm hasAnswered={hasAnswered} onSubmit={handlePostAnswer} />

            <FeedTicker
              answers={answers}
              votes={votes}
              currentUser={currentUser}
              onVote={handleVote}
            />
          </section>
        )}

        {/* Tab 2: LEADERBOARD */}
        {activeTab === 'leaderboard' && (
          <section>
            <LeaderboardView entries={leaderboard} currentUserId={currentUser.id} />
          </section>
        )}

        {/* Tab 3: PROFILE */}
        {activeTab === 'profile' && (
          <section>
            <ProfileView
              currentUser={currentUser}
              totalScore={userScore}
              answersCount={userAnswersCount}
              onUpdate={(updated) => {
                setCurrentUser(updated);
                persistCurrentUser(updated);
                refreshData();
              }}
              onLogout={handleLogout}
            />
          </section>
        )}

        {/* Tab 4: OWNER PANEL */}
        {activeTab === 'owner' && isOwner && activeChallenge && (
          <section>
            <OwnerPanel
              currentUser={currentUser}
              answers={answers}
              activeChallenge={activeChallenge}
              onChallengeUpdated={(updated) => {
                setActiveChallenge(updated);
                refreshData();
              }}
              onBoostComplete={() => {
                refreshData();
              }}
              onPreviewMidnightCeremony={(winner) => {
                setCeremonyWinner(winner);
                setIsCeremonyOpen(true);
              }}
            />
          </section>
        )}

        {/* Footer info */}
        <footer className="mt-8 pt-4 border-t border-neutral-900 text-center text-xs text-neutral-400 flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
            <Flame className="w-3.5 h-3.5 fill-amber-400" />
            <span>Firebase Connected: Project sigma-pepe</span>
          </div>
          <p className="text-[11px] text-neutral-400 max-w-md">
            Firebase Authentication & Google Analytics (Measurement ID: G-GVP3Q3DM3C) active. 1-second rapid login enabled.
          </p>
        </footer>
      </div>

      {/* 12:00 AM Midnight Result Ceremony Modal */}
      {isCeremonyOpen && (
        <MidnightCeremonyModal
          winner={ceremonyWinner}
          onClose={() => setIsCeremonyOpen(false)}
        />
      )}
    </div>
  );
}
