import { NextResponse } from 'next/server';
import { getUserSession } from '@/lib/user-auth';
import { createAdminClient } from '@/lib/supabase-server';

export async function GET(request) {
  try {
    const session = await getUserSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Fetch quizzes for this session
    const { data: quizzes, error } = await supabase
      .from('quizzes')
      .select('id, title, is_active, share_token')
      .eq('creator_id', session.sessionId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!quizzes || quizzes.length === 0) {
      return NextResponse.json({ quizzes: [] });
    }

    // Fetch attempt stats for these quizzes
    const quizIds = quizzes.map(q => q.id);
    
    const { data: attempts, error: attemptsError } = await supabase
      .from('quiz_attempts')
      .select('quiz_id, percentage')
      .in('quiz_id', quizIds);

    if (attemptsError) throw attemptsError;

    const statsMap = {};
    quizIds.forEach(id => {
      statsMap[id] = { count: 0, total_percentage: 0 };
    });

    attempts.forEach(a => {
      if (statsMap[a.quiz_id]) {
        statsMap[a.quiz_id].count += 1;
        statsMap[a.quiz_id].total_percentage += (a.percentage || 0);
      }
    });

    const enrichedQuizzes = quizzes.map(q => {
      const stats = statsMap[q.id];
      const avg = stats.count > 0 ? Math.round(stats.total_percentage / stats.count) : null;
      return {
        ...q,
        times_played: stats.count,
        average_score: avg
      };
    });

    return NextResponse.json({ quizzes: enrichedQuizzes });

  } catch (error) {
    console.error('Fetch creator quizzes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
