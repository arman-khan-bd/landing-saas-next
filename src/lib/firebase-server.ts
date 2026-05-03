import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

function initializeFirebaseServer() {
  const apps = getApps();
  let firebaseApp: FirebaseApp;

  if (apps.length > 0) {
    firebaseApp = apps[0];
  } else {
    firebaseApp = initializeApp(firebaseConfig);
  }

  const db = getFirestore(firebaseApp);
  
  return { db, app: firebaseApp };
}

export const { db, app } = initializeFirebaseServer();
