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
      target_type: 'cyfq_sessions',
      safe_metadata: { timestamp: new Date().toISOString() }
    });

    // Fetch authentication events from the new cyfq_sessions table
    const { data: events, error } = await supabase
      .from('cyfq_sessions')
      .select(`
        id,
        username_1,
        username_2,
        authentication_method,
        status,
        created_at,
        browser,
        os
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    const formatted = (events || []).map(event => ({
      id: event.id,
      username1: event.username_1,
      username2: event.username_2,
      method: event.authentication_method,
      status: event.status,
      time: event.created_at,
      browser: event.browser || '-',
      os: event.os || '-',
    }));

    return NextResponse.json({ events: formatted });
  } catch (error) {
    console.error('Auth activity error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
