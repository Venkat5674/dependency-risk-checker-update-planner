/**
 * @file StatCard.jsx
 * @description Card component displaying a high-level KPI metric with an icon and trend label.
 */

import React from 'react';

export default function StatCard({ label, value, subtext, icon: Icon, tone = 'violet' }) {
  return (
    <div className="stat">
      <div className={`stat-icon ${tone}`}>
        {Icon && <Icon size={19} />}
      </div>
      <span>{label}</span>
      <strong>{value ?? '—'}</strong>
      {subtext && <small>{subtext}</small>}
    </div>
  );
}
