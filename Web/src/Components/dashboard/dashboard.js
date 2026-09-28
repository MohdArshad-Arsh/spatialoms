import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import {
    Package,
    Clock,
    TrendingUp,
    CheckCircle,
    Settings,
    Plus,
    Target,
    Users,
    Search,
    Filter,
    Eye,
    Edit,
    MoreVertical,
    ChevronDown,
    PanelLeftClose,
    PanelLeftOpen,
    LogOut,
    ChevronRight,
    Bell,
    RefreshCw,
    AlertCircle,
    Download,
    FileText,
    DollarSign,
    SaudiRiyal,
    QrCode
} from 'lucide-react';
import { properties } from '../../Properties/Properties';
import shpwrite from "shp-write";

import OrderList from '../Order/OrderList';
import DashboardOrderList from '../Order/DashboardOrderList';
import OrderUpdate from '../Order/OrderUpdate';
import OrderEye from '../Order/OrderEye';
import OrderHistory from '../Order/OrderHistory';
import OrderCreate from '../Order/OrderCreate';
import AoiMapping from '../AOI Mapping/AoiMapping';
import CreateUser from '../Create User/CreateUser';
import OrderNotification from '../Order/OrderNotification';
import Barcode from '../Barcode/Barcode';
import { Button } from 'bootstrap';
import PromptManagement from '../PromptManagement/PromptManagement';
import {
    PROMPT_MANAGEMENT_ALLOWED_ROLES,
    formatRoleLabel,
    getPrimaryRoleFromToken,
    getRolesFromToken,
    hasAnyAllowedRole
} from '../../utils/authRoles';

const STATUS_COLORS = {
    'CREATED': 'bg-orange-100 text-orange-700',
    'PENDING': 'bg-yellow-100 text-yellow-700',
    'PARTIALLY_COMPLETED': 'bg-blue-100 text-blue-700',
    'CANCELLED': 'bg-red-100 text-red-700',
    'COMPLETED': 'bg-green-100 text-green-700',
    'Completed': 'bg-green-100 text-green-700'
};

// Export Dropdown Component
const ExportDropdown = ({ onExportCSV, onExportShapefile }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (ref.current && !ref.current.contains(event.target)) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative inline-block" ref={ref}>
            <button
                onClick={() => setOpen(prev => !prev)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 font-medium transition-all"
            >
                <Download className="w-4 h-4" />
                Export
                <ChevronDown className="w-4 h-4" />
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                    <button
                        onClick={() => {
                            onExportCSV();
                            setOpen(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center gap-3 font-medium text-sm border-b border-gray-100"
                    >
                        <FileText className="w-4 h-4 text-blue-600" />
                        Export CSV
                    </button>

                    <button
                        onClick={() => {
                            onExportShapefile();
                            setOpen(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-green-50 flex items-center gap-3 font-medium text-sm"
                    >
                        🗺️ Export Shapefile
                    </button>
                </div>
            )}
        </div>
    );
};

const Dashboard = ({ username, token, onLogout }) => {
    const location = useLocation();
    const history = useHistory();
    const [selectedMenu, setSelectedMenu] = useState('dashboard');
    const [statusFilter, setStatusFilter] = useState('all');
    const [vendorFilter, setVendorFilter] = useState('all');
    const [sensorFilter, setSensorFilter] = useState('all');
    const [sensorOptions, setSensorOptions] = useState([]);
    const [dateFilter, setDateFilter] = useState('newest');
    const [searchQuery, setSearchQuery] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [userRole, setUserRole] = useState('User');
    const [currentRoles, setCurrentRoles] = useState([]);

    // Real Data States
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [stats, setStats] = useState({
        total: 0,
        created: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
        cancelled: 0,
        totalPrice: 0
    });
    const [areaCoverage, setAreaCoverage] = useState({
        total: 0,
        collected: 0,
        unfulfilled: 0
    });

    // Update selected menu based on current route
    useEffect(() => {
        const path = location.pathname;
        if (path === '/dashboard') {
            setSelectedMenu('dashboard');
        } else if (path === '/orders') {
            setSelectedMenu('orders');
        } else if (path === '/order/update') {
            setSelectedMenu('order-update');
        } else if (path === '/order/eye') {
            setSelectedMenu('order-view');
        } else if (path.startsWith('/order/history')) {
            setSelectedMenu('order-history');
        } else if (path === '/order/create') {
            setSelectedMenu('create');
        } else if (path === '/barcode') {
            setSelectedMenu('barcode');
        } else if (path === '/notifications') {
            setSelectedMenu('notifications');
        } else if (path === '/aoi') {
            setSelectedMenu('aoi');
        } else if (path === '/users') {
            setSelectedMenu('users');
        } else if (path === '/prompt-management') {
            setSelectedMenu('prompt-management');
        }
    }, [location.pathname]);

    // Decode JWT token to get role
    useEffect(() => {
        const roles = getRolesFromToken(token);
        const role = getPrimaryRoleFromToken(token);

        setCurrentRoles(roles);
        setUserRole(formatRoleLabel(role));
    }, [token]);

    // Fetch Orders from API
    const fetchOrders = useCallback(async () => {
        if (!token) {
            setError('Please login to view orders');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(properties.Port + properties.getAllOrders, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!res.ok) throw new Error(res.status === 401 ? 'Session expired' : 'Failed to fetch');

            const data = await res.json();

            // Transform orders
            const transformedOrders = data.map(o => ({
                id: o.id,
                orderId: o.id,
                poId: o.poId,
                client: o.clientName,
                vendor: o.vendorNo ? (o.vendorNo === 'vendor-a' ? 'Vendor A' : 'Vendor B') : 'Not Assigned',
                vendorId: o.vendorNo,
                sensors: o.sansor?.join(', ') || 'Not Selected',
                sensorList: o.sansor || [],
                priority: o.priority,
                status: o.status,
                price: o.price ?? 0,
                statusColor: STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-700',
                progress: Math.round(o.percentageCompleted) || 0,
                totalArea: Math.round(o.totalArea) || 0,
                collectedArea: Math.round(o.totalArea - o.remainingArea) || 0,
                unfulfilledArea: Math.round(o.remainingArea) || 0,
                createdDate: o.createdDate,
                lastModifiedDate: o.lastModifiedDate,
                createdBy: o.createdBy,
                lastModifiedBy: o.lastModifiedBy,
                geometry: o.abj || o.aoi || null  // Store geometry for shapefile export
            }));

            setOrders(transformedOrders);

            // Derive sensor options from orders
            const uniqueSensors = Array.from(new Set(transformedOrders.flatMap(o => o.sensorList || []))).filter(Boolean);
            setSensorOptions(uniqueSensors);

            // Calculate stats
            const totalOrders = transformedOrders.length;
            const createdCount = transformedOrders.filter(o => o.status === 'CREATED').length;
            const inProgressCount = transformedOrders.filter(o =>
                o.status === 'PENDING' || o.status === 'PARTIALLY_COMPLETED'
            ).length;
            const completedCount = transformedOrders.filter(o =>
                o.status === 'COMPLETED' || o.status === 'Completed'
            ).length;
            const cancelledCount = transformedOrders.filter(o => o.status === 'CANCELLED').length;
            const totalPrice = transformedOrders.reduce((sum, o) => sum + (o.price || 0), 0);

            setStats({
                total: totalOrders,
                created: createdCount,
                pending: createdCount,
                inProgress: inProgressCount,
                completed: completedCount,
                cancelled: cancelledCount,
                totalPrice: totalPrice
            });

            // Calculate area coverage
            const totalArea = transformedOrders.reduce((sum, o) => sum + o.totalArea, 0);
            const collectedArea = transformedOrders.reduce((sum, o) => sum + o.collectedArea, 0);
            const unfulfilledArea = transformedOrders.reduce((sum, o) => sum + o.unfulfilledArea, 0);

            setAreaCoverage({
                total: totalArea,
                collected: collectedArea,
                unfulfilled: unfulfilledArea
            });

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    // Fetch orders on component mount
    useEffect(() => {
        if (token && selectedMenu === 'dashboard') {
            fetchOrders();
            setCurrentPage(1);
        }
    }, [token, selectedMenu, fetchOrders]);

    // **EXPORT CSV FUNCTION**
    const handleExportCSV = () => {
        try {
            if (!sortedOrders || sortedOrders.length === 0) {
                alert("No orders to export");
                return;
            }

            const escapeCSV = (val) => {
                if (val == null) return '';
                let s = String(val).replace(/"/g, '""');
                return s.search(/("|,|\n)/) >= 0 ? `"${s}"` : s;
            };

            const columns = [
                'id', 'orderId', 'poId', 'client', 'vendor', 'sensors',
                'priority', 'price', 'status', 'progress',
                'totalArea', 'collectedArea', 'unfulfilledArea',
                'createdDate', 'lastModifiedDate', 'createdBy', 'lastModifiedBy'
            ];

            const rows = sortedOrders.map(o => columns.map(c => escapeCSV(o[c])).join(','));

            const csvContent = [columns.join(','), ...rows].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `dashboard_orders_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);

            alert(`✅ Successfully exported ${sortedOrders.length} orders as CSV!`);
        } catch (err) {
            console.error('Export CSV failed:', err);
            alert('Failed to export CSV: ' + err.message);
        }
    };

    // **EXPORT SHAPEFILE FUNCTION**
    const handleExportShapefile = async () => {
        try {
            if (!sortedOrders || sortedOrders.length === 0) {
                alert("No orders to export");
                return;
            }

            console.log("Starting shapefile export...");

            // Fetch all AOIs to get geometry data
            const res = await fetch(properties.Port + properties.getAllAoi, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                alert("Failed to fetch AOI data for shapefile export");
                return;
            }

            const aoiData = await res.json();
            console.log("AOI Data fetched:", aoiData.length);

            // Create a map of orderId/poId to geometry
            const geometryMap = {};
            aoiData.forEach(item => {
                const aoi = item.abj || item.aoi || item;
                const poId = item.poId;
                const orderId = item.orderId || item.id;

                if (poId && aoi?.geometry?.type) {
                    geometryMap[String(poId)] = aoi;
                }
                if (orderId && aoi?.geometry?.type) {
                    geometryMap[String(orderId)] = aoi;
                }
            });

            console.log("Geometry Map created with", Object.keys(geometryMap).length, "entries");

            // Build features array
            const features = [];
            sortedOrders.forEach(o => {
                const poIdStr = String(o.poId);
                const orderIdStr = String(o.orderId);

                let geomSource = geometryMap[poIdStr] || geometryMap[orderIdStr];
                let geometry = geomSource?.type === "Feature" ? geomSource.geometry : geomSource;

                if (!geometry || !geometry.type || !geometry.coordinates) {
                    console.warn(`No valid geometry for order ${o.orderId} (PO: ${o.poId})`);
                    return;
                }

                const feature = {
                    type: "Feature",
                    geometry: geometry,
                    properties: {
                        id: Number(o.id || 0),
                        order_id: String(o.orderId || '').substring(0, 50),
                        po_id: String(o.poId || '').substring(0, 50),
                        client: String(o.client || '').substring(0, 50),
                        vendor: String(o.vendor || '').substring(0, 30),
                        sensors: String(o.sensors || '').substring(0, 100),
                        priority: String(o.priority || '').substring(0, 20),
                        price: Number(o.price || 0),
                        status: String(o.status || '').substring(0, 30),
                        progress: Number(o.progress || 0),
                        area_total: Number(o.totalArea || 0),
                        area_coll: Number(o.collectedArea || 0)
                    }
                };

                features.push(feature);
            });

            console.log("Features created:", features.length);

            if (!features.length) {
                alert(`No geometries found for the ${sortedOrders.length} filtered orders.`);
                return;
            }

            // Convert to Shapefile using shp-write
            const geojson = { type: "FeatureCollection", features };
            shpwrite.download(geojson, {
                folder: "dashboard_orders",
                types: { point: "dashboard_orders" }
            });

            alert(`✅ Successfully exported ${features.length} orders as Shapefile!`);

        } catch (err) {
            console.error("Export shapefile failed:", err);
            alert("Failed to export shapefile: " + err.message);
        }
    };

    const formatDate = (d) => {
        if (!d) return 'N/A';
        try {
            return new Date(d).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        } catch {
            return 'Invalid';
        }
    };

    const formatStatusLabel = (status) => {
        if (status === 'PARTIALLY_COMPLETED') return 'PARTIALLY_COMP.';
        return status;
    };

    const menuItems = [
        { id: 'dashboard', icon: TrendingUp, label: 'Dashboard', path: '/dashboard' },
        { id: 'orders', icon: Package, label: 'Orders', path: '/orders' },
        { id: 'create', icon: Plus, label: 'Create Order', path: '/order/create' },
        { id: 'barcode', icon: QrCode, label: 'Barcode', path: '/barcode' },
        { id: 'notifications', icon: Bell, label: 'Notifications', path: '/notifications' },
        { id: 'aoi', icon: Target, label: 'AOI Mapping', path: '/aoi' },
        { id: 'users', icon: Users, label: 'User Management', path: '/users' },
        {
            id: 'prompt-management',
            icon: FileText,
            label: 'Update Prompt',
            path: '/prompt-management',
            requiredRoles: PROMPT_MANAGEMENT_ALLOWED_ROLES
        }
    ];

    const visibleMenuItems = menuItems.filter((item) => (
        !item.requiredRoles || hasAnyAllowedRole(currentRoles, item.requiredRoles)
    ));

    const handleLogout = () => {
        setShowLogoutModal(false);
        setShowUserMenu(false);
        onLogout();
    };

    const handleMenuClick = (item) => {
        setSelectedMenu(item.id);
        history.push(item.path);
    };

    const handleViewOrder = (order) => {
        history.push('/order/eye', { orderData: order });
    };

    const handleEditOrder = (order) => {
        history.push('/order/update', { orderData: order, returnTo: 'dashboard' });
    };

    // Filter orders
    const filteredOrders = orders.filter(o => {
        const q = (searchQuery || '').toString().toLowerCase();
        const orderId = (o.orderId ?? '').toString().toLowerCase();
        const poId = (o.poId ?? '').toString().toLowerCase();
        const client = (o.client ?? '').toString().toLowerCase();
        const vendor = (o.vendor ?? '').toString().toLowerCase();
        const status = (o.status ?? '').toString().toLowerCase();
        const sensorList = (o.sensorList || []).map(s => s.toString().toLowerCase());

        const matchSearch = !q ||
            orderId.includes(q) ||
            poId.includes(q) ||
            client.includes(q) ||
            vendor.includes(q);

        const matchStatus = statusFilter === 'all' ||
            status.includes(statusFilter.toLowerCase());

        const matchVendor = vendorFilter === 'all' || o.vendorId === vendorFilter;
        const matchSensor = sensorFilter === 'all' || sensorList.includes((sensorFilter || '').toLowerCase());

        return matchSearch && matchStatus && matchVendor && matchSensor;
    });

    // Sort orders by date
    const sortedOrders = [...filteredOrders].sort((a, b) => {
        const dateA = new Date(a.lastModifiedDate || a.createdDate);
        const dateB = new Date(b.lastModifiedDate || b.createdDate);
        return dateFilter === 'newest' ? dateB - dateA : dateA - dateB;
    });

    // Pagination calculations
    const totalPages = Math.ceil(sortedOrders.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentOrders = sortedOrders.slice(indexOfFirstItem, indexOfLastItem);

    // Handle page change
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    // Generate page numbers
    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('...');
                pages.push(currentPage - 1);
                pages.push(currentPage);
                pages.push(currentPage + 1);
                pages.push('...');
                pages.push(totalPages);
            }
        }
        return pages;
    };

    const renderContent = () => {
        const toggleButton = !sidebarOpen && (
            <button
                onClick={() => setSidebarOpen(true)}
                className="mb-4 p-2 bg-gray-900 text-white rounded-lg shadow-md hover:bg-gray-800 transition-all"
            >
                <PanelLeftOpen className="w-5 h-5" />
            </button>
        );

        switch (selectedMenu) {
            case 'dashboard':
                const statsData = [
                    {
                        icon: Package,
                        label: 'Total Orders',
                        value: stats.total,
                        change: stats.total > 0 ? `${stats.total} orders` : 'No orders',
                        color: 'bg-blue-500',
                        bgLight: 'bg-blue-50'
                    },
                    {
                        icon: Clock,
                        label: 'Pending Approval',
                        value: stats.pending,
                        change: stats.pending > 0 ? `${stats.pending} created` : 'None',
                        color: 'bg-yellow-500',
                        bgLight: 'bg-yellow-50'
                    },
                    {
                        icon: TrendingUp,
                        label: 'In Progress',
                        value: stats.inProgress,
                        change: stats.inProgress > 0 ? `${stats.inProgress} active` : 'None',
                        color: 'bg-green-500',
                        bgLight: 'bg-green-50'
                    },
                    {
                        icon: CheckCircle,
                        label: 'Completed',
                        value: stats.completed,
                        change: stats.completed > 0 ? `${stats.completed} done` : 'None',
                        color: 'bg-purple-500',
                        bgLight: 'bg-purple-50'
                    },
                    {
                        icon: AlertCircle,
                        label: 'Cancelled',
                        value: stats.cancelled,
                        change: stats.cancelled > 0 ? `${stats.cancelled} cancelled` : 'None',
                        color: 'bg-red-500',
                        bgLight: 'bg-red-50'
                    },
                    {
                        icon: SaudiRiyal,
                        label: 'Total Price',
                        value: `﷼${stats.totalPrice.toLocaleString()}`,
                        change: stats.totalPrice > 0 ? `﷼${stats.totalPrice.toLocaleString()} total` : 'No revenue',
                        color: 'bg-emerald-500',
                        bgLight: 'bg-emerald-50'
                    }
                ];

                const areaCoverageData = [
                    {
                        label: 'Total Area',
                        value: `${areaCoverage.total} km²`,
                        bgColor: 'bg-blue-50',
                        textColor: 'text-blue-600'
                    },
                    {
                        label: 'Collected Area',
                        value: `${areaCoverage.collected} km²`,
                        bgColor: 'bg-green-50',
                        textColor: 'text-green-600'
                    },
                    {
                        label: 'Unfulfilled Area',
                        value: `${areaCoverage.unfulfilled} km²`,
                        bgColor: 'bg-yellow-50',
                        textColor: 'text-yellow-600'
                    }
                ];

                return (
                    <>
                        {toggleButton}
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-3xl font-bold text-gray-900">Dashboard Overview</h2>
                                <p className="text-gray-500 mt-1">Monitor your orders and system performance</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={fetchOrders}
                                    disabled={loading}
                                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50"
                                >
                                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                    <span className="font-medium">Refresh</span>
                                </button>

                                {/* EXPORT DROPDOWN */}
                                <ExportDropdown
                                    onExportCSV={handleExportCSV}
                                    onExportShapefile={handleExportShapefile}
                                />
                            </div>
                        </div>

                        {loading && orders.length === 0 ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="text-center">
                                    <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                                    <p className="text-gray-700 font-bold text-lg">Loading dashboard data...</p>
                                </div>
                            </div>
                        ) : error && orders.length === 0 ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="text-center">
                                    <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                                    <p className="text-red-700 font-bold text-lg mb-2">Failed to Load</p>
                                    <p className="text-gray-600 text-sm mb-6">{error}</p>
                                    <button
                                        onClick={fetchOrders}
                                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        Retry
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-5 gap-6 mb-8">
                                    {statsData.map((stat, index) => {
                                        const Icon = stat.icon;
                                        return (
                                            <div key={index} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className={`${stat.bgLight} p-3 rounded-lg`}>
                                                        <Icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
                                                    </div>
                                                    <span className="text-sm font-semibold text-gray-600">
                                                        {stat.change}
                                                    </span>
                                                </div>
                                                <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
                                                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                                    <h3 className="text-xl font-bold text-gray-900 mb-6">Area Coverage</h3>
                                    <div className="grid grid-cols-3 gap-6">
                                        {areaCoverageData.map((area, index) => (
                                            <div key={index} className={`${area.bgColor} rounded-lg p-6`}>
                                                <p className="text-sm text-gray-600 mb-2">{area.label}</p>
                                                <p className={`text-3xl font-bold ${area.textColor}`}>{area.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl shadow-sm">
                                    <div className="p-6 border-b border-gray-200">
                                        <h3 className="text-xl font-bold text-gray-900">Recent Orders</h3>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <DashboardOrderList showMap={false} showHeader={false} showFilterPanel={false} />
                                    </div>

                                </div>
                            </>
                        )}
                    </>
                );

            case 'orders':
                return (
                    <>
                        {toggleButton}
                        <OrderList />
                    </>
                );

            case 'order-update':
                return (
                    <>
                        {toggleButton}
                        <OrderUpdate />
                    </>
                );

            case 'order-view':
                return (
                    <>
                        {toggleButton}
                        <OrderEye />
                    </>
                );

            case 'order-history':
                return (
                    <>
                        {toggleButton}
                        <OrderHistory />
                    </>
                );

            case 'create':
                return (
                    <>
                        {toggleButton}
                        <OrderCreate />
                    </>
                );

            case 'notifications':
                return (
                    <>
                        {toggleButton}
                        <OrderNotification />
                    </>
                );

            case 'aoi':
                return (
                    <>
                        {toggleButton}
                        <AoiMapping />
                    </>
                );

            case 'users':
                return (
                    <>
                        {toggleButton}
                        <CreateUser />
                    </>
                );

            case 'barcode':
                return (
                    <>
                        {toggleButton}
                        <Barcode token={token} />
                    </>
                );

            case 'prompt-management':
                if (!hasAnyAllowedRole(currentRoles, PROMPT_MANAGEMENT_ALLOWED_ROLES)) {
                    return (
                        <>
                            {toggleButton}
                            <div className="bg-white rounded-xl shadow-sm p-10 text-center">
                                <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
                                <p className="text-gray-500">Only manager roles can update prompts.</p>
                            </div>
                        </>
                    );
                }

                return (
                    <>
                        {toggleButton}
                        <PromptManagement />
                    </>
                );

            default:
                return <div className="text-center text-gray-500">Page not found</div>;
        }
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Logout Confirmation Modal */}
            {showLogoutModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 transform transition-all">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                    <LogOut className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Confirm Logout</h3>
                                    <p className="text-sm text-gray-500">Are you sure you want to log out?</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                                <p className="text-sm text-amber-800">
                                    You'll need to sign in again to access your dashboard and orders.
                                </p>
                            </div>

                            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">
                                        {username ? username.substring(0, 2).toUpperCase() : 'AU'}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">{username || 'Admin User'}</p>
                                    <p className="text-xs text-gray-500">Currently logged in</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-gray-50 rounded-b-2xl flex items-center justify-end space-x-3">
                            <button
                                onClick={() => setShowLogoutModal(false)}
                                className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-white transition-all focus:ring-2 focus:ring-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleLogout}
                                className="px-6 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all focus:ring-2 focus:ring-red-200 flex items-center space-x-2"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sidebar */}
            <div className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col transition-all duration-300 overflow-hidden relative shadow-xl`}>
                {sidebarOpen && (
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="absolute top-4 right-4 p-1.5 hover:bg-gray-700 rounded-lg transition-all z-10"
                    >
                        <PanelLeftClose className="w-5 h-5 text-gray-400" />
                    </button>
                )}

                <div className="p-6 border-b border-gray-700">
                    <div className="flex items-center space-x-3 pr-10">
                        <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-lg">SO</span>
                        </div>
                        <div>
                            <h1 className="font-bold text-lg">Spatial OMS</h1>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {visibleMenuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = selectedMenu === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => handleMenuClick(item)}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl mb-1 transition-all group ${isActive
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'text-gray-300 hover:bg-gray-700/50'
                                    }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}`} />
                                    <span className="font-medium">{item.label}</span>
                                </div>
                                {isActive && <ChevronRight className="w-4 h-4" />}
                            </button>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-700">
                    <div className="relative">
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-gray-700/50 transition-all group"
                        >
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center ring-2 ring-gray-700">
                                    <span className="text-white font-bold text-sm">
                                        {username ? username.substring(0, 2).toUpperCase() : 'AU'}
                                    </span>
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-medium text-white">{username || 'Admin User'}</p>
                                    <p className="text-xs text-gray-400">{userRole}</p>
                                </div>
                            </div>
                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                        </button>

                        {showUserMenu && (
                            <div className="absolute bottom-full left-0 right-0 mb-2 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 overflow-hidden">
                                <button
                                    onClick={() => {
                                        setShowUserMenu(false);
                                    }}
                                    className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-700 transition-all text-gray-300 hover:text-white"
                                >
                                    <Settings className="w-4 h-4" />
                                    <span className="text-sm font-medium">Settings</span>
                                </button>

                                <div className="border-t border-gray-700"></div>

                                <button
                                    onClick={() => {
                                        setShowUserMenu(false);
                                        setShowLogoutModal(true);
                                    }}
                                    className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-red-600 transition-all text-gray-300 hover:text-white"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span className="text-sm font-medium">Logout</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <div className="px-4 py-6">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
