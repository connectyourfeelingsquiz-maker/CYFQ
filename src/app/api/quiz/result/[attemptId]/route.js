import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';

export async function GET(request, { params }) {
  try {
    const { attemptId } = params;
    
    if (!attemptId) {
      return NextResponse.json({ error: 'Missing attempt ID' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Fetch Attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('quiz_attempts')
      .select('id, score, percentage, total_questions, quiz_id')
      .eq('id', attemptId)
      .single();

    if (attemptError || !attempt) {
      return NextResponse.json({ error: 'Result not found' }, { status: 404 });
    }

    // Fetch Quiz Title and Share Token
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('title, share_token')
      .eq('id', attempt.quiz_id)
      .single();

    if (quizError) throw quizError;

    return NextResponse.json({
      result: {
        score: attempt.score,
        percentage: attempt.percentage,
        total_questions: attempt.total_questions,
        quiz_title: quiz.title,
        share_token: quiz.share_token
      }
    });

  } catch (error) {
    console.error('Fetch result error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
