import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../api/productService';
import { useAuth } from '../context/AuthContext';
import {
    Plus, Search, Filter, Trash2, Edit2, X, ScanBarcode, Camera, Check,
    AlertTriangle, Package, CheckCircle, XCircle, TrendingUp, Info,
    ArrowUpDown, ChevronDown, BarChart3, PieChart as PieChartIcon, Clock
} from 'lucide-react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList
} from 'recharts';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';

const Inventory = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [currentProduct, setCurrentProduct] = useState({
        sku: '', name: '', description: '', category: '', price: 0, quantity: 0, warehouseLocation: ''
    });
    const [isEditing, setIsEditing] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [scannedProduct, setScannedProduct] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [addQuantity, setAddQuantity] = useState(1);
    const [scannerInstance, setScannerInstance] = useState(null);

    // Filter & Sort State
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [sortBy, setSortBy] = useState('name');

    const canManageInventory = user?.role === 'admin' || user?.role === 'manager';

    useEffect(() => {
        fetchProducts();

        const params = new URLSearchParams(location.search);
        if (params.get('action') === 'add' && canManageInventory) {
            resetForm();
            setShowModal(true);
        }
    }, [location.search]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const res = await getProducts();
            setProducts(res.data.products || res.data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching products:", err);
            setLoading(false);
        }
    };

    // Calculate Stats
    const stats = useMemo(() => {
        const total = products.length;
        const inStock = products.filter(p => p.quantity > 10).length;
        const lowStock = products.filter(p => p.quantity > 0 && p.quantity <= 10).length;
        const outOfStock = products.filter(p => p.quantity === 0).length;
        const categories = [...new Set(products.map(p => p.category))];

        // Items updated in last 24 hours
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentlyUpdated = products.filter(p => new Date(p.updatedAt || p.createdAt || 0) > twentyFourHoursAgo).length;

        return { total, inStock, lowStock, outOfStock, categories, recentlyUpdated };
    }, [products]);

    // Chart Data
    const categoryData = useMemo(() => {
        const counts = {};
        products.forEach(p => {
            counts[p.category] = (counts[p.category] || 0) + 1;
        });
        return Object.keys(counts).map(cat => ({
            name: cat || 'Uncategorized',
            value: counts[cat]
        }));
    }, [products]);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

    // Filter Logic
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.sku.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = filterCategory === 'all' || p.category === filterCategory;

            let matchesStatus = true;
            if (filterStatus === 'in_stock') matchesStatus = p.quantity > 10;
            else if (filterStatus === 'low_stock') matchesStatus = p.quantity > 0 && p.quantity <= 10;
            else if (filterStatus === 'out_of_stock') matchesStatus = p.quantity === 0;

            return matchesSearch && matchesCategory && matchesStatus;
        }).sort((a, b) => {
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            if (sortBy === 'quantity') return a.quantity - b.quantity;
            if (sortBy === 'newest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            return 0;
        });
    }, [products, searchTerm, filterCategory, filterStatus, sortBy]);

    // Scanner Logic
    useEffect(() => {
        if (showScanner) {
            const scanner = new Html5QrcodeScanner("reader", {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                rememberLastUsedCamera: true,
                formatsToSupport: [
                    Html5QrcodeSupportedFormats.QR_CODE,
                    Html5QrcodeSupportedFormats.EAN_13,
                    Html5QrcodeSupportedFormats.CODE_128,
                ]
            });

            scanner.render(onScanSuccess);
            setScannerInstance(scanner);

            return () => {
                scanner.clear().catch(error => console.error("Failed to clear scanner", error));
            };
        }
    }, [showScanner]);

    const onScanSuccess = async (decodedText) => {
        try {
            if (scannerInstance) await scannerInstance.clear();
            setShowScanner(false);

            const { getProductBySku } = await import('../api/productService');
            const res = await getProductBySku(decodedText);
            setScannedProduct(res.data);
            setShowConfirmModal(true);
        } catch (err) {
            setShowModal(true);
            setCurrentProduct(prev => ({ ...prev, sku: decodedText }));
        }
    };

    const handleConfirmScan = async () => {
        try {
            const updatedProduct = {
                ...scannedProduct,
                quantity: scannedProduct.quantity + parseInt(addQuantity)
            };
            await updateProduct(scannedProduct._id, updatedProduct);
            setShowConfirmModal(false);
            setScannedProduct(null);
            fetchProducts();
        } catch (err) {
            alert("Failed to update stock");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await updateProduct(currentProduct._id, currentProduct);
            } else {
                await createProduct(currentProduct);
            }
            setShowModal(false);
            resetForm();
            fetchProducts();
        } catch (err) {
            alert(err.response?.data?.message || "Error saving product");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Delete this product?")) {
            try {
                await deleteProduct(id);
                fetchProducts();
            } catch (err) {
                alert(err.response?.data?.message || "Error deleting product");
            }
        }
    };

    const handleEdit = (product) => {
        setCurrentProduct(product);
        setIsEditing(true);
        setShowModal(true);
    };

    const resetForm = () => {
        setCurrentProduct({
            sku: '', name: '', description: '', category: '', price: 0, quantity: 0, warehouseLocation: ''
        });
        setIsEditing(false);
    };

    return (
        <div className="inventory-page dashboard-fade-in">
            <div className="page-header">
                <div className="header-title">
                    <h2>Inventory Management</h2>
                    <p className="subtitle">Real-time stock tracking and replenishment</p>
                </div>
                {canManageInventory && (
                    <div className="action-btns">
                        <button className="btn-secondary" onClick={() => setShowScanner(true)}>
                            <ScanBarcode size={18} /> Scan Barcode
                        </button>
                        <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
                            <Plus size={18} /> Add Product
                        </button>
                    </div>
                )}
            </div>

            {/* Summary Cards */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '2rem' }}>
                <div className="stat-card glass">
                    <div className="stat-icon purple"><Package size={24} /></div>
                    <div className="stat-info">
                        <h3>Total Products</h3>
                        <p className="stat-value">{stats.total}</p>
                    </div>
                </div>
                <div className="stat-card glass border-success">
                    <div className="stat-icon green"><CheckCircle size={24} /></div>
                    <div className="stat-info">
                        <h3>In Stock</h3>
                        <p className="stat-value">{stats.inStock}</p>
                    </div>
                </div>
                <div className="stat-card glass border-warning alert-border">
                    <div className="stat-icon yellow"><AlertTriangle size={24} /></div>
                    <div className="stat-info">
                        <h3>Low Stock</h3>
                        <p className="stat-value text-yellow">{stats.lowStock}</p>
                    </div>
                </div>
                <div className="stat-card glass border-danger">
                    <div className="stat-icon red" style={{ color: '#ef4444' }}><XCircle size={24} /></div>
                    <div className="stat-info">
                        <h3>Out of Stock</h3>
                        <p className="stat-value text-red">{stats.outOfStock}</p>
                    </div>
                </div>
                <div className="stat-card glass">
                    <div className="stat-icon blue" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}><Clock size={24} /></div>
                    <div className="stat-info">
                        <h3>Recently Changed</h3>
                        <p className="stat-value">{stats.recentlyUpdated}</p>
                    </div>
                </div>
            </div>

            {/* Analytics Section */}
            <div className="charts-container" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                <section className="chart-card glass">
                    <div className="chart-header">
                        <h3><BarChart3 size={20} /> Stock Levels by Category</h3>
                    </div>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={categoryData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="name" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip
                                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                                />
                                <Bar dataKey="value" fill="var(--accent)" radius={[6, 6, 0, 0]}>
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                <section className="chart-card glass">
                    <div className="chart-header">
                        <h3><PieChartIcon size={20} /> Category Split</h3>
                    </div>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </section>
            </div>

            {/* Filters Bar */}
            <div className="filter-bar glass" style={{ padding: '1.5rem', borderRadius: '20px', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div className="search-box" style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} size={18} />
                    <input
                        type="text"
                        placeholder="Search by name or SKU..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ paddingLeft: '40px', width: '100%', height: '45px' }}
                    />
                </div>

                <div className="filter-select">
                    <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ height: '45px' }}>
                        <option value="all">All Categories</option>
                        {stats.categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-select">
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ height: '45px' }}>
                        <option value="all">All Status</option>
                        <option value="in_stock">In Stock</option>
                        <option value="low_stock">Low Stock</option>
                        <option value="out_of_stock">Out of Stock</option>
                    </select>
                </div>

                <div className="filter-select">
                    <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ height: '45px' }}>
                        <option value="name">Sort by Name</option>
                        <option value="quantity">Sort by Quantity</option>
                        <option value="newest">Sort by Recently Added</option>
                    </select>
                </div>
            </div>

            <div className="data-table-container glass">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>SKU</th>
                            <th>Product Name</th>
                            <th>Category</th>
                            <th>Quantity</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {!loading && filteredProducts.length > 0 ? filteredProducts.map(product => {
                            const isLowStock = product.quantity > 0 && product.quantity <= 10;
                            const isOutOfStock = product.quantity === 0;

                            return (
                                <tr key={product._id} className={isLowStock ? 'row-warning' : isOutOfStock ? 'row-danger' : ''}>
                                    <td><code>{product.sku}</code></td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {product.name}
                                            {isLowStock && (
                                                <span className="alert-badge" title="Reorder recommended">
                                                    <AlertTriangle size={14} className="flash-icon" />
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td>{product.category}</td>
                                    <td>
                                        <span style={{ fontWeight: 700, color: isOutOfStock ? '#ef4444' : isLowStock ? '#eab308' : 'inherit' }}>
                                            {product.quantity}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`status-pill ${product.status}`}>
                                            {product.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td>
                                        {canManageInventory && (
                                            <div className="action-btns">
                                                <button className="btn-icon" onClick={() => handleEdit(product)}><Edit2 size={16} /></button>
                                                <button className="btn-icon delete" onClick={() => handleDelete(product._id)}><Trash2 size={16} /></button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>
                                    {loading ? "Crunching inventory data..." : "No items matching your filters."}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Summary Footer */}
            <div className="last-updated">
                <Clock size={12} style={{ marginRight: '5px' }} />
                Showing {filteredProducts.length} of {products.length} products
            </div>

            {/* Modal Logic Remains Same but Styled Better */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content glass">
                        <div className="modal-header">
                            <h3>{isEditing ? "Update Stock Record" : "Register New Product"}</h3>
                            <button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Universal SKU Code</label>
                                    <input type="text" value={currentProduct.sku} onChange={e => setCurrentProduct({ ...currentProduct, sku: e.target.value })} disabled={isEditing} placeholder="e.g. ELEC-001" required />
                                </div>
                                <div className="form-group">
                                    <label>Official Product Name</label>
                                    <input type="text" value={currentProduct.name} onChange={e => setCurrentProduct({ ...currentProduct, name: e.target.value })} placeholder="Enter formal name" required />
                                </div>
                                <div className="form-group">
                                    <label>Inventory Classification</label>
                                    <input type="text" value={currentProduct.category} onChange={e => setCurrentProduct({ ...currentProduct, category: e.target.value })} placeholder="e.g. Electronics, Fluid" />
                                </div>
                                <div className="form-group">
                                    <label>Unit Valuation ($)</label>
                                    <input type="number" value={currentProduct.price} onChange={e => setCurrentProduct({ ...currentProduct, price: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Stock Count</label>
                                    <input type="number" value={currentProduct.quantity} onChange={e => setCurrentProduct({ ...currentProduct, quantity: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Zone / Bin Location</label>
                                    <input type="text" value={currentProduct.warehouseLocation} onChange={e => setCurrentProduct({ ...currentProduct, warehouseLocation: e.target.value })} placeholder="e.g. Warehouse A, Row 4" />
                                </div>
                            </div>
                            <div className="form-actions" style={{ marginTop: '2rem' }}>
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Discard</button>
                                <button type="submit" className="btn-primary" style={{ background: 'var(--accent)', color: 'var(--bg-dark)' }}>
                                    {isEditing ? "Commit Changes" : "Confirm Creation"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Scanner and Confirmation modals stay same logic but with improved titles/icons */}
            {showScanner && (
                <div className="modal-overlay">
                    <div className="modal-content glass scanner-modal">
                        <div className="modal-header">
                            <h3><Camera size={20} /> Optical SKU Scanner</h3>
                            <button className="btn-icon" onClick={() => setShowScanner(false)}><X size={20} /></button>
                        </div>
                        <div id="reader" style={{ width: '100%', minHeight: '320px', background: '#000', borderRadius: '14px', overflow: 'hidden' }}></div>
                        <p className="scanner-hint" style={{ marginTop: '1rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Align the barcode within the central frame</p>
                    </div>
                </div>
            )}

            {showConfirmModal && scannedProduct && (
                <div className="modal-overlay">
                    <div className="modal-content glass confirm-modal" style={{ maxWidth: '400px', textAlign: 'center' }}>
                        <div className="confirm-icon success" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                            <Check size={40} />
                        </div>
                        <h3>Product Identified</h3>
                        <div className="product-summary" style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '16px', margin: '1rem 0' }}>
                            <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>{scannedProduct.name}</p>
                            <p style={{ color: 'var(--text-secondary)' }}>ID: {scannedProduct.sku}</p>
                            <p style={{ marginTop: '5px' }}>Stock: <span className="stat-value" style={{ fontSize: '1rem' }}>{scannedProduct.quantity} units</span></p>
                        </div>
                        <div className="form-group">
                            <label>Restock Quantity</label>
                            <input type="number" min="1" value={addQuantity} onChange={e => setAddQuantity(e.target.value)} className="custom-input large" style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 700 }} />
                        </div>
                        <div className="confirm-actions" style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <button className="btn-secondary" onClick={() => { setShowConfirmModal(false); setScannedProduct(null); }}>Abort</button>
                            <button className="btn-primary" onClick={handleConfirmScan}>Update Stock</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;
