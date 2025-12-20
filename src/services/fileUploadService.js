import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { initializeFirebaseServices } from './firebaseService';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB in bytes

/**
 * Upload a file to Firebase Storage
 * @param {File} file - The file to upload
 * @param {number} accountId - Account ID
 * @param {number} customerId - Customer ID
 * @param {Function} onProgress - Optional progress callback (progress: number) => void
 * @returns {Promise<{fileUrl: string, fileName: string, fileSize: number, mimeType: string}>}
 */
export async function uploadFile(file, accountId, customerId, onProgress = null) {
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds 2MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
  }

  // Validate file type (images and PDFs)
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`File type not allowed. Allowed types: JPEG, PNG, WebP, PDF`);
  }

  try {
    // Initialize Firebase Storage
    const { storage } = await initializeFirebaseServices();
    if (!storage) {
      throw new Error('Firebase Storage is not initialized');
    }

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedFileName}`;
    
    // Create storage path: {accountId}/{customerId}/filename
    const storagePath = `${accountId}/${customerId}/${fileName}`;
    const storageRef = ref(storage, storagePath);

    // Upload file
    const uploadTask = uploadBytesResumable(storageRef, file);

    // Return a promise that resolves when upload is complete
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Track upload progress
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) {
            onProgress(progress);
          }
        },
        (error) => {
          console.error('Upload error:', error);
          reject(new Error(`Upload failed: ${error.message}`));
        },
        async () => {
          try {
            // Calculate file size in KB (numeric)
            const fileSizeKB = parseFloat((file.size / 1024).toFixed(2));

            resolve({
              fileUrl: storagePath, // Store only the path in fileUrl field (not full URL)
              fileName: file.name, // Original file name
              fileSize: fileSizeKB, // Size in KB as number
              mimeType: file.type,
            });
          } catch (error) {
            reject(new Error(`Failed to process upload: ${error.message}`));
          }
        }
      );
    });
  } catch (error) {
    console.error('File upload error:', error);
    throw error;
  }
}

/**
 * Format file size to human-readable string
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size (e.g., "2.4 MB")
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Upload multiple files
 * @param {File[]} files - Array of files to upload
 * @param {number} accountId - Account ID
 * @param {number} customerId - Customer ID
 * @param {Function} onProgress - Optional progress callback (fileIndex: number, progress: number) => void
 * @returns {Promise<Array>} - Array of upload results
 */
export async function uploadMultipleFiles(files, accountId, customerId, onProgress = null) {
  const uploadPromises = files.map((file, index) => {
    return uploadFile(
      file,
      accountId,
      customerId,
      (progress) => {
        if (onProgress) {
          onProgress(index, progress);
        }
      }
    );
  });

  return Promise.all(uploadPromises);
}

/**
 * Delete a file from Firebase Storage
 * @param {string} fileUrl - File path stored in fileUrl field (format: "accountId/customerId/filename")
 * @returns {Promise<boolean>} - True if successful
 */
export async function deleteFile(fileUrl) {
  try {
    // Initialize Firebase Storage
    const { storage } = await initializeFirebaseServices();
    if (!storage) {
      throw new Error('Firebase Storage is not initialized');
    }

    // Create storage reference (fileUrl contains the path)
    const storageRef = ref(storage, fileUrl);
    
    // Delete the file
    await deleteObject(storageRef);
    
    return true;
  } catch (error) {
    console.error('File deletion error:', error);
    // If file doesn't exist, consider it successful (already deleted)
    if (error.code === 'storage/object-not-found') {
      return true;
    }
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * Delete multiple files from Firebase Storage
 * @param {string[]} fileUrls - Array of file paths (stored in fileUrl field)
 * @returns {Promise<Array>} - Array of results with success/failure status
 */
export async function deleteFiles(fileUrls) {
  const deletePromises = fileUrls.map(async (fileUrl) => {
    try {
      await deleteFile(fileUrl);
      return { path: fileUrl, success: true };
    } catch (error) {
      console.error(`Failed to delete file ${fileUrl}:`, error);
      return { path: fileUrl, success: false, error: error.message };
    }
  });

  return Promise.all(deletePromises);
}

