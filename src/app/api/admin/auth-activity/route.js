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
      action: 'authentication_activity_viewed',
      target_type: 'authentication_events',
      safe_metadata: { timestamp: new Date().toISOString() }
    });

    // Fetch authentication events with user info — NEVER includes passwords
    const { data: events, error } = await supabase
      .from('authentication_events')
      .select(`
        id,
        authentication_method,
        event_type,
        success,
        created_at,
        safe_metadata,
        user_id,
        users (
          username,
          display_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    const formatted = (events || []).map(event => ({
      id: event.id,
      user: event.users?.display_name || event.users?.username || 'Unknown',
      username: event.users?.username || 'unknown',
      method: event.authentication_method,
      status: event.success ? 'Success' : 'Failed',
      time: event.created_at,
      browser: event.safe_metadata?.browser || '-',
      os: event.safe_metadata?.os || '-',
    }));

    return NextResponse.json({ events: formatted });
  } catch (error) {
    console.error('Auth activity error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
