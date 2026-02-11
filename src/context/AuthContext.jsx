import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            axios.defaults.headers.common['x-auth-token'] = token;
            fetchUser();
        } else {
            setLoading(false);
        }
    }, []);

    const fetchUser = async () => {
        try {
            const res = await axios.get('/users/me');
            setUser(res.data);
        } catch (err) {
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['x-auth-token'];
        } finally {
            setLoading(false);
        }
    };

    const login = async (identifier, password) => {
        const cleanId = identifier.trim();
        const cleanPass = password.trim();

        // Decide if it's an email or driverId
        const loginData = cleanId.includes('@') ? { email: cleanId, password: cleanPass } : { driverId: cleanId, password: cleanPass };

        const res = await axios.post('/users/login', loginData);
        localStorage.setItem('token', res.data.token);
        axios.defaults.headers.common['x-auth-token'] = res.data.token;
        setUser(res.data.user);
        return res.data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['x-auth-token'];
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
