import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
    const [formData, setFormData] = useState({
        tenantName: '',
        subdomain: '',
        adminEmail: '',
        adminPassword: '',
        adminFullName: ''
    });
    const [error, setError] = useState('');
    const { registerTenant } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await registerTenant(formData);
            alert('Registration successful! Please login.');
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex-center" style={{ minHeight: '100vh', padding: '1rem', position: 'relative' }}>
            {/* Background Decor */}
            <div style={{ position: 'absolute', bottom: '20%', right: '20%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(168, 85, 247, 0.2) 0%, transparent 70%)', filter: 'blur(40px)', zIndex: -1 }}></div>

            <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '550px', padding: '2.5rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Start Your Journey</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Create a new organization workspace</p>
                </div>

                {error && <div className="mb-6" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="grid-auto gap-4 mb-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
                        <div className="input-group mb-0">
                            <label className="input-label">Organization Name</label>
                            <input
                                type="text"
                                className="input-field"
                                value={formData.tenantName}
                                onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                                required
                                placeholder="Acme Corp"
                            />
                        </div>
                        <div className="input-group mb-0">
                            <label className="input-label">Subdomain</label>
                            <input
                                type="text"
                                className="input-field"
                                value={formData.subdomain}
                                onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
                                required
                                placeholder="acme"
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Admin Full Name</label>
                        <input
                            type="text"
                            className="input-field"
                            value={formData.adminFullName}
                            onChange={(e) => setFormData({ ...formData, adminFullName: e.target.value })}
                            required
                            placeholder="John Doe"
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Admin Email</label>
                        <input
                            type="email"
                            className="input-field"
                            value={formData.adminEmail}
                            onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                            required
                            placeholder="john@acme.com"
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Password</label>
                        <input
                            type="password"
                            className="input-field"
                            value={formData.adminPassword}
                            onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                            required
                            placeholder="Min. 8 characters"
                        />
                    </div>

                    <button type="submit" className="btn btn-primary mt-4" style={{ width: '100%' }} disabled={isLoading}>
                        {isLoading ? <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div> : 'Create Workspace'}
                    </button>
                </form>

                <div className="mt-4" style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--primary-color)', fontWeight: '600' }}>Sign In</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
