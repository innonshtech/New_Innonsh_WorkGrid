// src/lib/rate-limiter.js
import { NextResponse } from 'next/server';

// In-memory store: { [ip_path]: { count: 1, resetTime: 1234567890 } }
// Note: This is per-process. For multi-server/serverless, use Redis (e.g., Upstash).
const store = new Map();

const isDev = process.env.NODE_ENV === 'development';

/**
 * Rate limit configuration
 */
export const RateLimitConfig = {
  LOGIN: { windowMs: 15 * 60 * 1000, max: isDev ? 1000 : 5 }, // Allow 1000 in dev, 5 in prod
  API: { windowMs: 60 * 1000, max: isDev ? 10000 : 100 },
  DEFAULT: { windowMs: 60 * 1000, max: isDev ? 5000 : 60 },
};

/**
 * Rate limit middleware helper
 * @param {Request} req - Next.js Request object
 * @param {Object} config - { windowMs, max }
 * @returns {NextResponse|null} - Returns 429 response if limited, null otherwise
 */
export function rateLimit(req, config = RateLimitConfig.DEFAULT) {
  const ip = req.headers.get('x-forwarded-for') || req.ip || 'unknown_ip';
  const path = req.nextUrl.pathname;
  const key = `${ip}_${path}`;

  const now = Date.now();
  
  // Scale up max requests for local or dev environments
  const isLocal = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || ip === 'unknown_ip';
  const effectiveConfig = (isDev || isLocal) 
    ? { ...config, max: Math.max(config.max, 1000) } 
    : config;
  
  let record = store.get(key);

  if (!record || now > record.resetTime) {
    // New window
    record = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    store.set(key, record);
  } else {
    // Existing window
    record.count++;
    if (record.count > effectiveConfig.max) {
      console.warn(`[RateLimit] Blocked request from ${ip} to ${path}`);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many requests, please try again later.' 
        }, 
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((record.resetTime - now) / 1000).toString(),
            'X-RateLimit-Limit': effectiveConfig.max.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': record.resetTime.toString()
          }
        }
      );
    }
  }

  // Cleanup old entries randomly to prevent memory leak
  if (Math.random() < 0.01) {
    for (const [k, v] of store.entries()) {
      if (now > v.resetTime) store.delete(k);
    }
  }

  return null; // Allowed
}
