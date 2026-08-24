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

    const { data: attempts, error } = await supabase
      .from('quiz_attempts')
      .select(`
        id,
        score,
        total_questions,
        started_at,
        completed_at,
        users ( username, display_name ),
        quizzes ( title )
      `)
      .order('started_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    const formatted = (attempts || []).map(attempt => ({
      id: attempt.id,
      user: attempt.users?.display_name || attempt.users?.username || 'Unknown',
      quiz: attempt.quizzes?.title || 'Unknown Quiz',
      score: attempt.score != null ? `${attempt.score} / ${attempt.total_questions || '?'}` : 'In Progress',
      date: attempt.started_at,
      completed: !!attempt.completed_at
    }));

    return NextResponse.json({ attempts: formatted });
  } catch (error) {
    console.error('Attempts API error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
