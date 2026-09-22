import { LeaderboardEntry } from '../types';
import { DEFAULT_AVATAR } from '../data/seedData';
import { Trophy, Medal, Award, Flame, Brain, Laugh } from 'lucide-react';

interface LeaderboardViewProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
}

export function LeaderboardView({ entries, currentUserId }: LeaderboardViewProps) {
  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="w-8 h-8 rounded-full bg-amber-400 text-black font-black flex items-center justify-center text-xs shadow-md shrink-0">
          <Trophy className="w-4 h-4" />
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="w-8 h-8 rounded-full bg-slate-300 text-black font-black flex items-center justify-center text-xs shrink-0">
          <Medal className="w-4 h-4" />
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="w-8 h-8 rounded-full bg-amber-700 text-white font-black flex items-center justify-center text-xs shrink-0">
          <Award className="w-4 h-4" />
        </span>
      );
    }
    return (
      <span className="w-8 h-8 rounded-full bg-neutral-800 text-neutral-400 font-mono font-bold flex items-center justify-center text-xs shrink-0">
        #{rank}
      </span>
    );
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-black text-white uppercase flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>GLOBAL SIGMA LEADERBOARD</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Ranked by authentic community reactions • 🔥 3pts • 🧠 2pts • 😂 1pt
          </p>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-10 text-neutral-500 text-xs">
          No players ranked yet. Submit an answer and get voted!
        </div>
      ) : (
        <div className="divide-y divide-neutral-800/80">
          {entries.map((entry) => {
            const isMe = currentUserId === entry.id;

            return (
              <div
                key={entry.id}
                className={`py-3.5 px-3 rounded-xl flex items-center justify-between gap-3 transition ${
                  isMe
                    ? 'bg-neutral-800/90 border border-neutral-700 shadow-sm'
                    : 'hover:bg-neutral-800/40'
                }`}
              >
                {/* Left: Rank + Avatar + Name */}
                <div className="flex items-center gap-3 min-w-0">
                  {getRankBadge(entry.rank)}

                  <img
                    src={entry.avatar_url || DEFAULT_AVATAR}
                    alt={entry.username}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
                    }}
                    className="w-11 h-11 rounded-full object-cover bg-neutral-950 border border-neutral-700 shrink-0"
                  />

                  <div className="min-w-0">
                    <div className="font-black text-sm text-white truncate flex items-center gap-1.5">
                      <span>@{entry.username}</span>
                      {isMe && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded">
                          YOU
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-neutral-400 truncate">
                      Rank #{entry.rank} Contender
                    </div>
                  </div>
                </div>

                {/* Right: Score + vote breakdown */}
                <div className="text-right shrink-0">
                  <div className="font-mono font-black text-base text-emerald-400">
                    {entry.score} <span className="text-xs text-neutral-400 font-sans font-normal">pts</span>
                  </div>
                  <div className="flex items-center justify-end gap-2 text-[10px] text-neutral-400 font-mono mt-0.5">
                    <span className="flex items-center gap-0.5" title="Sigma votes">
                      <Flame className="w-3 h-3 text-amber-400" /> {entry.sigmaVotes}
                    </span>
                    <span className="flex items-center gap-0.5" title="Smart votes">
                      <Brain className="w-3 h-3 text-purple-400" /> {entry.smartVotes}
                    </span>
                    <span className="flex items-center gap-0.5" title="Funny votes">
                      <Laugh className="w-3 h-3 text-sky-400" /> {entry.funnyVotes}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
