/**
 * @file VulnerabilitiesPage.jsx
 * @description Master catalog of detected vulnerabilities across all projects.
 * Supports filtering by severity, remediation status, and full-text search.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TriangleAlert,
  Search,
  Filter,
  ArrowUpRight,
  ShieldCheck,
  Download,
} from 'lucide-react';
import { vulnerabilityService } from '../services/vulnerabilityService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { SeverityBadge, RiskPill, StatusPill } from '../components/common/Badge';

export default function VulnerabilitiesPage() {
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  const loadVulnerabilities = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filterSeverity !== 'All') params.severity = filterSeverity.toLowerCase();
      if (filterStatus !== 'All') params.status = filterStatus.toLowerCase();
      if (search.trim()) params.search = search.trim();

      const res = await vulnerabilityService.list(params);
      setVulnerabilities(res.data?.vulnerabilities || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load vulnerabilities.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVulnerabilities();
  }, [filterSeverity, filterStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadVulnerabilities();
  };

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">SECURITY ADVISORIES</div>
          <h1>Vulnerabilities</h1>
          <p>Prioritize, analyze, and remediate CVE advisories discovered in project dependencies.</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Filter and Search Bar */}
      <div className="filters">
        <form onSubmit={handleSearchSubmit} className="search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by package, CVE ID, or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ fontSize: '12px', padding: '6px 10px', borderRadius: '6px' }}
          >
            <option value="All">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="accepted_risk">Accepted Risk</option>
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Querying vulnerability catalog..." />
      ) : (
        <section className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>VULNERABILITY ID</th>
                  <th>PACKAGE</th>
                  <th>INSTALLED</th>
                  <th>PROJECT</th>
                  <th>SEVERITY</th>
                  <th>RISK</th>
                  <th>FIX VERSION</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {vulnerabilities.map((v) => (
                  <tr key={v._id}>
                    <td>
                      <Link to={`/app/vulnerabilities/${v._id}`}>
                        <b style={{ fontFamily: "'DM Mono', monospace" }}>{v.vulnerabilityId}</b>
                      </Link>
                    </td>
                    <td>
                      <b>{v.packageName}</b>
                    </td>
                    <td>{v.installedVersion || 'unresolved'}</td>
                    <td>{v.project?.name || 'Unknown'}</td>
                    <td>
                      <SeverityBadge severity={v.severity} />
                    </td>
                    <td>
                      <RiskPill score={v.riskScore} />
                    </td>
                    <td>
                      {v.fixedVersions?.length ? (
                        <span style={{ color: 'var(--green)', fontWeight: 600 }}>
                          {v.fixedVersions[0]}
                        </span>
                      ) : (
                        <span className="muted">None reported</span>
                      )}
                    </td>
                    <td>
                      <StatusPill status={v.status} />
                    </td>
                    <td>
                      <Link to={`/app/vulnerabilities/${v._id}`} className="button small secondary">
                        Details <ArrowUpRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {vulnerabilities.length === 0 && (
              <div className="empty-state">
                <ShieldCheck size={34} color="var(--green)" />
                <h3>No vulnerabilities found</h3>
                <p>No active vulnerabilities match the current filter criteria.</p>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}
