import { ref, getDownloadURL } from 'firebase/storage';
import { initializeFirebaseServices } from './firebaseService';

// Cache for Firebase URLs with expiration
const urlCache = new Map();

// Cache expiration time: 7 days (604800000 ms)
// Files are only added or deleted, not modified, so URLs remain valid
const CACHE_EXPIRATION = 7 * 24 * 60 * 60 * 1000;

/**
 * Get Firebase download URL from file path with caching
 * @param {string} fileUrl - File path stored in fileUrl field (format: "accountId/customerId/filename")
 * @returns {Promise<string>} - Download URL
 */
export async function getFileUrl(fileUrl) {
  // Check cache first
  const cached = urlCache.get(fileUrl);
  if (cached && Date.now() - cached.timestamp < CACHE_EXPIRATION) {
    return cached.url;
  }

  try {
    // Initialize Firebase Storage
    const { storage } = await initializeFirebaseServices();
    if (!storage) {
      throw new Error('Firebase Storage is not initialized');
    }

    // Get download URL from Firebase (fileUrl contains the path)
    const storageRef = ref(storage, fileUrl);
    const downloadURL = await getDownloadURL(storageRef);

    // Cache the URL
    urlCache.set(fileUrl, {
      url: downloadURL,
      timestamp: Date.now(),
    });

    return downloadURL;
  } catch (error) {
    console.error('Error getting file URL:', error);
    throw new Error(`Failed to get file URL: ${error.message}`);
  }
}

/**
 * Get multiple file URLs at once
 * @param {string[]} fileUrls - Array of file paths (stored in fileUrl field)
 * @returns {Promise<string[]>} - Array of download URLs
 */
export async function getFileUrls(fileUrls) {
  const urlPromises = fileUrls.map(fileUrl => getFileUrl(fileUrl));
  return Promise.all(urlPromises);
}

/**
 * Clear the URL cache (useful for testing or forced refresh)
 */
export function clearUrlCache() {
  urlCache.clear();
}

/**
 * Clear expired entries from cache
 */
export function clearExpiredCache() {
  const now = Date.now();
  for (const [path, cached] of urlCache.entries()) {
    if (now - cached.timestamp >= CACHE_EXPIRATION) {
      urlCache.delete(path);
    }
  }
}

