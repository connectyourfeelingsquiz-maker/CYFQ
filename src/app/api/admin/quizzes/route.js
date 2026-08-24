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
      action: 'quizzes_viewed',
      target_type: 'quizzes',
      safe_metadata: { timestamp: new Date().toISOString() }
    });

    const { data: quizzes, error } = await supabase
      .from('quizzes')
      .select(`
        id,
        title,
        description,
        category,
        share_token,
        is_active,
        created_at,
        updated_at,
        creator_id,
        cyfq_sessions (
          username_1,
          username_2
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Count questions and attempts for each quiz
    const enriched = await Promise.all(
      (quizzes || []).map(async (quiz) => {
        const [questionCount, attemptCount, attemptsData] = await Promise.all([
          supabase.from('questions').select('id', { count: 'exact', head: true }).eq('quiz_id', quiz.id),
          supabase.from('quiz_attempts').select('id', { count: 'exact', head: true }).eq('quiz_id', quiz.id),
          supabase.from('quiz_attempts').select('percentage').eq('quiz_id', quiz.id)
        ]);
        
        let avgScore = null;
        if (attemptsData.data && attemptsData.data.length > 0) {
          const total = attemptsData.data.reduce((sum, a) => sum + (a.percentage || 0), 0);
          avgScore = Math.round(total / attemptsData.data.length);
        }

        let creatorName = 'Unknown';
        if (quiz.cyfq_sessions) {
          creatorName = `${quiz.cyfq_sessions.username_1} & ${quiz.cyfq_sessions.username_2}`;
        }

        return {
          ...quiz,
          creator: creatorName,
          question_count: questionCount.count || 0,
          attempt_count: attemptCount.count || 0,
          average_score: avgScore
        };
      })
    );

    return NextResponse.json({ quizzes: enriched });
  } catch (error) {
    console.error('Quizzes API error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const quizId = searchParams.get('id');
    const action = searchParams.get('action') || 'disable';

    if (!quizId) {
      return NextResponse.json({ error: 'Quiz ID required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    if (action === 'delete') {
      const { error } = await supabase.from('quizzes').delete().eq('id', quizId);
      if (error) throw error;

      await supabase.from('admin_audit_logs').insert({
        admin_id: session.email,
        action: 'quiz_deleted',
        target_type: 'quiz',
        target_id: quizId,
        safe_metadata: { timestamp: new Date().toISOString() }
      });
    } else {
      const { error } = await supabase.from('quizzes').update({ is_active: false }).eq('id', quizId);
      if (error) throw error;

      await supabase.from('admin_audit_logs').insert({
        admin_id: session.email,
        action: 'quiz_disabled',
        target_type: 'quiz',
        target_id: quizId,
        safe_metadata: { timestamp: new Date().toISOString() }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Quiz delete error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
