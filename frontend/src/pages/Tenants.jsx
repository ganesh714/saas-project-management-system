import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Tenants = () => {
    // Placeholder data until backend endpoint is ready or if we want to mock it
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // fetchTenants(); // Uncomment when API is ready
    }, []);

    return (
        <div className="animate-fade-in">
            <div className="flex-between mb-6">
                <div>
                    <h1>Tenant Organizations</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Manage all registered organizations (Super Admin)</p>
                </div>
                {/* <button className="btn btn-primary">+ Add Tenant</button> */}
            </div>

            <div className="glass-card p-8 flex-center flex-col" style={{ minHeight: '400px', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏢</div>
                <h2 className="mb-2">Tenant Management</h2>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', marginBottom: '2rem' }}>
                    This module allows Super Admins to manage all registered tenant organizations, their subscription plans, and status.
                </p>

                <div className="glass-panel p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed var(--border-color)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Feature coming soon in the next release.</span>
                </div>
            </div>
        </div>
    );
};

export default Tenants;
