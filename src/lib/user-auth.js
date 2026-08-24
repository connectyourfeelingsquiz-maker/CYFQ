import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const USER_COOKIE_NAME = 'cyfq_user_session';
const JWT_EXPIRY = '24h';

function getJwtSecret() {
  const secret = process.env.ADMIN_JWT_SECRET || process.env.ADMIN_PASSWORD || 'default_secret';
  return new TextEncoder().encode(secret);
}

// Sign a JWT for a CYFQ user session
export async function signUserToken(payload) {
  const secret = getJwtSecret();
  
  const token = await new SignJWT({ 
    ...payload,
    role: 'cyfq_user',
    iat: Math.floor(Date.now() / 1000)
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(secret);

  return token;
}

// Verify a user JWT token
export async function verifyUserToken(token) {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret);
    
    if (payload.role !== 'cyfq_user') return null;
    return payload;
  } catch {
    return null;
  }
}

// Set user session cookie (server-side)
export async function setUserCookie(token) {
  const cookieStore = await cookies();
  cookieStore.set(USER_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });
}

// Get user session from cookie (server-side)
export async function getUserSession() {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(USER_COOKIE_NAME);
    if (!cookie?.value) return null;
    return await verifyUserToken(cookie.value);
  } catch {
    return null;
  }
}

// Clear user session cookie
export async function clearUserCookie() {
  const cookieStore = await cookies();
  cookieStore.set(USER_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}
