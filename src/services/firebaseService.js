// src/firebaseService.js

import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { firebaseConfig as productionConfig } from '../firebaseConfig.js';

let firebaseApp = null;
let firebaseStorage = null;
let firebaseAuth = null;

// Determine the configuration source based on the environment
async function getFirebaseConfig() {
    // VITE's way to check if running in a development server
    if (import.meta.env.DEV) { 
        console.log("Using VITE environment variables for Firebase initialization.");
        
        // Use your old VITE_ keys directly
        return {
            apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
            authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
            projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
            storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
            appId: import.meta.env.VITE_FIREBASE_APP_ID,
        };
    } else {
        
       // Production: Use the statically imported config
        if (!productionConfig || !productionConfig.apiKey) {
            console.error("CRITICAL ERROR: Production Firebase config file (firebaseConfig.js) not found or invalid. Did injectConfig.js fail?");
            return null;
        }
         return productionConfig;
    }
}


// The asynchronous function that handles initialization and returns the services
async function initializeFirebaseApp() {
    if (firebaseApp && firebaseStorage && firebaseAuth) {
        return { storage: firebaseStorage, auth: firebaseAuth };
    }
    
    const config = await getFirebaseConfig();

    if (!config || !config.apiKey) {
        console.error("Firebase initialization skipped: Missing configuration.");
        return { storage: null };
    }

    try {
        firebaseApp = initializeApp(config);
        firebaseStorage = getStorage(firebaseApp);
        firebaseAuth = getAuth(firebaseApp);
        
        return { storage: firebaseStorage, auth: firebaseAuth };
    } catch (err) {
        console.error("Failed to initialize Firebase:", err);
        return { storage: null };
    }
}

// Export function to initialize Firebase services
export async function initializeFirebaseServices() {
    return await initializeFirebaseApp();
}