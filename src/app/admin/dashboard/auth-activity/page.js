'use client';

import { useState, useEffect } from 'react';

export default function AuthActivityPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/admin/auth-activity');
        const json = await res.json();
        setEvents(json.events || []);
      } catch (err) {
        console.error('Error fetching auth activity', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Authentication Activity</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
        Monitoring authentication events for security. <strong>No passwords or sensitive tokens are logged or displayed here.</strong>
      </p>
      
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Method</th>
              <th>Status</th>
              <th>Time</th>
              <th>Browser/OS</th>
            </tr>
          </thead>
          <tbody>
            {events.map(event => (
              <tr key={event.id}>
                <td>
                  <div style={{ fontWeight: 500 }}>{event.user}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{event.username}</div>
                </td>
                <td>{event.method}</td>
                <td>
                  <span className={`badge ${event.status === 'Success' ? 'badge-success' : 'badge-danger'}`}>
                    {event.status}
                  </span>
                </td>
                <td>{new Date(event.time).toLocaleString()}</td>
                <td>
                  <div style={{ fontSize: '0.875rem' }}>{event.browser}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{event.os}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
