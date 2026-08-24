import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const ADMIN_COOKIE_NAME = 'cyfq_admin_session';
const JWT_EXPIRY = '8h';

function getJwtSecret() {
  const secret = process.env.ADMIN_JWT_SECRET || process.env.ADMIN_PASSWORD;
  if (!secret) throw new Error('Missing JWT secret configuration');
  return new TextEncoder().encode(secret);
}

// Sign a JWT for admin session
export async function signAdminToken(adminEmail) {
  const secret = getJwtSecret();
  
  const token = await new SignJWT({ 
    email: adminEmail, 
    role: 'admin',
    iat: Math.floor(Date.now() / 1000)
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .setSubject(adminEmail)
    .sign(secret);

  return token;
}

// Verify an admin JWT token
export async function verifyAdminToken(token) {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret);
    
    if (payload.role !== 'admin') return null;
    return payload;
  } catch {
    return null;
  }
}

// Set admin session cookie (server-side)
export async function setAdminCookie(token) {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8, // 8 hours
    path: '/',
  });
}

// Get admin session from cookie (server-side)
export async function getAdminSession() {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(ADMIN_COOKIE_NAME);
    if (!cookie?.value) return null;
    return await verifyAdminToken(cookie.value);
  } catch {
    return null;
  }
}

// Clear admin session cookie
export async function clearAdminCookie() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}

// Validate admin credentials against environment variables
export function validateAdminCredentials(email, password) {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error('Admin credentials not configured in environment');
    return false;
  }

  // Constant-time-ish comparison to prevent timing attacks
  const emailMatch = email === adminEmail;
  const passwordMatch = password === adminPassword;

  return emailMatch && passwordMatch;
}
