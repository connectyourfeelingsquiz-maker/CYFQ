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

    // Fetch all dashboard stats in parallel
    const [
      usersResult,
      quizzesResult,
      attemptsResult,
      successfulLoginsResult,
      failedLoginsResult,
      activeUsersResult
    ] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('quizzes').select('id', { count: 'exact', head: true }),
      supabase.from('quiz_attempts').select('id', { count: 'exact', head: true }),
      supabase.from('authentication_events').select('id', { count: 'exact', head: true }).eq('success', true),
      supabase.from('authentication_events').select('id', { count: 'exact', head: true }).eq('success', false),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    ]);

    // Recent login activity for chart (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentActivity } = await supabase
      .from('authentication_events')
      .select('success, created_at')
      .gte('created_at', sevenDaysAgo)
      .order('created_at', { ascending: true });

    return NextResponse.json({
      stats: {
        totalUsers: usersResult.count || 0,
        totalQuizzes: quizzesResult.count || 0,
        totalAttempts: attemptsResult.count || 0,
        successfulLogins: successfulLoginsResult.count || 0,
        failedLogins: failedLoginsResult.count || 0,
        activeUsers: activeUsersResult.count || 0,
      },
      recentActivity: recentActivity || [],
    });
  } catch (error) {
    console.error('Overview error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
