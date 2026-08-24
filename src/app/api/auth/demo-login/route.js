import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';

export async function POST(request) {
  try {
    const supabase = createAdminClient();
    
    // In a real OAuth flow, this user info would come from the provider (Instagram)
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, username')
      .eq('username', 'demo_user')
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'Demo user not found' }, { status: 404 });
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const userAgent = request.headers.get('user-agent')?.substring(0, 200) || 'unknown';

    // Log authentication event
    await supabase.from('authentication_events').insert({
      user_id: user.id,
      authentication_method: 'CYFQ Demo',
      event_type: 'login',
      success: true,
      safe_metadata: {
        ip: ip,
        user_agent: userAgent,
        browser: 'Demo Browser'
      }
    });

    // Update last login
    await supabase.from('users').update({ last_login: new Date().toISOString() }).eq('id', user.id);

    // In a real app, you would set a session cookie here for the regular user.
    // We're just simulating a successful login for the demo.
    
    return NextResponse.json({ success: true, redirect: '/dashboard' });
  } catch (error) {
    console.error('Demo login error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
