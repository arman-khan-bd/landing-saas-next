import { initializeFirebase } from "@/firebase";

// Consolidate initialization to use the shared, correctly configured instances
// from the main firebase module. This prevents "Failed to fetch" errors caused
// by attempts to initialize with empty environment variables.
const isClient = typeof window !== "undefined";
const sdks = isClient ? initializeFirebase() : { auth: null, firestore: null, firebaseApp: null };

const auth = sdks.auth;
const db = sdks.firestore;
const app = sdks.firebaseApp;

export { auth, db, app };
