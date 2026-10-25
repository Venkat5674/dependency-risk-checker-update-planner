/**
 * @file RegisterPage.jsx
 * @description Account creation page with input validation for name, email, password,
 * password confirmation, and terms acknowledgment.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, ArrowLeft, Quote } from 'lucide-react';
import useAuth from '../hooks/useAuth';

export default function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    navigate('/app', { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 10) {
      setError('Password must be at least 10 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!agreed) {
      setError('You must accept the terms of service.');
      return;
    }

    setSubmitting(true);
    try {
      await register({ name, email, password });
      navigate('/app', { replace: true });
    } catch (err) {
      const serverMessage =
        err.response?.data?.errors?.[0]?.msg ||
        err.response?.data?.message ||
        (err.code === 'ERR_NETWORK'
          ? 'Network error: Cannot reach the backend API server on port 5000. Please verify the server is running.'
          : null) ||
        'Account registration failed. Please try again.';
      setError(serverMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-side">
        <Link className="logo" to="/">
          <span className="logo-mark">
            <ShieldCheck size={18} />
          </span>
          Dep<span>Safe</span>
        </Link>

        <div className="auth-quote">
          <Quote size={32} />
          <h2>Start securing dependencies today.</h2>
          <p>
            Connect manifests, pinpoint high-severity vulnerabilities, and get verified remediation roadmaps.
          </p>
          <div className="quote-person">
            <span className="avatar">DS</span>
            <span>
              <b>DepSafe Workspace</b>
              <small>Zero fake metrics · Evidence-based</small>
            </span>
          </div>
        </div>
      </div>

      <div className="auth-form">
        <div className="form-inner">
          <Link to="/" className="back-link">
            <ArrowLeft size={15} /> Back to home
          </Link>

          <h1>Create your account</h1>
          <p className="sub">Begin monitoring dependency risk across your software projects.</p>

          {error && <div className="error-banner">{error}</div>}

          <form onSubmit={handleSubmit}>
            <label>
              Full Name
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Morgan"
                required
                minLength={2}
                maxLength={80}
              />
            </label>

            <label>
              Work Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@company.com"
                required
              />
            </label>

            <label>
              Password (min. 10 characters)
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                minLength={10}
              />
            </label>

            <label>
              Confirm Password
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                minLength={10}
              />
            </label>

            <label className="check">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                required
              />
              I agree to the security policy and terms of service
            </label>

            <button type="submit" className="button full" disabled={submitting}>
              {submitting ? 'Creating account...' : 'Create Account'} <ArrowRight size={16} />
            </button>
          </form>

          <p className="switch">
            Already have an account?{' '}
            <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
