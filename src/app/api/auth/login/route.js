import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';
import { signUserToken, setUserCookie } from '@/lib/user-auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { username1, username2 } = body;

    if (!username1?.trim() || !username2?.trim()) {
      return NextResponse.json({ error: 'Both usernames are required.' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const userAgent = request.headers.get('user-agent')?.substring(0, 200) || 'unknown';

    // Create a new session record
    const { data: session, error } = await supabase
      .from('cyfq_sessions')
      .insert({
        username_1: username1.trim(),
        username_2: username2.trim(),
        browser: userAgent,
        ip_address: ip,
        authentication_method: 'CYFQ Development',
        status: 'Success'
      })
      .select('id, username_1, username_2')
      .single();

    if (error || !session) {
      throw error || new Error('Failed to create session');
    }

    // Create JWT and set cookie
    const token = await signUserToken({
      sessionId: session.id,
      username1: session.username_1,
      username2: session.username_2
    });
    
    await setUserCookie(token);

    return NextResponse.json({ success: true, redirect: '/dashboard' });
  } catch (error) {
    console.error('Login error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
