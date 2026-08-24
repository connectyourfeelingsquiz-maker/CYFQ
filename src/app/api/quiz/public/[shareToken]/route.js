import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';

export async function GET(request, { params }) {
  try {
    const { shareToken } = params;
    
    if (!shareToken) {
      return NextResponse.json({ error: 'Missing share token' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Fetch Quiz
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('id, title, description, is_active')
      .eq('share_token', shareToken)
      .single();

    if (quizError || !quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    if (!quiz.is_active) {
      return NextResponse.json({ error: 'This quiz is currently unavailable.' }, { status: 403 });
    }

    // 2. Fetch Questions
    const { data: questions, error: qError } = await supabase
      .from('questions')
      .select('id, question_text, order_index')
      .eq('quiz_id', quiz.id)
      .order('order_index', { ascending: true });

    if (qError) throw qError;

    // 3. Fetch Answer Options (DO NOT SELECT is_correct!)
    const questionIds = questions.map(q => q.id);
    const { data: options, error: optError } = await supabase
      .from('answer_options')
      .select('id, question_id, option_text, order_index')
      .in('question_id', questionIds)
      .order('order_index', { ascending: true });

    if (optError) throw optError;

    // Map options to their respective questions
    const formattedQuestions = questions.map(q => ({
      ...q,
      options: options.filter(o => o.question_id === q.id)
    }));

    return NextResponse.json({
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        questions: formattedQuestions
      }
    });

  } catch (error) {
    console.error('Fetch public quiz error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
