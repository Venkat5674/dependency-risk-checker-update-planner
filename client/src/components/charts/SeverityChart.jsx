/**
 * @file SeverityChart.jsx
 * @description Chart visualizing active vulnerabilities categorized by severity tier using Recharts.
 */

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const SEVERITY_COLORS = {
  Critical: '#df5b68',
  High: '#e5aa3d',
  Medium: '#63b5bd',
  Low: '#1a9b6c',
  Unknown: '#999cac',
};

export default function SeverityChart({ severities = {} }) {
  const data = [
    { name: 'Critical', count: severities.critical || 0 },
    { name: 'High', count: severities.high || 0 },
    { name: 'Medium', count: severities.medium || 0 },
    { name: 'Low', count: severities.low || 0 },
    { name: 'Unknown', count: severities.unknown || 0 },
  ];

  const total = data.reduce((sum, item) => sum + item.count, 0);

  if (total === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '30px 10px', color: '#999cac', fontSize: '13px' }}>
        No active vulnerabilities detected. All monitored packages are clean!
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis dataKey="name" stroke="#999cac" fontSize={11} tickLine={false} />
          <YAxis stroke="#999cac" fontSize={11} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              background: '#151827',
              borderColor: '#222538',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '12px',
            }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={SEVERITY_COLORS[entry.name] || '#6d5ce7'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
