import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Users = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newUser, setNewUser] = useState({ email: '', fullName: '', password: '', role: 'user' });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/tenants/${user.tenant_id}/users`);
            setUsers(res.data.users || res.data); // Adjust based on API structure
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (user && user.tenant_id) fetchUsers();
    }, [user]);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/tenants/${user.tenant_id}/users`, newUser);
            setShowModal(false);
            setNewUser({ email: '', fullName: '', password: '', role: 'user' });
            fetchUsers();
            alert('User created successfully');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create user');
        }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm('Delete this user?')) return;
        try {
            await api.delete(`/users/${userId}`);
            setUsers(users.filter(u => u.id !== userId));
        } catch (err) {
            alert('Failed to delete user');
        }
    };

    if (loading) return <div className="flex-center" style={{ height: '50vh' }}><div className="spinner"></div></div>;

    return (
        <div className="animate-fade-in">
            <div className="flex-between" style={{ marginBottom: '2rem' }}>
                <div>
                    <h1>Team Members</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Manage your organization's users</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add User</button>
            </div>

            <div className="glass-card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Joined</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 ? <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No other users yet.</td></tr> : users.map(u => (
                                <tr key={u.id}>
                                    <td style={{ fontWeight: '500', color: 'white' }}>{u.full_name}</td>
                                    <td>{u.email}</td>
                                    <td><span className="badge badge-active" style={{ textTransform: 'capitalize' }}>{u.role}</span></td>
                                    <td>{u.is_active ? 'Active' : 'Inactive'}</td>
                                    <td>{new Date(u.created_at).toLocaleDateString()}</td>
                                    <td>
                                        {u.id !== user.id && (
                                            <button onClick={() => handleDelete(u.id)} className="btn hover-danger" style={{ color: '#f87171', padding: '0.25rem', background: 'transparent' }}>Remove</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="glass-card" style={{ width: '100%', maxWidth: '450px', animation: 'fadeIn 0.2s ease-out' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>Add Team Member</h2>
                        <form onSubmit={handleCreate}>
                            <div className="input-group">
                                <label className="input-label">Full Name</label>
                                <input className="input-field" value={newUser.fullName} onChange={e => setNewUser({ ...newUser, fullName: e.target.value })} required />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Email</label>
                                <input type="email" className="input-field" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} required />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Default Password</label>
                                <input type="text" className="input-field" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} required />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Role</label>
                                <select className="input-field" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                                    <option value="user">User</option>
                                    <option value="tenant_admin">Admin</option>
                                </select>
                            </div>
                            <div className="flex-between" style={{ marginTop: '2rem' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Add Member</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
