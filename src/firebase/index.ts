'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, getFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

// Singleton pattern for Firebase initialization
let cachedSdks: any = null;

export function initializeFirebase() {
  const isClient = typeof window !== "undefined";

  // Check global scope first to survive HMR in development
  if (isClient && (window as any)._firebaseCachedSdks) {
    return (window as any)._firebaseCachedSdks;
  }
  
  if (cachedSdks) return cachedSdks;

  const apps = getApps();
  let firebaseApp: FirebaseApp;

  if (apps.length > 0) {
    firebaseApp = apps[0];
  } else {
    try {
      firebaseApp = initializeApp(firebaseConfig);
    } catch (e) {
      try {
        firebaseApp = initializeApp();
      } catch (finalError) {
        console.error("Firebase initialization failed completely:", finalError);
        throw finalError;
      }
    }
  }

  let firestore;
  
  // Use simple settings
  const firestoreSettings: any = {
    experimentalForceLongPolling: true,
  };

  try {
    firestore = initializeFirestore(firebaseApp, firestoreSettings);
  } catch (e: any) {
    firestore = getFirestore(firebaseApp);
  }

  cachedSdks = {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore
  };

  if (isClient) {
    (window as any)._firebaseCachedSdks = cachedSdks;
  }
  
  return cachedSdks;
}

// Export initialization function only
export { initializeFirebase };

