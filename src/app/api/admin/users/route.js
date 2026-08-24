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
      target_type: 'users',
      safe_metadata: { timestamp: new Date().toISOString() }
    });

    // Fetch users — NO password fields
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, display_name, auth_provider, status, created_at, last_login, updated_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Enrich with quiz counts
    const enrichedUsers = await Promise.all(
      (users || []).map(async (user) => {
        const [quizCreated, quizPlayed] = await Promise.all([
          supabase.from('quizzes').select('id', { count: 'exact', head: true }).eq('creator_id', user.id),
          supabase.from('quiz_attempts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        ]);
        return {
          ...user,
          quizzes_created: quizCreated.count || 0,
          quizzes_played: quizPlayed.count || 0,
        };
      })
    );

    return NextResponse.json({ users: enrichedUsers });
  } catch (error) {
    console.error('Users API error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
