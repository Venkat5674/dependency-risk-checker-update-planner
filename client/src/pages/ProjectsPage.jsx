/**
 * @file ProjectsPage.jsx
 * @description Repository management interface allowing users to view, search,
 * and filter all registered projects, monitor latest scan statuses, and initiate scans.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  Plus,
  Search,
  ScanLine,
  ArrowUpRight,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { projectService } from '../services/projectService';
import { scanService } from '../services/scanService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { RiskPill, StatusPill } from '../components/common/Badge';
import { formatTimeAgo } from '../utils/formatters';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedEcosystem, setSelectedEcosystem] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [triggeringScanId, setTriggeringScanId] = useState(null);

  const loadProjects = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await projectService.list();
      setProjects(res.data?.projects || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleTriggerScan = async (projectId) => {
    setTriggeringScanId(projectId);
    try {
      await scanService.create(projectId);
      await loadProjects();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to trigger scan.');
    } finally {
      setTriggeringScanId(null);
    }
  };

  const handleDeleteProject = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" and all its scans?`)) {
      return;
    }
    try {
      await projectService.remove(id);
      setProjects((current) => current.filter((p) => p._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete project.');
    }
  };

  // Filter projects by name, description, and ecosystem
  const filtered = projects.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()));
    const matchEco =
      selectedEcosystem === 'All' || p.ecosystem === selectedEcosystem;
    return matchSearch && matchEco;
  });

  if (loading) {
    return <LoadingSpinner message="Loading your repositories..." />;
  }

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">MONITORED REPOSITORIES</div>
          <h1>Projects</h1>
          <p>Manage repositories, manifests, and continuous security scanning.</p>
        </div>
        <Link to="/app/projects/new" className="button">
          <Plus size={16} /> New Project
        </Link>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Filters and Search Bar */}
      <div className="filters">
        <div className="search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search projects by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-tabs">
          {['All', 'npm', 'PyPI', 'Maven'].map((eco) => (
            <button
              key={eco}
              className={selectedEcosystem === eco ? 'active' : ''}
              onClick={() => setSelectedEcosystem(eco)}
            >
              {eco}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Table */}
      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>PROJECT</th>
                <th>ECOSYSTEM</th>
                <th>MANIFEST</th>
                <th>DEPENDENCIES</th>
                <th>LATEST SCAN</th>
                <th>RISK</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((project) => (
                <tr key={project._id}>
                  <td>
                    <Link to={`/app/projects/${project._id}`} className="project-name">
                      <b>{project.name}</b>
                      {project.description && <small>{project.description}</small>}
                    </Link>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{project.ecosystem}</span>
                  </td>
                  <td>
                    <code style={{ fontSize: '11px', background: '#f0f1f5', padding: '2px 5px', borderRadius: '4px' }}>
                      {project.manifestType}
                    </code>
                  </td>
                  <td>{project.dependencies?.length || 0}</td>
                  <td>
                    {project.latestScan ? (
                      <Link to={`/app/scans/${project.latestScan._id || project.latestScan}`}>
                        <StatusPill status={project.latestScan.status || 'completed'} />
                      </Link>
                    ) : (
                      <span className="muted">Not scanned yet</span>
                    )}
                  </td>
                  <td>
                    <RiskPill score={project.latestScan?.riskScore ?? 0} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="button small secondary"
                        onClick={() => handleTriggerScan(project._id)}
                        disabled={triggeringScanId === project._id}
                        title="Trigger Scan"
                      >
                        <ScanLine size={13} />
                        {triggeringScanId === project._id ? 'Scanning...' : 'Scan'}
                      </button>
                      <button
                        className="icon-btn"
                        onClick={() => handleDeleteProject(project._id, project.name)}
                        title="Delete project"
                      >
                        <Trash2 size={15} color="var(--red)" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="empty-state">
              <FolderKanban size={34} />
              <h3>No projects found</h3>
              <p>Get started by connecting a dependency manifest for scanning.</p>
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
