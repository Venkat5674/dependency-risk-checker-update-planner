/**
 * @file DashboardPage.jsx
 * @description Central dashboard delivering live security telemetry from the DepSafe API.
 * Features KPI summary cards, severity breakdown charts, scan trend analytics,
 * and high-priority upgrade highlights.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  Package,
  TriangleAlert,
  Activity,
  Plus,
  ScanLine,
  ArrowUpRight,
  ShieldAlert,
  RefreshCw,
  GitPullRequestArrow,
} from 'lucide-react';
import { dashboardService } from '../services/dashboardService';
import { upgradeService } from '../services/upgradeService';
import StatCard from '../components/common/StatCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import SeverityChart from '../components/charts/SeverityChart';
import RiskTrendChart from '../components/charts/RiskTrendChart';
import { SeverityBadge, RiskPill, StatusPill } from '../components/common/Badge';
import { formatTimeAgo } from '../utils/formatters';

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const [topUpgrades, setTopUpgrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');

    try {
      const [sumRes, trendRes, scanRes, upgradeRes] = await Promise.all([
        dashboardService.summary(),
        dashboardService.trends(),
        dashboardService.recentScans(),
        upgradeService.list(),
      ]);

      setSummary(sumRes.data);
      setTrends(trendRes.data);
      setRecentScans(scanRes.data?.scans || []);
      setTopUpgrades((upgradeRes.data?.upgrades || []).slice(0, 5));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Calculating dependency risk scores..." />;
  }

  return (
    <>
      {/* Page Header */}
      <div className="page-head">
        <div>
          <div className="eyebrow">WORKSPACE SECURITY TELEMETRY</div>
          <h1>Security Overview</h1>
          <p>Real-time dependency posture and prioritized remediation actions.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="button secondary small" onClick={fetchDashboardData} title="Refresh metrics">
            <RefreshCw size={14} /> Refresh
          </button>
          <Link to="/app/projects/new" className="button small">
            <Plus size={15} /> Add Project
          </Link>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          {error}{' '}
          <button className="text-button" onClick={fetchDashboardData} style={{ color: 'inherit', padding: 0 }}>
            Retry
          </button>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="stats-grid">
        <StatCard
          label="Projects Monitored"
          value={summary?.projects ?? 0}
          icon={FolderKanban}
          tone="cyan"
          subtext="Active repositories"
        />
        <StatCard
          label="Dependencies Tracked"
          value={summary?.dependencies ?? 0}
          icon={Package}
          tone="amber"
          subtext="Direct + transitive"
        />
        <StatCard
          label="Open Vulnerabilities"
          value={summary?.vulnerabilities ?? 0}
          icon={TriangleAlert}
          tone="red"
          subtext={`${summary?.critical ?? 0} critical severity`}
        />
        <StatCard
          label="Latest Scan Risk"
          value={summary?.latestScan ? `${summary.latestScan.riskScore}/100` : 'None'}
          icon={Activity}
          tone="violet"
          subtext={summary?.latestScan ? `Status: ${summary.latestScan.status}` : 'No scans run yet'}
        />
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid-2">
        {/* Severity Distribution */}
        <section className="card">
          <div className="card-head">
            <div>
              <h2>Vulnerabilities by Severity</h2>
              <p>Active unmitigated vulnerabilities across your projects</p>
            </div>
          </div>
          <SeverityChart severities={trends?.severities || {}} />
        </section>

        {/* Scan Risk Progression */}
        <section className="card">
          <div className="card-head">
            <div>
              <h2>Risk Score Trend</h2>
              <p>Historical scan risk progression over recent scans</p>
            </div>
          </div>
          <RiskTrendChart scansTrend={trends?.scansTrend || []} />
        </section>
      </div>

      {/* Tables: Recent Scans and Recommended Upgrades */}
      <div className="grid-2">
        {/* Recent Scans Table */}
        <section className="card">
          <div className="card-head">
            <div>
              <h2>Recent Scans</h2>
              <p>Latest vulnerability analyses executed</p>
            </div>
            <Link to="/app/scans" className="link" style={{ fontSize: '13px' }}>
              View all scans
            </Link>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>PROJECT</th>
                  <th>STATUS</th>
                  <th>RISK</th>
                  <th>FINDINGS</th>
                  <th>TIME</th>
                </tr>
              </thead>
              <tbody>
                {recentScans.map((scan) => (
                  <tr key={scan._id}>
                    <td>
                      <Link to={`/app/scans/${scan._id}`} className="project-name">
                        <b>{scan.project?.name || 'Project'}</b>
                      </Link>
                    </td>
                    <td>
                      <StatusPill status={scan.status} />
                    </td>
                    <td>
                      <RiskPill score={scan.riskScore} />
                    </td>
                    <td>{scan.vulnerabilityCount ?? 0}</td>
                    <td>{formatTimeAgo(scan.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {recentScans.length === 0 && (
              <div className="empty-state">
                <ScanLine size={32} />
                <h3>No scans run yet</h3>
                <p>Create a project and run your first scan to populate this table.</p>
                <Link to="/app/projects/new" className="button small">
                  Create Project
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Priority Upgrade Recommendations */}
        <section className="card">
          <div className="card-head">
            <div>
              <h2>Top Upgrade Recommendations</h2>
              <p>Prioritized package updates resolving known advisories</p>
            </div>
            <Link to="/app/planner" className="link" style={{ fontSize: '13px' }}>
              Upgrade Planner
            </Link>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>PACKAGE</th>
                  <th>SEVERITY</th>
                  <th>FIX VERSION</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {topUpgrades.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <b>{item.packageName}</b>
                      <small className="table-sub">{item.installedVersion || 'unresolved'}</small>
                    </td>
                    <td>
                      <SeverityBadge severity={item.severity} />
                    </td>
                    <td>
                      {item.recommendation?.fixedVersion ? (
                        <span style={{ color: 'var(--green)', fontWeight: 600 }}>
                          {item.recommendation.fixedVersion}
                        </span>
                      ) : (
                        <span className="muted">No fix advisory</span>
                      )}
                    </td>
                    <td>
                      <Link to={`/app/vulnerabilities/${item._id}`} className="table-arrow">
                        <ArrowUpRight size={15} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {topUpgrades.length === 0 && (
              <div className="empty-state">
                <GitPullRequestArrow size={32} />
                <h3>No pending upgrades</h3>
                <p>No actionable vulnerabilities found or all advisories are resolved.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
