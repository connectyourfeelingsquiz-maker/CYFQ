'use client';

import { useState, useEffect } from 'react';

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  async function fetchQuizzes() {
    try {
      const res = await fetch('/api/admin/quizzes');
      const json = await res.json();
      setQuizzes(json.quizzes || []);
    } catch (err) {
      console.error('Error fetching quizzes', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(id, action) {
    if (!confirm(`Are you sure you want to ${action} this quiz?`)) return;
    
    try {
      const res = await fetch(`/api/admin/quizzes?id=${id}&action=${action}`, { method: 'DELETE' });
      if (res.ok) fetchQuizzes();
    } catch (err) {
      console.error(`Error performing ${action}`, err);
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Quizzes</h1>
      
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Creator</th>
              <th>Category</th>
              <th>Stats</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {quizzes.map(quiz => (
              <tr key={quiz.id}>
                <td>
                  <div style={{ fontWeight: 500 }}>{quiz.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{quiz.description?.substring(0, 50)}...</div>
                </td>
                <td>{quiz.creator}</td>
                <td>{quiz.category}</td>
                <td>
                  <div style={{ fontSize: '0.875rem' }}>{quiz.question_count} Qs</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{quiz.attempt_count} plays</div>
                </td>
                <td>
                  <span className={`badge ${quiz.is_active ? 'badge-success' : 'badge-danger'}`}>
                    {quiz.is_active ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {quiz.is_active && (
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        onClick={() => handleAction(quiz.id, 'disable')}
                      >
                        Disable
                      </button>
                    )}
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderColor: 'var(--accent-danger)', color: 'var(--accent-danger)' }}
                      onClick={() => handleAction(quiz.id, 'delete')}
                    >
                      Delete
                    </button>
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
