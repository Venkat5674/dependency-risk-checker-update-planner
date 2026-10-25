/**
 * @file ProjectDetailsPage.jsx
 * @description In-depth project view providing dependency manifests breakdown,
 * historical scans, detected vulnerabilities, and manual scan triggers.
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ScanLine,
  ExternalLink,
  Package,
  Activity,
  TriangleAlert,
  Calendar,
  CheckCircle,
} from 'lucide-react';
import { projectService } from '../services/projectService';
import { scanService } from '../services/scanService';
import { vulnerabilityService } from '../services/vulnerabilityService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatCard from '../components/common/StatCard';
import { SeverityBadge, RiskPill, StatusPill } from '../components/common/Badge';
import { formatDate } from '../utils/formatters';

export default function ProjectDetailsPage() {
  const { id } = useParams();

  const [project, setProject] = useState(null);
  const [scans, setScans] = useState([]);
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('vulnerabilities'); // 'vulnerabilities' | 'dependencies' | 'scans'

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [projRes, scanRes, vulnRes] = await Promise.all([
        projectService.get(id),
        scanService.list(id),
        vulnerabilityService.list({ project: id }),
      ]);

      setProject(projRes.data?.project);
      setScans(scanRes.data?.scans || []);
      setVulnerabilities(vulnRes.data?.vulnerabilities || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve project details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleScanNow = async () => {
    setScanning(true);
    try {
      await scanService.create(id);
      await loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to trigger scan.');
    } finally {
      setScanning(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading project repository data..." />;
  }

  if (!project) {
    return (
      <div className="card">
        <h2>Project not found</h2>
        <Link to="/app/projects" className="button small">
          Return to Projects
        </Link>
      </div>
    );
  }

  const latestScan = project.latestScan;

  return (
    <>
      <Link to="/app/projects" className="back-link">
        <ArrowLeft size={15} /> All projects
      </Link>

      <div className="page-head" style={{ marginTop: '12px' }}>
        <div>
          <div className="eyebrow">{project.ecosystem} PROJECT</div>
          <h1>{project.name}</h1>
          <p>{project.description || 'No description provided.'}</p>
          {project.repositoryUrl && (
            <a
              href={project.repositoryUrl}
              target="_blank"
              rel="noreferrer"
              className="link"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', marginTop: '6px', fontSize: '13px' }}
            >
              <ExternalLink size={13} /> {project.repositoryUrl}
            </a>
          )}
        </div>

        <button className="button" onClick={handleScanNow} disabled={scanning}>
          <ScanLine size={16} /> {scanning ? 'Triggering Scan...' : 'Scan Now'}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Overview Metric Cards */}
      <div className="stats-grid">
        <StatCard
          label="Overall Risk Score"
          value={latestScan ? `${latestScan.riskScore}/100` : '—'}
          icon={Activity}
          tone="violet"
          subtext={latestScan ? `Status: ${latestScan.status}` : 'Pending first scan'}
        />
        <StatCard
          label="Open Vulnerabilities"
          value={vulnerabilities.length}
          icon={TriangleAlert}
          tone="red"
          subtext={`${vulnerabilities.filter((v) => v.severity === 'critical').length} critical`}
        />
        <StatCard
          label="Total Dependencies"
          value={project.dependencies?.length || 0}
          icon={Package}
          tone="cyan"
          subtext={`Manifest: ${project.manifestType}`}
        />
        <StatCard
          label="Last Scan"
          value={latestScan?.completedAt ? formatDate(latestScan.completedAt) : 'Never'}
          icon={Calendar}
          tone="amber"
          subtext={latestScan ? `${latestScan.scannedDependencyCount} deps scanned` : ''}
        />
      </div>

      {/* Tabs */}
      <div className="filter-tabs" style={{ marginBottom: '20px', width: 'fit-content' }}>
        <button
          className={activeTab === 'vulnerabilities' ? 'active' : ''}
          onClick={() => setActiveTab('vulnerabilities')}
        >
          Vulnerabilities ({vulnerabilities.length})
        </button>
        <button
          className={activeTab === 'dependencies' ? 'active' : ''}
          onClick={() => setActiveTab('dependencies')}
        >
          Dependencies ({project.dependencies?.length || 0})
        </button>
        <button
          className={activeTab === 'scans' ? 'active' : ''}
          onClick={() => setActiveTab('scans')}
        >
          Scan History ({scans.length})
        </button>
      </div>

      {/* Tab 1: Vulnerabilities */}
      {activeTab === 'vulnerabilities' && (
        <section className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>VULNERABILITY ID</th>
                  <th>PACKAGE</th>
                  <th>INSTALLED</th>
                  <th>SEVERITY</th>
                  <th>RISK</th>
                  <th>FIX VERSION</th>
                  <th>STATUS</th>
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
                  </tr>
                ))}
              </tbody>
            </table>

            {vulnerabilities.length === 0 && (
              <div className="empty-state">
                <CheckCircle size={32} color="var(--green)" />
                <h3>No vulnerabilities detected</h3>
                <p>This project has no active vulnerability advisories recorded.</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Tab 2: Dependencies */}
      {activeTab === 'dependencies' && (
        <section className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>PACKAGE NAME</th>
                  <th>RESOLVED VERSION</th>
                  <th>REQUESTED VERSION</th>
                  <th>TYPE</th>
                  <th>SCAN STATUS</th>
                </tr>
              </thead>
              <tbody>
                {project.dependencies?.map((dep, idx) => (
                  <tr key={idx}>
                    <td>
                      <b>{dep.name}</b>
                    </td>
                    <td>
                      {dep.version ? (
                        <code>{dep.version}</code>
                      ) : (
                        <span className="muted" style={{ fontStyle: 'italic' }}>
                          Unresolved range
                        </span>
                      )}
                    </td>
                    <td>{dep.requestedVersion || '—'}</td>
                    <td>
                      <span className={`status-pill ${dep.direct ? 'resolved' : 'queued'}`}>
                        {dep.direct ? 'Direct' : 'Transitive'}
                      </span>
                    </td>
                    <td>
                      {dep.resolved ? (
                        <span style={{ color: 'var(--green)', fontSize: '12px' }}>✓ Scannable</span>
                      ) : (
                        <span className="muted" style={{ fontSize: '12px' }}>
                          Needs lockfile version
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Tab 3: Scan History */}
      {activeTab === 'scans' && (
        <section className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>SCAN ID</th>
                  <th>STATUS</th>
                  <th>RISK SCORE</th>
                  <th>VULNERABILITIES</th>
                  <th>SCANNED DEPS</th>
                  <th>EXECUTED AT</th>
                </tr>
              </thead>
              <tbody>
                {scans.map((scan) => (
                  <tr key={scan._id}>
                    <td>
                      <Link to={`/app/scans/${scan._id}`}>
                        <code style={{ fontSize: '11px' }}>{scan._id.slice(-8)}</code>
                      </Link>
                    </td>
                    <td>
                      <StatusPill status={scan.status} />
                    </td>
                    <td>
                      <RiskPill score={scan.riskScore} />
                    </td>
                    <td>{scan.vulnerabilityCount ?? 0}</td>
                    <td>{scan.scannedDependencyCount ?? 0}</td>
                    <td>{formatDate(scan.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
