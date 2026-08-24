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
      <h1 style={{ marginBottom: '2rem' }}>Users</h1>
      
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID / Username</th>
              <th>Display Name</th>
              <th>Auth Provider</th>
              <th>Quizzes Created</th>
              <th>Quizzes Played</th>
              <th>Status</th>
              <th>Last Login</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{user.username}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.id.substring(0, 8)}...</div>
                </td>
                <td>{user.display_name}</td>
                <td>{user.auth_provider}</td>
                <td>{user.quizzes_created}</td>
                <td>{user.quizzes_played}</td>
                <td>
                  <span className={`badge ${user.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                    {user.status}
                  </span>
                </td>
                <td>{new Date(user.last_login).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
