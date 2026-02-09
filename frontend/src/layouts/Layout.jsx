import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
    const { user, logout } = useAuth();
    const location = useLocation();

    const isActive = (path) => location.pathname === path ? 'active' : '';

    return (
        <div className="layout-container">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-header mb-6">
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
                        Nexus<span style={{ color: '#fff' }}>SaaS</span>
                    </h2>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        {user?.tenant ? user.tenant.name : 'System Administration'}
                    </div>
                </div>

                <nav className="flex-col gap-2" style={{ flex: 1 }}>
                    <Link to="/dashboard" className={`nav-link ${isActive('/dashboard')}`}>
                        <span className="nav-icon">📊</span> 
                        <span>Dashboard</span>
                    </Link>
                    <Link to="/projects" className={`nav-link ${isActive('/projects')}`}>
                        <span className="nav-icon">🚀</span> 
                        <span>Projects</span>
                    </Link>

                    {user?.role === 'tenant_admin' && (
                        <Link to="/users" className={`nav-link ${isActive('/users')}`}>
                            <span className="nav-icon">👥</span> 
                            <span>Team</span>
                        </Link>
                    )}
                    {user?.role === 'super_admin' && (
                        <Link to="/tenants" className={`nav-link ${isActive('/tenants')}`}>
                            <span className="nav-icon">🏢</span> 
                            <span>Tenants</span>
                        </Link>
                    )}
                </nav>

                <div className="sidebar-footer glass-panel p-4 mt-4">
                    <div className="flex-start mb-4">
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1rem', color: 'white', flexShrink: 0 }}>
                            {user?.full_name?.charAt(0)}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontWeight: '600', fontSize: '0.9rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user?.full_name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user?.role?.replace('_', ' ')}</div>
                        </div>
                    </div>
                    <button onClick={logout} className="btn btn-secondary" style={{ width: '100%', fontSize: '0.8rem', padding: '0.5rem' }}>
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
