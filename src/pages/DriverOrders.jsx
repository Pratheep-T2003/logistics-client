import React, { useState, useEffect } from 'react';
import { getShipments, updateShipmentStatus } from '../api/shipmentService';
import { createComplaint } from '../api/complaintService';
import {
    Truck, MapPin, Clock, Edit2, AlertCircle, CheckCircle2,
    MessageSquare, Send, X, Package, Navigation, TrendingUp
} from 'lucide-react';

const DriverOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showComplaintModal, setShowComplaintModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [statusData, setStatusData] = useState({ status: '', note: '' });
    const [complaintData, setComplaintData] = useState({ subject: '', message: '' });

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await getShipments();
            setOrders(Array.isArray(res.data) ? res.data : []);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (e) => {
        e.preventDefault();
        try {
            await updateShipmentStatus(selectedOrder._id, statusData.status, statusData.note);
            setShowStatusModal(false);
            fetchOrders();
        } catch (err) {
            alert("Error updating order");
        }
    };

    const handleComplaint = async (e) => {
        e.preventDefault();
        try {
            await createComplaint(complaintData);
            setShowComplaintModal(false);
            setComplaintData({ subject: '', message: '' });
            alert("Complaint submitted successfully");
        } catch (err) {
            alert("Error submitting complaint");
        }
    };

    const stats = {
        total: orders.length,
        delivered: orders.filter(o => o.status === 'delivered').length,
        inTransit: orders.filter(o => o.status === 'in_transit' || o.status === 'out_for_delivery').length,
        pending: orders.filter(o => o.status === 'pending').length
    };

    return (
        <div className="driver-orders-page dashboard-fade-in">
            <div className="page-header">
                <div className="header-title">
                    <h2>Flight Deck: My Orders</h2>
                    <p className="subtitle">Real-time task synchronization and tactical reporting</p>
                </div>
                <button className="btn-primary glow-btn" onClick={() => setShowComplaintModal(true)}>
                    <MessageSquare size={18} /> File Tactical Report
                </button>
            </div>

            {/* Tactical Summary */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '2rem' }}>
                <div className="stat-card glass">
                    <div className="stat-icon blue"><Package size={24} /></div>
                    <div className="stat-info">
                        <h3>Total Assigned</h3>
                        <p className="stat-value">{stats.total}</p>
                    </div>
                </div>
                <div className="stat-card glass border-blue">
                    <div className="stat-icon blue" style={{ color: 'var(--accent)' }}><Navigation size={24} /></div>
                    <div className="stat-info">
                        <h3>In Progress</h3>
                        <p className="stat-value text-blue">{stats.inTransit}</p>
                    </div>
                </div>
                <div className="stat-card glass border-success">
                    <div className="stat-icon green"><CheckCircle2 size={24} /></div>
                    <div className="stat-info">
                        <h3>Completed</h3>
                        <p className="stat-value text-green">{stats.delivered}</p>
                    </div>
                </div>
                <div className="stat-card glass border-warning">
                    <div className="stat-icon yellow"><TrendingUp size={24} /></div>
                    <div className="stat-info">
                        <h3>Efficiency</h3>
                        <p className="stat-value">{stats.total > 0 ? Math.round((stats.delivered / stats.total) * 100) : 0}%</p>
                    </div>
                </div>
            </div>

            <div className="shipment-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                {orders.length > 0 ? orders.map(order => (
                    <div key={order._id} className={`member-card glass ${order.status === 'delivered' ? 'glow-success' : 'glow-blue'}`} style={{ padding: '1.5rem', cursor: 'default' }}>
                        <div className="card-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div className="avatar small" style={{ background: 'var(--accent-gradient)' }}>
                                    <Package size={14} />
                                </div>
                                <span style={{ fontWeight: 800, color: 'var(--accent)', fontSize: '1.1rem' }}>SHP-{order.shipmentId}</span>
                            </div>
                            <span className={`status-pill ${order.status}`}>{order.status.replace('_', ' ')}</span>
                        </div>

                        <div className="card-route" style={{ marginBottom: '1.5rem', position: 'relative' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#94a3b8' }}></div>
                                <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>{order.origin}</span>
                            </div>
                            <div style={{ marginLeft: '3px', borderLeft: '2px dashed rgba(255,255,255,0.1)', height: '20px', marginBottom: '10px' }}></div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <MapPin size={16} color="var(--accent)" />
                                <span style={{ fontWeight: 700 }}>{order.destination}</span>
                            </div>
                        </div>

                        <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.2rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <Clock size={12} /> Assigned {new Date(order.createdAt).toLocaleDateString()}
                                </div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{order.items?.length || 0} Payload Items</div>
                            </div>
                            <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={() => {
                                setSelectedOrder(order);
                                setStatusData({ status: order.status, note: '' });
                                setShowStatusModal(true);
                            }}>
                                <Edit2 size={14} style={{ marginRight: '6px' }} /> Update
                            </button>
                        </div>
                    </div>
                )) : (
                    <div className="empty-state glass" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '5rem' }}>
                        <Truck size={64} color="var(--text-secondary)" style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <h3>{loading ? "Synchronizing Orders..." : "No tactical assignments detected."}</h3>
                    </div>
                )}
            </div>

            {/* Update Status Modal */}
            {showStatusModal && (
                <div className="modal-overlay">
                    <div className="modal-content glass" style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h3>Transmit Status Update</h3>
                            <button className="btn-icon" onClick={() => setShowStatusModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleUpdateStatus}>
                            <div className="form-group">
                                <label>Operational Phase</label>
                                <select
                                    className="custom-select"
                                    value={statusData.status}
                                    onChange={e => setStatusData({ ...statusData, status: e.target.value })}
                                >
                                    <option value="pending">Pending Engagement</option>
                                    <option value="in_transit">In Transit (Active)</option>
                                    <option value="out_for_delivery">Final Approach (Out for Delivery)</option>
                                    <option value="delivered">Target Reached (Delivered)</option>
                                </select>
                            </div>
                            <div className="form-group" style={{ marginTop: '1.5rem' }}>
                                <label>Tactical Note (Optional)</label>
                                <textarea
                                    className="custom-textarea"
                                    placeholder="Add intelligence (e.g. Traffic patterns, weather delays)"
                                    value={statusData.note}
                                    onChange={e => setStatusData({ ...statusData, note: e.target.value })}
                                />
                            </div>
                            <div className="form-actions" style={{ marginTop: '2rem' }}>
                                <button type="submit" className="btn-primary glow-btn">Confirm Transmission</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Complaint Modal */}
            {showComplaintModal && (
                <div className="modal-overlay">
                    <div className="modal-content glass" style={{ maxWidth: '450px' }}>
                        <div className="modal-header">
                            <h3>File Tactical Report</h3>
                            <button className="btn-icon" onClick={() => setShowComplaintModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleComplaint}>
                            <div className="form-group">
                                <label>Subject</label>
                                <input
                                    type="text"
                                    placeholder="What is the issue?"
                                    className="custom-input"
                                    required
                                    value={complaintData.subject}
                                    onChange={e => setComplaintData({ ...complaintData, subject: e.target.value })}
                                />
                            </div>
                            <div className="form-group" style={{ marginTop: '1.5rem' }}>
                                <label>Intelligence Briefing</label>
                                <textarea
                                    className="custom-textarea"
                                    placeholder="Describe the incident in detail..."
                                    required
                                    value={complaintData.message}
                                    onChange={e => setComplaintData({ ...complaintData, message: e.target.value })}
                                />
                            </div>
                            <div className="form-actions" style={{ marginTop: '2rem' }}>
                                <button type="submit" className="btn-primary glow-btn">Transmit Briefing</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DriverOrders;
