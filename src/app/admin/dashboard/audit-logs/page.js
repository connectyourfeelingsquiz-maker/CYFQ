'use client';

import { useState, useEffect } from 'react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/admin/audit-logs');
        const json = await res.json();
        setLogs(json.logs || []);
      } catch (err) {
        console.error('Error fetching audit logs', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Audit Logs</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
        Record of administrative actions for security compliance.
      </p>
      
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Admin ID</th>
              <th>Action</th>
              <th>Target</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id}>
                <td style={{ fontSize: '0.875rem' }}>{new Date(log.created_at).toLocaleString()}</td>
                <td style={{ fontWeight: 500 }}>{log.admin_id}</td>
                <td>
                  <span style={{ 
                    padding: '0.25rem 0.5rem', 
                    background: 'rgba(56, 189, 248, 0.1)', 
                    color: 'var(--accent-primary)',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}>
                    {log.action}
                  </span>
                </td>
                <td>
                  {log.target_type && (
                    <div style={{ fontSize: '0.875rem' }}>
                      {log.target_type}: <span style={{ color: 'var(--text-muted)' }}>{log.target_id || 'all'}</span>
                    </div>
                  )}
                </td>
                <td>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {JSON.stringify(log.safe_metadata)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
