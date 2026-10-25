/**
 * @file formatters.js
 * @description Utility helpers for formatting dates, risk tags, and severity labels.
 */

/**
 * Format ISO date string into readable local timestamp
 */
export const formatDate = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format relative time (e.g. "5 minutes ago", "2 days ago")
 */
export const formatTimeAgo = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
};

/**
 * Return CSS color tone and label for severity
 */
export const getSeverityBadge = (severity) => {
  const norm = String(severity || 'unknown').toLowerCase();
  switch (norm) {
    case 'critical':
      return { tone: 'critical', label: 'Critical', bg: 'bg-red-500/10 text-red-400 border-red-500/30' };
    case 'high':
      return { tone: 'high', label: 'High', bg: 'bg-orange-500/10 text-orange-400 border-orange-500/30' };
    case 'medium':
      return { tone: 'medium', label: 'Medium', bg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' };
    case 'low':
      return { tone: 'low', label: 'Low', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
    default:
      return { tone: 'unknown', label: 'Unknown', bg: 'bg-gray-500/10 text-gray-400 border-gray-500/30' };
  }
};

/**
 * Return risk tier info based on 0-100 score
 */
export const getRiskTier = (score = 0) => {
  if (score >= 70) return { label: 'High Risk', tone: 'danger', color: '#ef4444' };
  if (score >= 40) return { label: 'Moderate Risk', tone: 'warn', color: '#f59e0b' };
  if (score > 0) return { label: 'Low Risk', tone: 'safe', color: '#10b981' };
  return { label: 'Clean / No Findings', tone: 'clean', color: '#6366f1' };
};
