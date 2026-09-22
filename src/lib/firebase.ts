import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';

export const firebaseConfig = {
  apiKey: "AIzaSyBTMQVQYG1qxRtoDDQHRQRP2EwRBT8OUi0",
  authDomain: "sigma-pepe.firebaseapp.com",
  projectId: "sigma-pepe",
  storageBucket: "sigma-pepe.firebasestorage.app",
  messagingSenderId: "102218200278",
  appId: "1:102218200278:web:69901611bcef37c61bc577",
  measurementId: "G-GVP3Q3DM3C"
};

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firebase Analytics safely (guards for SSR / iframe restrictions)
let analyticsInstance: Analytics | null = null;

if (typeof window !== 'undefined') {
  isSupported()
    .then((supported) => {
      if (supported) {
        analyticsInstance = getAnalytics(app);
        console.log('Firebase Analytics initialized successfully');
      }
    })
    .catch((err) => {
      console.warn('Firebase Analytics not supported in this environment:', err);
    });
}

export function logTrackingEvent(eventName: string, params?: Record<string, any>) {
  try {
    if (analyticsInstance) {
      import('firebase/analytics').then(({ logEvent }) => {
        logEvent(analyticsInstance!, eventName, params);
      });
    }
  } catch (e) {
    console.debug('Tracking event log error:', e);
  }
}
