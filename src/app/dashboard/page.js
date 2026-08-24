'use client';

import Link from 'next/link';

export default function UserDashboard() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '4rem' }}>
      
      <div style={{ width: '100%', maxWidth: '800px', padding: '0 1rem' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
          <h1 style={{ color: 'var(--accent-primary)' }}>CYFQ Dashboard</h1>
          <Link href="/">
            <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>Log Out</button>
          </Link>
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
