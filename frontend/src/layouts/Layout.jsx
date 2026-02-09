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
                <div style={{ marginBottom: '3rem', paddingLeft: '0.5rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', background: 'linear-gradient(to right, #fff, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
                        Nexus<span style={{ color: 'var(--primary-color)' }}>SaaS</span>
                    </h2>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        {user?.tenant ? user.tenant.name : 'System Administration'}
                    </div>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                    <Link to="/dashboard" className={`nav-link ${isActive('/dashboard')}`}>
                        <span>📊</span> Dashboard
                    </Link>
                    <Link to="/projects" className={`nav-link ${isActive('/projects')}`}>
                        <span>🚀</span> Projects
                    </Link>

                    {user?.role === 'tenant_admin' && (
                        <Link to="/users" className={`nav-link ${isActive('/users')}`}>
                            <span>👥</span> Team
                        </Link>
                    )}
                    {user?.role === 'super_admin' && (
                        <Link to="/tenants" className={`nav-link ${isActive('/tenants')}`}>
                            <span>🏢</span> Tenants
                        </Link>
                    )}
                </nav>

                <div className="glass-panel" style={{ padding: '1rem', marginTop: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1rem' }}>
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

            {/* Mobile Nav Placeholder */}
            {/* Ideally would have a hamburger menu here for mobile */}

            {/* Main Content */}
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
