import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';
import { getUserSession } from '@/lib/user-auth'; // We need some identifier for the player. If they are not logged in, we can either require login or generate an anonymous session. The user specified "Do not rely entirely on browser localStorage for authoritative scoring." but also "A player can view and play a published active quiz through its public share link... Verify login is NOT required just to access a public quiz link if the intended public flow supports that." Let's create an anonymous session entry if no session exists, or just allow attempt creation with a null session if `cyfq_sessions` is required. Actually, our schema for `quiz_attempts` requires `session_id UUID NOT NULL`. So we MUST have a session.
// Wait, the prompt says: "Verify login is NOT required just to access a public quiz link if the intended public flow supports that." Let's modify the schema to allow null session_id for anonymous players, OR we auto-create an anonymous session. Auto-creating a session is cleaner. Let's auto-create a session if needed.

export async function POST(request, { params }) {
  try {
    const { shareToken } = await params;
    const body = await request.json();
    const { answers } = body; // format: { [questionId]: selectedOptionId }

    if (!shareToken || !answers) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Fetch Quiz and verify it's active
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('id, is_active')
      .eq('share_token', shareToken)
      .single();

    if (quizError || !quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    if (!quiz.is_active) return NextResponse.json({ error: 'Quiz is disabled' }, { status: 403 });

    // 2. Resolve Player Session
    let playerSessionId = null;
    const session = await getUserSession();
    if (session && session.sessionId) {
      playerSessionId = session.sessionId;
    } else {
      // Create an anonymous session to satisfy the DB constraint
      const { data: anonSession, error: anonError } = await supabase
        .from('cyfq_sessions')
        .insert({
          username_1: 'Anonymous',
          username_2: 'Player',
          is_active: true
        })
        .select('id')
        .single();
      
      if (anonError) throw anonError;
      playerSessionId = anonSession.id;
    }

    // 3. Fetch all correct answers for this quiz
    const { data: correctOptions, error: optError } = await supabase
      .from('answer_options')
      .select('id, question_id')
      .eq('is_correct', true)
      .in('question_id', Object.keys(answers));

    if (optError) throw optError;

    const correctMap = {};
    correctOptions.forEach(opt => {
      correctMap[opt.question_id] = opt.id;
    });

    // 4. Calculate Score
    let score = 0;
    const totalQuestions = Object.keys(answers).length;
    const answersToInsert = [];

    for (const [questionId, selectedOptionId] of Object.entries(answers)) {
      const isCorrect = correctMap[questionId] === selectedOptionId;
      if (isCorrect) score += 1;
      
      answersToInsert.push({
        question_id: questionId,
        selected_option_id: selectedOptionId,
        is_correct: isCorrect
      });
    }

    const percentage = Math.round((score / totalQuestions) * 100);

    // 5. Create Attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('quiz_attempts')
      .insert({
        session_id: playerSessionId,
        quiz_id: quiz.id,
        score,
        percentage,
        total_questions: totalQuestions,
        completed_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (attemptError) throw attemptError;

    // 6. Insert Answers
    const answersWithAttemptId = answersToInsert.map(a => ({
      ...a,
      attempt_id: attempt.id
    }));

    const { error: insertAnswersError } = await supabase
      .from('quiz_answers')
      .insert(answersWithAttemptId);

    if (insertAnswersError) throw insertAnswersError;

    return NextResponse.json({ success: true, attempt_id: attempt.id });

  } catch (error) {
    console.error('Submit quiz error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
