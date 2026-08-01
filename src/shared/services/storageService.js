const R2_PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];

// URL cache — R2 public URLs never expire, but we cache to avoid redundant string ops
const urlCache = new Map();
const CACHE_EXPIRATION = 7 * 24 * 60 * 60 * 1000; // 7 days

// ─── Helpers ────────────────────────────────────────────────────────────────

function extensionFromMimeType(mimeType) {
  const map = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'application/pdf': 'pdf',
  };
  return map[mimeType] || null;
}

function normalizeUploadedFileName(originalName, mimeType) {
  const trimmed = String(originalName || '').trim();
  if (!trimmed) return 'file';
  const extFromMime = extensionFromMimeType(mimeType);
  const extFromName = trimmed.includes('.') ? trimmed.split('.').pop()?.toLowerCase() : null;
  const finalExt = extFromMime || extFromName;
  const baseWithoutExt = trimmed.replace(/(\.[A-Za-z0-9]+)+$/, '');
  const safeBase = (baseWithoutExt || 'file').replace(/[^a-zA-Z0-9.-]/g, '_');
  return finalExt ? `${safeBase}.${finalExt}` : safeBase;
}

/**
 * Request a short-lived presigned R2 upload URL from the backend. Sends the
 * file size so the backend can enforce the account storage quota (403 if over).
 *
 * @param {string} path R2 object key ({accountId}/{customerId}/filename).
 * @param {string} contentType MIME type of the file.
 * @param {number} contentLength File size in bytes.
 * @returns {Promise<{ url: string, path: string }>}
 * @throws {Error} With the backend message when the request is rejected.
 */
async function fetchPresignedUrl(path, contentType, contentLength) {
  const token = localStorage.getItem('firebase_token');
  const response = await fetch(`${API_BASE_URL}/storage/presigned-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    // content_length lets the backend enforce the account storage quota
    // before the upload starts (returns 403 when it would exceed the cap).
    body: JSON.stringify({ path, content_type: contentType, content_length: contentLength }),
  });

  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(json.message || 'Failed to get upload URL');
  }

  return json.data;
}

async function putToR2(presignedUrl, file, onProgress = null) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', presignedUrl);
    xhr.setRequestHeader('Content-Type', file.type);

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress((e.loaded / e.total) * 100);
      };
    }

    xhr.onload = () => {
      if (xhr.status === 200) resolve();
      else reject(new Error(`Upload failed with status ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error('Upload failed'));
    xhr.send(file);
  });
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Get public URL for a stored file path.
 * Handles both plain paths (R2) and legacy full URLs (old Firebase URLs).
 */
export function getFileUrl(filePath) {
  if (!filePath) return null;
  // Already a full URL (legacy Firebase or R2 receipt URL) — return as-is
  if (filePath.startsWith('http')) return filePath;

  const cached = urlCache.get(filePath);
  if (cached && Date.now() - cached.timestamp < CACHE_EXPIRATION) {
    return cached.url;
  }

  const url = `${R2_PUBLIC_URL}/${filePath}`;
  urlCache.set(filePath, { url, timestamp: Date.now() });
  return url;
}

export function getFileUrls(filePaths) {
  return filePaths.map((p) => getFileUrl(p));
}

export function clearUrlCache() {
  urlCache.clear();
}

export function clearExpiredCache() {
  const now = Date.now();
  for (const [path, cached] of urlCache.entries()) {
    if (now - cached.timestamp >= CACHE_EXPIRATION) urlCache.delete(path);
  }
}

/**
 * Upload a single file to R2 via presigned URL.
 */
export async function uploadFile(file, accountId, customerId, onProgress = null) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds 5MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('File type not allowed. Allowed types: JPEG, PNG, WebP, PDF');
  }

  const timestamp = Date.now();
  const sanitizedFileName = normalizeUploadedFileName(file.name, file.type);
  const storagePath = `${accountId}/${customerId}/${timestamp}_${sanitizedFileName}`;

  const { url: presignedUrl } = await fetchPresignedUrl(storagePath, file.type, file.size);
  await putToR2(presignedUrl, file, onProgress);

  return {
    fileUrl: storagePath,
    fileName: file.name,
    fileSize: parseFloat((file.size / 1024).toFixed(2)),
    mimeType: file.type,
  };
}

/**
 * Upload multiple files to R2.
 */
export async function uploadMultipleFiles(files, accountId, customerId, onProgress = null) {
  return Promise.all(
    files.map((file, index) =>
      uploadFile(file, accountId, customerId, (progress) => {
        if (onProgress) onProgress(index, progress);
      })
    )
  );
}

/**
 * Upload a subscription receipt to R2.
 * Returns the full public URL (not just the path) to match the existing receipt URL format.
 */
export async function uploadReceipt(file, accountId) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`Receipt must be under 5MB. Current: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Allowed types: JPEG, PNG, WebP, PDF');
  }

  const timestamp = Date.now();
  const safeName = normalizeUploadedFileName(file.name, file.type);
  const storagePath = `${accountId}/subscription-receipts/receipt_${timestamp}_${safeName}`;

  const { url: presignedUrl } = await fetchPresignedUrl(storagePath, file.type, file.size);
  await putToR2(presignedUrl, file);

  return {
    receiptUrl: `${R2_PUBLIC_URL}/${storagePath}`,
    receiptFileName: safeName,
  };
}

/**
 * Upload an expense receipt to R2 under {accountId}/receipt/{filename}.
 *
 * @param {File} file
 * @param {number} accountId
 * @returns {Promise<{ fileUrl: string, fileName: string, fileSize: number, mimeType: string }>}
 * @throws {Error} On invalid type/size or when the upload/quota check fails.
 */
export async function uploadExpenseReceipt(file, accountId) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`Receipt must be under 5MB. Current: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Allowed types: JPEG, PNG, WebP, PDF');
  }

  const timestamp = Date.now();
  const safeName = normalizeUploadedFileName(file.name, file.type);
  const storagePath = `${accountId}/receipt/${timestamp}_${safeName}`;

  const { url: presignedUrl } = await fetchPresignedUrl(storagePath, file.type, file.size);
  await putToR2(presignedUrl, file);

  return {
    fileUrl: storagePath,
    fileName: file.name,
    fileSize: parseFloat((file.size / 1024).toFixed(2)),
    mimeType: file.type,
  };
}

/**
 * Upload a user avatar to R2 under {accountId}/userprofile/{filename}.
 *
 * @param {File} file
 * @param {number} accountId
 * @returns {Promise<{ fileUrl: string, fileName: string, fileSize: number, mimeType: string }>}
 * @throws {Error} On invalid type/size or when the upload/quota check fails.
 */
export async function uploadUserAvatar(file, accountId) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`Avatar must be under 5MB. Current: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Allowed types: JPEG, PNG, WebP, PDF');
  }

  const timestamp = Date.now();
  const safeName = normalizeUploadedFileName(file.name, file.type);
  const storagePath = `${accountId}/userprofile/${timestamp}_${safeName}`;

  const { url: presignedUrl } = await fetchPresignedUrl(storagePath, file.type, file.size);
  await putToR2(presignedUrl, file);

  return {
    fileUrl: storagePath,
    fileName: file.name,
    fileSize: parseFloat((file.size / 1024).toFixed(2)),
    mimeType: file.type,
  };
}

/**
 * Fetch the authenticated account's storage usage/limit snapshot.
 * Shape: { usedKb, limitKb, remainingKb, usedPercent, isFull, isNearLimit,
 *          usedLabel, limitLabel, remainingLabel }
 *
 * @returns {Promise<StorageUsage>}
 * @throws {Error} With the backend message when the request fails.
 */
export async function getStorageUsage() {
  const token = localStorage.getItem('firebase_token');
  const response = await fetch(`${API_BASE_URL}/storage/usage`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(json.message || 'Failed to load storage usage');
  }

  return json.data;
}
