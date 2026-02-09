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
            setUsers(res.data.data.users || []);
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
            <div className="flex-between mb-6">
                <div>
                    <h1>Team Members</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Manage your organization's users</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add User</button>
            </div>

            <div className="glass-card table-container">
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
                        {users.length === 0 ? <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>No other users yet.</td></tr> : users.map(u => (
                            <tr key={u.id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white' }}>
                                            {u.full_name.charAt(0)}
                                        </div>
                                        <span style={{ fontWeight: '500', color: 'white' }}>{u.full_name}</span>
                                    </div>
                                </td>
                                <td>{u.email}</td>
                                <td>
                                    <span className={`badge ${u.role === 'tenant_admin' ? 'badge-primary' : 'badge-secondary'}`} style={{ textTransform: 'capitalize' }}>
                                        {u.role === 'tenant_admin' ? 'Admin' : 'User'}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: u.is_active ? '#34d399' : '#9ca3af' }}></div>
                                        {u.is_active ? 'Active' : 'Inactive'}
                                    </div>
                                </td>
                                <td>{new Date(u.created_at).toLocaleDateString()}</td>
                                <td>
                                    {u.id !== user.id && (
                                        <button onClick={() => handleDelete(u.id)} className="btn hover-danger" style={{ color: '#f87171', padding: '0.35rem', background: 'transparent' }}>Remove</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="glass-card p-6" style={{ width: '100%', maxWidth: '450px', animation: 'fadeIn 0.2s ease-out' }}>
                        <h2 className="mb-4">Add Team Member</h2>
                        <form onSubmit={handleCreate}>
                            <div className="input-group">
                                <label className="input-label">Full Name</label>
                                <input className="input-field" value={newUser.fullName} onChange={e => setNewUser({ ...newUser, fullName: e.target.value })} required autoFocus />
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
                            <div className="flex-between mt-6">
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
