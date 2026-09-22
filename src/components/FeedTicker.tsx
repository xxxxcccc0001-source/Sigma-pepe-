import { useRef, useEffect, useState } from 'react';
import { Answer, Vote, VoteType, UserAccount } from '../types';
import { calculateAnswerVoteCounts } from '../services/storageService';
import { DEFAULT_AVATAR } from '../data/seedData';
import { Play, Pause, MessageSquare } from 'lucide-react';

interface FeedTickerProps {
  answers: Answer[];
  votes: Vote[];
  currentUser: UserAccount | null;
  onVote: (answerId: string, type: VoteType) => void;
}

export function FeedTicker({ answers, votes, currentUser, onVote }: FeedTickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const feedContentRef = useRef<HTMLDivElement>(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const offsetRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);

  // Smooth scroll loop
  useEffect(() => {
    if (!isAutoScrolling) {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      return;
    }

    const tick = () => {
      const container = containerRef.current;
      const content = feedContentRef.current;

      if (container && content) {
        const maxScroll = Math.max(0, content.scrollHeight - container.clientHeight);
        if (maxScroll > 10) {
          offsetRef.current += 0.35; // gentle upward drift
          if (offsetRef.current > maxScroll + 40) {
            offsetRef.current = 0; // loop back
          }
          content.style.transform = `translateY(-${offsetRef.current}px)`;
        } else {
          offsetRef.current = 0;
          content.style.transform = 'translateY(0)';
        }
      }

      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [isAutoScrolling, answers.length]);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 mb-4">
      {/* Feed Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div>
          <h3 className="text-xs font-black tracking-wider text-white uppercase flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span>LIVE COMMUNITY ARENA</span>
          </h3>
          <p className="text-[11px] text-neutral-400 mt-0.5">
            Real-time feed • Upward continuous stream • Vote to rank
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsAutoScrolling(!isAutoScrolling);
          }}
          className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
        >
          {isAutoScrolling ? (
            <>
              <Pause className="w-3 h-3 text-amber-400" /> Pause
            </>
          ) : (
            <>
              <Play className="w-3 h-3 text-emerald-400" /> Auto-Scroll
            </>
          )}
        </button>
      </div>

      {/* Voting Rules Info Banner (English) */}
      <div className="mb-3 px-3 py-2 rounded-xl bg-amber-950/30 border border-amber-800/40 text-[11px] text-amber-200/90 flex items-start gap-2">
        <span className="text-sm select-none">⚖️</span>
        <div className="leading-tight">
          <strong className="text-amber-300">Voting Rule:</strong> You can vote for only <b>1 answer per question</b>. Clicking another answer transfers your vote. <b>Self-voting is strictly prohibited</b>.
        </div>
      </div>

      {/* Feed Window */}
      <div
        ref={containerRef}
        onMouseEnter={() => setIsAutoScrolling(false)}
        onMouseLeave={() => setIsAutoScrolling(true)}
        className="h-[520px] overflow-y-auto relative rounded-xl bg-neutral-950/70 border border-neutral-800/80 p-3 select-none scrollbar-thin scrollbar-thumb-neutral-800"
      >
        <div ref={feedContentRef} className="space-y-3 will-change-transform">
          {answers.length === 0 ? (
            <div className="text-center py-12 text-neutral-500 text-xs">
              No answers yet. Post the very first Sigma response above!
            </div>
          ) : (
            answers.map((ans) => {
              const profile = ans.profiles || { username: 'Pepe', avatar_url: DEFAULT_AVATAR };
              const isOwn = currentUser && ans.user_id === currentUser.id;
              const voteStats = calculateAnswerVoteCounts(ans.id, votes);

              const userVote = currentUser
                ? votes.find((v) => v.answer_id === ans.id && v.user_id === currentUser.id)
                : null;

              return (
                <div
                  key={ans.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isOwn
                      ? 'bg-neutral-900 border-neutral-700 shadow-sm'
                      : 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  {/* User Bar - Country is completely HIDDEN for privacy */}
                  <div className="flex items-center justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={profile.avatar_url || DEFAULT_AVATAR}
                        alt="Profile"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
                        }}
                        className="w-10 h-10 rounded-full object-cover bg-neutral-950 border border-neutral-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-extrabold text-sm text-white truncate flex items-center gap-1.5">
                          <span>@{profile.username}</span>
                          {isOwn && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded">
                              YOU
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono font-black text-sm text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-2 py-0.5 rounded-lg">
                        {voteStats.totalScore} pts
                      </span>
                    </div>
                  </div>

                  {/* Answer Text */}
                  <p className="text-neutral-100 text-sm leading-relaxed whitespace-pre-wrap font-normal mb-3">
                    {ans.answer_text}
                  </p>

                  {/* Reaction buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-neutral-800/80">
                    <button
                      type="button"
                      disabled={isOwn || !currentUser}
                      onClick={() => onVote(ans.id, 'sigma')}
                      title={isOwn ? 'Cannot vote on own answer' : 'Sigma response (+3 pts)'}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                        userVote?.vote_type === 'sigma'
                          ? 'bg-amber-400 text-black border-amber-300 shadow-sm'
                          : 'bg-neutral-800/80 text-neutral-300 border-neutral-700 hover:border-neutral-500'
                      } ${isOwn ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      <span>🔥 Sigma</span>
                      <span className="font-mono text-[11px] font-semibold">{voteStats.sigma}</span>
                    </button>

                    <button
                      type="button"
                      disabled={isOwn || !currentUser}
                      onClick={() => onVote(ans.id, 'funny')}
                      title={isOwn ? 'Cannot vote on own answer' : 'Funny response (+1 pt)'}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                        userVote?.vote_type === 'funny'
                          ? 'bg-amber-400 text-black border-amber-300 shadow-sm'
                          : 'bg-neutral-800/80 text-neutral-300 border-neutral-700 hover:border-neutral-500'
                      } ${isOwn ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      <span>😂 Funny</span>
                      <span className="font-mono text-[11px] font-semibold">{voteStats.funny}</span>
                    </button>

                    <button
                      type="button"
                      disabled={isOwn || !currentUser}
                      onClick={() => onVote(ans.id, 'smart')}
                      title={isOwn ? 'Cannot vote on own answer' : 'Smart response (+2 pts)'}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                        userVote?.vote_type === 'smart'
                          ? 'bg-amber-400 text-black border-amber-300 shadow-sm'
                          : 'bg-neutral-800/80 text-neutral-300 border-neutral-700 hover:border-neutral-500'
                      } ${isOwn ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      <span>🧠 Smart</span>
                      <span className="font-mono text-[11px] font-semibold">{voteStats.smart}</span>
                    </button>

                    {isOwn ? (
                      <span className="text-[10px] text-amber-400/90 font-medium ml-auto flex items-center gap-1">
                        🚫 Your own answer (Voting locked)
                      </span>
                    ) : userVote ? (
                      <span className="text-[10px] text-emerald-400 font-semibold ml-auto flex items-center gap-1 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/60">
                        ⭐ Your active vote
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
