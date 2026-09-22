export type VoteType = 'sigma' | 'funny' | 'smart';

export interface Profile {
  id: string;
  username: string;
  country: string;
  avatar_url: string;
  created_at: string;
  username_locked?: boolean;
  country_locked?: boolean;
}

export interface UserAccount {
  id: string;
  email: string;
  passwordHash: string;
  profile: Profile;
}

export interface Challenge {
  id: string;
  question: string;
  created_at: string;
  topic?: string;
}

export interface Vote {
  id: string;
  answer_id: string;
  user_id: string;
  vote_type: VoteType;
}

export interface Answer {
  id: string;
  user_id: string;
  challenge_id: string;
  answer_text: string;
  created_at: string;
  profiles: Profile;
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  country: string;
  avatar_url: string;
  score: number;
  rank: number;
  sigmaVotes: number;
  funnyVotes: number;
  smartVotes: number;
}

export interface WinnerAnnouncement {
  id: string;
  name: string;
  username: string;
  avatar_url: string;
  demon_image_url?: string;
  score: number;
  sigmaVotes: number;
  funnyVotes: number;
  smartVotes: number;
  winning_answer: string;
  announced_at: string;
}
