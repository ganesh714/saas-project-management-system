import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const res = await api.get('/auth/me');
                    setUser(res.data.data);
                } catch (err) {
                    console.error(err);
                    localStorage.removeItem('token');
                    setUser(null);
                }
            }
            setLoading(false);
        };
        checkUser();
    }, []);

    const login = async (email, password, subdomain) => {
        // Determine payload based on input
        // If subdomain contains '.', it might be domain, but we expect subdomain or id.
        const payload = { email, password, tenantSubdomain: subdomain };

        const res = await api.post('/auth/login', payload);
        localStorage.setItem('token', res.data.data.token);
        setUser(res.data.data.user);
        // After login, fetch detailed 'me' to get tenant info if needed, but login data usually has it.
        // AuthController login returns { ..., tenantId }, but 'me' return full tenant object.
        // Let's refetch 'me' to be consistent or just use what we have.
        // For specific UI (Subscription plan etc), we might need full tenant.
        // Let's fetch me.
        const meRes = await api.get('/auth/me');
        setUser(meRes.data.data);
        return res.data;
    };

    const registerTenant = async (data) => {
        const res = await api.post('/auth/register-tenant', data);
        return res.data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        // Call backend logout implicitly?
        api.post('/auth/logout').catch(console.error);
        window.location.href = '/login';
    };

    const value = {
        user,
        loading,
        login,
        logout,
        registerTenant
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
