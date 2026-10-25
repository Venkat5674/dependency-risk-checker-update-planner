/**
 * @file AppLayout.jsx
 * @description Master authenticated layout shell including responsive sidebar,
 * top navigation bar, active breadcrumb indicator, and user account actions.
 */

import React, { useState } from 'react';
import { NavLink, Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  LayoutDashboard,
  FolderKanban,
  ScanLine,
  TriangleAlert,
  GitPullRequestArrow,
  ScrollText,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronsUpDown,
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/app', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/app/projects', label: 'Projects', icon: FolderKanban },
    { to: '/app/scans', label: 'Scans', icon: ScanLine },
    { to: '/app/vulnerabilities', label: 'Vulnerabilities', icon: TriangleAlert },
    { to: '/app/planner', label: 'Upgrade Planner', icon: GitPullRequestArrow },
    { to: '/app/audit', label: 'Audit Logs', icon: ScrollText },
  ];

  // Derive human-readable breadcrumb label from URL pathname
  const getBreadcrumb = () => {
    const parts = location.pathname.split('/').filter(Boolean);
    if (parts.length <= 1) return 'Overview';
    const last = parts[parts.length - 1];
    return last.replace(/-/g, ' ');
  };

  const initials = (user?.name || 'User')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="app-shell">
      {/* Sidebar Navigation */}
      <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="side-top">
          <Link className="logo" to="/app">
            <span className="logo-mark">
              <ShieldCheck size={18} />
            </span>
            Dep<span>Safe</span>
          </Link>
          <button
            className="icon-btn mobile-close"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <div className="workspace">
          <span className="workspace-dot" />
          <span>DepSafe Workspace</span>
          <ChevronsUpDown size={14} />
        </div>

        <nav className="side-nav">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Icon size={17} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="side-bottom">
          <NavLink to="/app/settings" onClick={() => setMobileMenuOpen(false)}>
            <Settings size={17} />
            <span>Settings</span>
          </NavLink>

          <div className="profile">
            <span className="avatar">{initials}</span>
            <span>
              <b>{user?.name || 'Account'}</b>
              <small>{user?.role || 'user'}</small>
            </span>
            <button
              className="icon-btn"
              onClick={handleLogout}
              title="Log out"
              aria-label="Log out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="main-area">
        <header className="topbar">
          <button
            className="icon-btn menu-btn"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>

          <div className="crumb">{getBreadcrumb()}</div>

          <div className="top-actions">
            <div className="top-avatar">{initials}</div>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
