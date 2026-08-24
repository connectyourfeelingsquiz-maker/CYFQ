'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function AdminDashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/admin/login');
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  const navItems = [
    { label: 'Overview', path: '/admin/dashboard' },
    { label: 'Users', path: '/admin/dashboard/users' },
    { label: 'Auth Activity', path: '/admin/dashboard/auth-activity' },
    { label: 'Quizzes', path: '/admin/dashboard/quizzes' },
    { label: 'Quiz Attempts', path: '/admin/dashboard/attempts' },
    { label: 'Audit Logs', path: '/admin/dashboard/audit-logs' },
    { label: 'Settings → Login Page', path: '/admin/dashboard/settings/login-page' },
  ];

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2 style={{ color: 'var(--accent-primary)', margin: 0 }}>CYFQ Admin</h2>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <Link 
              key={item.path} 
              href={item.path}
              className={`nav-item ${pathname === item.path ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
          <button 
            onClick={handleLogout} 
            className="btn btn-secondary" 
            style={{ width: '100%', borderColor: 'var(--accent-danger)', color: 'var(--accent-danger)' }}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
