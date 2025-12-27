import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const Projects = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newProject, setNewProject] = useState({ name: '', description: '', status: 'active' });

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const res = await api.get('/projects?limit=100');
            setProjects(res.data.data.projects);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/projects', newProject);
            setShowModal(false);
            setNewProject({ name: '', description: '', status: 'active' });
            fetchProjects();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create project');
        }
    };

    if (loading) return <div className="spinner"></div>;

    return (
        <div className="container">
            <div className="flex-between" style={{ marginBottom: '2rem' }}>
                <h1>Projects</h1>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Project</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {projects.map(project => (
                    <div key={project.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div className="flex-between" style={{ marginBottom: '1rem' }}>
                            <span className={`badge badge-${project.status}`}>{project.status}</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>By {project.createdBy.fullName}</span>
                        </div>
                        <h3 style={{ marginBottom: '0.5rem' }}>{project.name}</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem', flex: 1 }}>
                            {project.description}
                        </p>
                        <div className="flex-between" style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                            <span style={{ fontSize: '0.9rem' }}>{project.taskCount} Tasks</span>
                            <Link to={`/projects/${project.id}`} className="btn" style={{ background: 'var(--bg-dark)' }}>View Details</Link>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="card glass" style={{ width: '400px', maxWidth: '90%' }}>
                        <h2>Create Project</h2>
                        <form onSubmit={handleCreate}>
                            <div className="input-group">
                                <label className="input-label">Project Name</label>
                                <input className="input-field" value={newProject.name} onChange={e => setNewProject({ ...newProject, name: e.target.value })} required />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Description</label>
                                <textarea className="input-field" value={newProject.description} onChange={e => setNewProject({ ...newProject, description: e.target.value })} />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'white' }} onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Projects;
