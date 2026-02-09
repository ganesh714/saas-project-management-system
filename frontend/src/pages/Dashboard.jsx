import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Link } from 'react-router-dom';

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        projects: 0,
        tasks: 0,
        completedTasks: 0
    });
    const [recentProjects, setRecentProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const projectsRes = await api.get('/projects');
                const projects = projectsRes.data;

                setStats({
                    projects: projects.length,
                    tasks: projects.reduce((acc, curr) => acc + (curr.task_count || 0), 0),
                    completedTasks: 0 
                });

                setRecentProjects(projects.slice(0, 5));
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) return <div className="flex-center" style={{ height: '50vh' }}><div className="spinner"></div></div>;

    return (
        <div className="animate-fade-in">
            <header className="flex-between" style={{ marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ marginBottom: '0.5rem' }}>Dashboard</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Welcome back, {user?.full_name}</p>
                </div>
                {user?.role === 'tenant_admin' && (
                     <div className="badge badge-active" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                        {user.tenant?.plan || 'Free'} Plan
                    </div>
                )}
            </header>

            {/* Stats Grid */}
            <div className="grid-auto" style={{ marginBottom: '2rem' }}>
                <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)', borderLeft: '4px solid var(--primary-color)' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Projects</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fff' }}>{stats.projects}</div>
                </div>
                <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(45, 212, 191, 0.1) 100%)', borderLeft: '4px solid #2dd4bf' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Active Tasks</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fff' }}>{stats.tasks}</div>
                </div>
                <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(239, 68, 68, 0.1) 100%)', borderLeft: '4px solid #f59e0b' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Pending Review</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fff' }}>--</div>
                </div>
            </div>

            {/* Recent Activity / Projects */}
            <div className="glass-card">
                <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                    <h3>Recent Projects</h3>
                    <Link to="/projects" className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>View All</Link>
                </div>

                {recentProjects.length > 0 ? (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Project Name</th>
                                    <th>Status</th>
                                    <th>Created At</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentProjects.map(project => (
                                    <tr key={project.id}>
                                        <td style={{ fontWeight: '500' }}>{project.name}</td>
                                        <td>
                                            <span className={`badge badge-${project.status === 'active' ? 'active' : 'archived'}`}>
                                                {project.status}
                                            </span>
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{new Date(project.created_at).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                        No projects found. Start by creating one!
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
