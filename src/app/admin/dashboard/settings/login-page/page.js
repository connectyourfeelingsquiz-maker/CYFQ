'use client';

import { useState, useEffect } from 'react';

export default function LoginPageSettings() {
  const [settings, setSettings] = useState({
    login_title: '',
    login_subtitle: '',
    username_1_label: '',
    username_2_label: '',
    username_1_placeholder: '',
    username_2_placeholder: '',
    login_button_text: '',
    login_footer_text: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/settings/login-page');
        const data = await res.json();
        setSettings(data);
      } catch (err) {
        console.error('Failed to load settings', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg('');
    try {
      const res = await fetch('/api/settings/login-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setSuccessMsg('Login page settings updated successfully.');
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        alert('Failed to save settings.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading settings...</div>;

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Login Page Settings</h1>
      
      {successMsg && (
        <div style={{ padding: '1rem', background: 'rgba(52, 211, 153, 0.1)', color: 'var(--accent-success)', border: '1px solid rgba(52, 211, 153, 0.2)', borderRadius: '8px', marginBottom: '2rem' }}>
          {successMsg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Editor Form */}
        <div className="glass-card">
          <h2 style={{ marginBottom: '1.5rem' }}>Edit Content</h2>
          
          <div className="input-group">
            <label>Page Title</label>
            <input type="text" className="input-field" name="login_title" value={settings.login_title} onChange={handleChange} />
          </div>
          <div className="input-group">
            <label>Page Subtitle</label>
            <input type="text" className="input-field" name="login_subtitle" value={settings.login_subtitle} onChange={handleChange} />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label>Username 1 Label</label>
              <input type="text" className="input-field" name="username_1_label" value={settings.username_1_label} onChange={handleChange} />
            </div>
            <div className="input-group">
              <label>Username 2 Label</label>
              <input type="text" className="input-field" name="username_2_label" value={settings.username_2_label} onChange={handleChange} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label>Username 1 Placeholder</label>
              <input type="text" className="input-field" name="username_1_placeholder" value={settings.username_1_placeholder} onChange={handleChange} />
            </div>
            <div className="input-group">
              <label>Username 2 Placeholder</label>
              <input type="text" className="input-field" name="username_2_placeholder" value={settings.username_2_placeholder} onChange={handleChange} />
            </div>
          </div>

          <div className="input-group">
            <label>Login Button Text</label>
            <input type="text" className="input-field" name="login_button_text" value={settings.login_button_text} onChange={handleChange} />
          </div>
          <div className="input-group">
            <label>Footer Text</label>
            <input type="text" className="input-field" name="login_footer_text" value={settings.login_footer_text} onChange={handleChange} />
          </div>

          <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ marginTop: '1rem' }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Live Preview */}
        <div>
          <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Live Preview</h2>
          <div style={{ 
            border: '2px dashed var(--glass-border)', 
            borderRadius: '16px', 
            padding: '2rem', 
            display: 'flex', 
            justifyContent: 'center', 
            background: 'var(--bg-primary)' 
          }}>
            <div className="glass-card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
              <h2 style={{ marginBottom: '0.5rem', color: 'var(--accent-primary)' }}>{settings.login_title}</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>{settings.login_subtitle}</p>
              
              <div style={{ textAlign: 'left' }}>
                <div className="input-group">
                  <label>{settings.username_1_label}</label>
                  <input type="text" className="input-field" placeholder={settings.username_1_placeholder} disabled />
                </div>
                
                <div className="input-group">
                  <label>{settings.username_2_label}</label>
                  <input type="text" className="input-field" placeholder={settings.username_2_placeholder} disabled />
                </div>
                
                <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', cursor: 'default' }} disabled>
                  {settings.login_button_text}
                </button>
              </div>
              
              {settings.login_footer_text && (
                <div style={{ marginTop: '2rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  {settings.login_footer_text}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
