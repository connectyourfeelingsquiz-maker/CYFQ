import { NextResponse } from 'next/server';
import { getUserSession, clearUserCookie } from '@/lib/user-auth';
import { createAdminClient } from '@/lib/supabase-server';

export async function POST() {
  try {
    const session = await getUserSession();
    if (session?.sessionId) {
      const supabase = createAdminClient();
      await supabase
        .from('cyfq_sessions')
        .update({ 
          status: 'Logged Out', 
          logout_at: new Date().toISOString() 
        })
        .eq('id', session.sessionId);
    }

    await clearUserCookie();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error.message);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}
