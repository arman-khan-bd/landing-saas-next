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
  
  // Use a simpler settings object to avoid conflicts
  const firestoreSettings: any = {
    experimentalForceLongPolling: true, // Needed for many proxy/firewall environments
  };

  if (isClient) {
    try {
      // Use multi-tab persistence
      firestoreSettings.localCache = persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      });
    } catch (e) {
      console.warn("Firestore: Failed to initialize multi-tab cache manager:", e);
    }
  }

  try {
    // Attempt initialization with settings
    firestore = initializeFirestore(firebaseApp, firestoreSettings);
  } catch (e: any) {
    // If already initialized, we must use getFirestore() as settings cannot be changed
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

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
