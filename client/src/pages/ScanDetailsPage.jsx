/**
 * @file ScanDetailsPage.jsx
 * @description Dedicated scan analysis view showing scan metrics, severity breakdown,
 * findings table with search and filtering, export capabilities (JSON/CSV), and failure retries.
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ScanLine,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle,
  FileText,
  Activity,
  Layers,
} from 'lucide-react';
import { scanService } from '../services/scanService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatCard from '../components/common/StatCard';
import { SeverityBadge, RiskPill, StatusPill } from '../components/common/Badge';
import { formatDate } from '../utils/formatters';

export default function ScanDetailsPage() {
  const { id } = useParams();

  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('All');
  const [search, setSearch] = useState('');

  const loadScan = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await scanService.get(id);
      setScan(res.data?.scan);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve scan report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScan();

    // Auto-poll if status is currently queued or running
    const interval = setInterval(async () => {
      if (scan && (scan.status === 'queued' || scan.status === 'running')) {
        try {
          const res = await scanService.status(id);
          setScan(res.data?.scan);
        } catch {
          // ignore polling errors
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [id, scan?.status]);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await scanService.retry(id);
      await loadScan();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to retry scan.');
    } finally {
      setRetrying(false);
    }
  };

  const exportToJson = () => {
    if (!scan) return;
    const blob = new Blob([JSON.stringify(scan, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `depsafe-scan-${scan._id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToCsv = () => {
    if (!scan || !scan.findings?.length) return;
    const headers = ['Vulnerability ID', 'Package', 'Severity', 'Installed Version', 'Fixed Versions', 'Risk Score'];
    const rows = scan.findings.map((f) => [
      f.vulnerabilityId,
      f.packageName,
      f.severity,
      f.installedVersion || 'unknown',
      (f.fixedVersions || []).join('; ') || 'None',
      f.riskScore,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `depsafe-scan-${scan._id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <LoadingSpinner message="Loading scan report..." />;
  }

  if (!scan) {
    return (
      <div className="card">
        <h2>Scan report not found</h2>
        <Link to="/app/projects" className="button small">
          Return to Projects
        </Link>
      </div>
    );
  }

  const findings = scan.findings || [];

  const filteredFindings = findings.filter((f) => {
    const matchSev = filterSeverity === 'All' || f.severity?.toLowerCase() === filterSeverity.toLowerCase();
    const matchSearch =
      f.packageName.toLowerCase().includes(search.toLowerCase()) ||
      f.vulnerabilityId.toLowerCase().includes(search.toLowerCase()) ||
      (f.summary && f.summary.toLowerCase().includes(search.toLowerCase()));
    return matchSev && matchSearch;
  });

  return (
    <>
      <Link to={scan.project?._id ? `/app/projects/${scan.project._id}` : '/app/projects'} className="back-link">
        <ArrowLeft size={15} /> Back to project
      </Link>

      <div className="page-head" style={{ marginTop: '12px' }}>
        <div>
          <div className="eyebrow">SCAN REPORT & ADVISORY FINDINGS</div>
          <h1>{scan.project?.name || 'Project'} Scan Analysis</h1>
          <p>
            Executed on {formatDate(scan.createdAt)} · Manifest: <code>{scan.manifestType}</code>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {scan.status === 'failed' && (
            <button className="button danger small" onClick={handleRetry} disabled={retrying}>
              <RefreshCw size={14} /> {retrying ? 'Retrying...' : 'Retry Scan'}
            </button>
          )}

          {scan.status === 'completed' && (
            <>
              <button className="button secondary small" onClick={exportToCsv} title="Export findings to CSV">
                <Download size={14} /> Export CSV
              </button>
              <button className="button secondary small" onClick={exportToJson} title="Export raw JSON">
                <Download size={14} /> Export JSON
              </button>
            </>
          )}
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Metric Cards */}
      <div className="stats-grid">
        <StatCard
          label="Execution Status"
          value={<StatusPill status={scan.status} />}
          icon={ScanLine}
          tone="cyan"
          subtext={scan.completedAt ? `Completed: ${formatDate(scan.completedAt)}` : 'In progress...'}
        />
        <StatCard
          label="Overall Risk Score"
          value={`${scan.riskScore}/100`}
          icon={Activity}
          tone="violet"
          subtext="Deterministic weighted score"
        />
        <StatCard
          label="Total Findings"
          value={scan.vulnerabilityCount ?? 0}
          icon={AlertTriangle}
          tone="red"
          subtext={`${scan.severitySummary?.critical || 0} critical · ${scan.severitySummary?.high || 0} high`}
        />
        <StatCard
          label="Dependencies Scanned"
          value={scan.scannedDependencyCount ?? 0}
          icon={Layers}
          tone="amber"
          subtext={`Out of ${scan.dependencyCount} declared`}
        />
      </div>

      {scan.errorMessage && (
        <div className="error-banner">
          <b>Scan failure reason:</b> {scan.errorMessage}
        </div>
      )}

      {/* Findings Filters */}
      <div className="filters">
        <div className="search">
          <input
            type="text"
            placeholder="Search by package, CVE, or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

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
      </div>

      {/* Findings Table */}
      <section className="card">
        <div className="card-head">
          <div>
            <h2>Detected Vulnerability Findings ({filteredFindings.length})</h2>
            <p>Vulnerabilities retrieved from the OSV database for resolved dependencies</p>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>VULNERABILITY ID</th>
                <th>PACKAGE</th>
                <th>INSTALLED</th>
                <th>SEVERITY</th>
                <th>CVSS</th>
                <th>RISK</th>
                <th>FIX VERSION</th>
                <th>SUMMARY</th>
              </tr>
            </thead>
            <tbody>
              {filteredFindings.map((finding, idx) => (
                <tr key={idx}>
                  <td>
                    <b style={{ fontFamily: "'DM Mono', monospace" }}>{finding.vulnerabilityId}</b>
                  </td>
                  <td>
                    <b>{finding.packageName}</b>
                  </td>
                  <td>{finding.installedVersion || 'unresolved'}</td>
                  <td>
                    <SeverityBadge severity={finding.severity} />
                  </td>
                  <td>{finding.cvssScore ? finding.cvssScore.toFixed(1) : '—'}</td>
                  <td>
                    <RiskPill score={finding.riskScore} />
                  </td>
                  <td>
                    {finding.fixedVersions?.length ? (
                      <span style={{ color: 'var(--green)', fontWeight: 600 }}>
                        {finding.fixedVersions[0]}
                      </span>
                    ) : (
                      <span className="muted">None reported</span>
                    )}
                  </td>
                  <td style={{ maxWidth: '300px', whiteSpace: 'normal', fontSize: '12px' }}>
                    {finding.summary}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredFindings.length === 0 && (
            <div className="empty-state">
              <CheckCircle size={32} color="var(--green)" />
              <h3>No matching findings</h3>
              <p>No vulnerabilities match the chosen search query or severity tier.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
