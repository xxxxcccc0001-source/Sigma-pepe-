import { Flame, Activity, ShieldCheck, Zap } from 'lucide-react';

export function PrivacyBanner() {
  return (
    <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-3 mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-400">
      <div className="flex items-center gap-2 text-amber-400 font-semibold">
        <Flame className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
        <span>Firebase Active: <span className="font-mono text-white">sigma-pepe</span></span>
      </div>
      <div className="flex items-center gap-4 text-neutral-300 text-[11px]">
        <span className="flex items-center gap-1 text-emerald-400">
          <Activity className="w-3.5 h-3.5" /> Analytics Tracking Live
        </span>
        <span className="flex items-center gap-1 text-amber-300">
          <Zap className="w-3.5 h-3.5" /> 1-Sec Quick Auth
        </span>
        <span className="flex items-center gap-1 text-neutral-400">
          <ShieldCheck className="w-3.5 h-3.5 text-neutral-500" /> Secure Sessions
        </span>
      </div>
    </div>
  );
}
