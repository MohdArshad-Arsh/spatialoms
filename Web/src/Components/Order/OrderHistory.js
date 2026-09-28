import React, { useEffect, useState } from 'react';
import { withRouter } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, FileText, AlertCircle, Loader } from 'lucide-react';
import { properties } from '../../Properties/Properties';

const OrderHistory = ({ history, location, match }) => {
    const orderFromState = location.state?.orderData;
    const paramId = match?.params?.id;
    const orderId = orderFromState?.orderId || orderFromState?.orderId || paramId;

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!orderId) {
            history.push('/orders');
            return;
        }

        const token = sessionStorage.getItem('jwtToken');
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete axios.defaults.headers.common['Authorization'];
        }

        fetchHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderId]);

    const fetchHistory = async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await axios.get(
                properties.Port + `order/getAllOrderHistoryBYId/${orderId}`
            );
            setItems(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Order history fetch error:', err);
            if (err.response) {
                setError(err.response.data?.message || `Status ${err.response.status}`);
            } else if (err.request) {
                setError('No response from server');
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (d) => {
        if (!d) return 'N/A';
        try {
            return new Date(d).toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return d;
        }
    };

    const handleBack = () => history.push('/orders');

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-medium">Back to Orders</span>
                    </button>

                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-indigo-600">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-100 rounded-lg">
                                <FileText className="w-7 h-7 text-indigo-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Order History</h1>
                                <p className="text-sm text-gray-600 mt-1">
                                    Order ID: <span className="font-semibold text-indigo-700">{orderId}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                    {loading ? (
                        <div className="text-center py-12">
                            <Loader className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-3" />
                            <p className="text-indigo-700 font-semibold">Loading history...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12">
                            <AlertCircle className="w-10 h-10 text-red-600 mx-auto mb-3" />
                            <p className="text-red-700 font-semibold">{error}</p>
                        </div>
                    ) : (!items || !items.length) ? (
                        <div className="text-center py-16">
                            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-600 font-medium">No history records found for this order.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full table-auto border-collapse">
                                <thead>
                                    <tr className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider border-r border-white/20">ID</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider border-r border-white/20">Created Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider border-r border-white/20">Modified Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider border-r border-white/20">Created By</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider border-r border-white/20">Modified By</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider border-r border-white/20">Old Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider border-r border-white/20">New Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider border-r border-white/20">Vendor</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider border-r border-white/20">Client</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider border-r border-white/20">Priority</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider border-r border-white/20">Sensor</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider border-r border-white/20">Area Covered (km²)</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider border-r border-white/20">
                                            Remaining Area (km²)
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider border-r border-white/20">Extra Area Covered (km²)</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider border-r border-white/20">Price/km²</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider border-r border-white/20">Total Price</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider border-r border-white/20">Progress %</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Comment</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y-2 divide-gray-200">
                                    {items.map((h, idx) => (
                                        <tr
                                            key={h.id || idx}
                                            className="hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-200"
                                        >
                                            <td className="px-4 py-3 text-sm font-semibold text-gray-700 border-r border-gray-200">
                                                {h.id ?? 'N/A'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">
                                                {formatDate(h.createdDate)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">
                                                {formatDate(h.lastModifiedDate)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">
                                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs font-semibold">
                                                    {h.createdBy || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">
                                                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-md text-xs font-semibold">
                                                    {h.lastModifiedBy || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm border-r border-gray-200">
                                                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-md text-xs font-semibold">
                                                    {h.statusOld || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm border-r border-gray-200">
                                                <span className={`px-2 py-1 rounded-md text-xs font-semibold ${h.statusNew === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                                    h.statusNew === 'COMPLETED_WITH_ENHANCEMENTS' ? 'bg-purple-100 text-purple-800' :
                                                        h.statusNew === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                                                            h.statusNew === 'PARTIALLY_COMPLETED' ? 'bg-yellow-100 text-yellow-800' :
                                                                h.statusNew === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                                                    'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {h.statusNew || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">
                                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs font-semibold">
                                                    {h.vendor || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">
                                                {h.clientName || 'N/A'}
                                            </td>
                                            <td className="px-4 py-3 text-sm border-r border-gray-200">
                                                <span className={`px-2 py-1 rounded-md text-xs font-semibold ${h.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                                                    h.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {h.priority || 'N/A'}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3 text-sm border-r border-gray-200">
                                                <span className="bg-teal-100 text-teal-800 px-2 py-1 rounded-md text-xs font-semibold">
                                                    {h.selectedSensor || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm font-bold text-blue-700 border-r border-gray-200">
                                                {h.areaCovered ? Number(h.areaCovered).toFixed(2) : '0.00'}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-bold text-orange-700 border-r border-gray-200">
                                                {h.remainingArea !== null && h.remainingArea !== undefined
                                                    ? (h.remainingArea >= 0 ? Number(h.remainingArea).toFixed(2) : '0.00')
                                                    : 'N/A'}
                                            </td>

                                            <td className="px-4 py-3 text-sm font-bold border-r border-gray-200">
                                                {h.extraAreaCovered && h.extraAreaCovered > 0 ? (
                                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs font-bold">
                                                        +{Number(h.extraAreaCovered).toFixed(2)} km²
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">--</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-bold text-purple-700 border-r border-gray-200">
                                                {h.pricePerKm ? `﷼${Number(h.pricePerKm).toFixed(2)}` : 'N/A'}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-bold text-green-700 border-r border-gray-200">
                                                {h.totalPrice ? `﷼${Number(h.totalPrice).toFixed(2)}` : 'N/A'}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-bold text-indigo-700 border-r border-gray-200">
                                                {Number(h.percentageCompleted ?? h.progress ?? 0).toFixed(2)}%
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700 max-w-xs">
                                                {h.comment ? (
                                                    <span
                                                        title={h.comment}
                                                        className="line-clamp-2 bg-gray-100 px-2 py-1 rounded text-xs"
                                                    >
                                                        {h.comment}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 italic text-xs">No comment</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Summary Section */}
                {items && items.length > 0 && (
                    <div className="mt-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl shadow-lg p-6 border-2 border-indigo-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">History Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white rounded-lg p-4 shadow">
                                <p className="text-xs text-gray-600 font-semibold mb-2">Total Updates</p>
                                <p className="text-2xl font-bold text-indigo-700">{items.length}</p>
                            </div>
                            <div className="bg-white rounded-lg p-4 shadow min-h-[88px] flex flex-col justify-between">
                                <p className="text-xs text-gray-600 font-semibold mb-2">Latest Status</p>
                                <p className="text-sm font-bold text-green-700 break-words leading-tight">
                                    {items[items.length - 1]?.statusNew || 'N/A'}
                                </p>
                            </div>
                            <div className="bg-white rounded-lg p-4 shadow">
                                <p className="text-xs text-gray-600 font-semibold mb-2">Total Area Covered</p>
                                <p className="text-2xl font-bold text-blue-700">
                                    {items.reduce((sum, h) => sum + (Number(h.areaCovered) || 0), 0).toFixed(2)} km²
                                </p>
                            </div>
                            <div className="bg-white rounded-lg p-4 shadow">
                                <p className="text-xs text-gray-600 font-semibold mb-2">Total Price Added</p>
                                <p className="text-2xl font-bold text-purple-700">
                                    ﷼{items.reduce((sum, h) => sum + (Number(h.totalPrice) || 0), 0).toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .line-clamp-2 {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
                
                table {
                    border-collapse: separate;
                    border-spacing: 0;
                }
                
                tbody tr {
                    border-bottom: 2px solid #e5e7eb;
                }
                
                tbody tr:last-child {
                    border-bottom: none;
                }
            `}</style>
        </div>
    );
};

export default withRouter(OrderHistory);