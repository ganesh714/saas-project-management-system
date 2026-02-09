import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const ProjectDetails = () => {
    const { projectId } = useParams();
    const { user } = useAuth();
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', dueDate: '', assignedTo: '' });
    // User list for assignment
    const [users, setUsers] = useState([]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [projRes, tasksRes] = await Promise.all([
                api.get(`/projects/${projectId}`),
                api.get(`/projects/${projectId}/tasks?limit=100`)
            ]);
            setProject(projRes.data.data);
            setTasks(tasksRes.data.data.tasks || []);

            // Fetch users for assignment if admin
            if (user.role === 'tenant_admin') {
                const usersRes = await api.get(`/tenants/${user.tenant_id}/users?limit=100`);
                setUsers(usersRes.data.users);
            }
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [projectId]);

    const handleCreateTask = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/projects/${projectId}/tasks`, newTask);
            setShowTaskModal(false);
            setNewTask({ title: '', description: '', priority: 'medium', dueDate: '', assignedTo: '' });
            fetchData();
        } catch (err) {
            alert('Failed to create task');
        }
    };

    const handleStatusChange = async (taskId, newStatus) => {
        try {
            await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
            // Optimistic update
            setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            await api.delete(`/tasks/${taskId}`);
            setTasks(tasks.filter(t => t.id !== taskId));
        } catch (err) {
            alert('Failed to delete task');
        }
    };

    if (loading) return <div className="flex-center" style={{ height: '50vh' }}><div className="spinner"></div></div>;
    if (!project) return <div className="text-center" style={{ marginTop: '2rem' }}>Project not found</div>;

    return (
        <div className="animate-fade-in">
            <div className="mb-6">
                <Link to="/projects" className="btn btn-secondary mb-4" style={{ display: 'inline-flex' }}>&larr; Back to Projects</Link>
                <div className="flex-between mt-4">
                    <div>
                        <h1 className="mb-2">{project.name}</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>{project.description}</p>
                    </div>
                    <div>
                        <button className="btn btn-primary" onClick={() => setShowTaskModal(true)}>+ Add Task</button>
                    </div>
                </div>
            </div>

            {/* Task List */}
            <div className="glass-card table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Task</th>
                            <th>Assignee</th>
                            <th>Priority</th>
                            <th>Due Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tasks.length === 0 ? <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>No tasks yet. Add one above!</td></tr> : tasks.map(task => (
                            <tr key={task.id}>
                                <td>
                                    <div style={{ fontWeight: '500', color: 'white', marginBottom: '0.25rem' }}>{task.title}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{task.description}</div>
                                </td>
                                <td>
                                    {task.assigned_to_user ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                                {task.assigned_to_user.full_name.charAt(0)}
                                            </div>
                                            <span style={{ fontSize: '0.9rem' }}>{task.assigned_to_user.full_name}</span>
                                        </div>
                                    ) : <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>Unassigned</span>}
                                </td>
                                <td>
                                    <span style={{
                                        color: task.priority === 'high' ? '#fca5a5' : task.priority === 'medium' ? '#fcd34d' : '#6ee7b7',
                                        textTransform: 'capitalize',
                                        fontWeight: '600',
                                        fontSize: '0.85rem'
                                    }}>{task.priority}</span>
                                </td>
                                <td style={{ fontSize: '0.9rem' }}>{task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}</td>
                                <td>
                                    <select
                                        value={task.status}
                                        onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                        className="input-field"
                                        style={{ padding: '0.35rem', fontSize: '0.85rem', width: 'auto', minWidth: '130px' }}
                                    >
                                        <option value="todo">To Do</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="done">Done</option>
                                    </select>
                                </td>
                                <td>
                                    <button onClick={() => handleDeleteTask(task.id)} className="btn btn-danger" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Task Modal */}
            {showTaskModal && (
                <div style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="glass-card p-6" style={{ width: '100%', maxWidth: '500px', animation: 'fadeIn 0.2s ease-out' }}>
                        <h2 className="mb-4">Add Task</h2>
                        <form onSubmit={handleCreateTask}>
                            <div className="input-group">
                                <label className="input-label">Title</label>
                                <input className="input-field" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} required autoFocus />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Description</label>
                                <textarea className="input-field" value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} rows="3" />
                            </div>
                            <div className="grid-auto gap-4 mb-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
                                <div className="input-group mb-0">
                                    <label className="input-label">Priority</label>
                                    <select className="input-field" value={newTask.priority} onChange={e => setNewTask({ ...newTask, priority: e.target.value })}>
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                                <div className="input-group mb-0">
                                    <label className="input-label">Due Date</label>
                                    <input type="date" className="input-field" value={newTask.dueDate} onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })} />
                                </div>
                            </div>
                            {user.role === 'tenant_admin' && (
                                <div className="input-group">
                                    <label className="input-label">Assign To</label>
                                    <select className="input-field" value={newTask.assignedTo} onChange={e => setNewTask({ ...newTask, assignedTo: e.target.value })}>
                                        <option value="">-- Unassigned --</option>
                                        {users.map(u => (
                                            <option key={u.id} value={u.id}>{u.full_name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div className="flex-between mt-6">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Create Task</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectDetails;
