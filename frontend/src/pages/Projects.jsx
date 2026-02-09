import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';

const Projects = () => {
    const [projects, setProjects] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '', status: 'active' });
    const [loading, setLoading] = useState(true);

    const fetchProjects = async () => {
        try {
            const res = await api.get('/projects');
            setProjects(res.data.data.projects || []);
        } catch (error) {
            console.error("Failed to fetch projects", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/projects', formData);
            setShowModal(false);
            setFormData({ name: '', description: '', status: 'active' });
            fetchProjects();
        } catch (error) {
            alert('Failed to create project');
        }
    };

    if (loading) return <div className="flex-center" style={{ height: '50vh' }}><div className="spinner"></div></div>;

    return (
        <div className="animate-fade-in">
            <div className="flex-between mb-6">
                <div>
                    <h1>Projects</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Manage your team's projects</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn btn-primary">
                    <span>+</span> New Project
                </button>
            </div>

            <div className="glass-card table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Description</th>
                            <th>Status</th>
                            <th>Tasks</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {projects.map(project => (
                            <tr key={project.id}>
                                <td style={{ fontWeight: '500', color: 'white' }}>{project.name}</td>
                                <td style={{ color: 'var(--text-secondary)' }}>{project.description}</td>
                                <td>
                                    <span className={`badge badge-${project.status === 'active' ? 'active' : 'archived'}`}>
                                        {project.status}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontWeight: '600' }}>{project.task_count || 0}</span>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>tasks</span>
                                    </div>
                                </td>
                                <td>
                                    <Link to={`/projects/${project.id}`} className="btn btn-secondary" style={{ padding: '0.35rem 0.85rem', fontSize: '0.85rem' }}>
                                        View Details
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {projects.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                                    No projects found. Create one to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div className="glass-card p-6" style={{ width: '100%', maxWidth: '500px', animation: 'fadeIn 0.2s ease-out' }}>
                        <h2 className="mb-4">Create New Project</h2>
                        <form onSubmit={handleCreate}>
                            <div className="input-group">
                                <label className="input-label">Project Name</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Description</label>
                                <textarea
                                    className="input-field"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    rows="3"
                                />
                            </div>
                            <div className="flex-between mt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Create Project
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Projects;
