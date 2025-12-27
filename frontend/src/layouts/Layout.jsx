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
            <aside className="sidebar open glass">
                <div style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>SaaS Platform</h2>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {user?.tenant ? user.tenant.name : 'System Admin'}
                    </div>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <Link to="/dashboard" className={`nav-link ${isActive('/dashboard')}`}>Dashboard</Link>
                    <Link to="/projects" className={`nav-link ${isActive('/projects')}`}>Projects</Link>

                    {user?.role === 'tenant_admin' && (
                        <Link to="/users" className={`nav-link ${isActive('/users')}`}>Users</Link>
                    )}
                    {user?.role === 'super_admin' && (
                        <Link to="/tenants" className={`nav-link ${isActive('/tenants')}`}>Tenants</Link>
                    )}
                </nav>

                <div style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
                        <div>{user?.full_name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{user?.email}</div>
                    </div>
                    <button onClick={logout} className="btn btn-danger" style={{ width: '100%' }}>Logout</button>
                </div>
            </aside>

            {/* Mobile Nav (Simplistic) */}
            <div className="navbar-mobile">
                <h2>SaaS App</h2>
                <button onClick={logout} className="btn btn-danger">Logout</button>
            </div>

            {/* Main Content */}
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
