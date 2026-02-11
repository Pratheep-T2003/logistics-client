import React from 'react';
import { HashRouter as Router, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { Package, Truck, Users as UsersIcon, BarChart3, Bell, LogOut, ClipboardList, MessageSquare, AlertCircle, Search, X, CheckCircle } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Shipments from './pages/Shipments';
import Users from './pages/Users';
import Login from './pages/Login';
import DriverOrders from './pages/DriverOrders';
import Complaints from './pages/Complaints';
import LandingPage from './pages/LandingPage';
import api from './api/axios';
import { useState } from 'react';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div className="loading-screen">Loading...</div>;
    if (!user) return <Navigate to="/login" />;
    return children;
};

function AppContent() {
    console.log("AppContent Rendering...");
    const { user, logout, loading: authLoading } = useAuth();
    console.log("Auth State:", { user, authLoading });
    const location = useLocation();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResult, setSearchResult] = useState(null);
    const [showResultModal, setShowResultModal] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [complaintCount, setComplaintCount] = useState(0);
    const [alertShipments, setAlertShipments] = useState(0);

    React.useEffect(() => {
        if (user && (user.role === 'admin' || user.role === 'manager')) {
            const fetchData = async () => {
                try {
                    const [compRes, shipRes] = await Promise.all([
                        api.get('/complaints'),
                        api.get('/shipments')
                    ]);

                    const complaints = Array.isArray(compRes.data) ? compRes.data : [];
                    const pendingComplaints = complaints.filter(c => c.status === 'Pending').length;
                    setComplaintCount(pendingComplaints);

                    const shipments = Array.isArray(shipRes.data) ? shipRes.data : [];
                    const delayed = shipments.filter(s => s.status === 'cancelled').length;
                    setAlertShipments(delayed);
                } catch (err) {
                    console.error("Failed to fetch notification data", err);
                }
            };
            fetchData();
            const interval = setInterval(fetchData, 60000);
            return () => clearInterval(interval);
        }
    }, [user]);

    if (!user) {
        return (
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        );
    }

    const getPageClass = () => {
        const path = location.pathname;
        if (path === '/' || path === '') return 'page-dashboard';
        if (path.startsWith('/inventory')) return 'page-inventory';
        if (path.startsWith('/shipments')) return 'page-shipments';
        if (path.startsWith('/users')) return 'page-users';
        if (path.startsWith('/my-deliveries')) return 'page-shipments';
        if (path.startsWith('/complaints')) return 'page-complaints';
        return '';
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setSearchLoading(true);
        try {

            const res = await api.get(`/shipments/search?q=${searchQuery}`);
            const found = res.data;

            if (found) {
                setSearchResult(found);
                setShowResultModal(true);
            } else {
                alert("Shipment not found with that ID");
            }
        } catch (err) {
            if (err.response && err.response.status === 404) {
                alert("Shipment not found with that ID");
            } else {
                console.error("Search failed", err);
                alert("Error searching for shipment");
            }
        } finally {
            setSearchLoading(false);
        }
    };

    const isDriver = user.role === 'driver';

    return (
        <div className={`app-container role-${user.role} ${getPageClass()}`}>
            <aside className="sidebar">
                <div className="logo">
                    <Truck size={32} color="#5ed3edff" />
                    <span className="logo-text">
                        <span className="logo-main">Black's</span>
                        <span className="logo-accent">Logistics</span>
                    </span>
                </div>
                <nav className="nav-links">
                    <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
                        <BarChart3 size={20} /> Dashboard
                    </NavLink>

                    {!isDriver && (
                        <>
                            <NavLink to="/inventory" className={({ isActive }) => isActive ? 'active' : ''}>
                                <Package size={20} /> Inventory
                            </NavLink>
                            <NavLink to="/shipments" className={({ isActive }) => isActive ? 'active' : ''}>
                                <Truck size={20} /> Shipments
                            </NavLink>
                            {(user.role === 'admin' || user.role === 'manager') && (
                                <NavLink to="/users" className={({ isActive }) => isActive ? 'active' : ''}>
                                    <UsersIcon size={20} /> Team
                                </NavLink>
                            )}
                        </>
                    )}

                    {isDriver && (
                        <>
                            <NavLink to="/my-deliveries" className={({ isActive }) => isActive ? 'active' : ''}>
                                <ClipboardList size={20} /> My Deliveries
                            </NavLink>
                            <NavLink to="/complaints" className={({ isActive }) => isActive ? 'active' : ''}>
                                <MessageSquare size={20} /> Make Complaint
                            </NavLink>
                        </>
                    )}
                    {!isDriver && (
                        <NavLink to="/complaints" className={({ isActive }) => isActive ? 'active' : ''}>
                            <AlertCircle size={20} />
                            <span>Complaints</span>
                            {complaintCount > 0 && <span className="nav-badge">{complaintCount}</span>}
                        </NavLink>
                    )}
                </nav>
                <div className="sidebar-footer">
                    <button onClick={logout} className="logout-btn">
                        <LogOut size={20} /> Logout
                    </button>
                </div>
            </aside>

            <main className="content">
                <header className="top-header">
                    <form className="search-global" onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
                        <input
                            type="text"
                            placeholder="Search Shipment ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button type="submit" className="btn-icon" style={{ background: 'var(--accent)', color: 'var(--bg-dark)' }}>
                            <Search size={20} />
                        </button>
                    </form>
                    <div className="user-profile">
                        <div className="notification-bell" title={`${alertShipments} shipment alerts`}>
                            <Bell size={20} />
                            {alertShipments > 0 && <span className="dot" style={{ background: '#ef4444' }}></span>}
                        </div>
                        <div className="avatar">{(user?.name || '?').charAt(0)}</div>
                        <div className="user-details">
                            <span className="user-name">{user?.name || 'User'}</span>
                            <span className="user-role">{user?.role} {user?.driverId ? `(#${user.driverId})` : ''}</span>
                        </div>
                    </div>
                </header>

                <div className="page-content">
                    <Routes>
                        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                        <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
                        <Route path="/shipments" element={<ProtectedRoute><Shipments /></ProtectedRoute>} />
                        <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
                        <Route path="/my-deliveries" element={<ProtectedRoute><DriverOrders /></ProtectedRoute>} />
                        <Route path="/complaints" element={<ProtectedRoute><Complaints /></ProtectedRoute>} />
                    </Routes>
                </div>
            </main>

            {/* Global Search Result Modal */}
            {showResultModal && searchResult && (
                <div className="modal-overlay" style={{ zIndex: 2000 }}>
                    <div className="modal-content glass" style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h3><Search size={20} style={{ marginRight: '8px' }} /> Search Result</h3>
                            <button className="btn-icon" onClick={() => setShowResultModal(false)}><X size={20} /></button>
                        </div>
                        <div className="search-result-content" style={{ textAlign: 'center', padding: '1rem' }}>
                            <div className={`status-pill ${searchResult.status}`} style={{ display: 'inline-block', fontSize: '1.2rem', padding: '0.5rem 1.5rem', marginBottom: '1.5rem' }}>
                                {searchResult.status.replace('_', ' ')}
                            </div>

                            <div className="result-details" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', textAlign: 'left' }}>
                                <div>
                                    <label style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Shipment ID</label>
                                    <p style={{ fontWeight: 'bold' }}>SHP-{searchResult.shipmentId}</p>
                                </div>
                                <div>
                                    <label style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Internal ID</label>
                                    <p style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{searchResult._id}</p>
                                </div>
                                <div>
                                    <label style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Customer</label>
                                    <p>{searchResult.customerName}</p>
                                </div>
                                <div>
                                    <label style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Destination</label>
                                    <p>{searchResult.destination}</p>
                                </div>
                            </div>

                            <div style={{ marginTop: '2rem' }}>
                                {searchResult.assignedDriver ? (
                                    <div className="driver-info" style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div className="avatar" style={{ width: '40px', height: '40px', fontSize: '1rem' }}>
                                            <Truck size={20} />
                                        </div>
                                        <div style={{ textAlign: 'left' }}>
                                            <p style={{ fontWeight: 'bold' }}>{searchResult.assignedDriver.name}</p>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Assigned Driver</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="driver-info" style={{ border: '1px dashed var(--text-secondary)', padding: '1rem', borderRadius: '12px', color: 'var(--text-secondary)' }}>
                                        No driver assigned
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="form-actions" style={{ marginTop: '2rem', justifyContent: 'center' }}>
                            <button className="btn-primary" onClick={() => setShowResultModal(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function App() {
    return (
        <AuthProvider>
            <Router>
                <AppContent />
            </Router>
        </AuthProvider>
    );
}

export default App;
