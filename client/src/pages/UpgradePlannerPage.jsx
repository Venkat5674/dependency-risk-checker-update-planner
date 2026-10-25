/**
 * @file UpgradePlannerPage.jsx
 * @description Prioritized dependency upgrade planning dashboard.
 * Delivers transparent upgrade guidance, breaking change warnings, fix availability filters,
 * and direct links to verify advisories and release notes.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  GitPullRequestArrow,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  ArrowRight,
  ShieldAlert,
  ArrowUpRight,
} from 'lucide-react';
import { upgradeService } from '../services/upgradeService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { SeverityBadge, RiskPill, StatusPill } from '../components/common/Badge';

export default function UpgradePlannerPage() {
  const [upgrades, setUpgrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('All');
  const [filterFix, setFilterFix] = useState('All'); // 'All' | 'has_fix' | 'no_fix'

  const loadUpgrades = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filterSeverity !== 'All') params.severity = filterSeverity.toLowerCase();
      const res = await upgradeService.list(params);
      setUpgrades(res.data?.upgrades || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load upgrade recommendations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUpgrades();
  }, [filterSeverity]);

  const filtered = upgrades.filter((u) => {
    if (filterFix === 'has_fix') return u.recommendation?.isFixAvailable;
    if (filterFix === 'no_fix') return !u.recommendation?.isFixAvailable;
    return true;
  });

  const availableFixesCount = upgrades.filter((u) => u.recommendation?.isFixAvailable).length;

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">REMEDIATION INTELLIGENCE</div>
          <h1>Upgrade Planner</h1>
          <p>Prioritized package remediation plans based on verified security advisory fixes.</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Advisory Banner */}
      <div className="planner-banner">
        <span>
          <Sparkles size={22} />
        </span>
        <div>
          <b>Actionable Security Upgrades Available</b>
          <p>
            {availableFixesCount > 0
              ? `We identified ${availableFixesCount} dependencies with published fix versions ready for upgrade testing.`
              : 'All detected advisories currently lack published upstream patches or are already mitigated.'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters">
        <div className="filter-tabs">
          {['All', 'Critical', 'High', 'Medium', 'Low'].map((sev) => (
            <button
              key={sev}
              className={filterSeverity === sev ? 'active' : ''}
              onClick={() => setFilterSeverity(sev)}
            >
              {sev}
            </button>
          ))}
        </div>

        <select
          value={filterFix}
          onChange={(e) => setFilterFix(e.target.value)}
          style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '6px' }}
        >
          <option value="All">All Advisories</option>
          <option value="has_fix">Fix Available</option>
          <option value="no_fix">No Fix Yet</option>
        </select>
      </div>

      {loading ? (
        <LoadingSpinner message="Calculating upgrade roadmaps..." />
      ) : (
        <section className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>PACKAGE</th>
                  <th>CURRENT</th>
                  <th>RECOMMENDED TARGET</th>
                  <th>SEVERITY</th>
                  <th>RISK</th>
                  <th>PROJECT</th>
                  <th>STATUS</th>
                  <th>UPGRADE GUIDANCE</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <b style={{ fontSize: '13px' }}>{item.packageName}</b>
                      <small className="table-sub">{item.vulnerabilityId}</small>
                    </td>
                    <td>
                      <code>{item.installedVersion || 'unresolved'}</code>
                    </td>
                    <td>
                      {item.recommendation?.fixedVersion ? (
                        <span style={{ color: 'var(--green)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {item.recommendation.fixedVersion} <ArrowUpRight size={13} />
                        </span>
                      ) : (
                        <span className="muted" style={{ fontStyle: 'italic' }}>
                          No fix published
                        </span>
                      )}
                    </td>
                    <td>
                      <SeverityBadge severity={item.severity} />
                    </td>
                    <td>
                      <RiskPill score={item.riskScore} />
                    </td>
                    <td>{item.project?.name || 'Unknown'}</td>
                    <td>
                      <StatusPill status={item.status} />
                    </td>
                    <td style={{ maxWidth: '280px', whiteSpace: 'normal', fontSize: '12px', lineHeight: 1.4 }}>
                      {item.recommendation?.action}
                    </td>
                    <td>
                      <Link to={`/app/vulnerabilities/${item._id}`} className="button small secondary">
                        Remediate
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="empty-state">
                <CheckCircle size={32} color="var(--green)" />
                <h3>No pending upgrade plans</h3>
                <p>All dependencies are clean or match the selected filters.</p>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}
