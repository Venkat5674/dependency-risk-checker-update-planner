/**
 * @file LoginPage.jsx
 * @description Authentication page for existing users to sign in.
 * Includes client-side input validation, error handling, and redirection upon success.
 */

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, ArrowRight, ArrowLeft, Quote } from 'lucide-react';
import useAuth from '../hooks/useAuth';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // If already logged in, redirect to intended target or /app
  const from = location.state?.from?.pathname || '/app';

  if (user) {
    navigate(from, { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      const serverMessage =
        err.response?.data?.errors?.[0]?.msg ||
        err.response?.data?.message ||
        (err.code === 'ERR_NETWORK'
          ? 'Network error: Cannot reach the backend API server on port 5000. Please verify the server is running.'
          : null) ||
        'Unable to sign in. Please verify your email and password.';
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
          <h2>Security shouldn't block delivery.</h2>
          <p>
            Gain continuous clarity on known CVEs, evaluate exposure realistically,
            and upgrade dependencies with verifiable confidence.
          </p>
          <div className="quote-person">
            <span className="avatar">DS</span>
            <span>
              <b>DepSafe Engine</b>
              <small>Automated Security Intelligence</small>
            </span>
          </div>
        </div>
      </div>

      <div className="auth-form">
        <div className="form-inner">
          <Link to="/" className="back-link">
            <ArrowLeft size={15} /> Back to home
          </Link>

          <h1>Welcome back</h1>
          <p className="sub">Sign in to your vulnerability management workspace.</p>

          {error && <div className="error-banner">{error}</div>}

          <form onSubmit={handleSubmit}>
            <label>
              Work Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@company.com"
                required
                autoComplete="email"
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                autoComplete="current-password"
              />
            </label>

            <button type="submit" className="button full" disabled={submitting}>
              {submitting ? 'Signing in...' : 'Sign In'} <ArrowRight size={16} />
            </button>
          </form>

          <p className="switch">
            Don't have an account?{' '}
            <Link to="/register">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
