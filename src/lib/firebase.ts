import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, signInAnonymously } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyAlQNNGc8ByuqCnh-HfEoyxeFzsA9OLSpQ',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'cre-portal-a616f.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'cre-portal-a616f',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'cre-portal-a616f.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '968569214130',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:968569214130:web:f156db66ee29c20de765ab',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-9DRZB132LY',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId
);

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let analytics: Analytics | undefined;

if (!getApps().length) {
  if (isFirebaseConfigured) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    if (typeof window !== 'undefined') {
      isSupported().then((supported) => {
        if (supported && app) {
          analytics = getAnalytics(app);
        }
      }).catch(() => {
        // Safe ignore for environments without analytics support
      });

      // Silently sign in anonymously to satisfy any request.auth security rules
      if (auth) {
        signInAnonymously(auth).catch((err) => {
          // Normal if anonymous provider is not toggled on in console; open firestore.rules will handle it
          console.debug('Multi-device auth token init:', err?.code || err?.message);
        });
      }
    }
  }
} else {
  app = getApp();
  auth = getAuth(app);
  db = getFirestore(app);
}

export { app, auth, db, analytics };

/**
 * Creates internal email alias from normalized phone number.
 * Never exposed to users on the UI.
 */
export function getInternalEmail(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  return `admin_${clean}@creportal.org`;
}
