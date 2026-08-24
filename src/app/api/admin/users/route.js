import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Log audit event
    await supabase.from('admin_audit_logs').insert({
      admin_id: session.email,
      action: 'users_viewed',
      target_type: 'cyfq_sessions',
      safe_metadata: { timestamp: new Date().toISOString() }
    });

    // Fetch from cyfq_sessions instead of old users table
    const { data: sessions, error } = await supabase
      .from('cyfq_sessions')
      .select('id, username_1, username_2, authentication_method, status, created_at, logout_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formattedSessions = (sessions || []).map(sess => ({
      id: sess.id,
      username1: sess.username_1,
      username2: sess.username_2,
      method: sess.authentication_method,
      status: sess.status,
      login_time: sess.created_at,
      logout_time: sess.logout_at
    }));

    return NextResponse.json({ users: formattedSessions });
  } catch (error) {
    console.error('Users API error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
