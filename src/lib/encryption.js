import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
// In production, MUST use a strong, uniquely generated ENCRYPTION_KEY in .env
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default_fallback_secret_key_1234';

// Use scrypt to derive a robust 32-byte key regardless of input length
const keyBuffer = crypto.scryptSync(ENCRYPTION_KEY, 'salt_workgrid', 32);

/**
 * Encrypts a plaintext string into AES-256-GCM format: iv:authTag:encryptedData
 * @param {string} text - Plaintext to encrypt
 * @returns {string} Encrypted ciphertext
 */
export function encrypt(text) {
  if (!text) return text;
  // If it's already encrypted (starts with a 32 char hex IV followed by a colon), don't double encrypt
  if (typeof text === 'string' && /^[0-9a-f]{32}:[0-9a-f]{32}:[0-9a-f]+$/i.test(text)) {
    return text;
  }

  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (err) {
    console.error('Encryption failed:', err);
    throw new Error('Data protection error: Encryption failed');
  }
}

/**
 * Decrypts an AES-256-GCM ciphertext back to plaintext.
 * If the text is not in the recognized format, it assumes it's legacy plaintext and returns it.
 * @param {string} hash - Ciphertext to decrypt
 * @returns {string} Decrypted plaintext
 */
export function decrypt(hash) {
  if (!hash) return hash;
  
  // Check if it matches our encryption signature (iv:authTag:ciphertext)
  if (typeof hash === 'string' && !/^[0-9a-f]{32}:[0-9a-f]{32}:[0-9a-f]+$/i.test(hash)) {
    // Legacy plaintext data from before encryption was enabled
    return hash;
  }

  try {
    const parts = hash.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encryptedText = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Decryption failed:', err);
    // If decryption fails (e.g. wrong key), we log it but don't crash, 
    // we return a masked error string so the app doesn't break, but protects the data.
    return '*** DECRYPTION ERROR ***';
  }
}
