// src/firebaseService.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { firebaseConfig as productionConfig } from '../../firebaseConfig.js';

let firebaseApp = null;
let firebaseAuth = null;

async function getFirebaseConfig() {
    if (import.meta.env.DEV) {
        return {
            apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
            authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
            projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
            appId: import.meta.env.VITE_FIREBASE_APP_ID,
        };
    } else {
        if (!productionConfig || !productionConfig.apiKey) {
            if (import.meta.env.DEV) console.error("CRITICAL ERROR: Production Firebase config file (firebaseConfig.js) not found or invalid.");
            return null;
        }
        return productionConfig;
    }
}

async function initializeFirebaseApp() {
    if (firebaseApp && firebaseAuth) {
        return { auth: firebaseAuth };
    }

    const config = await getFirebaseConfig();

    if (!config || !config.apiKey) {
        if (import.meta.env.DEV) console.error("Firebase initialization skipped: Missing configuration.");
        return { auth: null };
    }

    try {
        firebaseApp = initializeApp(config);
        firebaseAuth = getAuth(firebaseApp);
        return { auth: firebaseAuth };
    } catch (err) {
        if (import.meta.env.DEV) console.error("Failed to initialize Firebase:", err);
        return { auth: null };
    }
}

export async function initializeFirebaseServices() {
    return await initializeFirebaseApp();
}