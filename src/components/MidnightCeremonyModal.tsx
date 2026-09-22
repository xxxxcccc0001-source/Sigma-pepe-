import { useEffect, useRef, useState } from 'react';
import { WinnerAnnouncement } from '../types';
import { X, RotateCcw, Volume2, VolumeX, Sparkles } from 'lucide-react';

interface MidnightCeremonyModalProps {
  winner: WinnerAnnouncement;
  onClose: () => void;
}

export function MidnightCeremonyModal({ winner, onClose }: MidnightCeremonyModalProps) {
  const [gateOpen, setGateOpen] = useState(false);
  const [demonEnter, setDemonEnter] = useState(false);
  const [diamondShow, setDiamondShow] = useState(false);
  const [cardShow, setCardShow] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  // Web Audio Synthesizer (Zero External Dependencies)
  const initAudio = () => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        audioCtxRef.current = new AudioCtx();
        const master = audioCtxRef.current.createGain();
        master.gain.value = isAudioMuted ? 0 : 0.24;
        master.connect(audioCtxRef.current.destination);
        masterGainRef.current = master;
      } else if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    } catch (e) {
      console.warn('Web Audio init error:', e);
    }
  };

  const playTone = (
    freq: number,
    start: number,
    dur: number,
    type: OscillatorType = 'sine',
    gain = 0.18
  ) => {
    if (isAudioMuted || !audioCtxRef.current || !masterGainRef.current) return;
    try {
      const ctx = audioCtxRef.current;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, ctx.currentTime + start);
      g.gain.setValueAtTime(0, ctx.currentTime + start);
      g.gain.linearRampToValueAtTime(gain, ctx.currentTime + start + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      o.connect(g);
      g.connect(masterGainRef.current);
      o.start(ctx.currentTime + start);
      o.stop(ctx.currentTime + start + dur + 0.05);
    } catch (e) {
      // Audio node scheduling guard
    }
  };

  const playMusic = () => {
    initAudio();
    [55, 65.41, 73.42, 82.41].forEach((f, i) => playTone(f, i * 0.35, 3.8, 'sawtooth', 0.035));
    playTone(110, 0, 4, 'sine', 0.07);
    playTone(146.83, 1.1, 2.8, 'sine', 0.055);
    playTone(220, 2.5, 2, 'triangle', 0.06);
  };

  const playGateSfx = () => {
    initAudio();
    playTone(70, 0, 1.4, 'sawtooth', 0.12);
    playTone(92, 0, 1.5, 'sine', 0.08);
  };

  const playDemonSfx = () => {
    initAudio();
    playTone(45, 0, 1.5, 'sawtooth', 0.16);
    playTone(90, 0.2, 1.1, 'square', 0.05);
  };

  const playDiamondSfx = () => {
    initAudio();
    playTone(523.25, 0, 0.35, 'sine', 0.16);
    playTone(783.99, 0.12, 0.55, 'sine', 0.14);
    playTone(1046.5, 0.25, 0.8, 'sine', 0.12);
  };

  const playWinnerSfx = () => {
    initAudio();
    [261.63, 329.63, 392, 523.25, 659.25].forEach((f, i) =>
      playTone(f, i * 0.13, 0.75, 'triangle', 0.11)
    );
  };

  const startCeremony = () => {
    // Clear any pending timeouts
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];

    setGateOpen(false);
    setDemonEnter(false);
    setDiamondShow(false);
    setCardShow(false);

    // Initial audio and music
    playMusic();

    // 1. Gate Open
    const t1 = setTimeout(() => {
      setGateOpen(true);
      playGateSfx();
    }, 450);

    // 2. Demon Enters
    const t2 = setTimeout(() => {
      setDemonEnter(true);
      playDemonSfx();
    }, 1050);

    // 3. Diamond Burst
    const t3 = setTimeout(() => {
      setDiamondShow(true);
      playDiamondSfx();
    }, 2600);

    // 4. Winner Card Appears
    const t4 = setTimeout(() => {
      setCardShow(true);
      playWinnerSfx();
    }, 3500);

    timeoutsRef.current.push(t1, t2, t3, t4);
  };

  useEffect(() => {
    const autoStart = setTimeout(() => {
      startCeremony();
    }, 200);

    return () => {
      clearTimeout(autoStart);
      timeoutsRef.current.forEach((t) => clearTimeout(t));
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const toggleAudioMute = () => {
    setIsAudioMuted((prev) => {
      const next = !prev;
      if (masterGainRef.current) {
        masterGainRef.current.gain.value = next ? 0 : 0.24;
      }
      return next;
    });
  };

  const demonImage = winner.demon_image_url || 'https://i.ibb.co/prnXzb0F/Fs-Z7-EXg-AAy-EW0.jpg';

  return (
    <div
      id="ceremony-container"
      className="fixed inset-0 z-50 overflow-hidden select-none bg-black flex items-center justify-center"
      style={{
        background: 'radial-gradient(circle at 50% 45%, #151515, #000000 75%)'
      }}
    >
      {/* Top Floating Controls */}
      <div className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={startCeremony}
            className="px-3 py-1.5 rounded-full bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700 text-xs font-bold text-amber-400 flex items-center gap-1.5 shadow-lg backdrop-blur-md transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Replay</span>
          </button>
          <button
            type="button"
            onClick={toggleAudioMute}
            className="p-2 rounded-full bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 shadow-lg backdrop-blur-md transition cursor-pointer"
            title={isAudioMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-full bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700 text-white shadow-lg backdrop-blur-md transition cursor-pointer active:scale-95"
          title="Close Ceremony"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Header */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center z-30 pointer-events-none">
        <div className="text-xs md:text-sm font-bold text-neutral-400 tracking-wider">
          🌙 12:00 AM 🌙
        </div>
        <div className="text-xl md:text-2xl font-black text-amber-400 tracking-widest mt-1 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]">
          ⚡ RESULT TIME ⚡
        </div>
      </div>

      {/* Stage Arena */}
      <div className="relative w-full h-full flex items-center justify-center">
        {/* The Gate */}
        <div
          className="absolute w-[240px] md:w-[260px] h-[340px] md:h-[370px] -translate-y-8"
          style={{
            border: '4px solid #777',
            borderBottom: 'none',
            borderRadius: '130px 130px 0 0',
            boxShadow: '0 0 45px rgba(255,255,255,0.15), inset 0 0 35px rgba(255,255,255,0.08)'
          }}
        >
          {/* Gate Doors */}
          <div
            className="absolute top-0 left-0 w-1/2 h-full bg-[#080808] border-3 border-[#444] origin-left transition-transform duration-[1500ms]"
            style={{
              borderRadius: '125px 0 0 0',
              transform: gateOpen ? 'perspective(500px) rotateY(-105deg)' : 'none',
              transitionTimingFunction: 'cubic-bezier(.7,0,.2,1)'
            }}
          />
          <div
            className="absolute top-0 right-0 w-1/2 h-full bg-[#080808] border-3 border-[#444] origin-right transition-transform duration-[1500ms]"
            style={{
              borderRadius: '0 125px 0 0',
              transform: gateOpen ? 'perspective(500px) rotateY(105deg)' : 'none',
              transitionTimingFunction: 'cubic-bezier(.7,0,.2,1)'
            }}
          />
        </div>

        {/* Portal Glow */}
        <div
          className={`absolute w-[170px] md:w-[185px] h-[250px] md:h-[270px] -translate-y-8 rounded-t-[100px] transition-all duration-[1200ms] pointer-events-none ${
            gateOpen ? 'opacity-90 scale-110' : 'opacity-0 scale-95'
          }`}
          style={{
            background: 'radial-gradient(circle, #fff, #777 18%, #222 48%, #000 75%)'
          }}
        />

        {/* Demon Rising Character */}
        <img
          src={demonImage}
          alt="Sigma Pepe Demon"
          className="absolute z-10 w-[260px] md:w-[290px] max-h-[350px] object-contain transition-all duration-[1800ms] pointer-events-none"
          style={{
            filter: 'drop-shadow(0 0 30px rgba(255,255,255,0.25))',
            opacity: demonEnter ? 1 : 0,
            transform: demonEnter ? 'translateY(-40px) scale(1)' : 'translateY(180px) scale(0.55)',
            transitionTimingFunction: 'cubic-bezier(.2,.8,.2,1)'
          }}
        />

        {/* Diamond Burst */}
        <div
          className="absolute z-20 text-6xl md:text-7xl transition-all duration-[1200ms] pointer-events-none"
          style={{
            opacity: diamondShow ? 1 : 0,
            transform: diamondShow ? 'scale(1) rotate(0deg)' : 'scale(0.1) rotate(-30deg)',
            textShadow: '0 0 30px #ffffff, 0 0 70px #f59e0b',
            transitionTimingFunction: 'cubic-bezier(.2,1.5,.4,1)'
          }}
        >
          💎
        </div>

        {/* Winner Showcase Card */}
        <div
          className="absolute z-30 bottom-5 md:bottom-7 left-1/2 -translate-x-1/2 w-[min(420px,92vw)] p-4 md:p-5 rounded-3xl border border-neutral-600/80 text-center transition-all duration-[1200ms]"
          style={{
            background: 'linear-gradient(145deg, #181818, #070707)',
            boxShadow: '0 20px 70px #000, 0 0 35px rgba(255,255,255,0.08)',
            transform: cardShow ? 'translate(-50%, 0)' : 'translate(-50%, 140%)',
            opacity: cardShow ? 1 : 0,
            transitionTimingFunction: 'cubic-bezier(.2,.8,.2,1)'
          }}
        >
          <div className="relative inline-block">
            <img
              src={winner.avatar_url}
              alt={winner.name}
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://i.ibb.co/prnXzb0F/Fs-Z7-EXg-AAy-EW0.jpg';
              }}
              className="w-16 h-16 rounded-full object-cover border-2 border-amber-400 mx-auto shadow-md"
            />
            <span className="absolute -bottom-1 -right-1 text-base">👑</span>
          </div>

          <div className="text-xl font-black text-white mt-1.5">{winner.name}</div>
          <div className="text-xs text-neutral-400 font-mono">@{winner.username}</div>

          <div className="inline-block my-2 px-3 py-1 rounded-full border border-amber-400/80 bg-amber-400/10 text-amber-300 font-black text-[11px] uppercase tracking-wider">
            👑 SIGMA OF THE DAY
          </div>

          <div className="text-2xl md:text-3xl font-black text-emerald-400 tracking-tight">
            ⚡ {winner.score.toLocaleString()}{' '}
            <span className="text-[10px] text-neutral-400 tracking-normal font-bold">SIGMA SCORE</span>
          </div>

          <div className="flex justify-around items-center mt-2.5 py-2 px-3 rounded-xl bg-neutral-900/80 border border-neutral-800 text-xs">
            <span className="text-amber-300 font-bold">
              🔥 {winner.sigmaVotes.toLocaleString()}<br />
              <span className="text-[10px] text-neutral-400 font-normal">Sigma</span>
            </span>
            <span className="text-amber-300 font-bold">
              😂 {winner.funnyVotes.toLocaleString()}<br />
              <span className="text-[10px] text-neutral-400 font-normal">Funny</span>
            </span>
            <span className="text-amber-300 font-bold">
              🧠 {winner.smartVotes.toLocaleString()}<br />
              <span className="text-[10px] text-neutral-400 font-normal">Smart</span>
            </span>
          </div>

          <div className="mt-2.5 p-3 rounded-xl bg-neutral-950/90 border border-neutral-800/80 text-neutral-200 text-xs italic leading-relaxed">
            {winner.winning_answer || '“I don\'t chase opportunities… opportunities chase me.”'}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full mt-3 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black rounded-xl text-xs uppercase tracking-wider transition cursor-pointer shadow-md"
          >
            Enter Arena Feed
          </button>
        </div>
      </div>
    </div>
  );
}
