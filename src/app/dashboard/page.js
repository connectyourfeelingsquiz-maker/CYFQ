'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function DashboardContent() {
  const [session, setSession] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [quizLink, setQuizLink] = useState('');

  useEffect(() => {
    const playQuiz = searchParams.get('playQuiz');
    if (playQuiz) {
      setQuizLink(`https://mycyfq.com/quiz/${playQuiz}`);
    }
  }, [searchParams]);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setSession(data);
            
            // Fetch quizzes created by user
            const quizRes = await fetch('/api/quiz/creator-list');
            if (quizRes.ok) {
              const quizData = await quizRes.json();
              setQuizzes(quizData.quizzes || []);
            }
          } else {
            router.push('/login');
          }
        } else {
          router.push('/login');
        }
      } catch (err) {
        console.error(err);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (err) {
      console.error(err);
    }
  };

  const handlePlayQuiz = (e) => {
    e.preventDefault();
    if (!quizLink.trim()) return;
    
    // Parse link to extract token if it's a full URL
    let token = quizLink.trim();
    if (token.includes('/quiz/')) {
      const parts = token.split('/quiz/');
      token = parts[parts.length - 1].replace('/result', '');
    }
    
    if (token) {
      router.push(`/quiz/${token}`);
    }
  };

  if (loading) return null;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '4rem' }}>
      
      <div style={{ width: '100%', maxWidth: '800px', padding: '0 1rem' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
          <h1 style={{ color: 'var(--accent-primary)' }}>Welcome, {session?.username1}</h1>
          <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>Log Out</button>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
          
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✍️</div>
            <h2 style={{ marginBottom: '1rem' }}>Create a Quiz</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              Create your own CYFQ guessing quiz.
            </p>
            <Link href="/quiz/create" style={{ marginTop: 'auto', width: '100%' }}>
              <button className="btn btn-primary" style={{ width: '100%' }}>Create Quiz</button>
            </Link>
          </div>

          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎮</div>
            <h2 style={{ marginBottom: '1rem' }}>Play Quiz</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Enter a CYFQ quiz link and play someone else's quiz.
            </p>
            <form onSubmit={handlePlayQuiz} style={{ width: '100%', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Paste quiz link or token" 
                value={quizLink}
                onChange={(e) => setQuizLink(e.target.value)}
              />
              <button type="submit" className="btn btn-secondary" style={{ width: '100%' }}>Start Quiz</button>
            </form>
          </div>

        </div>

        {/* My Quizzes Section */}
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>My Quizzes</h2>
          
          {quizzes.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>You haven't created a quiz yet.</p>
              <Link href="/quiz/create">
                <button className="btn btn-primary">Create Your First Quiz</button>
              </Link>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Quiz Title</th>
                    <th>Played</th>
                    <th>Average Score</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {quizzes.map(quiz => (
                    <tr key={quiz.id}>
                      <td style={{ fontWeight: 500 }}>{quiz.title}</td>
                      <td>{quiz.times_played} times</td>
                      <td>{quiz.average_score != null ? `${quiz.average_score}%` : 'N/A'}</td>
                      <td>
                        <span className={`badge ${quiz.is_active ? 'badge-success' : 'badge-warning'}`}>
                          {quiz.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td>
                        <Link href={`/quiz/share/${quiz.share_token}`}>
                          <button className="btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderRadius: '4px' }}>
                            Share Link
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}

export default function UserDashboard() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
