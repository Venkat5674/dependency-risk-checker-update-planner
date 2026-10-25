/**
 * @file RiskTrendChart.jsx
 * @description Chart visualizing historical vulnerability scan risk progression over time.
 */

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function RiskTrendChart({ scansTrend = [] }) {
  if (!scansTrend || scansTrend.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '30px 10px', color: '#999cac', fontSize: '13px' }}>
        Run multiple scans to observe risk score trends over time.
      </div>
    );
  }

  const data = scansTrend.map((scan, index) => {
    const date = scan.createdAt ? new Date(scan.createdAt).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }) : `#${index + 1}`;
    return {
      date,
      riskScore: scan.riskScore || 0,
      vulnerabilities: scan.vulnerabilityCount || 0,
    };
  });

  return (
    <div style={{ width: '100%', height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6d5ce7" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#6d5ce7" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" stroke="#999cac" fontSize={11} tickLine={false} />
          <YAxis stroke="#999cac" fontSize={11} domain={[0, 100]} />
          <Tooltip
            contentStyle={{
              background: '#151827',
              borderColor: '#222538',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '12px',
            }}
          />
          <Area
            type="monotone"
            dataKey="riskScore"
            stroke="#6d5ce7"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#riskGradient)"
            name="Risk Score (0-100)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
