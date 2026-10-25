/**
 * @file Badge.jsx
 * @description Consistent visual badges for vulnerability severities, risk levels, and remediation states.
 */

import React from 'react';
import { getSeverityBadge, getRiskTier } from '../../utils/formatters';

export function SeverityBadge({ severity }) {
  const { tone, label } = getSeverityBadge(severity);
  return (
    <span className={`severity ${tone}`}>
      <i />
      {label}
    </span>
  );
}

export function RiskPill({ score = 0 }) {
  const { tone, label } = getRiskTier(score);
  return (
    <span className={`risk-pill ${tone}`}>
      <i />
      {score}/100 · {label}
    </span>
  );
}

export function StatusPill({ status = 'open' }) {
  const formatted = String(status).replace('_', ' ');
  return (
    <span className={`status-pill ${status}`}>
      {formatted}
    </span>
  );
}
