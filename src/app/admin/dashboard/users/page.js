'use client';

import { useState, useEffect } from 'react';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/admin/users');
        const json = await res.json();
        setUsers(json.users || []);
      } catch (err) {
        console.error('Error fetching users', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>User Sessions</h1>
      
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Username 1</th>
              <th>Username 2</th>
              <th>Session ID</th>
              <th>Auth Method</th>
              <th>Status</th>
              <th>Login Time</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td style={{ fontWeight: 500 }}>{user.username1}</td>
                <td style={{ fontWeight: 500 }}>{user.username2}</td>
                <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.id.substring(0, 8)}...</td>
                <td>{user.method}</td>
                <td>
                  <span className={`badge ${user.status === 'Success' ? 'badge-success' : (user.status === 'Logged Out' ? 'badge-warning' : 'badge-danger')}`}>
                    {user.status}
                  </span>
                </td>
                <td style={{ fontSize: '0.875rem' }}>{new Date(user.login_time).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
