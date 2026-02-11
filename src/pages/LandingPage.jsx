import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Shield, Briefcase, User, ArrowRight, CheckCircle, Globe, Zap } from 'lucide-react';
import './LandingPage.css';

const LandingPage = () => {
    const navigate = useNavigate();
    const [selectedRole, setSelectedRole] = useState(null);

    const roles = [
        {
            id: 'admin',
            title: 'Administrator',
            icon: <Shield size={32} />,
            desc: 'Full system control, team management, and global analytics.',
            color: '#00d2ff'
        },
        {
            id: 'manager',
            title: 'Logistics Manager',
            icon: <Briefcase size={32} />,
            desc: 'Inventory oversight, shipment tracking, and reporting.',
            color: '#a855f7'
        },
        {
            id: 'driver',
            title: 'Fleet Driver',
            icon: <User size={32} />,
            desc: 'Route optimization, delivery status, and instant updates.',
            color: '#22c55e'
        }
    ];

    const scrollToSection = (e, id) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            window.scrollTo({
                top: element.offsetTop - 100, // Account for fixed nav
                behavior: 'smooth'
            });
        }
    };

    const handleLoginRedirect = () => {
        if (!selectedRole) {
            const element = document.getElementById('portal-selection');
            if (element) {
                window.scrollTo({
                    top: element.offsetTop - 120,
                    behavior: 'smooth'
                });
            }
            return;
        }
        navigate('/login', { state: { requiredRole: selectedRole } });
    };

    return (
        <div className="landing-container">
            {/* Background elements */}
            <div className="landing-blobs">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
                <div className="blob blob-3"></div>
            </div>

            <div className="ticker-bar">
                <div className="ticker-text">
                    <span>LIVE UPDATES: Global Network Active • 42 Countries Connected • Delivery Sync: 0.4s • Fleet Efficiency: +38% • New Driver Portals Activated • Real-time Inventory Syncing...</span>
                    <span>LIVE UPDATES: Global Network Active • 42 Countries Connected • Delivery Sync: 0.4s • Fleet Efficiency: +38% • New Driver Portals Activated • Real-time Inventory Syncing...</span>
                </div>
            </div>

            <nav className="landing-nav glass">
                <div className="logo">
                    <Truck size={32} color="#00f2fe" />
                    <span className="logo-text">
                        <span className="logo-main" style={{ fontStyle: 'italic', fontWeight: 900 }}>Black's</span>
                        <span className="logo-accent" style={{ color: '#00f2fe', letterSpacing: '4px' }}>Logistics Pro</span>
                    </span>
                </div>
                <div className="nav-links-landing">
                    <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Home</a>
                    <a href="#features" onClick={(e) => scrollToSection(e, 'features')}>Features</a>
                    <a href="#solutions" onClick={(e) => scrollToSection(e, 'solutions')}>Solutions</a>
                </div>
            </nav>

            <main className="landing-hero">
                <div className="hero-content">
                    <div className="badge-new">EST. 2026 • GLOBAL SCALE</div>
                    <h1 className="hero-title">
                        Revolutionize <br />
                        <span className="text-gradient">Logistics 2.0</span>
                    </h1>
                    <p className="hero-subtitle">
                        The ultimate high-performance workspace for global supply chains.
                        Sub-second tracking, neural route optimization, and military-grade security.
                    </p>

                    <div id="portal-selection" className="role-selection-container">
                        <h3>Secure Portal Access</h3>
                        <div className="role-grid">
                            {roles.map((role) => (
                                <div
                                    key={role.id}
                                    className={`role-card ${selectedRole === role.id ? 'active' : ''}`}
                                    onClick={() => setSelectedRole(role.id)}
                                    style={{ '--role-color': role.color }}
                                >
                                    <div className="role-icon">{role.icon}</div>
                                    <div className="role-info">
                                        <h4>{role.title}</h4>
                                        <p>{role.desc}</p>
                                    </div>
                                    {selectedRole === role.id && <div className="check-badge"><CheckCircle size={20} /></div>}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="hero-actions">
                        <button className="btn-get-started" onClick={handleLoginRedirect}>
                            Initialize Workspace <ArrowRight size={20} />
                        </button>
                    </div>
                </div>

                <div className="hero-visual">
                    <div className="visual-card glass">
                        <div className="visual-header">
                            <div className="dots"><span /><span /><span /></div>
                            <div className="status-indicator">
                                <span className="pulse"></span>
                                Global Tracking: ACTIVE
                            </div>
                        </div>
                        <div className="visual-stats">
                            <div className="v-stat">
                                <div className="v-icon-box" style={{ background: 'rgba(0, 242, 254, 0.1)' }}>
                                    <Globe size={24} color="#00f2fe" />
                                </div>
                                <div>
                                    <span className="v-label">Total Reach</span>
                                    <span className="v-value">2,482 Nodes</span>
                                </div>
                            </div>
                            <div className="v-stat">
                                <div className="v-icon-box" style={{ background: 'rgba(112, 0, 255, 0.1)' }}>
                                    <Zap size={24} color="#7000ff" />
                                </div>
                                <div>
                                    <span className="v-label">Processing</span>
                                    <span className="v-value">0.4ms Latency</span>
                                </div>
                            </div>
                            <div className="v-stat">
                                <div className="v-icon-box" style={{ background: 'rgba(0, 255, 135, 0.1)' }}>
                                    <CheckCircle size={24} color="#00ff87" />
                                </div>
                                <div>
                                    <span className="v-label">Reliability</span>
                                    <span className="v-value">99.99% Uptime</span>
                                </div>
                            </div>
                        </div>
                        <div className="visual-footer">
                            <div className="mini-chart">
                                {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                                    <div key={i} className="bar" style={{ height: `${h}%` }}></div>
                                ))}
                            </div>
                            <span>Real-time Network Traffic</span>
                        </div>
                    </div>
                </div>
            </main>

            <div className="trusted-by">
                <span>TRUSTED BY INDUSTRY TITANS</span>
                <div className="company-logos">
                    <div className="logo-item">GLOBALCARGO</div>
                    <div className="logo-item">SWIFTFLEET</div>
                    <div className="logo-item">OCEANIC.IO</div>
                    <div className="logo-item">SKYNET LOGISTICS</div>
                    <div className="logo-item">V-TECH FORWARDING</div>
                </div>
            </div>

            <section id="features" className="landing-section">
                <div className="section-header">
                    <div className="badge-new">ADVANCED CORE</div>
                    <h2>The Future is Liquid</h2>
                </div>
                <div className="features-grid">
                    <div className="feature-item glass">
                        <Zap color="#00f2fe" size={32} />
                        <h4>Quantum Tracking</h4>
                        <p>Predictive location engines with precision down to the meter.</p>
                    </div>
                    <div className="feature-item glass">
                        <Shield color="#7000ff" size={32} />
                        <h4>Biometric Auth</h4>
                        <p>Zero-trust architecture ensuring your data remains your data.</p>
                    </div>
                    <div className="feature-item glass">
                        <Globe color="#00ff87" size={32} />
                        <h4>Hyper-Connected</h4>
                        <p>Unified interface for air, sea, and land logistics networks.</p>
                    </div>
                </div>
            </section>

            <section id="solutions" className="landing-section solutions-bg">
                <div className="section-header">
                    <div className="badge-new">SOLUTIONS</div>
                    <h2>Tailored for Your Role</h2>
                </div>
                <div className="solutions-content">
                    <div className="solution-card glass">
                        <Shield size={40} color="#00f2fe" />
                        <h3>For Administrators</h3>
                        <p>Global oversight, team management, and financial reporting at your fingertips.</p>
                    </div>
                    <div className="solution-card glass">
                        <Briefcase size={40} color="#7000ff" />
                        <h3>For Managers</h3>
                        <p>Inventory optimization and shipment workflow automation for peak efficiency.</p>
                    </div>
                    <div className="solution-card glass">
                        <Truck size={40} color="#00ff87" />
                        <h3>For Drivers</h3>
                        <p>Simplified mobile interface for route tracking and instant complaint reporting.</p>
                    </div>
                </div>
            </section>

            <footer className="landing-footer">
                <div className="footer-content">
                    <div className="logo">
                        <Truck size={24} color="#00f2fe" />
                        <span className="logo-text">
                            <span className="logo-main">Black's</span>
                            <span className="logo-accent">Logistics Pro</span>
                        </span>
                    </div>
                    <p>&copy; 2026 Black's Logistics Pro. All Rights Reserved.</p>
                </div>
                {/* <div className="footer-links">
                    <a href="#">Security</a>
                    <a href="#">Architecture</a>
                    <a href="#">Neural Link</a>
                </div> */}
            </footer>
        </div>
    );
};

export default LandingPage;
