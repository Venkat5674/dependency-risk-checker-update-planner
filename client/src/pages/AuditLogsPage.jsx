/**
 * @file AuditLogsPage.jsx
 * @description Chronological audit log viewer providing security accountability
 * for authentication, project changes, scans, and remediation updates.
 */

import React, { useState, useEffect } from 'react';
import { ScrollText, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { auditService } from '../services/auditService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatDate } from '../utils/formatters';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await auditService.list();
      setLogs(res.data?.logs || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve audit trail.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">COMPLIANCE & TRACEABILITY</div>
          <h1>Audit Logs</h1>
          <p>Chronological immutable log of all operations performed in this workspace.</p>
        </div>
        <button className="button secondary small" onClick={loadLogs}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <LoadingSpinner message="Retrieving audit records..." />
      ) : (
        <section className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ACTION</th>
                  <th>RESOURCE TYPE</th>
                  <th>PROJECT</th>
                  <th>OUTCOME</th>
                  <th>METADATA DETAILS</th>
                  <th>TIMESTAMP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id}>
                    <td>
                      <b style={{ fontFamily: "'DM Mono', monospace", color: 'var(--ink)' }}>
                        {log.action}
                      </b>
                    </td>
                    <td>{log.resourceType}</td>
                    <td>{log.project?.name || '—'}</td>
                    <td>
                      {log.outcome === 'success' ? (
                        <span style={{ color: 'var(--green)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                          <CheckCircle size={14} /> Success
                        </span>
                      ) : (
                        <span style={{ color: 'var(--red)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                          <XCircle size={14} /> Failed
                        </span>
                      )}
                    </td>
                    <td style={{ maxWidth: '300px', whiteSpace: 'normal', fontSize: '11px', color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>
                      {log.metadata && Object.keys(log.metadata).length > 0
                        ? JSON.stringify(log.metadata)
                        : '—'}
                    </td>
                    <td>{formatDate(log.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {logs.length === 0 && (
              <div className="empty-state">
                <ScrollText size={32} />
                <h3>No audit logs yet</h3>
                <p>Actions performed within your account will be securely recorded here.</p>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}
