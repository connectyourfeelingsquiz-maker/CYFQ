'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ShareQuizPage({ params }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    // Generate the absolute URL for sharing
    const url = `${window.location.origin}/quiz/${params.id}`;
    setShareUrl(url);
  }, [params.id]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '500px', textAlign: 'center', padding: '3rem 2rem' }}>
        
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
        <h1 style={{ color: 'var(--accent-primary)', marginBottom: '1rem' }}>Your CYFQ is ready</h1>
        
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1.125rem' }}>
          Send this link to your friends and see who really knows you.
        </p>

        <div style={{ 
          background: 'var(--bg-primary)', 
          padding: '1rem', 
          borderRadius: '8px', 
          border: '1px solid var(--glass-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <input 
            type="text" 
            readOnly 
            value={shareUrl} 
            style={{ 
              flex: 1, 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--text-primary)', 
              outline: 'none',
              fontSize: '1rem'
            }} 
          />
        </div>

        <button 
          onClick={handleCopy} 
          className="btn btn-primary" 
          style={{ width: '100%', padding: '1rem', marginBottom: '1rem' }}
        >
          {copied ? 'Link Copied!' : 'Copy Link'}
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Link href={`/quiz/${params.id}`} style={{ width: '100%' }}>
            <button className="btn btn-secondary" style={{ width: '100%' }}>Play Quiz</button>
          </Link>
          <Link href="/dashboard" style={{ width: '100%' }}>
            <button className="btn btn-secondary" style={{ width: '100%' }}>Dashboard</button>
          </Link>
        </div>
        
      </div>
    </div>
  );
}
