import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Truck, Lock, User as UserIcon, ShieldCheck, Mail, HelpCircle, ArrowRight, ArrowLeft, Shield, Briefcase, User } from 'lucide-react';

const Login = () => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Get required role from state (passed from LandingPage)
    const requiredRole = location.state?.requiredRole;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await login(identifier, password);

            // Check if user role matches the selection from Landing Page
            if (requiredRole && data.user.role !== requiredRole) {
                await logout(); // Logout immediately if role mismatch
                setError(`Access Denied: Your account is not authorized for the ${requiredRole} portal.`);
                return;
            }

            navigate('/');
        } catch (err) {
            console.error('Login error:', err);
            if (!err.response) {
                setError('Cannot connect to server. Please check if backend is running.');
            } else {
                setError(err.response?.data?.message || 'Invalid credentials');
            }
        } finally {
            setLoading(false);
        }
    };

    const getRoleIcon = () => {
        switch (requiredRole) {
            case 'admin': return <Shield size={16} />;
            case 'manager': return <Briefcase size={16} />;
            case 'driver': return <User size={16} />;
            default: return null;
        }
    };

    return (
        <div className="login-container">
            <div className="login-bg-shapes">
                <div className="shape shape-1"></div>
                <div className="shape shape-2"></div>
                <div className="shape shape-3"></div>
            </div>

            <div className="login-card glass">
                <button className="btn-back" onClick={() => navigate('/')}>
                    <ArrowLeft size={16} /> Back
                </button>

                <div className="login-header">
                    <div className="login-logo-wrapper">
                        <Truck size={40} color="#00d2ff" strokeWidth={2.5} />
                    </div>
                    <h1>Logistics<span>Pro</span></h1>
                    {requiredRole ? (
                        <div className="role-indicator" style={{
                            background: 'rgba(0, 210, 255, 0.1)',
                            color: '#00d2ff',
                            padding: '0.4rem 1rem',
                            borderRadius: '100px',
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginTop: '1rem',
                            textTransform: 'uppercase',
                            border: '1px solid rgba(0, 210, 255, 0.2)'
                        }}>
                            {getRoleIcon()} {requiredRole} Portal
                        </div>
                    ) : (
                        <p>Advanced Supply Chain Management System</p>
                    )}
                </div>

                {error && (
                    <div className="error-alert fade-in" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        <ShieldCheck size={18} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label>
                            <UserIcon size={14} />
                            <span>{requiredRole === 'driver' ? 'Driver ID' : 'Company Email'}</span>
                        </label>
                        <div className="input-with-icon">
                            {requiredRole === 'driver' ? <User className="field-icon" size={18} /> : <Mail className="field-icon" size={18} />}
                            <input
                                type="text"
                                placeholder={requiredRole === 'driver' ? "DRV-XXXX" : "name@company.com"}
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group" style={{ marginTop: '1.5rem' }}>
                        <div className="label-flex">
                            <label>
                                <Lock size={14} />
                                <span>Password</span>
                            </label>
                        </div>
                        <div className="input-with-icon">
                            <Lock className="field-icon" size={18} />
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn-primary login-btn" disabled={loading} style={{
                        marginTop: '2rem',
                        padding: '1rem',
                        borderRadius: '14px',
                        background: 'linear-gradient(135deg, #00d2ff, #2563eb)'
                    }}>
                        {loading ? 'Authenticating...' : <>Access Portal <ArrowRight size={18} style={{ marginLeft: '8px' }} /></>}
                    </button>

                    <div className="login-footer">
                        <p><HelpCircle size={14} /> Need Help? <span className="contact-link" onClick={() => alert("Contact IT Support for access issues.")}>Contact Support</span></p>
                    </div>
                </form>
            </div>

            <div className="login-copyright">
                © 2026 Black's Logistics Pro. Authorized Personnel Only.
            </div>
        </div>
    );
};

export default Login;
