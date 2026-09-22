import { Profile, UserAccount, Challenge, Answer, Vote, VoteType, LeaderboardEntry, WinnerAnnouncement } from '../types';
import { INITIAL_CHALLENGES, SEED_PROFILES, SEED_ANSWERS, SEED_VOTES, DEFAULT_AVATAR } from '../data/seedData';

export const MASTER_OWNER_EMAIL = 'yachinhussain6@gmail.com';
export const MASTER_OWNER_PASSWORD = '729@ownerYa';

const STORAGE_KEYS = {
  USERS: 'sigma_pepe_users_v2',
  CURRENT_USER_ID: 'sigma_pepe_current_user_v2',
  CHALLENGES: 'sigma_pepe_challenges_v2',
  ANSWERS: 'sigma_pepe_answers_v2',
  VOTES: 'sigma_pepe_votes_v2',
  OWNER_EMAILS: 'sigma_pepe_owner_emails_v2',
  DAILY_WINNER: 'sigma_pepe_daily_winner_v2',
  OWNER_FORCE_MIDNIGHT: 'sigma_pepe_owner_force_midnight_v2'
};

// Pure client-side hash helper for simple local credential storage (no external transmission)
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return 'h_' + Math.abs(hash).toString(36);
}

function getItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('LocalStorage write failed:', e);
  }
}

// Initialize seed data if empty
export function initLocalDatabase(): void {
  const challenges = getItem<Challenge[]>(STORAGE_KEYS.CHALLENGES, []);
  if (!challenges.length) {
    setItem(STORAGE_KEYS.CHALLENGES, INITIAL_CHALLENGES);
  }

  const answers = getItem<Answer[]>(STORAGE_KEYS.ANSWERS, []);
  if (!answers.length) {
    setItem(STORAGE_KEYS.ANSWERS, SEED_ANSWERS);
  }

  const votes = getItem<Vote[]>(STORAGE_KEYS.VOTES, []);
  if (!votes.length) {
    setItem(STORAGE_KEYS.VOTES, SEED_VOTES);
  }

  const users = getItem<UserAccount[]>(STORAGE_KEYS.USERS, []);
  if (!users.length) {
    // Seed test accounts for demonstration if desired
    const seedUsers: UserAccount[] = SEED_PROFILES.map((p) => ({
      id: p.id,
      email: `${p.username.toLowerCase()}@sigma.local`,
      passwordHash: simpleHash('sigma123'),
      profile: p
    }));
    users.push(...seedUsers);
  }

  // Ensure Master Owner exists in database with requested email & password
  const masterOwnerExists = users.some(
    (u) => u.email.toLowerCase() === MASTER_OWNER_EMAIL.toLowerCase()
  );
  if (!masterOwnerExists) {
    users.unshift({
      id: 'owner_master_yachin',
      email: MASTER_OWNER_EMAIL,
      passwordHash: simpleHash(MASTER_OWNER_PASSWORD),
      profile: {
        id: 'owner_master_yachin',
        username: 'YachinOwner',
        country: 'International (Global)',
        avatar_url: 'https://i.ibb.co/prnXzb0F/Fs-Z7-EXg-AAy-EW0.jpg',
        created_at: new Date().toISOString(),
        username_locked: true,
        country_locked: true
      }
    });
  }
  setItem(STORAGE_KEYS.USERS, users);

  // Ensure Master Owner email is registered in owner list
  const ownerEmails = getItem<string[]>(STORAGE_KEYS.OWNER_EMAILS, []);
  if (!ownerEmails.includes(MASTER_OWNER_EMAIL.toLowerCase())) {
    ownerEmails.unshift(MASTER_OWNER_EMAIL.toLowerCase());
    setItem(STORAGE_KEYS.OWNER_EMAILS, ownerEmails);
  }
}

export function getCurrentUser(): UserAccount | null {
  const currentId = getItem<string | null>(STORAGE_KEYS.CURRENT_USER_ID, null);
  if (!currentId) return null;
  const users = getItem<UserAccount[]>(STORAGE_KEYS.USERS, []);
  return users.find((u) => u.id === currentId) || null;
}

export function setCurrentUser(user: UserAccount): void {
  const users = getItem<UserAccount[]>(STORAGE_KEYS.USERS, []);
  const existingIdx = users.findIndex((u) => u.id === user.id);
  if (existingIdx !== -1) {
    users[existingIdx] = user;
  } else {
    users.push(user);
  }
  setItem(STORAGE_KEYS.USERS, users);
  setItem(STORAGE_KEYS.CURRENT_USER_ID, user.id);
}

export function registerUser(
  email: string,
  password: string,
  username: string,
  country: string,
  avatar_url?: string
): UserAccount {
  const cleanEmail = email.trim().toLowerCase();
  const cleanUser = username.trim();

  if (!cleanEmail || !cleanUser || !password) {
    throw new Error('Please fill in all required fields.');
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  const users = getItem<UserAccount[]>(STORAGE_KEYS.USERS, []);

  if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
    throw new Error('An account with this email already exists.');
  }

  if (users.some((u) => u.profile.username.toLowerCase() === cleanUser.toLowerCase())) {
    throw new Error('This username is already taken. Pick a legendary one.');
  }

  const newId = 'u_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const profile: Profile = {
    id: newId,
    username: cleanUser,
    country: country.trim() || 'International (Global)',
    avatar_url: avatar_url || DEFAULT_AVATAR,
    created_at: new Date().toISOString(),
    username_locked: true,
    country_locked: true
  };

  const newAccount: UserAccount = {
    id: newId,
    email: cleanEmail,
    passwordHash: simpleHash(password),
    profile
  };

  users.push(newAccount);
  setItem(STORAGE_KEYS.USERS, users);
  setItem(STORAGE_KEYS.CURRENT_USER_ID, newId);

  return newAccount;
}

export function loginUser(email: string, password: string): UserAccount {
  const cleanEmail = email.trim().toLowerCase();
  const users = getItem<UserAccount[]>(STORAGE_KEYS.USERS, []);

  // Guarantee Master Owner direct login
  if (cleanEmail === MASTER_OWNER_EMAIL.toLowerCase() && password === MASTER_OWNER_PASSWORD) {
    let owner = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!owner) {
      owner = {
        id: 'owner_master_yachin',
        email: MASTER_OWNER_EMAIL,
        passwordHash: simpleHash(MASTER_OWNER_PASSWORD),
        profile: {
          id: 'owner_master_yachin',
          username: 'YachinOwner',
          country: 'International (Global)',
          avatar_url: 'https://i.ibb.co/prnXzb0F/Fs-Z7-EXg-AAy-EW0.jpg',
          created_at: new Date().toISOString(),
          username_locked: true,
          country_locked: true
        }
      };
      users.unshift(owner);
      setItem(STORAGE_KEYS.USERS, users);
    }
    setItem(STORAGE_KEYS.CURRENT_USER_ID, owner.id);
    return owner;
  }

  const user = users.find((u) => u.email.toLowerCase() === cleanEmail);

  if (!user) {
    throw new Error('Account not found. Please register first.');
  }

  if (user.passwordHash !== simpleHash(password)) {
    throw new Error('Incorrect password. Please try again.');
  }

  setItem(STORAGE_KEYS.CURRENT_USER_ID, user.id);
  return user;
}

export function resetPassword(email: string, newPassword: string): void {
  const cleanEmail = email.trim().toLowerCase();
  if (newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters.');
  }
  const users = getItem<UserAccount[]>(STORAGE_KEYS.USERS, []);
  const idx = users.findIndex((u) => u.email.toLowerCase() === cleanEmail);
  if (idx === -1) {
    throw new Error('Email not found in local registry.');
  }

  users[idx].passwordHash = simpleHash(newPassword);
  setItem(STORAGE_KEYS.USERS, users);
}

export function logoutUser(): void {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
}

export function updateProfile(userId: string, updates: Partial<Profile>): Profile {
  const users = getItem<UserAccount[]>(STORAGE_KEYS.USERS, []);
  const userIdx = users.findIndex((u) => u.id === userId);
  if (userIdx === -1) throw new Error('User not found.');

  const currentProfile = users[userIdx].profile;

  // Rule 1: Username is chosen once and cannot be modified later
  if (updates.username && updates.username.trim() !== currentProfile.username) {
    const isAutoGuest = currentProfile.username.startsWith('SigmaGuest_') || currentProfile.username.startsWith('SigmaPepe_');
    if (currentProfile.username_locked || !isAutoGuest) {
      throw new Error('Rule: Your username is permanent and cannot be modified once set.');
    }

    const cleanNewName = updates.username.trim();
    if (users.some((u) => u.id !== userId && u.profile.username.toLowerCase() === cleanNewName.toLowerCase())) {
      throw new Error('This username is already taken. Please choose another username.');
    }

    updates.username = cleanNewName;
    updates.username_locked = true;
  } else if (updates.username) {
    updates.username_locked = true;
  }

  // Rule 2: Country is selected once during account creation and cannot be modified later
  if (updates.country && updates.country.trim() !== currentProfile.country) {
    if (currentProfile.country_locked) {
      throw new Error('Rule: Your selected country is permanent and cannot be edited.');
    }
    updates.country = updates.country.trim();
    updates.country_locked = true;
  }

  const updatedProfile: Profile = {
    ...currentProfile,
    ...updates
  };

  users[userIdx].profile = updatedProfile;
  setItem(STORAGE_KEYS.USERS, users);

  // Also sync profile in user's past answers
  const answers = getItem<Answer[]>(STORAGE_KEYS.ANSWERS, []);
  let changed = false;
  const updatedAnswers = answers.map((a) => {
    if (a.user_id === userId) {
      changed = true;
      return { ...a, profiles: updatedProfile };
    }
    return a;
  });
  if (changed) {
    setItem(STORAGE_KEYS.ANSWERS, updatedAnswers);
  }

  return updatedProfile;
}

export function getChallenges(): Challenge[] {
  return getItem<Challenge[]>(STORAGE_KEYS.CHALLENGES, INITIAL_CHALLENGES);
}

export function getActiveChallenge(): Challenge {
  const challenges = getChallenges();
  return challenges[0] || INITIAL_CHALLENGES[0];
}

export function getAnswers(challengeId?: string): Answer[] {
  const answers = getItem<Answer[]>(STORAGE_KEYS.ANSWERS, SEED_ANSWERS);
  if (challengeId) {
    return answers.filter((a) => a.challenge_id === challengeId);
  }
  return answers;
}

export function hasAnsweredChallenge(userId: string, challengeId: string): boolean {
  const answers = getItem<Answer[]>(STORAGE_KEYS.ANSWERS, []);
  return answers.some((a) => a.user_id === userId && a.challenge_id === challengeId);
}

export function postAnswer(userId: string, challengeId: string, answerText: string): Answer {
  const cleanText = answerText.trim();
  if (!cleanText) throw new Error('Answer cannot be empty.');

  if (hasAnsweredChallenge(userId, challengeId)) {
    throw new Error('You have already submitted an answer to this challenge.');
  }

  const users = getItem<UserAccount[]>(STORAGE_KEYS.USERS, []);
  const user = users.find((u) => u.id === userId);
  if (!user) throw new Error('User session invalid.');

  const answers = getItem<Answer[]>(STORAGE_KEYS.ANSWERS, []);
  const newAnswer: Answer = {
    id: 'a_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    user_id: userId,
    challenge_id: challengeId,
    answer_text: cleanText,
    created_at: new Date().toISOString(),
    profiles: user.profile
  };

  answers.push(newAnswer);
  setItem(STORAGE_KEYS.ANSWERS, answers);
  return newAnswer;
}

export function getVotes(): Vote[] {
  return getItem<Vote[]>(STORAGE_KEYS.VOTES, SEED_VOTES);
}

export function voteAnswer(answerId: string, userId: string, voteType: VoteType): Vote[] {
  const answers = getItem<Answer[]>(STORAGE_KEYS.ANSWERS, []);
  const targetAnswer = answers.find((a) => a.id === answerId);
  if (!targetAnswer) throw new Error('Answer not found.');

  // नियम 1: खुद के उत्तर पर कभी वोट नहीं कर सकता (Cannot vote on own answer)
  if (targetAnswer.user_id === userId) {
    throw new Error('नियम: आप अपने खुद के उत्तर पर वोट नहीं कर सकते! (Cannot vote on your own answer)');
  }

  const votes = getItem<Vote[]>(STORAGE_KEYS.VOTES, []);
  
  // नियम 2: एक सवाल पर एक आदमी केवल एक ही व्यक्ति (एक ही उत्तर) को वोट दे सकता है
  // Check all answers belonging to the same question/challenge
  const challengeAnswerIds = new Set(
    answers.filter((a) => a.challenge_id === targetAnswer.challenge_id).map((a) => a.id)
  );

  // Find if user already voted on ANY answer in this challenge
  const existingChallengeVoteIdx = votes.findIndex(
    (v) => v.user_id === userId && challengeAnswerIds.has(v.answer_id)
  );

  if (existingChallengeVoteIdx !== -1) {
    const prevVote = votes[existingChallengeVoteIdx];
    if (prevVote.answer_id === answerId) {
      if (prevVote.vote_type === voteType) {
        // Toggle off if same answer and same reaction
        votes.splice(existingChallengeVoteIdx, 1);
      } else {
        // Change vote reaction type on this answer
        votes[existingChallengeVoteIdx].vote_type = voteType;
      }
    } else {
      // Re-assign vote from previous answer to this new answer (1 vote per challenge rule)
      votes[existingChallengeVoteIdx].answer_id = answerId;
      votes[existingChallengeVoteIdx].vote_type = voteType;
    }
  } else {
    // Add new vote for this challenge
    votes.push({
      id: 'v_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      answer_id: answerId,
      user_id: userId,
      vote_type: voteType
    });
  }

  setItem(STORAGE_KEYS.VOTES, votes);
  return votes;
}

export function calculateAnswerScore(answerId: string, votes: Vote[]): number {
  return votes
    .filter((v) => v.answer_id === answerId)
    .reduce((total, v) => {
      if (v.vote_type === 'sigma') return total + 3;
      if (v.vote_type === 'smart') return total + 2;
      return total + 1; // 'funny'
    }, 0);
}

export function calculateAnswerVoteCounts(answerId: string, votes: Vote[]) {
  const ansVotes = votes.filter((v) => v.answer_id === answerId);
  return {
    sigma: ansVotes.filter((v) => v.vote_type === 'sigma').length,
    funny: ansVotes.filter((v) => v.vote_type === 'funny').length,
    smart: ansVotes.filter((v) => v.vote_type === 'smart').length,
    totalScore: ansVotes.reduce((sum, v) => {
      if (v.vote_type === 'sigma') return sum + 3;
      if (v.vote_type === 'smart') return sum + 2;
      return sum + 1;
    }, 0)
  };
}

export function getLeaderboard(): LeaderboardEntry[] {
  const users = getItem<UserAccount[]>(STORAGE_KEYS.USERS, []);
  const answers = getItem<Answer[]>(STORAGE_KEYS.ANSWERS, []);
  const votes = getItem<Vote[]>(STORAGE_KEYS.VOTES, []);

  // Map answerId to userId
  const answerOwner: Record<string, string> = {};
  answers.forEach((a) => {
    answerOwner[a.id] = a.user_id;
  });

  const scores: Record<string, { total: number; sigma: number; funny: number; smart: number }> = {};
  users.forEach((u) => {
    scores[u.id] = { total: 0, sigma: 0, funny: 0, smart: 0 };
  });

  votes.forEach((v) => {
    const ownerId = answerOwner[v.answer_id];
    if (ownerId && scores[ownerId]) {
      if (v.vote_type === 'sigma') {
        scores[ownerId].total += 3;
        scores[ownerId].sigma += 1;
      } else if (v.vote_type === 'smart') {
        scores[ownerId].total += 2;
        scores[ownerId].smart += 1;
      } else {
        scores[ownerId].total += 1;
        scores[ownerId].funny += 1;
      }
    }
  });

  const entries: LeaderboardEntry[] = users.map((u) => {
    const sc = scores[u.id] || { total: 0, sigma: 0, funny: 0, smart: 0 };
    return {
      id: u.id,
      username: u.profile.username,
      country: u.profile.country,
      avatar_url: u.profile.avatar_url || DEFAULT_AVATAR,
      score: sc.total,
      rank: 0,
      sigmaVotes: sc.sigma,
      funnyVotes: sc.funny,
      smartVotes: sc.smart
    };
  });

  // Sort descending by score, then username
  entries.sort((a, b) => b.score - a.score || a.username.localeCompare(b.username));

  // Assign ranks
  return entries.map((e, idx) => ({ ...e, rank: idx + 1 }));
}

export function getUserTotalScore(userId: string): number {
  const answers = getItem<Answer[]>(STORAGE_KEYS.ANSWERS, []).filter((a) => a.user_id === userId);
  const votes = getItem<Vote[]>(STORAGE_KEYS.VOTES, []);
  return answers.reduce((acc, a) => acc + calculateAnswerScore(a.id, votes), 0);
}

// Client-side photo compressor (0% external API / 0% tracking)
export function compressImageClient(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No photo selected.'));
    if (file.size > 5 * 1024 * 1024) return reject(new Error('Photo must be 5 MB or smaller.'));

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image file.'));
      img.onload = () => {
        const max = 320;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));

        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context unavailable.'));

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        try {
          const webpData = canvas.toDataURL('image/webp', 0.82);
          resolve(webpData);
        } catch {
          // Fallback to jpeg if webp unsupported
          const jpegData = canvas.toDataURL('image/jpeg', 0.82);
          resolve(jpegData);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// Account deletion is permanently disabled across the platform for all users and owners
export function isAccountDeletionAllowed(): boolean {
  return false;
}

export function resetAppToDefaults(): void {
  // Account deletion is permanently forbidden for all users and owners
  console.warn('Account deletion is permanently forbidden for all members and owners.');
}

// OWNER MANAGEMENT & PRIVILEGES
export function getOwnerEmails(): string[] {
  const list = getItem<string[]>(STORAGE_KEYS.OWNER_EMAILS, [MASTER_OWNER_EMAIL.toLowerCase()]);
  if (!list.map((e) => e.toLowerCase()).includes(MASTER_OWNER_EMAIL.toLowerCase())) {
    list.unshift(MASTER_OWNER_EMAIL.toLowerCase());
  }
  return list;
}

export function addOwnerEmail(email: string): void {
  const clean = email.trim().toLowerCase();
  if (!clean || !clean.includes('@')) throw new Error('Please enter a valid email address.');
  const list = getOwnerEmails();
  if (!list.includes(clean)) {
    list.push(clean);
    setItem(STORAGE_KEYS.OWNER_EMAILS, list);
  }
}

export function removeOwnerEmail(email: string): void {
  const clean = email.trim().toLowerCase();
  if (clean === MASTER_OWNER_EMAIL.toLowerCase()) {
    throw new Error('Master owner account (yachinhussain6@gmail.com) cannot be removed.');
  }
  const list = getOwnerEmails().filter((e) => e !== clean);
  setItem(STORAGE_KEYS.OWNER_EMAILS, list);
}

export function isOwnerUser(user: UserAccount | null): boolean {
  if (!user || !user.email) return false;
  const owners = getOwnerEmails();
  return owners.includes(user.email.trim().toLowerCase());
}

export function getAllUsers(): UserAccount[] {
  return getItem<UserAccount[]>(STORAGE_KEYS.USERS, []);
}

export function setDailyChallenge(question: string, topic?: string): Challenge {
  const cleanQ = question.trim();
  if (!cleanQ) throw new Error('Challenge question cannot be empty.');

  const newChallenge: Challenge = {
    id: 'ch_' + Date.now().toString(36),
    question: cleanQ,
    topic: topic?.trim() || 'Daily Sigma Arena Challenge',
    created_at: new Date().toISOString()
  };

  const challenges = getItem<Challenge[]>(STORAGE_KEYS.CHALLENGES, INITIAL_CHALLENGES);
  challenges.unshift(newChallenge);
  setItem(STORAGE_KEYS.CHALLENGES, challenges);
  return newChallenge;
}

export function boostAnswerVotes(answerId: string, voteType: VoteType, count: number): void {
  const votes = getItem<Vote[]>(STORAGE_KEYS.VOTES, []);
  const answers = getItem<Answer[]>(STORAGE_KEYS.ANSWERS, []);
  const answer = answers.find((a) => a.id === answerId);
  if (!answer) throw new Error('Answer not found to boost.');

  const safeCount = Math.max(1, Math.min(count, 5000));
  for (let i = 0; i < safeCount; i++) {
    votes.push({
      id: 'boost_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7),
      answer_id: answerId,
      user_id: 'boost_agent_' + Math.random().toString(36).slice(2, 7),
      vote_type: voteType
    });
  }

  setItem(STORAGE_KEYS.VOTES, votes);
}

export function getDailyWinner(): WinnerAnnouncement {
  const stored = getItem<WinnerAnnouncement | null>(STORAGE_KEYS.DAILY_WINNER, null);
  if (stored) return stored;

  // Default seed winner matching the user's provided midnight code
  return {
    id: 'winner_default',
    name: '🐸 Shadow',
    username: 'shadow_sigma',
    avatar_url: 'https://i.ibb.co/prnXzb0F/Fs-Z7-EXg-AAy-EW0.jpg',
    demon_image_url: 'https://i.ibb.co/prnXzb0F/Fs-Z7-EXg-AAy-EW0.jpg',
    score: 9842,
    sigmaVotes: 1284,
    funnyVotes: 642,
    smartVotes: 913,
    winning_answer: '“I don\'t chase opportunities… opportunities chase me.”',
    announced_at: new Date().toISOString()
  };
}

export function setDailyWinner(winner: WinnerAnnouncement): void {
  setItem(STORAGE_KEYS.DAILY_WINNER, winner);
}

export function isOwnerForceMidnight(): boolean {
  return getItem<boolean>(STORAGE_KEYS.OWNER_FORCE_MIDNIGHT, false);
}

export function setOwnerForceMidnight(enabled: boolean): void {
  setItem(STORAGE_KEYS.OWNER_FORCE_MIDNIGHT, enabled);
}

export function getFullAppState() {
  return {
    users: getAllUsers(),
    challenges: getChallenges(),
    answers: getAnswers(),
    votes: getVotes(),
    ownerEmails: getOwnerEmails(),
    dailyWinner: getDailyWinner(),
    currentUser: getCurrentUser(),
    timestamp: new Date().toISOString()
  };
}



export interface MidnightCountdown {
  hours: string;
  minutes: string;
  seconds: string;
  totalSeconds: number;
  isMidnightNow: boolean;
}

export function calculateMidnightCountdown(): MidnightCountdown {
  const now = new Date();
  const currentHour = now.getHours();

  // 12:00 AM window (00:00:00 to 00:59:59)
  const isMidnightNow = currentHour === 0;

  // Next 12:00 AM (midnight)
  const nextMidnight = new Date(now);
  nextMidnight.setHours(24, 0, 0, 0);

  const diffSec = Math.max(0, Math.floor((nextMidnight.getTime() - now.getTime()) / 1000));
  const h = Math.floor(diffSec / 3600);
  const m = Math.floor((diffSec % 3600) / 60);
  const s = diffSec % 60;

  return {
    hours: String(h).padStart(2, '0'),
    minutes: String(m).padStart(2, '0'),
    seconds: String(s).padStart(2, '0'),
    totalSeconds: diffSec,
    isMidnightNow
  };
}

