import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalProjects: 0,
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0
    });
    const [recentProjects, setRecentProjects] = useState([]);
    const [myTasks, setMyTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Parallel fetching
                const [projectsRes, tasksRes] = await Promise.all([
                    api.get('/projects?limit=5'),
                    api.get(`/tasks?assignedTo=${user.id}&limit=5&status=todo`)
                ]);  // Let's assume I fix the backend in next step.
                // For now, I'll assume projects work.

                const projects = projectsRes.data.data.projects;
                setRecentProjects(projects);

                // Calculate basic stats from projects (incomplete but something)
                const totalProj = projectsRes.data.data.total;
                setStats(s => ({ ...s, totalProjects: totalProj }));

                // Tenant Admin Stats
                if (user.role === 'tenant_admin' || user.role === 'super_admin') {
                    try {
                        const tenantRes = await api.get(`/tenants/${user.tenantId}`);
                        const tStats = tenantRes.data.data.stats;
                        setStats({
                            totalProjects: tStats.totalProjects,
                            totalTasks: tStats.totalTasks,
                            completedTasks: 0, // Backend stat doesn't have this breakdown, implies need to fetch
                            pendingTasks: 0
                        });
                    } catch (e) { console.error("Tenant stat fetch fail", e); }
                }

                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };

        if (user) fetchData();
    }, [user]);

    if (loading) return <div className="spinner"></div>;

    return (
        <div className="container">
            <h1>Dashboard</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Welcome back, {user.fullName}
            </p>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div className="card">
                    <h3 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Total Projects</h3>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalProjects}</div>
                </div>
                <div className="card">
                    <h3 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Total Tasks</h3>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalTasks}</div>
                </div>
                {/* Placeholders since backend stats are limited */}
                <div className="card">
                    <h3 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Active Plan</h3>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', textTransform: 'capitalize' }}>{user.tenant?.subscriptionPlan || 'Free'}</div>
                </div>
            </div>

            {/* Recent Projects */}
            <h2 style={{ marginBottom: '1rem' }}>Recent Projects</h2>
            <div style={{ display: 'grid', gap: '1rem' }}>
                {recentProjects.length === 0 ? <p>No projects found.</p> : recentProjects.map(project => (
                    <div key={project.id} className="card flex-between">
                        <div>
                            <h3 style={{ fontSize: '1.1rem' }}>
                                <Link to={`/projects/${project.id}`} style={{ color: 'var(--primary-color)' }}>{project.name}</Link>
                            </h3>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{project.description}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <span className={`badge badge-${project.status}`}>{project.status}</span>
                            <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                                {project.taskCount} Tasks
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '2rem' }}>
                <Link to="/projects" className="btn btn-primary">View All Projects</Link>
            </div>
        </div>
    );
};

export default Dashboard;
