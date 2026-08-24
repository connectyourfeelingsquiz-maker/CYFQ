'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function UserDashboard() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setSession(data);
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
    fetchSession();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (err) {
      console.error(err);
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✍️</div>
            <h2 style={{ marginBottom: '1rem' }}>Create a Quiz</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              Design your own feelings and emotions quiz to share with friends.
            </p>
            <button className="btn btn-primary" style={{ marginTop: 'auto' }}>Create Quiz</button>
          </div>

          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎮</div>
            <h2 style={{ marginBottom: '1rem' }}>Play a Quiz</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              Discover more about yourself by taking quizzes made by others.
            </p>
            <button className="btn btn-secondary" style={{ marginTop: 'auto' }}>Browse Quizzes</button>
          </div>

        </div>
      </div>
    </div>
  );
}
