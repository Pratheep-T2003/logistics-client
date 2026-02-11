import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { getShipments, createShipment, updateShipmentStatus, deleteShipment } from '../api/shipmentService';
import { getProducts } from '../api/productService';
import { getUsers, updateUser } from '../api/userService';
import { useAuth } from '../context/AuthContext';
import {
    Truck, MapPin, Clock, Plus, X, Edit2, User, Trash2,
    Navigation, CheckCircle2, AlertCircle, FileText,
    Download, Filter, Search, Calendar, ChevronRight,
    BarChart3, PieChart as PieChartIcon, ArrowRight, Plane
} from 'lucide-react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

const Shipments = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [shipments, setShipments] = useState([]);
    const [products, setProducts] = useState([]);
    const [availableDrivers, setAvailableDrivers] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showTrackModal, setShowTrackModal] = useState(false);
    const [showDetailPanel, setShowDetailPanel] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selectedShipment, setSelectedShipment] = useState(null);
    const [statusData, setStatusData] = useState({ status: '', note: '' });
    const [formData, setFormData] = useState({
        shipmentId: '',
        origin: '',
        destination: '',
        assignedDriver: '',
        items: [{ productId: '', quantity: 1 }]
    });

    // Filter states
    const [filterSearch, setFilterSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterDateRange, setFilterDateRange] = useState('all');
    const [filterUser, setFilterUser] = useState('');

    const canManageShipments = user?.role === 'admin' || user?.role === 'manager';

    useEffect(() => {
        fetchData();
        const params = new URLSearchParams(location.search);
        if (params.get('action') === 'add' && canManageShipments) {
            setShowModal(true);
        }
    }, [location.search]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [shipRes, prodRes, userRes] = await Promise.all([
                getShipments(),
                getProducts(),
                getUsers()
            ]);
            setShipments(shipRes.data);
            setProducts(prodRes.data.products || prodRes.data);
            setAllUsers(userRes.data);
            setAvailableDrivers(userRes.data.filter(u => u.role === 'driver'));
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createShipment(formData);
            setShowModal(false);
            setFormData({
                shipmentId: '',
                origin: '',
                destination: '',
                assignedDriver: '',
                items: [{ productId: '', quantity: 1 }]
            });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || "Error creating shipment");
        }
    };

    const handleUpdateStatus = async (e) => {
        e.preventDefault();
        try {
            await updateShipmentStatus(selectedShipment._id, statusData.status, statusData.note);
            setShowStatusModal(false);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || "Error updating status");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Nuclear Option: Delete this shipment permanently?")) {
            try {
                await deleteShipment(id);
                fetchData();
            } catch (err) {
                alert("Deletion blocked by system.");
            }
        }
    };

    const openStatusModal = (shipment) => {
        setSelectedShipment(shipment);
        setStatusData({ status: shipment.status, note: '' });
        setShowStatusModal(true);
    };

    const stats = useMemo(() => {
        const total = shipments.length;
        const inTransit = shipments.filter(s => ['shipped', 'in_transit', 'out_for_delivery'].includes(s.status)).length;
        const delivered = shipments.filter(s => s.status === 'delivered').length;
        const pending = shipments.filter(s => s.status === 'pending').length;
        const delayed = shipments.filter(s => s.status === 'cancelled').length; // Assuming cancelled/other for simulation or dedicated field

        return { total, inTransit, delivered, pending, delayed };
    }, [shipments]);

    // Analytics Data
    const statusChartData = [
        { name: 'Pending', value: stats.pending, color: '#eab308' },
        { name: 'Transit', value: stats.inTransit, color: '#3b82f6' },
        { name: 'Done', value: stats.delivered, color: '#22c55e' },
        { name: 'Alert', value: stats.delayed, color: '#ef4444' }
    ].filter(d => d.value > 0);

    const COLORS = ['#eab308', '#3b82f6', '#22c55e', '#ef4444'];

    // Filter Logic
    const filteredShipments = useMemo(() => {
        return shipments.filter(s => {
            const searchLower = filterSearch.toLowerCase();
            const matchesSearch = s.shipmentId.toLowerCase().includes(searchLower) ||
                s.origin.toLowerCase().includes(searchLower) ||
                s.destination.toLowerCase().includes(searchLower) ||
                s.assignedDriver?.name?.toLowerCase().includes(searchLower);

            const matchesStatus = filterStatus === 'all' || s.status === filterStatus;

            let matchesDate = true;
            const now = new Date();
            const shipDate = new Date(s.updatedAt);
            if (filterDateRange === 'today') {
                matchesDate = shipDate.toDateString() === now.toDateString();
            } else if (filterDateRange === 'week') {
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                matchesDate = shipDate >= weekAgo;
            }

            const matchesUser = !filterUser || s.assignedDriver?._id === filterUser;

            return matchesSearch && matchesStatus && matchesDate && matchesUser;
        });
    }, [shipments, filterSearch, filterStatus, filterDateRange, filterUser]);

    const handleQuickAssign = async (shipmentId, driverId) => {
        try {
            await updateShipmentStatus(shipmentId, 'pending', 'Driver re-assigned', driverId);
            fetchData();
        } catch (err) {
            alert("Assignment failed");
        }
    };

    const StatusSteps = ({ currentStatus }) => {
        const steps = ['pending', 'shipped', 'in_transit', 'out_for_delivery', 'delivered'];
        const currentIndex = steps.indexOf(currentStatus);

        return (
            <div className="status-timeline-mini">
                {steps.map((step, idx) => (
                    <div key={step} className={`step ${idx <= currentIndex ? 'active' : ''} ${currentStatus === 'cancelled' && idx <= currentIndex ? 'cancelled' : ''}`}>
                        <div className="step-dot"></div>
                        {idx < steps.length - 1 && <div className="step-line"></div>}
                    </div>
                ))}
            </div>
        );
    };

    const downloadReport = (type) => {
        alert(`Exporting ${type} report... (Feature simulation)`);
    };

    return (
        <div className="shipments-page dashboard-fade-in">
            <div className="page-header">
                <div className="header-title">
                    <h2>Shipment Logistics</h2>
                    <p className="subtitle">Global tracking & autonomous routing</p>
                </div>
                <div className="header-actions">
                    <button className="btn-secondary" onClick={() => downloadReport('PDF')}>
                        <FileText size={18} /> Export PDF
                    </button>
                    {canManageShipments && (
                        <button className="btn-primary glow-btn" onClick={() => setShowModal(true)}>
                            <Plus size={18} /> New Shipment
                        </button>
                    )}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '2rem' }}>
                <div className="stat-card glass">
                    <div className="stat-icon purple"><Truck size={24} /></div>
                    <div className="stat-info">
                        <h3>Total Shipments</h3>
                        <p className="stat-value">{stats.total}</p>
                    </div>
                </div>
                <div className="stat-card glass border-blue">
                    <div className="stat-icon blue"><Navigation size={24} /></div>
                    <div className="stat-info">
                        <h3>In Transit</h3>
                        <p className="stat-value text-blue">{stats.inTransit}</p>
                    </div>
                </div>
                <div className="stat-card glass border-success">
                    <div className="stat-icon green"><CheckCircle2 size={24} /></div>
                    <div className="stat-info">
                        <h3>Delivered</h3>
                        <p className="stat-value text-green">{stats.delivered}</p>
                    </div>
                </div>
                <div className="stat-card glass border-warning">
                    <div className="stat-icon yellow"><Clock size={24} /></div>
                    <div className="stat-info">
                        <h3>Pending</h3>
                        <p className="stat-value">{stats.pending}</p>
                    </div>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="filter-bar glass" style={{
                padding: '1.2rem',
                borderRadius: '20px',
                marginBottom: '1.5rem',
                display: 'flex',
                gap: '1rem',
                flexWrap: 'wrap',
                alignItems: 'center',
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(0, 210, 255, 0.2)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
            }}>
                <div className="search-box" style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} size={18} />
                    <input
                        type="text"
                        placeholder="Search ID, Origin, Driver..."
                        value={filterSearch}
                        onChange={e => setFilterSearch(e.target.value)}
                        style={{ paddingLeft: '40px', width: '100%', height: '42px' }}
                    />
                </div>

                <div className="quick-chips" style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className={`chip ${filterDateRange === 'all' ? 'active' : ''}`} onClick={() => setFilterDateRange('all')}>All Time</button>
                    <button className={`chip ${filterDateRange === 'today' ? 'active' : ''}`} onClick={() => setFilterDateRange('today')}>Today</button>
                    <button className={`chip ${filterDateRange === 'week' ? 'active' : ''}`} onClick={() => setFilterDateRange('week')}>This Week</button>
                </div>

                <div className="filter-select">
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ height: '42px' }}>
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="in_transit">In Transit</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Delayed/Cancelled</option>
                    </select>
                </div>

                <div className="filter-select">
                    <select value={filterUser} onChange={e => setFilterUser(e.target.value)} style={{ height: '42px' }}>
                        <option value="">All Drivers</option>
                        {availableDrivers.map(d => (
                            <option key={d._id} value={d._id}>{d.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'stretch' }}>
                <div className="data-table-container glass">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Shipment ID</th>
                                <th>Route Timeline</th>
                                <th>Driver Assignment</th>
                                <th>Progress</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredShipments.map(shipment => (
                                <tr key={shipment._id} onClick={() => { setSelectedShipment(shipment); setShowDetailPanel(true); }} style={{ cursor: 'pointer' }}>
                                    <td>
                                        <div style={{ fontWeight: 800, color: 'var(--accent)' }}>SHP-{shipment.shipmentId}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{new Date(shipment.updatedAt).toLocaleTimeString()}</div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>{shipment.origin}</span>
                                            <ArrowRight size={12} color="var(--accent)" />
                                            <span>{shipment.destination}</span>
                                        </div>
                                    </td>
                                    <td onClick={(e) => e.stopPropagation()}>
                                        {canManageShipments ? (
                                            <select
                                                className="inline-assign-select"
                                                value={shipment.assignedDriver?._id || ''}
                                                onChange={(e) => handleQuickAssign(shipment._id, e.target.value)}
                                            >
                                                <option value="">Unassigned</option>
                                                {availableDrivers.map(d => (
                                                    <option key={d._id} value={d._id}>{d.name}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <User size={12} /> {shipment.assignedDriver?.name || 'Pending'}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <StatusSteps currentStatus={shipment.status} />
                                    </td>
                                    <td>
                                        <span className={`status-pill ${shipment.status}`}>
                                            {shipment.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td onClick={(e) => e.stopPropagation()}>
                                        <div className="action-btns">
                                            <button className="btn-icon track-btn" onClick={() => { setSelectedShipment(shipment); setShowTrackModal(true); }} title="Live Tracking">
                                                <Navigation size={16} />
                                            </button>
                                            <button className="btn-icon" onClick={() => openStatusModal(shipment)} title="Edit Status">
                                                <Edit2 size={16} />
                                            </button>
                                            <button className="btn-icon delete" onClick={() => handleDelete(shipment._id)} title="Delete">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="side-analytics">
                    <section className="chart-card glass" style={{ padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <h4 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '10px', width: '100%', fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent)' }}>
                            <PieChartIcon size={20} /> Operational Status
                        </h4>
                        <div style={{ width: '100%', height: 260, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusChartData}
                                        innerRadius={70}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                        cx="50%"
                                        cy="50%"
                                    >
                                        {statusChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', color: 'white' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="chart-legend" style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: '1fr', gap: '12px', width: '100%', padding: '0 10px' }}>
                            {statusChartData.map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color }}></div>
                                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{item.name}</span>
                                    </div>
                                    <span style={{ fontWeight: 800, color: 'white' }}>{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>

            {/* Live Track Modal Simulation */}
            {showTrackModal && selectedShipment && (
                <div className="modal-overlay">
                    <div className="modal-content glass track-modal" style={{ maxWidth: '800px', height: '600px', overflow: 'hidden', padding: 0 }}>
                        <div className="track-header" style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                                <h3>Live Tracking: SHP-{selectedShipment.shipmentId}</h3>
                                <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>From <strong>{selectedShipment.origin}</strong> to <strong>{selectedShipment.destination}</strong></p>
                            </div>
                            <button className="btn-icon" onClick={() => setShowTrackModal(false)}><X size={20} /></button>
                        </div>
                        <div className="map-simulation" style={{ flex: 1, position: 'relative', background: '#1e293b', overflow: 'hidden' }}>
                            {/* Visual representation of a route */}
                            <div className="route-line"></div>
                            <div className="point origin"><MapPin size={24} color="#ef4444" /></div>
                            <div className="point destination"><MapPin size={24} color="#22c55e" /></div>
                            <div className="moving-truck">
                                <Truck size={32} color="var(--accent)" />
                                <div className="truck-pulse"></div>
                            </div>

                            <div className="map-stats">
                                <div className="map-stat-item">
                                    <label>Distance Remaining</label>
                                    <p>12.4 KM</p>
                                </div>
                                <div className="map-stat-item">
                                    <label>Estimated Arrival</label>
                                    <p>14:45 (24 mins left)</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Shipment Detail Panel (Side Slide-out) */}
            {showDetailPanel && selectedShipment && (
                <div className="detail-panel-overlay" onClick={() => setShowDetailPanel(false)}>
                    <div className="detail-panel glass" onClick={e => e.stopPropagation()}>
                        <div className="panel-header">
                            <h3>Shipment Details</h3>
                            <button className="btn-icon" onClick={() => setShowDetailPanel(false)}><X size={20} /></button>
                        </div>
                        <div className="panel-scroll-content">
                            <div className="shipment-id-hero">
                                <Plane size={40} color="var(--accent)" />
                                <h2>SHP-{selectedShipment.shipmentId}</h2>
                                <span className={`status-pill ${selectedShipment.status}`}>{selectedShipment.status.replace('_', ' ')}</span>
                            </div>

                            <section className="detail-section">
                                <label>Route Information</label>
                                <div className="route-box">
                                    <div className="route-node">
                                        <div className="node-icon origin"></div>
                                        <div>
                                            <p className="node-label">Origin</p>
                                            <p className="node-value">{selectedShipment.origin}</p>
                                        </div>
                                    </div>
                                    <div className="route-connector"></div>
                                    <div className="route-node">
                                        <div className="node-icon dest"></div>
                                        <div>
                                            <p className="node-label">Destination</p>
                                            <p className="node-value">{selectedShipment.destination}</p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="detail-section">
                                <label>Personnel & Items</label>
                                <div className="info-card">
                                    <div className="info-row">
                                        <User size={16} />
                                        <span><strong>Driver:</strong> {selectedShipment.assignedDriver?.name || 'Unassigned'}</span>
                                    </div>
                                    <div className="items-list-mini" style={{ marginTop: '1rem' }}>
                                        {selectedShipment.items?.map((item, idx) => (
                                            <div key={idx} className="item-mini">
                                                <span>{item.productId?.name || 'Loading item...'}</span>
                                                <span className="qty">× {item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>

                            <section className="detail-section">
                                <label>Timeline & History</label>
                                <div className="timeline-full">
                                    <div className="timeline-item active">
                                        <div className="time">{new Date(selectedShipment.updatedAt).toLocaleTimeString()}</div>
                                        <div className="event">Status updated to: <strong>{selectedShipment.status}</strong></div>
                                    </div>
                                    <div className="timeline-item">
                                        <div className="time">{new Date(selectedShipment.createdAt).toLocaleTimeString()}</div>
                                        <div className="event">Shipment record initialized in system.</div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            )}

            {/* Standard Modals - Upgraded Styling */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content glass">
                        <div className="modal-header">
                            <h3>Deploy New Cargo</h3>
                            <button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Tracking Identifier</label>
                                    <input type="text" required value={formData.shipmentId} onChange={e => setFormData({ ...formData, shipmentId: e.target.value })} placeholder="e.g. 778899" />
                                </div>
                                <div className="form-group">
                                    <label>Dispatch Origin</label>
                                    <input type="text" required value={formData.origin} onChange={e => setFormData({ ...formData, origin: e.target.value })} placeholder="Warehouse A" />
                                </div>
                                <div className="form-group">
                                    <label>Arrival Destination</label>
                                    <input type="text" required value={formData.destination} onChange={e => setFormData({ ...formData, destination: e.target.value })} placeholder="Client Office" />
                                </div>
                                <div className="form-group">
                                    <label>Driver Assignment</label>
                                    <select className="custom-select" value={formData.assignedDriver} onChange={e => setFormData({ ...formData, assignedDriver: e.target.value })}>
                                        <option value="">Select Pilot...</option>
                                        {availableDrivers.map(d => (
                                            <option key={d._id} value={d._id}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="items-section">
                                <h4>Payload Contents</h4>
                                {formData.items.map((item, index) => (
                                    <div key={index} className="item-row">
                                        <select required value={item.productId} onChange={e => {
                                            const newItems = [...formData.items];
                                            newItems[index].productId = e.target.value;
                                            setFormData({ ...formData, items: newItems });
                                        }}>
                                            <option value="">Select Resource...</option>
                                            {products.map(p => (
                                                <option key={p._id} value={p._id}>{p.sku} - {p.name}</option>
                                            ))}
                                        </select>
                                        <input type="number" min="1" value={item.quantity} onChange={e => {
                                            const newItems = [...formData.items];
                                            newItems[index].quantity = parseInt(e.target.value);
                                            setFormData({ ...formData, items: newItems });
                                        }} />
                                    </div>
                                ))}
                                <button type="button" className="btn-add-item" style={{ color: 'var(--accent)' }} onClick={() => setFormData({ ...formData, items: [...formData.items, { productId: '', quantity: 1 }] })}>
                                    <Plus size={14} /> Add Resource
                                </button>
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Discard</button>
                                <button type="submit" className="btn-primary glow-btn">Confirm Shipment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showStatusModal && (
                <div className="modal-overlay">
                    <div className="modal-content glass" style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h3>Modify Voyage Status</h3>
                            <button className="btn-icon" onClick={() => setShowStatusModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleUpdateStatus}>
                            <div className="form-group">
                                <label>Transition Status</label>
                                <select className="custom-select" value={statusData.status} onChange={e => setStatusData({ ...statusData, status: e.target.value })}>
                                    <option value="pending">🟡 Pending</option>
                                    <option value="shipped">🔵 Shipped</option>
                                    <option value="in_transit">🚚 In Transit</option>
                                    <option value="out_for_delivery">📦 Out for Delivery</option>
                                    <option value="delivered">🟢 Delivered</option>
                                    <option value="cancelled">🔴 Delayed/Cancelled</option>
                                </select>
                            </div>
                            <div className="form-group" style={{ marginTop: '1rem' }}>
                                <label>System Note (Internal)</label>
                                <textarea className="custom-textarea" value={statusData.note} onChange={e => setStatusData({ ...statusData, note: e.target.value })} rows="2"></textarea>
                            </div>
                            <div className="form-actions" style={{ marginTop: '1rem' }}>
                                <button type="button" className="btn-secondary" onClick={() => setShowStatusModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">Apply Update</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Shipments;
