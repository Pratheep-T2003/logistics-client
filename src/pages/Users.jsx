import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { getUsers, registerUser, updateUser, deleteUser } from '../api/userService';
import { useAuth } from '../context/AuthContext';
import {
    Users as UsersIcon, UserPlus, Mail, Shield, X, Edit2, Trash2, Key,
    Search, Filter, ArrowUpDown, Clock, Phone, Truck, Briefcase,
    ChevronRight, BarChart3, Star, Zap, UserCheck, UserMinus, Download,
    PieChart as PieChartIcon, Activity, MapPin
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const Users = () => {
    console.log("Users Component Mounting...");
    const { user: currentUser } = useAuth();
    const location = useLocation();
    const [team, setTeam] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showDetailDrawer, setShowDetailDrawer] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    // Filter/Sort states
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('name');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'staff',
        driverId: '',
        phoneNumber: '',
        status: 'offline',
        permissions: {
            canEditShipments: false,
            canAssignDrivers: false,
            canManageInventory: false
        }
    });

    const canManageTeam = currentUser?.role === 'admin' || currentUser?.role === 'manager';

    useEffect(() => {
        fetchUsers();
        const params = new URLSearchParams(location.search);
        if (params.get('action') === 'add' && canManageTeam) {
            resetForm();
            setShowModal(true);
        }
    }, [location.search, canManageTeam]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await getUsers();
            setTeam(Array.isArray(res.data) ? res.data : []);
            setLoading(false);
        } catch (err) {
            console.error("Fetch Users Error:", err);
            setLoading(false);
        }
    };

    // Calculate Summary Stats
    const stats = useMemo(() => {
        const data = Array.isArray(team) ? team : [];
        return {
            total: data.length,
            admins: data.filter(u => u?.role === 'admin').length,
            managers: data.filter(u => u?.role === 'manager').length,
            drivers: data.filter(u => u?.role === 'driver').length,
            active: data.filter(u => u?.status === 'active' || u?.status === 'on_delivery').length,
            offline: data.filter(u => u?.status === 'offline').length
        };
    }, [team]);

    // Role Chart Data
    const roleChartData = useMemo(() => [
        { name: 'Admins', value: stats.admins, color: '#a855f7' },
        { name: 'Managers', value: stats.managers, color: '#3b82f6' },
        { name: 'Drivers', value: stats.drivers, color: '#eab308' },
        { name: 'Others', value: Math.max(0, stats.total - (stats.admins + stats.managers + stats.drivers)), color: '#94a3b8' }
    ].filter(d => d.value > 0), [stats]);

    // Enhanced Filter and Sort Logic
    const filteredTeam = useMemo(() => {
        const data = Array.isArray(team) ? team : [];
        return data.filter(member => {
            if (!member) return false;
            const search = searchTerm.toLowerCase();
            const matchesSearch = (member.name || '').toLowerCase().includes(search) ||
                (member.email || '').toLowerCase().includes(search) ||
                (member.driverId || '').toLowerCase().includes(search);
            const matchesRole = roleFilter === 'all' || member.role === roleFilter;
            const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
            return matchesSearch && matchesRole && matchesStatus;
        }).sort((a, b) => {
            if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
            if (sortBy === 'recent') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            if (sortBy === 'driverId') return (a.driverId || '').localeCompare(b.driverId || '');
            return 0;
        });
    }, [team, searchTerm, roleFilter, statusFilter, sortBy]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const submitData = { ...formData };
            if (isEditing && !submitData.password) delete submitData.password;

            if (isEditing) {
                await updateUser(formData._id, submitData);
            } else {
                await registerUser(submitData);
            }
            setShowModal(false);
            resetForm();
            fetchUsers();
        } catch (err) {
            alert(err.response?.data?.message || "Error processing request");
        }
    };

    const handleEdit = (member) => {
        if (!member) return;
        setFormData({ ...member, password: '' });
        setIsEditing(true);
        setShowModal(true);
        setShowDetailDrawer(false);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Banish this member from the kingdom permanently?")) {
            try {
                await deleteUser(id);
                fetchUsers();
                setShowDetailDrawer(false);
            } catch (err) {
                alert(err.response?.data?.message || "Error deleting user");
            }
        }
    };

    const resetForm = () => {
        setFormData({
            name: '', email: '', password: '', role: 'staff',
            driverId: '', phoneNumber: '', status: 'offline',
            permissions: { canEditShipments: false, canAssignDrivers: false, canManageInventory: false }
        });
        setIsEditing(false);
    };

    const togglePermission = (perm) => {
        setFormData(prev => ({
            ...prev,
            permissions: { ...prev.permissions, [perm]: !prev.permissions[perm] }
        }));
    };

    const openDetails = (member) => {
        setSelectedMember(member);
        setShowDetailDrawer(true);
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'admin': return <Shield size={16} />;
            case 'manager': return <Briefcase size={16} />;
            case 'driver': return <Truck size={16} />;
            default: return <UserPlus size={16} />;
        }
    };

    return (
        <div className="users-page dashboard-fade-in">
            <div className="page-header">
                <div className="header-title">
                    <h2>Team Command</h2>
                    <p className="subtitle">Manage access control and monitor fleet performance</p>
                </div>
                <div className="header-actions">
                    <button className="btn-secondary" onClick={() => alert("Generating Team Report...")}>
                        <Download size={18} /> Export List
                    </button>
                    {canManageTeam && (
                        <button className="btn-primary glow-btn" onClick={() => { resetForm(); setShowModal(true); }}>
                            <UserPlus size={18} /> Add Member
                        </button>
                    )}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: '2rem' }}>
                <div className="stat-card glass">
                    <div className="stat-icon blue"><UsersIcon size={24} /></div>
                    <div className="stat-info">
                        <h3>Total Team</h3>
                        <p className="stat-value">{stats.total}</p>
                    </div>
                </div>
                <div className="stat-card glass" style={{ borderLeft: '4px solid #a855f7' }}>
                    <div className="stat-icon purple" style={{ color: '#a855f7' }}><Shield size={24} /></div>
                    <div className="stat-info">
                        <h3>Command</h3>
                        <p className="stat-value">{stats.admins + stats.managers}</p>
                    </div>
                </div>
                <div className="stat-card glass" style={{ borderLeft: '4px solid #eab308' }}>
                    <div className="stat-icon yellow" style={{ color: '#eab308' }}><Truck size={24} /></div>
                    <div className="stat-info">
                        <h3>Pilots</h3>
                        <p className="stat-value">{stats.drivers}</p>
                    </div>
                </div>
                <div className="stat-card glass" style={{ borderLeft: '4px solid #22c55e' }}>
                    <div className="stat-icon green" style={{ color: '#22c55e' }}><UserCheck size={24} /></div>
                    <div className="stat-info">
                        <h3>Online</h3>
                        <p className="stat-value">{stats.active}</p>
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
                        placeholder="Search Name, Email, Driver ID..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ paddingLeft: '40px', width: '100%', height: '42px' }}
                    />
                </div>

                <div className="filter-select">
                    <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ height: '42px' }}>
                        <option value="all">Every Role</option>
                        <option value="admin">Admins</option>
                        <option value="manager">Managers</option>
                        <option value="driver">Drivers</option>
                        <option value="staff">Staff</option>
                    </select>
                </div>

                <div className="filter-select">
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ height: '42px' }}>
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="on_delivery">On Delivery</option>
                        <option value="offline">Offline</option>
                    </select>
                </div>

                <div className="filter-select">
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ height: '42px' }}>
                        <option value="name">Sort by Name</option>
                        <option value="recent">Recently Added</option>
                        <option value="driverId">Driver ID</option>
                    </select>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem', alignItems: 'stretch' }}>
                <div className="data-table-container glass" style={{ margin: 0 }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Member</th>
                                <th>Role</th>
                                <th>Identity</th>
                                <th>Status</th>
                                <th>Activity</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!loading && filteredTeam.length > 0 ? filteredTeam.map(member => (
                                <tr key={member._id} onClick={() => openDetails(member)} style={{ cursor: 'pointer' }}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div className="avatar" style={{ width: '36px', height: '36px', fontSize: '0.9rem', flexShrink: 0 }}>
                                                {(member.name || '?').charAt(0)}
                                            </div>
                                            <div style={{ overflow: 'hidden' }}>
                                                <div style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.name || 'Unknown User'}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`role-badge ${member.role}`}>
                                            {getRoleIcon(member.role)} {member.role}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '0.85rem' }}>
                                            {member.driverId ? (
                                                <><Key size={12} style={{ marginRight: '4px' }} /> {member.driverId}</>
                                            ) : (
                                                <span style={{ color: 'var(--text-secondary)' }}>N/A</span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`status-pill ${member.status || 'offline'}`}>
                                            {(member.status || 'offline').replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            {member.lastLogin ? (
                                                <><Clock size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> {new Date(member.lastLogin).toLocaleDateString()}</>
                                            ) : 'Never'}
                                        </div>
                                    </td>
                                    <td onClick={(e) => e.stopPropagation()}>
                                        <div className="action-btns">
                                            <button className="btn-icon" onClick={() => handleEdit(member)} title="Edit Configuration">
                                                <Edit2 size={16} />
                                            </button>
                                            {canManageTeam && (
                                                <button className="btn-icon delete" onClick={() => handleDelete(member._id)} title="Deactivate">
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                                        {loading ? "Decrypting Fleet Data..." : "No matching team members found."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="side-analytics">
                    <section className="chart-card glass" style={{ padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <h4 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}><PieChartIcon size={16} /> Role Distribution</h4>
                        <div style={{ width: '100%', height: 240, display: 'flex', justifyContent: 'center' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={roleChartData}
                                        innerRadius={65}
                                        outerRadius={95}
                                        paddingAngle={5}
                                        dataKey="value"
                                        cx="50%"
                                        cy="50%"
                                    >
                                        {roleChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: 'white', fontSize: '12px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="chart-legend" style={{ marginTop: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', width: '100%', padding: '0 10px' }}>
                            {roleChartData.map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color }}></div>
                                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{item.name}: <strong>{item.value}</strong></span>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>

            {/* Member Detail side drawer */}
            {showDetailDrawer && selectedMember && (
                <div className="member-drawer-overlay" onClick={() => setShowDetailDrawer(false)}>
                    <div className="member-drawer" onClick={e => e.stopPropagation()}>
                        <div className="drawer-header" style={{ padding: '2rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', position: 'relative' }}>
                            <button className="btn-icon" style={{ position: 'absolute', right: '1rem', top: '1rem' }} onClick={() => setShowDetailDrawer(false)}><X size={20} /></button>
                            <div className="drawer-avatar-lg" style={{ margin: '0 auto 1rem', width: '80px', height: '80px', fontSize: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'var(--accent-gradient)' }}>{(selectedMember.name || '?').charAt(0)}</div>
                            <h2>{selectedMember.name || 'Unknown User'}</h2>
                            <div className={`role-badge ${selectedMember.role}`} style={{ marginBottom: '1rem', display: 'inline-flex' }}>
                                {getRoleIcon(selectedMember.role)} {selectedMember.role}
                            </div>
                            <p className="subtitle" style={{ fontSize: '0.9rem', opacity: 0.7 }}>{selectedMember.email}</p>
                        </div>

                        <div className="drawer-content" style={{ padding: '2rem' }}>
                            <div className="info-group">
                                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 800, letterSpacing: '0.1em', marginBottom: '1rem', display: 'block' }}>Identity Details</label>
                                <div className="info-card-lite" style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '1.2rem', borderRadius: '12px' }}>
                                    <div className="info-line" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}><Phone size={16} /> {selectedMember.phoneNumber || 'No verified phone'}</div>
                                    <div className="info-line" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}><Clock size={16} /> Joined System: {new Date(selectedMember.createdAt).toLocaleDateString()}</div>
                                    {selectedMember.driverId && <div className="info-line" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}><Key size={16} /> Protocol ID: {selectedMember.driverId}</div>}
                                    {selectedMember.vehicleDetails && <div className="info-line" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}><Truck size={16} /> Unit: {selectedMember.vehicleDetails}</div>}
                                </div>
                            </div>

                            {selectedMember.role === 'driver' && (
                                <div className="info-group" style={{ marginTop: '2rem' }}>
                                    <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 800, letterSpacing: '0.1em', marginBottom: '1rem', display: 'block' }}>Operational Metrics</label>
                                    <div className="performance-stats-mini" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div className="perf-item" style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                                            <label style={{ fontSize: '0.7rem', display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Deliveries</label>
                                            <p style={{ fontSize: '1.2rem', fontWeight: 800 }}>{selectedMember.performance?.totalDeliveries || 0}</p>
                                        </div>
                                        <div className="perf-item" style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                                            <label style={{ fontSize: '0.7rem', display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>On-Time</label>
                                            <p style={{ fontSize: '1.2rem', fontWeight: 800, color: '#22c55e' }}>{selectedMember.performance?.onTimeRate || 0}%</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="drawer-actions" style={{ display: 'flex', gap: '1rem', marginTop: '3rem' }}>
                                <button className="btn-primary" style={{ flex: 1 }} onClick={() => handleEdit(selectedMember)}>Edit Profile</button>
                                {canManageTeam && (
                                    <button className="btn-danger" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', padding: '0 12px', borderRadius: '8px' }} onClick={() => handleDelete(selectedMember._id)}><Trash2 size={18} /></button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit/Add Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content glass" style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h3>{isEditing ? "Configure Member" : "Enlist New Member"}</h3>
                            <button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div className="form-group">
                                    <label>Legal Name</label>
                                    <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Full Name" />
                                </div>
                                <div className="form-group">
                                    <label>Email ID</label>
                                    <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="email@logistics.com" />
                                </div>
                                <div className="form-group">
                                    <label>Security Phrase {isEditing && '(Blank to keep)'}</label>
                                    <input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required={!isEditing} />
                                </div>
                                <div className="form-group">
                                    <label>Tactical Role</label>
                                    <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="custom-select">
                                        <option value="admin">Administrator</option>
                                        <option value="manager">Manager</option>
                                        <option value="staff">Staff</option>
                                        <option value="driver">Driver Pilot</option>
                                    </select>
                                </div>
                                {formData.role === 'driver' && (
                                    <>
                                        <div className="form-group">
                                            <label>Driver Identifier (UID)</label>
                                            <input type="text" required value={formData.driverId || ''} onChange={e => setFormData({ ...formData, driverId: e.target.value })} placeholder="D-990" />
                                        </div>
                                        <div className="form-group">
                                            <label>Vehicle Fleet ID</label>
                                            <input type="text" value={formData.vehicleDetails || ''} onChange={e => setFormData({ ...formData, vehicleDetails: e.target.value })} placeholder="Truck-702" />
                                        </div>
                                    </>
                                )}
                            </div>

                            {(formData.role === 'admin' || formData.role === 'manager') && (
                                <div className="permissions-section" style={{ marginTop: '2rem' }}>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--accent)', textTransform: 'uppercase', fontWeight: 800 }}>Privilege Matrix</label>
                                    <div className="permission-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                                        <div className="permission-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '0.8rem', borderRadius: '8px' }}>
                                            <span style={{ fontSize: '0.85rem' }}>Override Shipments</span>
                                            <div className={`toggle-switch ${formData.permissions?.canEditShipments ? 'on' : ''}`} onClick={() => togglePermission('canEditShipments')}>
                                                <div className="toggle-knob"></div>
                                            </div>
                                        </div>
                                        <div className="permission-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '0.8rem', borderRadius: '8px' }}>
                                            <span style={{ fontSize: '0.85rem' }}>Deploy Pilots</span>
                                            <div className={`toggle-switch ${formData.permissions?.canAssignDrivers ? 'on' : ''}`} onClick={() => togglePermission('canAssignDrivers')}>
                                                <div className="toggle-knob"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="form-actions" style={{ marginTop: '2.5rem' }}>
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Discard</button>
                                <button type="submit" className="btn-primary glow-btn">{isEditing ? "Apply Config" : "Enlist Member"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
