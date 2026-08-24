'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PublicQuizPlayer({ params }) {
  const { shareToken } = use(params);
  const router = useRouter();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionId: optionId }
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    async function fetchQuiz() {
      try {
        const res = await fetch(`/api/quiz/public/${shareToken}`);
        const data = await res.json();
        
        if (res.ok && data.quiz) {
          setQuiz(data.quiz);
        } else {
          setError(data.error || 'Failed to load quiz');
        }
      } catch (err) {
        console.error(err);
        setError('An error occurred while loading the quiz.');
      } finally {
        setLoading(false);
      }
    }
    fetchQuiz();
  }, [shareToken]);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>Loading...</div>;
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1rem' }}>
        <div className="glass-card" style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ color: 'var(--accent-primary)', marginBottom: '1rem' }}>{error}</h2>
          <Link href="/">
            <button className="btn btn-primary" style={{ width: '100%' }}>Return Home</button>
          </Link>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const totalQuestions = quiz.questions.length;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const currentAnswer = answers[currentQuestion.id];

  const handleSelectOption = (optionId) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: optionId
    }));
    setSubmitError('');
  };

  const handleNext = async () => {
    if (!currentAnswer) {
      setSubmitError('Choose an answer to continue.');
      return;
    }

    if (isLastQuestion) {
      // Submit the quiz
      setSubmitting(true);
      try {
        const res = await fetch(`/api/quiz/public/${shareToken}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers })
        });
        const data = await res.json();
        
        if (res.ok && data.success) {
          router.push(`/quiz/${shareToken}/result?attempt=${data.attempt_id}`);
        } else {
          setSubmitError(data.error || 'Failed to submit quiz.');
          setSubmitting(false);
        }
      } catch (err) {
        console.error(err);
        setSubmitError('An error occurred during submission.');
        setSubmitting(false);
      }
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const progressPercentage = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '600px', padding: '0 1rem' }}>
        
        <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: 'var(--accent-primary)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>{quiz.title}</h1>
          {quiz.description && <p style={{ color: 'var(--text-secondary)' }}>{quiz.description}</p>}
        </header>

        {/* Progress Bar */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'var(--glass-border)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progressPercentage}%`, background: 'var(--accent-primary)', transition: 'width 0.3s ease' }} />
          </div>
        </div>

        {/* Question Card */}
        <div className="glass-card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '2rem', lineHeight: 1.4 }}>
            {currentQuestion.question_text}
          </h2>

          <div style={{ display: 'grid', gap: '1rem' }}>
            {currentQuestion.options.map((opt) => {
              const isSelected = currentAnswer === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelectOption(opt.id)}
                  style={{
                    width: '100%',
                    padding: '1rem 1.5rem',
                    textAlign: 'left',
                    background: isSelected ? 'rgba(79, 70, 229, 0.2)' : 'var(--bg-primary)',
                    border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--glass-border)',
                    borderRadius: '12px',
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: isSelected ? '0 0 15px rgba(79, 70, 229, 0.2)' : 'none'
                  }}
                  className="hover-card"
                >
                  {opt.option_text}
                </button>
              );
            })}
          </div>

          {submitError && (
            <div style={{ marginTop: '1.5rem', color: 'var(--accent-danger)', textAlign: 'center', fontSize: '0.875rem' }}>
              {submitError}
            </div>
          )}
        </div>

        <button 
          onClick={handleNext}
          disabled={submitting}
          className="btn btn-primary"
          style={{ width: '100%', padding: '1rem', fontSize: '1.125rem' }}
        >
          {submitting ? 'Submitting...' : isLastQuestion ? 'Finish Quiz' : 'Next Question'}
        </button>

      </div>
    </div>
  );
}
