'use client';

import { useState, useEffect } from 'react';

export default function OverviewPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/admin/overview');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Error fetching overview', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!data?.stats) return <div>Error loading dashboard data</div>;

  const { stats } = data;

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Overview</h1>
      
      <div className="grid-cards">
        <div className="stat-card">
          <div className="stat-title">Total Users</div>
          <div className="stat-value">{stats.totalUsers}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Active Users</div>
          <div className="stat-value">{stats.activeUsers}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Total Quizzes</div>
          <div className="stat-value">{stats.totalQuizzes}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Total Quiz Attempts</div>
          <div className="stat-value">{stats.totalAttempts}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Successful Logins</div>
          <div className="stat-value" style={{ color: 'var(--accent-success)' }}>{stats.successfulLogins}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Failed Login Attempts</div>
          <div className="stat-value" style={{ color: 'var(--accent-danger)' }}>{stats.failedLogins}</div>
        </div>
      </div>
    </div>
  );
}
