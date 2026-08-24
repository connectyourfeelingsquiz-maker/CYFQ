import { NextResponse } from 'next/server';
import { validateAdminCredentials, signAdminToken, setAdminCookie } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase-server';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request) {
  try {
    // Get client IP for rate limiting
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
    
    // Rate limit check
    const limiter = rateLimit(ip);
    if (!limiter.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { 
          status: 429,
          headers: { 'Retry-After': String(limiter.retryAfter) }
        }
      );
    }

    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Invalid admin credentials' },
        { status: 401 }
      );
    }

    // Verify against environment variables (server-side only)
    const isValid = validateAdminCredentials(email, password);

    // Log the attempt to audit logs
    try {
      const supabase = createAdminClient();
      await supabase.from('admin_audit_logs').insert({
        admin_id: isValid ? email : 'failed_attempt',
        action: 'admin_login',
        target_type: 'admin',
        target_id: null,
        safe_metadata: {
          success: isValid,
          ip: ip,
          user_agent: request.headers.get('user-agent')?.substring(0, 200) || 'unknown',
          timestamp: new Date().toISOString()
        }
      });
    } catch (logError) {
      // Don't fail login if logging fails
      console.error('Audit log error:', logError.message);
    }

    if (!isValid) {
      // Generic error — don't reveal which field was wrong
      return NextResponse.json(
        { error: 'Invalid admin credentials' },
        { status: 401 }
      );
    }

    // Sign JWT and set cookie
    const token = await signAdminToken(email);
    await setAdminCookie(token);

    return NextResponse.json({ 
      success: true,
      message: 'Admin authenticated successfully'
    });

  } catch (error) {
    console.error('Admin login error:', error.message);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
