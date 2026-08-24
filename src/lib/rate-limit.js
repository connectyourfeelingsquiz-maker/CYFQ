// Simple in-memory rate limiter
// In production, use Redis or a distributed store
const attempts = new Map();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

export function rateLimit(identifier) {
  const now = Date.now();
  const record = attempts.get(identifier);

  // Clean up expired entries periodically
  if (attempts.size > 1000) {
    for (const [key, val] of attempts.entries()) {
      if (now - val.firstAttempt > WINDOW_MS) {
        attempts.delete(key);
      }
    }
  }

  if (!record || now - record.firstAttempt > WINDOW_MS) {
    attempts.set(identifier, { count: 1, firstAttempt: now });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }

  if (record.count >= MAX_ATTEMPTS) {
    const resetTime = record.firstAttempt + WINDOW_MS;
    return { 
      allowed: false, 
      remaining: 0, 
      retryAfter: Math.ceil((resetTime - now) / 1000) 
    };
  }

  record.count += 1;
  return { allowed: true, remaining: MAX_ATTEMPTS - record.count };
}
