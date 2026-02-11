import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getProducts } from '../api/productService';
import { getShipments } from '../api/shipmentService';
import { getComplaints, deleteComplaint } from '../api/complaintService';
import { useAuth } from '../context/AuthContext';
import {
    Package, Truck, AlertTriangle, CheckCircle, MessageSquare,
    Trash2, TrendingUp, Info, Filter,
    ChevronRight, ArrowRight, Plus, UserPlus, FileBarChart, RefreshCw,
    Search, Calendar, Clock
} from 'lucide-react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList
} from 'recharts';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [stats, setStats] = useState({
        products: 0,
        lowStock: 0,
        activeShipments: 0,
        delivered: 0,
        unassigned: 0,
        totalShipments: 0
    });
    const [complaints, setComplaints] = useState([]);
    const [allComplaints, setAllComplaints] = useState([]);
    const [recentShipments, setRecentShipments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    // Search & Filter state
    const [filters, setFilters] = useState({
        status: 'all',
        driver: '',
        dateRange: 'all'
    });

    const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const promises = [getProducts(), getShipments()];
            if (isAdminOrManager) {
                promises.push(getComplaints());
            }

            const results = await Promise.all(promises);
            const products = results[0].data.products || results[0].data;
            const shipments = results[1].data;

            const lowStock = products.filter(p => p.quantity < 10).length;
            const active = shipments.filter(s => ['pending', 'shipped', 'in_transit', 'out_for_delivery'].includes(s.status)).length;
            const delivered = shipments.filter(s => s.status === 'delivered').length;
            const unassigned = shipments.filter(s => !s.assignedDriver && s.status === 'pending').length;

            setStats({
                products: products.length,
                lowStock: lowStock,
                activeShipments: active,
                delivered: delivered,
                unassigned: unassigned,
                totalShipments: shipments.length
            });

            setRecentShipments(shipments);

            if (isAdminOrManager && results[2]) {
                const allDeps = results[2].data;
                setAllComplaints(allDeps);
                setComplaints(allDeps.filter(c => c.status === 'Pending'));
            }

            setLastUpdated(new Date());
            setLoading(false);
        } catch (err) {
            console.error("Dashboard Fetch Error:", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
        // Auto refresh every 5 minutes
        const interval = setInterval(fetchDashboardData, 300000);
        return () => clearInterval(interval);
    }, [user?.role]); // Refetch if role changes (e.g. login/logout)

    // Effect to handle quick actions from query parameters
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const action = params.get('action');

        if (action === 'add') {
            const target = params.get('target');
            if (target === 'product' && isAdminOrManager) {
                navigate('/inventory?action=add');
            } else if (target === 'shipment' && isAdminOrManager) {
                navigate('/shipments?action=add');
            } else if (target === 'user' && isAdminOrManager) {
                navigate('/users?action=add');
            }
        }
    }, [location.search, navigate, isAdminOrManager]);

    const handleRemoveComplaint = async (id) => {
        if (window.confirm("Remove this complaint report?")) {
            try {
                await deleteComplaint(id);
                setComplaints(complaints.filter(c => c._id !== id));
            } catch (err) {
                alert("Error removing complaint");
            }
        }
    };

    if (loading && recentShipments.length === 0) {
        return <div className="loading-msg">Refreshing Dashboard...</div>;
    }

    // --- DRIVER VIEW ---
    if (user?.role === 'driver') {
        return (
            <div className="dashboard-fade-in">
                <div className="welcome-banner glass">
                    <h1>Welcome, {user.name}</h1>
                    <p>You have {stats.activeShipments} active orders waiting for delivery.</p>
                </div>
                <div className="stats-grid" style={{ marginTop: '2rem' }}>
                    <div className="stat-card glass blue">
                        <div className="stat-icon blue"><Truck size={24} /></div>
                        <div className="stat-info">
                            <h3>My Active Orders</h3>
                            <p className="stat-value">{stats.activeShipments}</p>
                            <div className="stat-trend info">
                                <Info size={12} /> Live Tracking Active
                            </div>
                        </div>
                    </div>
                    <div className="stat-card glass green">
                        <div className="stat-icon green"><CheckCircle size={24} /></div>
                        <div className="stat-info">
                            <h3>Total Delivered</h3>
                            <p className="stat-value">{stats.delivered}</p>
                            <div className="stat-trend up">
                                <TrendingUp size={12} /> Keep it up!
                            </div>
                        </div>
                    </div>
                </div>

                <div className="last-updated">
                    <RefreshCw size={12} style={{ marginRight: '5px' }} />
                    Last updated: {lastUpdated.toLocaleString()}
                </div>
            </div>
        );
    }

    // --- ADMIN / MANAGER VIEW ---
    const shipmentStatusData = [
        { name: 'Delivered', value: stats.delivered, color: '#22c55e' },
        { name: 'In Transit', value: recentShipments.filter(s => s.status === 'in_transit' || s.status === 'shipped' || s.status === 'out_for_delivery').length, color: '#3b82f6' },
        { name: 'Pending', value: recentShipments.filter(s => s.status === 'pending').length, color: '#eab308' },
        { name: 'Others', value: recentShipments.filter(s => !['delivered', 'in_transit', 'shipped', 'pending', 'out_for_delivery'].includes(s.status)).length, color: '#94a3b8' }
    ].filter(d => d.value > 0);

    const inventoryLevelData = [
        { name: 'In Stock', count: stats.products - stats.lowStock, fill: '#22c55e' },
        { name: 'Low Stock', count: stats.lowStock, fill: '#eab308' },
        { name: 'Critical', count: recentShipments.filter(s => s.status === 'cancelled').length, fill: '#ef4444' }
    ];

    const complaintStatCounts = {
        pending: allComplaints.filter(c => c.status === 'Pending').length,
        resolved: allComplaints.filter(c => c.status === 'Solved').length,
        ongoing: allComplaints.filter(c => c.status === 'Ongoing Process').length
    };

    return (
        <div className="dashboard-fade-in">
            <div className="dashboard-header-row">
                <div className="welcome-banner-compact">
                    <h1>{user?.role === 'admin' ? 'Admin Dashboard' : 'Manager Dashboard'}</h1>
                    <p>Overview of your logistics operations</p>
                </div>
                <button className="btn-secondary btn-mini" onClick={fetchDashboardData} disabled={loading}>
                    <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh Data
                </button>
            </div>

            {/* KPI Cards Section */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <div className="stat-card glass">
                    <div className="stat-icon purple"><Package size={24} /></div>
                    <div className="stat-info">
                        <h3>Total Inventory</h3>
                        <p className="stat-value">{stats.products}</p>
                        <div className="stat-trend up">
                            <TrendingUp size={12} /> Total SKU's
                        </div>
                    </div>
                </div>
                <div className="stat-card glass">
                    <div className="stat-icon yellow"><AlertTriangle size={24} /></div>
                    <div className="stat-info">
                        <h3>Low Stock</h3>
                        <p className="stat-value">{stats.lowStock}</p>
                        <div className="stat-trend warning">
                            {stats.lowStock > 0 ? <><AlertTriangle size={12} /> Needs Action</> : <><CheckCircle size={12} /> Stable</>}
                        </div>
                    </div>
                </div>
                <div className="stat-card glass">
                    <div className="stat-icon blue"><Truck size={24} /></div>
                    <div className="stat-info">
                        <h3>Active Travel</h3>
                        <p className="stat-value">{stats.activeShipments}</p>
                        <div className="stat-trend info">
                            <Truck size={12} /> In Transit
                        </div>
                    </div>
                </div>
                <div className="stat-card glass">
                    <div className="stat-icon green"><CheckCircle size={24} /></div>
                    <div className="stat-info">
                        <h3>Delivered</h3>
                        <p className="stat-value">{stats.delivered}</p>
                        <div className="stat-trend up">
                            <CheckCircle size={12} /> Completed
                        </div>
                    </div>
                </div>
                <div className="stat-card glass">
                    <div className="stat-icon red" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}><AlertTriangle size={24} /></div>
                    <div className="stat-info">
                        <h3>Unassigned</h3>
                        <p className="stat-value">{stats.unassigned}</p>
                        <div className="stat-trend warning">
                            <Clock size={12} /> Waiting for driver
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="charts-container">
                <section className="chart-card glass">
                    <h3>📊 Shipment Status Distribution</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        {shipmentStatusData.length > 0 ? (
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={shipmentStatusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {shipmentStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                        itemStyle={{ color: '#f8fafc' }}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="empty-chart">No shipment data available</div>
                        )}
                    </div>
                </section>

                <section className="chart-card glass">
                    <h3>📈 Inventory Levels</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={inventoryLevelData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="name" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                />
                                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                    <LabelList dataKey="count" position="top" fill="#f8fafc" />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </section>
            </div>

            {/* Bottom Row: Quick Actions & Complaints */}
            <div className="dashboard-grid-single">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <section className="quick-actions glass" style={{ padding: '2rem' }}>
                        <div className="section-header">
                            <h2>Quick Actions</h2>
                            <Plus size={20} color="#00d2ff" />
                        </div>
                        <div className="quick-actions-grid">
                            <div className="quick-action-btn" onClick={() => navigate('/inventory?action=add')}>
                                <Package size={20} />
                                <span>Add Inventory</span>
                            </div>
                            <div className="quick-action-btn" onClick={() => navigate('/shipments?action=add')}>
                                <Truck size={20} />
                                <span>Create Shipment</span>
                            </div>
                            <div className="quick-action-btn" onClick={() => navigate('/users?action=add')}>
                                <UserPlus size={20} />
                                <span>Add Driver</span>
                            </div>
                            <div className="quick-action-btn" onClick={() => navigate('/shipments')}>
                                <FileBarChart size={20} />
                                <span>View Reports</span>
                            </div>
                        </div>
                    </section>

                    <section className="complaints-section glass">
                        <div className="section-header">
                            <h2>Driver Complaints</h2>
                            <MessageSquare size={20} color="#f87171" />
                        </div>

                        <div className="complaints-summary-grid">
                            <div className="complaint-stat">
                                <span className="label">Pending</span>
                                <span className="value text-yellow">{complaintStatCounts.pending}</span>
                            </div>
                            <div className="complaint-stat">
                                <span className="label">Resolved</span>
                                <span className="value text-green">{complaintStatCounts.resolved}</span>
                            </div>
                            <div className="complaint-stat">
                                <span className="label">Active</span>
                                <span className="value text-blue">{complaintStatCounts.ongoing}</span>
                            </div>
                        </div>

                        <div className="complaints-list">
                            {complaints.length > 0 ? complaints.slice(0, 3).map(c => (
                                <div key={c._id} className={`complaint-card-mini priority-${c.priority?.toLowerCase() || 'medium'}`}>
                                    <div className="complaint-meta">
                                        <span className="user">{c.userName}</span>
                                        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                            <span className="status-dot pending"></span>
                                        </div>
                                    </div>
                                    <h4>{c.subject}</h4>
                                    <p>{c.message.substring(0, 60)}...</p>
                                    <div className="action-alert-btns">
                                        <button className="filter-btn btn-mini" onClick={() => navigate('/complaints')}>View</button>
                                        <button className="btn-primary btn-mini" style={{ background: '#22c55e' }} onClick={() => handleRemoveComplaint(c._id)}>Resolve</button>
                                    </div>
                                </div>
                            )) : (
                                <p className="empty-msg">No new pending complaints.</p>
                            )}
                            {(complaints.length > 3 || allComplaints.length > 0) && (
                                <div className="view-all-link" onClick={() => navigate('/complaints')}>
                                    Manage all {allComplaints.length} complaints <ArrowRight size={14} style={{ verticalAlign: 'middle' }} />
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>

            <div className="last-updated">
                <RefreshCw size={12} style={{ marginRight: '5px' }} />
                Last updated: {lastUpdated.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
        </div>
    );
};

export default Dashboard;
