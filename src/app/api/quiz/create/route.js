import { NextResponse } from 'next/server';
import { getUserSession } from '@/lib/user-auth';
import { createAdminClient } from '@/lib/supabase-server';

function generateShareToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 8; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export async function POST(request) {
  try {
    const session = await getUserSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, questions } = body;

    if (!title || !questions || questions.length === 0) {
      return NextResponse.json({ error: 'Invalid quiz data' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const shareToken = generateShareToken();

    // 1. Insert Quiz
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .insert({
        creator_id: session.sessionId,
        title,
        description,
        share_token: shareToken,
        is_active: true
      })
      .select('id')
      .single();

    if (quizError) throw quizError;

    // 2. Prepare and Insert Questions
    const questionsToInsert = questions.map((q) => ({
      quiz_id: quiz.id,
      question_text: q.text,
      order_index: q.order_index
    }));

    const { data: insertedQuestions, error: qError } = await supabase
      .from('questions')
      .insert(questionsToInsert)
      .select('id, order_index');

    if (qError) throw qError;

    // 3. Prepare and Insert Answer Options
    const optionsToInsert = [];
    questions.forEach((q) => {
      // Find the corresponding inserted question by order_index
      const insertedQ = insertedQuestions.find(iq => iq.order_index === q.order_index);
      if (insertedQ) {
        q.options.forEach((o) => {
          optionsToInsert.push({
            question_id: insertedQ.id,
            option_text: o.text,
            is_correct: o.is_correct,
            order_index: o.order_index
          });
        });
      }
    });

    const { error: optionsError } = await supabase
      .from('answer_options')
      .insert(optionsToInsert);

    if (optionsError) throw optionsError;

    return NextResponse.json({ success: true, share_token: shareToken });

  } catch (error) {
    console.error('Quiz creation error:', error);
    // If it's a unique constraint violation on share_token, we could retry, but 8 chars alphanumeric is highly unlikely to collide initially
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
