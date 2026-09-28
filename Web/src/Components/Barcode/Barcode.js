import React, { useState } from 'react';
import { Search, Download, AlertCircle, RefreshCw } from 'lucide-react';
import { properties } from '../../Properties/Properties';

const Barcode = ({ token }) => {
    const [poId, setPoId] = useState('');
    const [barcodeData, setBarcodeData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!poId.trim()) {
            setError('Please enter a PO ID');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');
        setBarcodeData(null);

        try {
            const response = await fetch(`${properties.Port}api/download/pdf/${poId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error(`PO ID "${poId}" not found`);
                } else if (response.status === 401) {
                    throw new Error('Session expired. Please login again');
                } else {
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }
            }

            // Convert response to blob
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            
            setBarcodeData({
                url: url,
                poId: poId,
                timestamp: new Date().toLocaleString()
            });
            
            setSuccess(`Barcode PDF generated successfully for PO ID: ${poId}`);

        } catch (err) {
            setError(err.message || 'Failed to generate barcode. Please try again');
            setBarcodeData(null);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        if (barcodeData && barcodeData.url) {
            const link = document.createElement('a');
            link.href = barcodeData.url;
            link.download = `po_${poId}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleReset = () => {
        setPoId('');
        setBarcodeData(null);
        setError('');
        setSuccess('');
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Barcode Manager</h1>
                    <p className="text-gray-600 mt-1">Generate and download barcodes for Purchase Orders</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Input Form */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Generate Barcode</h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        PO ID
                                    </label>
                                    <input
                                        type="text"
                                        value={poId}
                                        onChange={(e) => setPoId(e.target.value)}
                                        placeholder="Enter PO ID"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        disabled={loading}
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-all"
                                    >
                                        {loading ? (
                                            <>
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                                <span>Generating...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Search className="w-4 h-4" />
                                                <span>Submit</span>
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleReset}
                                        disabled={loading}
                                        className="px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50 transition-all"
                                    >
                                        Reset
                                    </button>
                                </div>
                            </form>

                            {/* Info Box */}
                            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm text-blue-800">
                                    <strong>Note:</strong> Enter the Purchase Order ID to generate its barcode PDF.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Results */}
                    <div className="lg:col-span-2">
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="text-red-900 font-semibold mb-1">Error</h3>
                                        <p className="text-red-700 text-sm">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {success && (
                            <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-white text-sm font-bold">✓</span>
                                    </div>
                                    <div>
                                        <h3 className="text-green-900 font-semibold mb-1">Success</h3>
                                        <p className="text-green-700 text-sm">{success}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {barcodeData ? (
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-gray-200">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">Barcode PDF</h3>
                                            <p className="text-sm text-gray-600 mt-1">
                                                PO ID: <span className="font-semibold">{barcodeData.poId}</span>
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Generated: {barcodeData.timestamp}
                                            </p>
                                        </div>
                                        <button
                                            onClick={handleDownload}
                                            className="flex items-center gap-2 bg-green-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-green-700 transition-all shadow-sm"
                                        >
                                            <Download className="w-4 h-4" />
                                            Download
                                        </button>
                                    </div>
                                </div>

                                {/* PDF Preview */}
                                <div className="p-6 bg-gray-50 min-h-96">
                                    <iframe
                                        src={barcodeData.url}
                                        title="PDF Preview"
                                        className="w-full h-96 border border-gray-300 rounded-lg"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Search className="w-8 h-8 text-gray-400" />
                                </div>
                                <p className="text-gray-600 font-medium">No barcode generated yet</p>
                                <p className="text-gray-500 text-sm mt-1">Enter a PO ID and click Submit to generate a barcode</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Barcode;
