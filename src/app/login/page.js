'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

function LoginForm() {
  const [settings, setSettings] = useState(null);
  const [username1, setUsername1] = useState('');
  const [username2, setUsername2] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/settings/login-page');
        const data = await res.json();
        setSettings(data);
      } catch (err) {
        console.error('Failed to load settings', err);
      }
    }
    fetchSettings();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    const u1 = username1.trim();
    const u2 = username2.trim();

    if (!u1) {
      setError(`Please enter ${settings?.username_1_label || 'Username 1'}.`);
      return;
    }
    if (!u2) {
      setError(`Please enter ${settings?.username_2_label || 'Username 2'}.`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username1: u1, username2: u2 }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const playQuiz = searchParams.get('playQuiz');
        if (playQuiz) {
          router.push(`/dashboard?playQuiz=${playQuiz}`);
        } else {
          router.push(data.redirect || '/dashboard');
        }
      } else {
        setError(data.error || 'Login failed. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  if (!settings) return null; // Wait for settings to load

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        
        {settings.logo_url ? (
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
            <img src={settings.logo_url} alt="CYFQ Logo" style={{ maxHeight: '80px', maxWidth: '100%', objectFit: 'contain' }} />
          </div>
        ) : (
          <h2 style={{ marginBottom: '0.5rem', color: 'var(--accent-primary)' }}>CYFQ</h2>
        )}

        <h2 style={{ marginBottom: '0.5rem', color: 'var(--accent-primary)' }}>{settings.login_title}</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>{settings.login_subtitle}</p>
        
        {error && <div className="error-msg" style={{ textAlign: 'left' }}>{error}</div>}

        <form onSubmit={handleLogin} style={{ textAlign: 'left' }}>
          <div className="input-group">
            <label htmlFor="username1">{settings.username_1_label}</label>
            <input 
              id="username1"
              type="text" 
              className="input-field" 
              placeholder={settings.username_1_placeholder}
              value={username1} 
              onChange={(e) => setUsername1(e.target.value)} 
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="username2">{settings.username_2_label}</label>
            <input 
              id="username2"
              type="text" 
              className="input-field" 
              placeholder={settings.username_2_placeholder}
              value={username2} 
              onChange={(e) => setUsername2(e.target.value)} 
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Logging in...' : settings.login_button_text}
          </button>
        </form>
        
        {settings.login_footer_text && (
          <div style={{ marginTop: '2rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {settings.login_footer_text}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
