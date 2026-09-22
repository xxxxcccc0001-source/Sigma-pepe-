import { Challenge, Answer, Vote, Profile } from '../types';

export const DEFAULT_AVATAR =
  'data:image/svg+xml;charset=UTF-8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="60" fill="#151515"/><circle cx="60" cy="60" r="50" fill="#1c2b1a"/><text x="60" y="78" text-anchor="middle" font-size="52">🐸</text></svg>'
  );

export const AVATAR_PRESETS = [
  'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="50" fill="#111"/><text x="50" y="68" text-anchor="middle" font-size="52">🐸</text></svg>'),
  'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="50" fill="#1a2016"/><text x="50" y="68" text-anchor="middle" font-size="52">👑</text></svg>'),
  'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="50" fill="#201515"/><text x="50" y="68" text-anchor="middle" font-size="52">🕶️</text></svg>'),
  'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="50" fill="#13232b"/><text x="50" y="68" text-anchor="middle" font-size="52">🔥</text></svg>'),
  'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="50" fill="#231a2c"/><text x="50" y="68" text-anchor="middle" font-size="52">⚡</text></svg>')
];

export const INITIAL_CHALLENGES: Challenge[] = [
  {
    id: 'c1',
    question: 'Someone cuts in front of you in line and smirks. What is your ultimate Sigma move?',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    topic: 'Daily Sigma Grind'
  },
  {
    id: 'c2',
    question: 'Your boss asks why you were staring into the abyss during the meeting. What is your response?',
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    topic: 'Office Dominance'
  },
  {
    id: 'c3',
    question: 'When someone says "You need to socialize more", what is the legendary comeback?',
    created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
    topic: 'Solitary Rule'
  }
];

export const SEED_PROFILES: Profile[] = [
  {
    id: 'u_sigma_king',
    username: 'SigmaGrindset',
    country: 'United States',
    avatar_url: AVATAR_PRESETS[0],
    created_at: new Date(Date.now() - 3600000 * 90).toISOString()
  },
  {
    id: 'u_pepe_wise',
    username: 'PepeTheWise',
    country: 'Japan',
    avatar_url: AVATAR_PRESETS[1],
    created_at: new Date(Date.now() - 3600000 * 80).toISOString()
  },
  {
    id: 'u_shadow_lord',
    username: 'ShadowArchitect',
    country: 'Germany',
    avatar_url: AVATAR_PRESETS[2],
    created_at: new Date(Date.now() - 3600000 * 70).toISOString()
  },
  {
    id: 'u_monk_mode',
    username: 'MonkModeChad',
    country: 'India',
    avatar_url: AVATAR_PRESETS[3],
    created_at: new Date(Date.now() - 3600000 * 60).toISOString()
  },
  {
    id: 'u_quantum_pepe',
    username: 'QuantumFrog',
    country: 'Canada',
    avatar_url: AVATAR_PRESETS[4],
    created_at: new Date(Date.now() - 3600000 * 50).toISOString()
  }
];

export const SEED_ANSWERS: Answer[] = [
  {
    id: 'a1',
    user_id: 'u_sigma_king',
    challenge_id: 'c1',
    answer_text: 'I buy the entire store, fire the cashier who served them, and promote the person behind me to CEO. Never break eye contact.',
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    profiles: SEED_PROFILES[0]
  },
  {
    id: 'a2',
    user_id: 'u_pepe_wise',
    challenge_id: 'c1',
    answer_text: 'I say "Thank you for holding my place" and hand them my basket to carry.',
    created_at: new Date(Date.now() - 3600000 * 15).toISOString(),
    profiles: SEED_PROFILES[1]
  },
  {
    id: 'a3',
    user_id: 'u_shadow_lord',
    challenge_id: 'c1',
    answer_text: 'I whisper in their ear: "The simulation is resetting in 3 minutes. Spend your final moments wisely."',
    created_at: new Date(Date.now() - 3600000 * 10).toISOString(),
    profiles: SEED_PROFILES[2]
  },
  {
    id: 'a4',
    user_id: 'u_monk_mode',
    challenge_id: 'c1',
    answer_text: 'A lion does not fight sheep for position in line. I simply place my items on their head and wait.',
    created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    profiles: SEED_PROFILES[3]
  },
  {
    id: 'a5',
    user_id: 'u_quantum_pepe',
    challenge_id: 'c1',
    answer_text: 'I maintain absolute silence and begin calculating the gravitational pull of their audacity.',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    profiles: SEED_PROFILES[4]
  }
];

export const SEED_VOTES: Vote[] = [
  { id: 'v1', answer_id: 'a1', user_id: 'u_pepe_wise', vote_type: 'sigma' },
  { id: 'v2', answer_id: 'a1', user_id: 'u_shadow_lord', vote_type: 'sigma' },
  { id: 'v3', answer_id: 'a1', user_id: 'u_monk_mode', vote_type: 'funny' },
  { id: 'v4', answer_id: 'a2', user_id: 'u_sigma_king', vote_type: 'smart' },
  { id: 'v5', answer_id: 'a2', user_id: 'u_quantum_pepe', vote_type: 'smart' },
  { id: 'v6', answer_id: 'a2', user_id: 'u_shadow_lord', vote_type: 'sigma' },
  { id: 'v7', answer_id: 'a3', user_id: 'u_sigma_king', vote_type: 'sigma' },
  { id: 'v8', answer_id: 'a3', user_id: 'u_pepe_wise', vote_type: 'funny' },
  { id: 'v9', answer_id: 'a4', user_id: 'u_quantum_pepe', vote_type: 'sigma' },
  { id: 'v10', answer_id: 'a4', user_id: 'u_sigma_king', vote_type: 'sigma' },
  { id: 'v11', answer_id: 'a5', user_id: 'u_monk_mode', vote_type: 'smart' },
  { id: 'v12', answer_id: 'a5', user_id: 'u_pepe_wise', vote_type: 'funny' }
];
