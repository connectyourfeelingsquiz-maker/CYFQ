'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function LoginPageSettings() {
  const [settings, setSettings] = useState({
    login_title: '',
    login_subtitle: '',
    username_1_label: '',
    username_2_label: '',
    username_1_placeholder: '',
    username_2_placeholder: '',
    login_button_text: '',
    login_footer_text: '',
    logo_url: '',
    logo_path: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

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
    setErrorMsg('');
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
        setErrorMsg('Failed to save settings.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Image file size must be less than 2MB.');
      return;
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMsg('Unsupported file format. Please upload PNG, JPG, WEBP, or SVG.');
      return;
    }

    setUploadingLogo(true);
    setErrorMsg('');
    setSuccessMsg('');

    const formData = new FormData();
    formData.append('logo', file);

    try {
      const res = await fetch('/api/settings/logo', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Update local state, still requires clicking 'Save Changes' to update DB settings
        setSettings(prev => ({ ...prev, logo_url: data.url, logo_path: data.path }));
        setSuccessMsg('Logo uploaded! Click "Save Changes" to apply.');
      } else {
        setErrorMsg(data.error || 'Failed to upload logo.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('An error occurred during upload.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!settings.logo_path && !settings.logo_url) return;

    if (!confirm('Remove the current CYFQ logo?')) return;

    try {
      if (settings.logo_path) {
        await fetch(`/api/settings/logo?path=${settings.logo_path}`, { method: 'DELETE' });
      }
      
      const newSettings = { ...settings, logo_url: '', logo_path: '' };
      setSettings(newSettings);

      // Auto-save the empty logo setting
      await fetch('/api/settings/login-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });

      setSuccessMsg('Logo removed successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
      setErrorMsg('An error occurred while removing the logo.');
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
      
      {errorMsg && (
        <div style={{ padding: '1rem', background: 'rgba(244, 63, 94, 0.1)', color: 'var(--accent-danger)', border: '1px solid rgba(244, 63, 94, 0.2)', borderRadius: '8px', marginBottom: '2rem' }}>
          {errorMsg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Editor Form */}
        <div>
          <div className="glass-card" style={{ marginBottom: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Login Page Branding</h2>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Current Logo</label>
              <div style={{ padding: '1rem', background: 'var(--bg-primary)', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100px', border: '1px solid var(--glass-border)' }}>
                {settings.logo_url ? (
                  <img src={settings.logo_url} alt="CYFQ Logo" style={{ maxHeight: '80px', maxWidth: '100%', objectFit: 'contain' }} />
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>Default CYFQ Text Branding</span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', overflow: 'hidden' }}>
                <button className="btn btn-secondary" disabled={uploadingLogo}>
                  {uploadingLogo ? 'Uploading...' : 'Upload New Logo'}
                </button>
                <input 
                  type="file" 
                  accept="image/png, image/jpeg, image/webp, image/svg+xml"
                  onChange={handleLogoUpload}
                  style={{ position: 'absolute', top: 0, left: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                />
              </div>
              
              {settings.logo_url && (
                <button className="btn btn-secondary" onClick={handleRemoveLogo} style={{ borderColor: 'var(--accent-danger)', color: 'var(--accent-danger)' }}>
                  Remove Logo
                </button>
              )}
            </div>
            <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Supported formats: PNG, JPG, WEBP, SVG. Max size: 2MB.</p>
          </div>

          <div className="glass-card">
            <h2 style={{ marginBottom: '1.5rem' }}>Edit Content</h2>
            
            <div className="input-group">
              <label>Page Title</label>
              <input type="text" className="input-field" name="login_title" value={settings.login_title || ''} onChange={handleChange} />
            </div>
            <div className="input-group">
              <label>Page Subtitle</label>
              <input type="text" className="input-field" name="login_subtitle" value={settings.login_subtitle || ''} onChange={handleChange} />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label>Username 1 Label</label>
                <input type="text" className="input-field" name="username_1_label" value={settings.username_1_label || ''} onChange={handleChange} />
              </div>
              <div className="input-group">
                <label>Username 2 Label</label>
                <input type="text" className="input-field" name="username_2_label" value={settings.username_2_label || ''} onChange={handleChange} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label>Username 1 Placeholder</label>
                <input type="text" className="input-field" name="username_1_placeholder" value={settings.username_1_placeholder || ''} onChange={handleChange} />
              </div>
              <div className="input-group">
                <label>Username 2 Placeholder</label>
                <input type="text" className="input-field" name="username_2_placeholder" value={settings.username_2_placeholder || ''} onChange={handleChange} />
              </div>
            </div>

            <div className="input-group">
              <label>Login Button Text</label>
              <input type="text" className="input-field" name="login_button_text" value={settings.login_button_text || ''} onChange={handleChange} />
            </div>
            <div className="input-group">
              <label>Footer Text</label>
              <input type="text" className="input-field" name="login_footer_text" value={settings.login_footer_text || ''} onChange={handleChange} />
            </div>

            <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ marginTop: '1rem', width: '100%' }}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
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
              
              {settings.logo_url ? (
                <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
                  <img src={settings.logo_url} alt="CYFQ Logo" style={{ maxHeight: '80px', maxWidth: '100%', objectFit: 'contain' }} />
                </div>
              ) : (
                <h2 style={{ marginBottom: '0.5rem', color: 'var(--accent-primary)' }}>CYFQ</h2>
              )}

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
