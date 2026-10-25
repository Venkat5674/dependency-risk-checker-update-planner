/**
 * @file SettingsPage.jsx
 * @description Workspace and user profile settings page.
 * Strictly adheres to security rules by never exposing JWT secrets or environment variables.
 */

import React, { useState } from 'react';
import { User, Shield, CheckCircle } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import { authService } from '../services/authService';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess('');
    setError('');

    try {
      const res = await authService.updateProfile({ name });
      if (res.data?.user) {
        updateUser(res.data.user);
        setSuccess('Profile updated successfully.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '680px' }}>
      <div className="page-head">
        <div>
          <div className="eyebrow">ACCOUNT & PREFERENCES</div>
          <h1>Settings</h1>
          <p>Manage your account profile and workspace configuration.</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {success && (
        <div style={{ background: '#e8f8f1', border: '1px solid #c2ebd7', color: 'var(--green)', padding: '11px 15px', borderRadius: '6px', marginBottom: '18px', fontSize: '13px' }}>
          {success}
        </div>
      )}

      <div className="card">
        <h2 style={{ fontSize: '17px', margin: '0 0 16px' }}>Profile Details</h2>

        <form onSubmit={handleSave} style={{ display: 'grid', gap: '18px' }}>
          <label>
            Full Name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              maxLength={80}
            />
          </label>

          <label>
            Email Address
            <input
              type="email"
              value={user?.email || ''}
              disabled
              style={{ background: '#f8f9fa', color: 'var(--muted)', cursor: 'not-allowed' }}
            />
            <small style={{ color: 'var(--muted)', fontSize: '11px' }}>
              Email address cannot be changed once verified.
            </small>
          </label>

          <label>
            Role
            <input
              type="text"
              value={user?.role || 'user'}
              disabled
              style={{ background: '#f8f9fa', color: 'var(--muted)', cursor: 'not-allowed', textTransform: 'capitalize' }}
            />
          </label>

          <div className="form-actions">
            <button type="submit" className="button" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
