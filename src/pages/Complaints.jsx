import React, { useState, useEffect } from 'react';
import { getComplaints, createComplaint, updateComplaint, deleteComplaint } from '../api/complaintService';
import { useAuth } from '../context/AuthContext';
import {
    MessageSquare, Send, Clock, CheckCircle2, AlertCircle, XCircle,
    Trash2, Filter, BarChart3, PieChart as PieChartIcon, Activity
} from 'lucide-react';

const Complaints = () => {
    const { user } = useAuth();
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ subject: '', message: '' });
    const [submitting, setSubmitting] = useState(false);

    const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';

    useEffect(() => {
        fetchComplaints();
    }, []);

    const fetchComplaints = async () => {
        try {
            const res = await getComplaints();
            setComplaints(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await createComplaint(formData);
            setFormData({ subject: '', message: '' });
            setShowForm(false);
            fetchComplaints();
            alert("Complaint submitted successfully!");
        } catch (err) {
            alert("Error submitting complaint");
        } finally {
            setSubmitting(false);
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            await updateComplaint(id, { status: newStatus });
            fetchComplaints();
        } catch (err) {
            alert("Error updating status");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this complaint?")) {
            try {
                await deleteComplaint(id);
                fetchComplaints();
            } catch (err) {
                alert("Error deleting complaint");
            }
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Solved': return <CheckCircle2 size={16} />;
            case 'Ongoing Process': return <Clock size={16} />;
            case 'Not Accepted': return <XCircle size={16} />;
            default: return <AlertCircle size={16} />;
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'Solved': return 'status-delivered';
            case 'Ongoing Process': return 'status-in_transit';
            case 'Not Accepted': return 'status-cancelled';
            default: return 'status-pending';
        }
    };

    const stats = {
        total: complaints.length,
        pending: complaints.filter(c => c.status === 'Pending').length,
        solved: complaints.filter(c => c.status === 'Solved').length,
        ongoing: complaints.filter(c => c.status === 'Ongoing Process').length
    };

    return (
        <div className="complaints-page dashboard-fade-in">
            <div className="page-header">
                <div className="header-title">
                    <h2>Protocol Reports</h2>
                    <p className="subtitle">{isAdminOrManager ? 'Fleet grievance and feedback management' : 'Report operational issues and incidents'}</p>
                </div>
                {!isAdminOrManager && (
                    <button className="btn-primary glow-btn" onClick={() => setShowForm(!showForm)}>
                        {showForm ? <XCircle size={18} /> : <Send size={18} />}
                        {showForm ? 'Cancel Report' : 'New Complaint'}
                    </button>
                )}
            </div>

            {/* Summary Cards */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '2rem' }}>
                <div className="stat-card glass">
                    <div className="stat-icon blue"><MessageSquare size={24} /></div>
                    <div className="stat-info">
                        <h3>Total Filed</h3>
                        <p className="stat-value">{stats.total}</p>
                    </div>
                </div>
                <div className="stat-card glass border-warning">
                    <div className="stat-icon yellow"><Clock size={24} /></div>
                    <div className="stat-info">
                        <h3>Unresolved</h3>
                        <p className="stat-value text-yellow">{stats.pending + stats.ongoing}</p>
                    </div>
                </div>
                <div className="stat-card glass border-success">
                    <div className="stat-icon green"><CheckCircle2 size={24} /></div>
                    <div className="stat-info">
                        <h3>Resolved</h3>
                        <p className="stat-value text-green">{stats.solved}</p>
                    </div>
                </div>
                <div className="stat-card glass">
                    <div className="stat-icon purple" style={{ color: '#a855f7' }}><Activity size={24} /></div>
                    <div className="stat-info">
                        <h3>Resolution Rate</h3>
                        <p className="stat-value">{stats.total > 0 ? Math.round((stats.solved / stats.total) * 100) : 0}%</p>
                    </div>
                </div>
            </div>

            {showForm && !isAdminOrManager && (
                <div className="modal-overlay">
                    <div className="modal-content glass" style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h3>File Tactical Report</h3>
                            <button className="btn-icon" onClick={() => setShowForm(false)}><XCircle size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Operational Subject</label>
                                <input
                                    type="text"
                                    required
                                    className="custom-input"
                                    placeholder="e.g. Vehicle Breakdown, Delivery Dispute"
                                    value={formData.subject}
                                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                />
                            </div>
                            <div className="form-group" style={{ marginTop: '1.5rem' }}>
                                <label>Detailed Description</label>
                                <textarea
                                    required
                                    className="custom-textarea"
                                    rows="5"
                                    placeholder="Provide full tactical details..."
                                    value={formData.message}
                                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                                ></textarea>
                            </div>
                            <div className="form-actions" style={{ marginTop: '2rem' }}>
                                <button type="submit" className="btn-primary glow-btn" disabled={submitting}>
                                    {submitting ? 'Transmitting...' : 'Transmit Report'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="data-table-container glass">
                <table className="data-table">
                    <thead>
                        <tr>
                            {isAdminOrManager && <th>Reporter</th>}
                            <th>Subject</th>
                            <th>Description</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {!loading && complaints.length > 0 ? complaints.map(c => (
                            <tr key={c._id}>
                                {isAdminOrManager && (
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div className="avatar small">{(c.userName || '?').charAt(0)}</div>
                                            <span style={{ fontWeight: 700 }}>{c.userName}</span>
                                        </div>
                                    </td>
                                )}
                                <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{c.subject}</td>
                                <td>
                                    <div style={{ maxWidth: '300px', fontSize: '0.85rem', opacity: 0.8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {c.message}
                                    </div>
                                </td>
                                <td>
                                    <span className={`status-pill ${getStatusClass(c.status)}`}>
                                        {getStatusIcon(c.status)}
                                        {c.status}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                                        {new Date(c.createdAt).toLocaleDateString()}
                                    </div>
                                </td>
                                <td>
                                    <div className="action-btns">
                                        {isAdminOrManager ? (
                                            <>
                                                <select
                                                    className="inline-assign-select"
                                                    style={{ width: '140px', padding: '4px', fontSize: '0.8rem' }}
                                                    value={c.status}
                                                    onChange={(e) => handleStatusUpdate(c._id, e.target.value)}
                                                >
                                                    <option value="Pending">Pending</option>
                                                    <option value="Ongoing Process">Ongoing</option>
                                                    <option value="Solved">Solved</option>
                                                    <option value="Not Accepted">Rejected</option>
                                                </select>
                                                <button className="btn-icon delete" onClick={() => handleDelete(c._id)} title="Delete Permanent">
                                                    <Trash2 size={16} />
                                                </button>
                                            </>
                                        ) : (
                                            c.status === 'Pending' && (
                                                <button className="btn-icon delete" onClick={() => handleDelete(c._id)} title="Cancel Report">
                                                    <Trash2 size={16} />
                                                </button>
                                            )
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={isAdminOrManager ? 6 : 5} style={{ textAlign: 'center', padding: '3rem' }}>
                                    {loading ? "Decrypting reports..." : "No operational reports found."}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Complaints;
