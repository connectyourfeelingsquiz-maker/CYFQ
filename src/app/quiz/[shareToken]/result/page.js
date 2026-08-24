'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function ResultContent({ shareToken }) {
  const searchParams = useSearchParams();
  const attemptId = searchParams.get('attempt');
  const router = useRouter();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!attemptId) {
      setError('No result found.');
      setLoading(false);
      return;
    }

    async function fetchResult() {
      try {
        const res = await fetch(`/api/quiz/result/${attemptId}`);
        const data = await res.json();
        
        if (res.ok && data.result) {
          setResult(data.result);
        } else {
          setError(data.error || 'Failed to load result');
        }
      } catch (err) {
        console.error(err);
        setError('An error occurred while loading the result.');
      } finally {
        setLoading(false);
      }
    }
    fetchResult();
  }, [attemptId]);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>Loading...</div>;
  }

  if (error) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', maxWidth: '400px', width: '100%', margin: '0 auto' }}>
        <h2 style={{ color: 'var(--accent-primary)', marginBottom: '1rem' }}>{error}</h2>
        <Link href="/">
          <button className="btn btn-primary" style={{ width: '100%' }}>Return Home</button>
        </Link>
      </div>
    );
  }

  const { score, total_questions, percentage, quiz_title } = result;

  let connectionMessage = '';
  let emoji = '';
  if (percentage >= 90) {
    connectionMessage = 'You really know them!';
    emoji = '🔥';
  } else if (percentage >= 70) {
    connectionMessage = 'Pretty strong connection!';
    emoji = '✨';
  } else if (percentage >= 50) {
    connectionMessage = 'You know them, but there\'s still more to discover!';
    emoji = '🌱';
  } else {
    connectionMessage = 'Looks like you need to spend more time together!';
    emoji = '👀';
  }

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/quiz/${shareToken}`;
    const shareText = `I scored ${score}/${total_questions} on "${quiz_title}" on CYFQ! Can you beat my score?`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'CYFQ Score',
          text: shareText,
          url: shareUrl
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback
      alert('Take a screenshot to share your score on your story!');
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}>
      <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 2rem', marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', marginBottom: '2rem' }}>Your CYFQ Score</h2>
        
        <div style={{ fontSize: '4rem', fontWeight: '800', color: 'var(--accent-primary)', marginBottom: '0.5rem', lineHeight: 1 }}>
          {score} / {total_questions}
        </div>
        <div style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '2rem' }}>
          {percentage}%
        </div>

        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{emoji}</div>
        <h3 style={{ color: 'var(--accent-secondary)', marginBottom: '2rem', fontSize: '1.25rem' }}>
          {connectionMessage}
        </h3>

        {/* Story CTA */}
        <div style={{ background: 'var(--bg-primary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)', marginBottom: '2rem' }}>
          <p style={{ fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Take a screenshot and share it on your story.
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Show your friends how strong your connection really is.
          </p>
        </div>

        <button 
          onClick={handleShare}
          className="btn btn-primary"
          style={{ width: '100%', padding: '1rem', marginBottom: '1rem' }}
        >
          Share My Score
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Link href={`/quiz/${shareToken}`} style={{ width: '100%' }}>
            <button className="btn btn-secondary" style={{ width: '100%' }}>Play Again</button>
          </Link>
          <Link href="/dashboard" style={{ width: '100%' }}>
            <button className="btn btn-secondary" style={{ width: '100%' }}>Back to Home</button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function QuizResultPage({ params }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>Loading...</div>}>
        <ResultContent shareToken={params.shareToken} />
      </Suspense>
    </div>
  );
}
