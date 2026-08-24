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

  const isButtonDisabled = loading || username1.trim() === '' || username2.trim() === '';

  return (
    <>
      <style>{`
        .login-page-bg {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background-color: #FAFAFA;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          padding: 1rem;
        }
        .minimal-card {
          background-color: #FFFFFF;
          border: 1px solid #DBDBDB;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
          width: 100%;
          max-width: 380px;
          text-align: center;
          padding: 2.5rem 2rem;
        }
        .minimal-input-group {
          margin-bottom: 0.75rem;
          text-align: left;
        }
        .minimal-label {
          display: block;
          color: #262626;
          font-size: 0.85rem;
          font-weight: 600;
          margin-bottom: 0.3rem;
        }
        .minimal-input {
          width: 100%;
          background-color: #FFFFFF;
          border: 1px solid #DBDBDB;
          border-radius: 6px;
          padding: 0.75rem;
          font-size: 0.95rem;
          color: #262626;
          outline: none;
          transition: border-color 0.2s ease;
          box-sizing: border-box;
        }
        .minimal-input::placeholder {
          color: #8E8E8E;
        }
        .minimal-input:focus {
          border-color: #0095F6;
        }
        .minimal-btn {
          width: 100%;
          background-color: #0095F6;
          color: #FFFFFF;
          border: none;
          border-radius: 8px;
          padding: 0.75rem;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          margin-top: 1rem;
          transition: background-color 0.2s ease, opacity 0.2s ease;
        }
        .minimal-btn:disabled {
          background-color: #B2DFFC;
          cursor: default;
        }
        .minimal-btn:not(:disabled):hover {
          opacity: 0.85;
        }
        .minimal-error {
          color: #ED4956;
          font-size: 0.9rem;
          margin-bottom: 1rem;
          text-align: center;
        }
      `}</style>

      <div className="login-page-bg">
        <div className="minimal-card">
          
          {settings.logo_url ? (
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
              <img src={settings.logo_url} alt="CYFQ Logo" style={{ maxHeight: '60px', maxWidth: '100%', objectFit: 'contain' }} />
            </div>
          ) : (
            <h2 style={{ marginBottom: '1rem', color: '#262626', fontSize: '2rem', fontWeight: 'bold' }}>CYFQ</h2>
          )}

          <h2 style={{ marginBottom: '0.5rem', color: '#262626', fontSize: '1.1rem', fontWeight: '600' }}>{settings.login_title}</h2>
          <p style={{ color: '#8E8E8E', marginBottom: '2rem', fontSize: '0.9rem' }}>{settings.login_subtitle}</p>
          
          {error && <div className="minimal-error">{error}</div>}

          <form onSubmit={handleLogin} style={{ textAlign: 'left' }}>
            <div className="minimal-input-group">
              <label htmlFor="username1" className="minimal-label">{settings.username_1_label}</label>
              <input 
                id="username1"
                type="text" 
                className="minimal-input" 
                placeholder={settings.username_1_placeholder}
                value={username1} 
                onChange={(e) => setUsername1(e.target.value)} 
              />
            </div>
            
            <div className="minimal-input-group">
              <label htmlFor="username2" className="minimal-label">{settings.username_2_label}</label>
              <input 
                id="username2"
                type="text" 
                className="minimal-input" 
                placeholder={settings.username_2_placeholder}
                value={username2} 
                onChange={(e) => setUsername2(e.target.value)} 
              />
            </div>
            
            <button 
              type="submit" 
              className="minimal-btn" 
              disabled={isButtonDisabled}
            >
              {loading ? 'Logging in...' : settings.login_button_text}
            </button>
          </form>
          
          {settings.login_footer_text && (
            <div style={{ marginTop: '2rem', color: '#8E8E8E', fontSize: '0.85rem' }}>
              {settings.login_footer_text}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
