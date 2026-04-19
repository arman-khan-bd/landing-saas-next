import { initializeFirebase } from "@/firebase";

// Consolidate initialization to use the shared, correctly configured instances
// from the main firebase module. This prevents "Failed to fetch" errors caused
// by attempts to initialize with empty environment variables.
const { auth, firestore: db, firebaseApp: app } = initializeFirebase();

export { auth, db, app };
