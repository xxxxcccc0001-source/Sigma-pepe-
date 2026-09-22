import { Challenge } from '../types';
import { Flame, Sparkles } from 'lucide-react';

interface ChallengeCardProps {
  challenge: Challenge;
  hasAnswered: boolean;
  onSelectChallenge?: (challenge: Challenge) => void;
  allChallenges?: Challenge[];
}

export function ChallengeCard({ challenge, hasAnswered, onSelectChallenge, allChallenges }: ChallengeCardProps) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 mb-4 relative overflow-hidden">
      {/* Decorative subtle accent */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Flame className="w-4 h-4" />
          </span>
          <h3 className="text-xs font-black tracking-wider text-amber-400 uppercase">
            CURRENT SIGMA CHALLENGE
          </h3>
        </div>

        {hasAnswered ? (
          <span className="px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 text-[10px] font-bold">
            ✓ COMPLETED
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-full bg-neutral-800 text-neutral-400 text-[10px] font-semibold">
            1 ATTEMPT ONLY
          </span>
        )}
      </div>

      <div className="text-lg md:text-xl font-black text-white leading-relaxed mb-3">
        "{challenge.question}"
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-800/80 text-xs text-neutral-400">
        <span className="flex items-center gap-1.5 font-medium text-neutral-400">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          Category: <span className="text-neutral-200">{challenge.topic || 'Sigma Mindset'}</span>
        </span>

        {allChallenges && allChallenges.length > 1 && onSelectChallenge && (
          <div className="flex items-center gap-1 text-[11px]">
            <span className="text-neutral-500">Other challenges:</span>
            {allChallenges.map((c, i) => (
              <button
                key={c.id}
                onClick={() => onSelectChallenge(c)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                  c.id === challenge.id
                    ? 'bg-white text-black'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                #{i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
