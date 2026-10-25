/**
 * @file ScansPage.jsx
 * @description List of all scans executed across all monitored projects with status indicators.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ScanLine, ArrowUpRight, RefreshCw, AlertCircle } from 'lucide-react';
import { scanService } from '../services/scanService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { RiskPill, StatusPill } from '../components/common/Badge';
import { formatDate } from '../utils/formatters';

export default function ScansPage() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadScans = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await scanService.list();
      setScans(res.data?.scans || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve scan history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScans();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading scan history..." />;
  }

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">CONTINUOUS SCAN HISTORY</div>
          <h1>Vulnerability Scans</h1>
          <p>Review scan execution history, health metrics, and findings across all repositories.</p>
        </div>
        <button className="button secondary small" onClick={loadScans}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>PROJECT</th>
                <th>MANIFEST</th>
                <th>STATUS</th>
                <th>RISK SCORE</th>
                <th>VULNERABILITIES</th>
                <th>SCANNED / TOTAL</th>
                <th>EXECUTED</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {scans.map((scan) => (
                <tr key={scan._id}>
                  <td>
                    <Link to={`/app/scans/${scan._id}`} className="project-name">
                      <b>{scan.project?.name || 'Unknown Project'}</b>
                      <small>{scan.project?.ecosystem || '—'}</small>
                    </Link>
                  </td>
                  <td>
                    <code>{scan.manifestType}</code>
                  </td>
                  <td>
                    <StatusPill status={scan.status} />
                  </td>
                  <td>
                    <RiskPill score={scan.riskScore} />
                  </td>
                  <td>
                    <b>{scan.vulnerabilityCount ?? 0}</b>
                  </td>
                  <td>
                    {scan.scannedDependencyCount} / {scan.dependencyCount}
                  </td>
                  <td>{formatDate(scan.createdAt)}</td>
                  <td>
                    <Link to={`/app/scans/${scan._id}`} className="button small secondary">
                      Report <ArrowUpRight size={13} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {scans.length === 0 && (
            <div className="empty-state">
              <ScanLine size={32} />
              <h3>No scans on record</h3>
              <p>Add a project and run your first scan to analyze dependency risks.</p>
              <Link to="/app/projects/new" className="button small">
                Add Project
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
