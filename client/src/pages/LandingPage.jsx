/**
 * @file LandingPage.jsx
 * @description Public marketing and landing page introducing DepSafe's security capabilities,
 * supported ecosystems (npm, PyPI, Maven), and transparent risk scoring workflows.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  Layers,
  Lock,
  GitPullRequest,
  CheckCircle,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="landing">
      {/* Top Public Navigation */}
      <nav className="public-nav">
        <Link className="logo" to="/">
          <span className="logo-mark">
            <ShieldCheck size={19} />
          </span>
          Dep<span>Safe</span>
        </Link>
        <div>
          <Link to="/login" className="muted-link">
            Sign In
          </Link>
          <Link to="/register" className="button small">
            Get Started <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="hero">
        <div className="eyebrow">
          <span className="pulse" />
          DEPENDENCY SECURITY & UPGRADE PLANNER
        </div>
        <h1>
          Ship faster.<br />
          <em>Stay secure.</em>
        </h1>
        <p>
          DepSafe helps software engineering teams identify vulnerable open-source dependencies,
          calculate transparent risk scores, and safely plan prioritized package upgrades without breaking builds.
        </p>

        <div className="hero-actions">
          <Link to="/register" className="button">
            Start Securing Projects <ArrowUpRight size={17} />
          </Link>
          <Link to="/login" className="text-button">
            Sign In to Workspace <ChevronRight size={16} />
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div style={{ marginTop: '80px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          <div className="card" style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)' }}>
            <div className="stat-icon violet">
              <Layers size={18} />
            </div>
            <h3 style={{ margin: '0 0 8px', font: '700 16px Manrope' }}>Multi-Ecosystem Support</h3>
            <p className="muted" style={{ fontSize: '13px', lineHeight: 1.6, margin: 0 }}>
              Safely parse <code>package.json</code>, <code>package-lock.json</code>, <code>requirements.txt</code>, and <code>pom.xml</code> without executing arbitrary package scripts.
            </p>
          </div>

          <div className="card" style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)' }}>
            <div className="stat-icon cyan">
              <Lock size={18} />
            </div>
            <h3 style={{ margin: '0 0 8px', font: '700 16px Manrope' }}>Authoritative Security Data</h3>
            <p className="muted" style={{ fontSize: '13px', lineHeight: 1.6, margin: 0 }}>
              Powered directly by the Open Source Vulnerabilities (OSV) database. Retrieve exact CVE/GHSA advisories, CVSS vectors, and affected version ranges.
            </p>
          </div>

          <div className="card" style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)' }}>
            <div className="stat-icon green">
              <GitPullRequest size={18} />
            </div>
            <h3 style={{ margin: '0 0 8px', font: '700 16px Manrope' }}>Transparent Upgrade Planner</h3>
            <p className="muted" style={{ fontSize: '13px', lineHeight: 1.6, margin: 0 }}>
              Actionable, verified upgrade guidance. We never fabricate unreleased patches or blindly force breakages.
            </p>
          </div>
        </div>

        {/* Trusted By strip */}
        <div className="trust">
          <span>POWERING SECURE DEVSECOPS TEAMS</span>
          <b>npm</b>
          <b>PyPI</b>
          <b>Maven</b>
          <b>OSV.dev</b>
        </div>
      </main>

      <div className="hero-glow" />
    </div>
  );
}
