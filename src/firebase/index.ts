'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

// Singleton pattern for Firebase initialization
let cachedSdks: any = null;

export function initializeFirebase() {
  if (cachedSdks) return cachedSdks;

  const apps = getApps();
  let firebaseApp: FirebaseApp;

  if (apps.length > 0) {
    firebaseApp = apps[0];
  } else {
    try {
      // In Vercel/Next.js environments, we must provide the config object
      // since we aren't using Firebase App Hosting's automatic injection.
      firebaseApp = initializeApp(firebaseConfig);
    } catch (e) {
      // Fallback: try automatic initialization if manual fails (e.g. if config is empty)
      try {
        firebaseApp = initializeApp();
      } catch (finalError) {
        console.error("Firebase initialization failed completely:", finalError);
        throw finalError;
      }
    }
  }

  // Initialize Firestore with settings optimized for reliability and offline use.
  // experimentalForceLongPolling is enabled to bypass potential WebSocket connectivity issues 
  // commonly found in Cloud Workstation and proxied environments.
  const firestore = initializeFirestore(firebaseApp, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    }),
    experimentalForceLongPolling: true,
  });

  cachedSdks = {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore
  };
  
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
