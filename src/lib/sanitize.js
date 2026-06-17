// src/lib/sanitize.js

/**
 * Basic HTML tag stripper for XSS prevention.
 * In a real production app, consider using a robust library like DOMPurify or xss.
 * @param {string} str - The string to sanitize
 * @returns {string} - Sanitized string
 */
export function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Recursively sanitizes an object's string properties
 * @param {Object|Array|string} obj - The object to sanitize
 * @returns {Object|Array|string} - Sanitized object
 */
export function sanitizeObject(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }

  return obj; // Return numbers, booleans, etc. as is
}
