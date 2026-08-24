'use client';

import { useState, useEffect } from 'react';

export default function AttemptsPage() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/admin/attempts');
        const json = await res.json();
        setAttempts(json.attempts || []);
      } catch (err) {
        console.error('Error fetching attempts', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Quiz Attempts</h1>
      
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Quiz</th>
              <th>Score</th>
              <th>Date Started</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {attempts.map(attempt => (
              <tr key={attempt.id}>
                <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{attempt.id.substring(0, 8)}...</td>
                <td style={{ fontWeight: 500 }}>{attempt.user}</td>
                <td>{attempt.quiz}</td>
                <td>
                  <div style={{ fontWeight: 600 }}>{attempt.score}</div>
                  {attempt.percentage !== null && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)' }}>{attempt.percentage}%</div>
                  )}
                </td>
                <td>{new Date(attempt.date).toLocaleString()}</td>
                <td>
                  <span className={`badge ${attempt.completed ? 'badge-success' : 'badge-warning'}`}>
                    {attempt.completed ? 'Completed' : 'In Progress'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
