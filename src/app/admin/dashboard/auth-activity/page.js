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
        Recent login events and session details.
      </p>
      
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Username 1</th>
              <th>Username 2</th>
              <th>Method</th>
              <th>Status</th>
              <th>Login Time</th>
              <th>Browser / OS</th>
              <th>Session ID</th>
            </tr>
          </thead>
          <tbody>
            {events.map(event => (
              <tr key={event.id}>
                <td style={{ fontWeight: 500 }}>{event.username1}</td>
                <td style={{ fontWeight: 500 }}>{event.username2}</td>
                <td>{event.method}</td>
                <td>
                  <span className={`badge ${event.status === 'Success' ? 'badge-success' : 'badge-warning'}`}>
                    {event.status}
                  </span>
                </td>
                <td style={{ fontSize: '0.875rem' }}>{new Date(event.time).toLocaleString()}</td>
                <td style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  {event.browser} / {event.os}
                </td>
                <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {event.id.substring(0, 8)}...
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
