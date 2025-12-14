import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

let firebaseApp = null;
let firebaseStorage = null;

// Initialize Firebase app with environment variables
async function initializeFirebaseApp() {
  if (firebaseApp && firebaseStorage) {
    return { storage: firebaseStorage };
  }

  try {
    // Get Firebase config from environment variables
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
    const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
    const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
    const appId = import.meta.env.VITE_FIREBASE_APP_ID;

    // Validate required fields
    if (!apiKey || !authDomain || !projectId || !storageBucket) {
      throw new Error(
        "Missing required Firebase environment variables. " +
        "Please set VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, " +
        "VITE_FIREBASE_PROJECT_ID, and VITE_FIREBASE_STORAGE_BUCKET."
      );
    }

    // Initialize Firebase app with storage
    const firebaseConfig = {
      apiKey: apiKey,
      authDomain: authDomain,
      projectId: projectId,
      storageBucket: storageBucket,
      ...(appId && { appId: appId }), // Include appId if available
    };

    firebaseApp = initializeApp(firebaseConfig);
    firebaseStorage = getStorage(firebaseApp);
    
    return { storage: firebaseStorage };
  } catch (err) {
    console.error("Failed to initialize Firebase:", err);
    return { storage: null };
  }
}

// Export function to initialize Firebase services
export async function initializeFirebaseServices() {
  return await initializeFirebaseApp();
}