import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  sendPasswordResetEmail,
  updateProfile as updateFirebaseProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, logTrackingEvent } from '../lib/firebase';
import { UserAccount, Profile } from '../types';
import { DEFAULT_AVATAR } from '../data/seedData';
import {
  registerUser as localRegisterUser,
  loginUser as localLoginUser,
  resetPassword as localResetPassword,
  MASTER_OWNER_EMAIL,
  MASTER_OWNER_PASSWORD
} from './storageService';

const FIREBASE_PROFILES_KEY = 'sigma_pepe_firebase_profiles';

function getStoredProfiles(): Record<string, Profile> {
  try {
    const raw = localStorage.getItem(FIREBASE_PROFILES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredProfile(uid: string, profile: Profile) {
  try {
    const all = getStoredProfiles();
    all[uid] = profile;
    localStorage.setItem(FIREBASE_PROFILES_KEY, JSON.stringify(all));
  } catch (e) {
    console.warn('Failed to save profile cache:', e);
  }
}

// Convert a Firebase User into our application's UserAccount
export function mapFirebaseUserToAccount(
  fbUser: FirebaseUser,
  customUsername?: string,
  customCountry?: string,
  customAvatar?: string
): UserAccount {
  const stored = getStoredProfiles()[fbUser.uid];

  const username =
    customUsername ||
    stored?.username ||
    fbUser.displayName ||
    (fbUser.email ? fbUser.email.split('@')[0] : `Sigma_${fbUser.uid.slice(0, 5)}`);

  const country = customCountry || stored?.country || 'International (Global)';
  const avatar = customAvatar || stored?.avatar_url || DEFAULT_AVATAR;

  const isCustomUser = Boolean(customUsername || stored?.username_locked);
  const isCustomCountry = Boolean(customCountry || stored?.country_locked);

  const profile: Profile = {
    id: fbUser.uid,
    username,
    country,
    avatar_url: avatar,
    created_at: stored?.created_at || new Date().toISOString(),
    username_locked: isCustomUser,
    country_locked: isCustomCountry
  };

  saveStoredProfile(fbUser.uid, profile);

  return {
    id: fbUser.uid,
    email: fbUser.email || `${username.toLowerCase()}@firebase.guest`,
    passwordHash: 'firebase_authenticated',
    profile
  };
}

// 1. Firebase Register
export async function firebaseRegisterUser(
  email: string,
  password: string,
  username: string,
  country: string,
  avatarUrl?: string
): Promise<UserAccount> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanUser = username.trim();

  if (!cleanEmail || !cleanUser || !password) {
    throw new Error('Please fill in all fields (Email, Username, Password).');
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    await updateFirebaseProfile(userCredential.user, {
      displayName: cleanUser
    });

    logTrackingEvent('sign_up', {
      method: 'firebase_email',
      username: cleanUser
    });

    const account = mapFirebaseUserToAccount(userCredential.user, cleanUser, country, avatarUrl);

    // Also mirror to local database so local queries find the user
    try {
      localRegisterUser(cleanEmail, password, cleanUser, country, avatarUrl);
    } catch {
      // Already exists locally or synced
    }

    return account;
  } catch (err: any) {
    // If Firebase project doesn't have Email/Password provider enabled yet, provide clear instruction
    if (err.code === 'auth/operation-not-allowed') {
      console.warn('Firebase Email/Password provider not enabled in console. Falling back to fast local registry.');
      const local = localRegisterUser(cleanEmail, password, cleanUser, country, avatarUrl);
      logTrackingEvent('sign_up', { method: 'local_fallback', username: cleanUser });
      return local;
    }
    if (err.code === 'auth/email-already-in-use') {
      throw new Error('This email is already registered in Firebase. Please login instead.');
    }
    if (err.code === 'auth/weak-password') {
      throw new Error('Firebase requires password to be at least 6 characters.');
    }
    throw new Error(err.message || 'Firebase Registration failed.');
  }
}

// 2. Firebase Login
export async function firebaseLoginUser(email: string, password: string): Promise<UserAccount> {
  const cleanEmail = email.trim().toLowerCase();

  // Direct Master Owner fast bypass
  if (cleanEmail === MASTER_OWNER_EMAIL.toLowerCase() && password === MASTER_OWNER_PASSWORD) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      return mapFirebaseUserToAccount(userCredential.user);
    } catch {
      return localLoginUser(cleanEmail, password);
    }
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);

    logTrackingEvent('login', {
      method: 'firebase_email'
    });

    return mapFirebaseUserToAccount(userCredential.user);
  } catch (err: any) {
    if (err.code === 'auth/operation-not-allowed' || err.code === 'auth/network-request-failed') {
      // Fallback to local login if console settings not toggled yet
      return localLoginUser(cleanEmail, password);
    }
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
      // Check if it exists locally
      try {
        return localLoginUser(cleanEmail, password);
      } catch {
        throw new Error('Invalid email or password.');
      }
    }
    throw new Error(err.message || 'Firebase Login failed.');
  }
}

// 3. 1-Second Instant Guest / Anonymous Login
export async function firebaseInstant1SecondLogin(): Promise<UserAccount> {
  const randomTag = Math.floor(1000 + Math.random() * 9000);
  const fastUsername = `SigmaPepe_${randomTag}`;

  try {
    const userCredential = await signInAnonymously(auth);
    await updateFirebaseProfile(userCredential.user, {
      displayName: fastUsername
    });

    logTrackingEvent('login', {
      method: 'firebase_anonymous',
      username: fastUsername
    });

    return mapFirebaseUserToAccount(userCredential.user, fastUsername, 'Global Sanctuary');
  } catch (err: any) {
    // If anonymous sign-in is disabled in Firebase console, generate 1-second rapid local guest
    console.warn('Anonymous auth not enabled in Firebase Console. Generating 1-second instant guest.');
    const local = localRegisterUser(
      `guest_${randomTag}@sigma.firebase`,
      'sigma123',
      fastUsername,
      'Global Citadel',
      DEFAULT_AVATAR
    );
    logTrackingEvent('login', { method: 'rapid_guest_fallback' });
    return local;
  }
}

// 4. Password Reset
export async function firebaseResetPassword(email: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  try {
    await sendPasswordResetEmail(auth, cleanEmail);
    logTrackingEvent('password_reset_sent', { email: cleanEmail });
  } catch (err: any) {
    // Also reset locally
    localResetPassword(cleanEmail, 'sigma_reset_' + Math.random().toString(36).slice(2, 8));
    throw new Error(err.message || 'Firebase reset email could not be sent.');
  }
}

// 5. Firebase Logout
export async function firebaseLogout(): Promise<void> {
  try {
    await signOut(auth);
    logTrackingEvent('logout');
  } catch (e) {
    console.warn('Firebase signout error:', e);
  }
}
