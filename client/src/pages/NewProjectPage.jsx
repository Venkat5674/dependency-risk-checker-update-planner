/**
 * @file NewProjectPage.jsx
 * @description Guided workflow for submitting a dependency manifest (package.json,
 * package-lock.json, requirements.txt, or pom.xml), parsing dependencies, and creating a project.
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, UploadCloud, FileCode } from 'lucide-react';
import { projectService } from '../services/projectService';
import { scanService } from '../services/scanService';

const MANIFEST_SAMPLES = {
  'package.json': `{
  "name": "sample-service",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.6.0",
    "lodash": "^4.17.19"
  }
}`,
  'package-lock.json': `{
  "name": "sample-service",
  "version": "1.0.0",
  "lockfileVersion": 2,
  "packages": {
    "node_modules/axios": {
      "version": "1.6.0"
    },
    "node_modules/lodash": {
      "version": "4.17.19"
    }
  }
}`,
  'requirements.txt': `requests==2.28.1
urllib3==1.26.12
flask==2.2.2`,
  'pom.xml': `<project>
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.example</groupId>
  <artifactId>demo-app</artifactId>
  <version>1.0.0</version>
  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
      <version>2.7.0</version>
    </dependency>
  </dependencies>
</project>`,
};

export default function NewProjectPage() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [manifestType, setManifestType] = useState('package.json');
  const [manifest, setManifest] = useState(MANIFEST_SAMPLES['package.json']);
  const [autoScan, setAutoScan] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleManifestTypeChange = (type) => {
    setManifestType(type);
    if (!manifest || manifest === MANIFEST_SAMPLES['package.json'] || manifest === MANIFEST_SAMPLES['package-lock.json'] || manifest === MANIFEST_SAMPLES['requirements.txt'] || manifest === MANIFEST_SAMPLES['pom.xml']) {
      setManifest(MANIFEST_SAMPLES[type] || '');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      setError('Selected file exceeds the 1 MB security limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      setManifest(evt.target?.result || '');
      if (file.name.includes('lock')) setManifestType('package-lock.json');
      else if (file.name.endsWith('.txt')) setManifestType('requirements.txt');
      else if (file.name.endsWith('.xml')) setManifestType('pom.xml');
      else if (file.name.endsWith('.json')) setManifestType('package.json');
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await projectService.create({
        name,
        description,
        repositoryUrl,
        manifestType,
        manifest,
      });

      const createdProject = res.data?.project;

      // Automatically queue initial scan if requested
      if (autoScan && createdProject?._id) {
        try {
          await scanService.create(createdProject._id);
        } catch (scanErr) {
          console.warn('Auto-scan trigger error:', scanErr.message);
        }
      }

      navigate(`/app/projects/${createdProject._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project and parse manifest.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '780px' }}>
      <Link to="/app/projects" className="back-link">
        <ArrowLeft size={15} /> Back to projects
      </Link>

      <div className="page-head" style={{ marginTop: '10px' }}>
        <div>
          <div className="eyebrow">NEW MONITORED PROJECT</div>
          <h1>Add a Project</h1>
          <p>Submit dependency manifest content to parse packages and begin scanning.</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
          <label>
            Project Name *
            <input
              type="text"
              placeholder="e.g. Payment Gateway Service"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              maxLength={120}
            />
          </label>

          <label>
            Description
            <input
              type="text"
              placeholder="e.g. Core microservice processing transactions"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
            />
          </label>

          <label>
            Repository URL
            <input
              type="url"
              placeholder="https://github.com/organization/repo"
              value={repositoryUrl}
              onChange={(e) => setRepositoryUrl(e.target.value)}
              maxLength={500}
            />
          </label>

          <label>
            Manifest Format *
            <select
              value={manifestType}
              onChange={(e) => handleManifestTypeChange(e.target.value)}
              required
            >
              <option value="package.json">package.json (Node.js - declared dependencies)</option>
              <option value="package-lock.json">package-lock.json (Node.js - resolved tree)</option>
              <option value="requirements.txt">requirements.txt (Python / PyPI)</option>
              <option value="pom.xml">pom.xml (Java / Maven)</option>
            </select>
          </label>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: '13px' }}>Manifest Content *</span>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: 'var(--violet)' }}>
              <UploadCloud size={16} /> Upload file
              <input
                type="file"
                accept=".json,.txt,.xml"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
            </label>
          </div>

          <textarea
            rows={12}
            value={manifest}
            onChange={(e) => setManifest(e.target.value)}
            required
            style={{ fontFamily: "'DM Mono', monospace", fontSize: '12px' }}
          />

          <label className="check">
            <input
              type="checkbox"
              checked={autoScan}
              onChange={(e) => setAutoScan(e.target.checked)}
            />
            Trigger immediate vulnerability scan upon project creation
          </label>

          <div className="form-actions">
            <button
              type="button"
              className="button secondary"
              onClick={() => navigate('/app/projects')}
            >
              Cancel
            </button>
            <button type="submit" className="button" disabled={submitting}>
              {submitting ? 'Parsing & Creating...' : 'Create & Scan Project'} <ArrowRight size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
