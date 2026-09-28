import React, { useEffect, useState } from 'react';
import { withRouter } from 'react-router-dom';
import { MapContainer, GeoJSON, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import axios from "axios";
import {
    ArrowLeft, Package, User, MapPin, Calendar, Clock,
    TrendingUp, CheckCircle, AlertCircle, Activity, Edit, Eye,
    Layers, Building2, UserCircle, BarChart3, Target, Percent, Loader
} from 'lucide-react';
import { properties } from '../../Properties/Properties';

// Fix Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

const STATUS_COLORS = {
    'CREATED': 'bg-orange-100 text-orange-700 border-orange-300',
    'PENDING': 'bg-blue-100 text-blue-700 border-blue-300',
    'PARTIALLY_COMPLETED': 'bg-blue-100 text-blue-700 border-blue-300',
    'CANCELLED': 'bg-green-100 text-green-700 border-green-300',
    'COMPLETED': 'bg-purple-100 text-purple-700 border-purple-300',
    'Completed': 'bg-purple-100 text-purple-700 border-purple-300'
};

const PRIORITY_COLORS = {
    'HIGH': 'bg-red-100 text-red-700 border-red-300',
    'MEDIUM': 'bg-yellow-100 text-yellow-700 border-yellow-300',
    'LOW': 'bg-gray-100 text-gray-700 border-gray-300'
};

// Dual Tile Layer Component - World (Z:2-8) + Saudi Arabia (Z:9-13)
function DualTileLayer({ worldMaxZoom = 8, saudiMaxZoom = 13 }) {
    const map = useMap();

    useEffect(() => {
        const basename = process.env.PUBLIC_URL || '';

        console.log('🗺️ OrderEye: Initializing Dual Tile Layer System');
        console.log('   World tiles: Zoom 2-8');
        console.log('   Saudi Arabia tiles: Zoom 9-13 (high detail)');

        // Saudi Arabia bounding box
        const saudiBounds = L.latLngBounds(
            L.latLng(16.0, 34.5),   // Southwest
            L.latLng(32.5, 56.0)    // Northeast
        );

        // World Tile Layer (Zoom 2-8)
        const WorldTileLayer = L.TileLayer.extend({
            getTileUrl: function (coords) {
                let { z, x, y } = coords;
                if (z > worldMaxZoom) {
                    const scale = Math.pow(2, z - worldMaxZoom);
                    return `${window.location.origin}${basename}/tiles/${worldMaxZoom}/${Math.floor(x / scale)}/${Math.floor(y / scale)}.png`;
                }
                return `${properties.TilesBase}/tiles/${z}/${x}/${y}.png`;
            }
        });

        // Saudi Arabia Tile Layer (Zoom 9-13)
        const SaudiTileLayer = L.TileLayer.extend({
            getTileUrl: function (coords) {
                const { z, x, y } = coords;
                const tileBounds = this._tileCoordsToBounds(coords);
                const tileCenter = tileBounds.getCenter();

                if (z >= 9 && z <= saudiMaxZoom && saudiBounds.contains(tileCenter)) {
                    return `${properties.TilesBase}/Saudi_tiles/${z}/${x}/${y}.png`;
                }

                // Transparent tile for outside Saudi Arabia
                return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
            }
        });

        // Create layers
        const worldLayer = new WorldTileLayer('', {
            attribution: '© OpenStreetMap contributors (Offline)',
            minZoom: 2,
            maxZoom: 13,
            maxNativeZoom: worldMaxZoom,
            tileSize: 256,
            noWrap: false,
            crossOrigin: 'anonymous',
            errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
        });

        const saudiLayer = new SaudiTileLayer('', {
            attribution: '© OpenStreetMap (Saudi Arabia - High Detail)',
            minZoom: 9,
            maxZoom: saudiMaxZoom,
            tileSize: 256,
            noWrap: false,
            crossOrigin: 'anonymous',
            errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
        });

        // Add layers to map (Saudi on top)
        worldLayer.addTo(map);
        saudiLayer.addTo(map);

        return () => {
            map.removeLayer(worldLayer);
            map.removeLayer(saudiLayer);
        };
    }, [map, worldMaxZoom, saudiMaxZoom]);

    return null;
}

// Component to access map instance and fit bounds
function MapInstanceHandler({ onMapReady, geoJsonData }) {
    const map = useMap();

    useEffect(() => {
        if (map && onMapReady) {
            onMapReady(map);
        }
    }, [map, onMapReady]);

    useEffect(() => {
        if (map && geoJsonData) {
            try {
                const geoJsonLayer = L.geoJSON(geoJsonData);
                const bounds = geoJsonLayer.getBounds();
                if (bounds.isValid()) {
                    map.fitBounds(bounds, { padding: [50, 50] });
                }
            } catch (error) {
                console.error("Error fitting bounds:", error);
            }
        }
    }, [geoJsonData, map]);

    return null;
}

const OrderEye = ({ history, location }) => {
    const orderData = location.state?.orderData;

    // AOI Mapping States
    const [fetchedAoi, setFetchedAoi] = useState(null);
    const [mapInstance, setMapInstance] = useState(null);
    const [isLoadingAoi, setIsLoadingAoi] = useState(false);
    const [aoiError, setAoiError] = useState(null);
    const [aoiInfo, setAoiInfo] = useState(null);
    const [clickedCoords, setClickedCoords] = useState(null);

    useEffect(() => {
        if (!orderData) {
            history.push('/orders');
        }
    }, [orderData, history]);

    // Setup axios with token
    useEffect(() => {
        const token = sessionStorage.getItem('jwtToken');
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete axios.defaults.headers.common['Authorization'];
        }
    }, []);

    // Auto-fetch AOI when component mounts
    useEffect(() => {
        if (orderData?.orderId) {
            fetchAoi();
        }
    }, [orderData?.orderId]);

    // Attach click handler to map for coordinate tracking
    useEffect(() => {
        if (!mapInstance) return;

        const handleMapClick = (e) => {
            setClickedCoords({
                latitude: e.latlng.lat.toFixed(6),
                longitude: e.latlng.lng.toFixed(6)
            });
        };

        mapInstance.on('click', handleMapClick);

        return () => {
            mapInstance.off('click', handleMapClick);
        };
    }, [mapInstance]);

    // Extract polygon coordinates when AOI is loaded
    useEffect(() => {
        if (fetchedAoi && aoiInfo?.center) {
            // Set initial center coords from AOI bounds center
            setClickedCoords({
                latitude: aoiInfo.center.lat.toFixed(6),
                longitude: aoiInfo.center.lng.toFixed(6),
                isPolygonCenter: true
            });
        }
    }, [fetchedAoi, aoiInfo]);

    const handleBack = () => {
        history.push('/orders');
    };

    const handleEdit = () => {
        history.push('/order/update', { state: { orderData } });
    };

    const formatDate = (d) => {
        if (!d) return 'N/A';
        try {
            return new Date(d).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'Invalid';
        }
    };

    // Calculate AOI statistics
    const calculateAoiStats = (aoi) => {
        try {
            let geometry = aoi;
            if (aoi.type === "Feature") {
                geometry = aoi.geometry;
            } else if (aoi.type === "FeatureCollection" && aoi.features?.length > 0) {
                geometry = aoi.features[0].geometry;
            }

            const geoJsonLayer = L.geoJSON(aoi);
            const bounds = geoJsonLayer.getBounds();

            return {
                type: geometry.type,
                bounds: bounds,
                center: bounds.getCenter(),
                hasData: true
            };
        } catch (err) {
            console.error("Error calculating AOI stats:", err);
            return null;
        }
    };

    // Fetch AOI from backend
    const fetchAoi = async () => {
        if (!orderData?.orderId) {
            setAoiError("Order ID not available");
            return;
        }

        const token = sessionStorage.getItem('jwtToken');
        if (!token) {
            setAoiError("Please login first!");
            return;
        }

        setIsLoadingAoi(true);
        setAoiError(null);
        setFetchedAoi(null);
        setAoiInfo(null);

        try {
            const response = await axios.get(
                properties.Port + properties.getAoiByOrderId + orderData.orderId
            );
            setFetchedAoi(response.data);
            const stats = calculateAoiStats(response.data);
            setAoiInfo(stats);

            if (mapInstance && stats?.bounds) {
                mapInstance.fitBounds(stats.bounds, { padding: [50, 50] });
            }
        } catch (err) {
            console.error("Fetch AOI Error:", err);
            let errorMessage = "Failed to fetch AOI: ";

            if (err.response) {
                if (err.response.status === 403 || err.response.status === 401) {
                    errorMessage = "Authentication failed! Please login again.";
                } else {
                    errorMessage += err.response.data?.message || err.response.data || `Status ${err.response.status}`;
                }
            } else if (err.request) {
                errorMessage += "No response from server. Check if backend is running.";
            } else {
                errorMessage += err.message;
            }

            setAoiError(errorMessage);
        } finally {
            setIsLoadingAoi(false);
        }
    };

    if (!orderData) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 p-6">
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-medium">Back to Orders</span>
                    </button>

                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-600">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-100 rounded-lg">
                                    <Eye className="w-7 h-7 text-purple-600" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">
                                        {orderData.orderId}
                                    </h1>
                                    <p className="text-gray-600 mt-1">
                                        Order Details & Information
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={handleEdit}
                                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
                            >
                                <Edit className="w-4 h-4" />
                                <span className="font-medium">Edit Order</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Status & Priority */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                        <div className="flex items-center gap-3 mb-4">
                            <Activity className="w-6 h-6 text-blue-600" />
                            <h2 className="text-lg font-semibold">Order Status</h2>
                        </div>
                        <span className={`inline-block px-4 py-2 rounded-lg text-lg font-bold border-2 
                            ${STATUS_COLORS[orderData.status] || 'bg-gray-100 text-gray-700'}`}>
                            {orderData.status}
                        </span>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
                        <div className="flex items-center gap-3 mb-4">
                            <AlertCircle className="w-6 h-6 text-yellow-600" />
                            <h2 className="text-lg font-semibold">Priority Level</h2>
                        </div>
                        <span className={`inline-block px-4 py-2 rounded-lg text-lg font-bold border-2 
                            ${PRIORITY_COLORS[orderData.priority] || 'bg-gray-100 text-gray-700'}`}>
                            {orderData.priority || 'N/A'}
                        </span>
                    </div>
                </div>

                {/* Basic Information */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <div className="flex items-center gap-3 mb-6 pb-3 border-b-2 border-blue-100">
                        <Package className="w-6 h-6 text-blue-600" />
                        <h2 className="text-xl font-bold">Basic Information</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Package className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 font-medium">Order ID</p>
                                <p className="text-lg font-bold text-gray-900">{orderData.orderId}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                                <MapPin className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 font-medium">PO ID</p>
                                <p className="text-lg font-bold text-gray-900">{orderData.poId}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Building2 className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 font-medium">Client</p>
                                <p className="text-lg font-bold text-gray-900">{orderData.client}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <User className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 font-medium">Vendor</p>
                                <p className="text-lg font-bold text-gray-900">{orderData.vendor}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sensors Information */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <div className="flex items-center gap-3 mb-6 pb-3 border-b-2 border-blue-100">
                        <Layers className="w-6 h-6 text-blue-600" />
                        <h2 className="text-xl font-bold">Sensors Information</h2>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-teal-100 rounded-lg">
                            <Layers className="w-5 h-5 text-teal-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-gray-600 font-medium mb-2">Assigned Sensors</p>
                            <div className="flex flex-wrap gap-2">
                                {orderData.sensorList && orderData.sensorList.length > 0 ? (
                                    orderData.sensorList.map((sensor, idx) => (
                                        <span
                                            key={idx}
                                            className="px-3 py-1.5 bg-teal-100 text-teal-700 rounded-lg text-sm font-semibold border border-teal-200"
                                        >
                                            {sensor}
                                        </span>
                                    ))
                                ) : (
                                    <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-semibold">
                                        No sensors selected
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Total Sensors: <span className="font-bold">{orderData.sensorList?.length || 0}</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* AOI Mapping Section - WITH DUAL TILE SYSTEM (World + Saudi) */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <div className="flex items-center justify-between mb-6 pb-3 border-b-2 border-blue-100">
                        <div className="flex items-center gap-3">
                            <MapPin className="w-6 h-6 text-blue-600" />
                            <h2 className="text-xl font-bold">Order AOI - Dual Tile System</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                                <span className="text-xs font-semibold text-blue-700">🌍 Z:2-8</span>
                            </div>
                            <div className="px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-lg">
                                <span className="text-xs font-semibold text-orange-700">🇸🇦 Z:9-13</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex gap-3 items-center">
                            <button
                                onClick={fetchAoi}
                                disabled={isLoadingAoi}
                                className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${!isLoadingAoi
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                {isLoadingAoi ? (
                                    <>
                                        <Loader className="w-4 h-4 animate-spin" />
                                        <span>Fetching AOI...</span>
                                    </>
                                ) : (
                                    <>
                                        <MapPin className="w-4 h-4" />
                                        <span>Fetch AOI</span>
                                    </>
                                )}
                            </button>

                            {fetchedAoi && (
                                <button
                                    onClick={() => {
                                        setFetchedAoi(null);
                                        setAoiError(null);
                                        setAoiInfo(null);
                                    }}
                                    disabled={isLoadingAoi}
                                    className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold text-sm transition-all disabled:opacity-50"
                                >
                                    Clear AOI
                                </button>
                            )}
                        </div>

                        {aoiError && (
                            <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
                                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-600" />
                                <div>
                                    <p className="font-semibold text-sm mb-0.5 text-red-900">Error</p>
                                    <p className="text-sm text-red-700">{aoiError}</p>
                                </div>
                            </div>
                        )}

                        {aoiInfo && fetchedAoi && (
                            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <p className="font-semibold text-green-900">AOI Loaded Successfully</p>
                                </div>
                                <p className="text-sm text-green-700">
                                    Geometry Type: <span className="font-bold">{aoiInfo.type}</span>
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Map Section - WITH DUAL TILES (World + Saudi) */}
                    <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden">
                        <div style={{ height: "500px" }} className="relative">
                            <div className="absolute top-3 left-3 bg-white p-3 rounded-lg shadow-lg z-[1000] border border-green-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    <p className="text-xs font-semibold text-green-700">Dual Tile System</p>
                                </div>
                                <p className="text-xs text-gray-600 mb-1">🌍 World: Z:2-8</p>
                                <p className="text-xs text-orange-600 font-semibold">🇸🇦 Saudi: Z:9-13</p>
                            </div>

                            <MapContainer
                                center={[20.5937, 78.9629]}
                                zoom={5}
                                style={{ height: "100%", width: "100%", backgroundColor: '#e8f5e9' }}
                                zoomControl={true}
                                maxZoom={13}
                                minZoom={2}
                            >
                                <DualTileLayer worldMaxZoom={8} saudiMaxZoom={13} />
                                <MapInstanceHandler
                                    onMapReady={setMapInstance}
                                    geoJsonData={fetchedAoi}
                                />
                                {fetchedAoi && (
                                    <GeoJSON
                                        data={fetchedAoi}
                                        style={{
                                            color: '#3b82f6',
                                            weight: 3,
                                            fillColor: '#3b82f6',
                                            fillOpacity: 0.25
                                        }}
                                        key={JSON.stringify(fetchedAoi)}
                                    />
                                )}
                                {clickedCoords && (
                                    <div className="absolute bottom-4 left-4 bg-white p-4 rounded-lg shadow-lg z-[1000] border-2 border-blue-400">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-xs font-bold text-gray-800 uppercase">
                                                {clickedCoords.isPolygonCenter ? '📍 Polygon Center' : '📌 Clicked Location'}
                                            </p>
                                            <button
                                                onClick={() => setClickedCoords(null)}
                                                className="text-sm text-gray-500 hover:text-gray-700 font-bold ml-3"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-mono text-blue-700 bg-blue-50 px-2 py-1 rounded">
                                                <span className="font-bold">Lat:</span> {clickedCoords.latitude}
                                            </p>
                                            <p className="text-sm font-mono text-blue-700 bg-blue-50 px-2 py-1 rounded">
                                                <span className="font-bold">Lon:</span> {clickedCoords.longitude}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </MapContainer>

                            <div className="absolute top-3 right-3 z-[10000]">
                                <button
                                    onClick={() => {
                                        if (!fetchedAoi) return;
                                        try {
                                            sessionStorage.setItem('tempAoi', JSON.stringify(fetchedAoi));
                                            window.open(window.location.origin + '/orderingSystems-application/map-view', '_blank');
                                        } catch (err) {
                                            console.error('Open in new tab failed:', err);
                                        }
                                    }}
                                    disabled={!fetchedAoi}
                                    className="bg-white hover:bg-gray-50 text-gray-700 rounded-lg px-3 py-2 shadow-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Open in new tab
                                </button>
                            </div>
                        </div>

                        {!fetchedAoi && !isLoadingAoi && (
                            <div className="p-12 text-center bg-gradient-to-b from-green-50 to-white">
                                <div className="bg-white w-16 h-16 rounded-xl inline-flex items-center justify-center mb-4 shadow-sm">
                                    <MapPin className="w-8 h-8 text-gray-400" />
                                </div>
                                <p className="text-gray-900 font-semibold text-base mb-2">Dual Tile System Ready</p>
                                <p className="text-gray-600 text-sm mb-1">🌍 World (Z:2-8) + 🇸🇦 Saudi Arabia (Z:9-13)</p>
                                <p className="text-green-600 text-sm font-semibold">
                                    Click "Fetch AOI" to display order boundaries
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Polygon Coordinates */}
                {fetchedAoi && (
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                        <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-blue-100">
                            <MapPin className="w-6 h-6 text-blue-600" />
                            <h2 className="text-xl font-bold">Polygon Coordinates</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {aoiInfo?.center && (
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-300">
                                    <p className="text-sm font-bold text-blue-900 mb-3">📍 Polygon Center</p>
                                    <p className="text-sm font-mono text-blue-800 mb-2">
                                        <span className="font-bold">Latitude:</span> {aoiInfo.center.lat.toFixed(6)}
                                    </p>
                                    <p className="text-sm font-mono text-blue-800">
                                        <span className="font-bold">Longitude:</span> {aoiInfo.center.lng.toFixed(6)}
                                    </p>
                                </div>
                            )}

                            {aoiInfo?.bounds && (
                                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-300">
                                    <p className="text-sm font-bold text-green-900 mb-3">📦 Polygon Bounds</p>
                                    <div className="space-y-2 text-sm font-mono text-green-800">
                                        <p><span className="font-bold">NW:</span> {aoiInfo.bounds.getNorthWest().lat.toFixed(6)}, {aoiInfo.bounds.getNorthWest().lng.toFixed(6)}</p>
                                        <p><span className="font-bold">SE:</span> {aoiInfo.bounds.getSouthEast().lat.toFixed(6)}, {aoiInfo.bounds.getSouthEast().lng.toFixed(6)}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Polygon Vertices */}
                        <div className="mt-6">
                            <p className="text-sm font-bold text-gray-800 mb-3">🔹 All Vertices</p>
                            <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto">
                                {fetchedAoi.type === 'Feature' && fetchedAoi.geometry?.coordinates ? (
                                    <div className="space-y-2">
                                        {(fetchedAoi.geometry.type === 'Polygon' ? fetchedAoi.geometry.coordinates[0] :
                                            fetchedAoi.geometry.type === 'MultiPolygon' ? fetchedAoi.geometry.coordinates[0][0] : []).map((coord, idx) => (
                                                <p key={idx} className="text-xs font-mono text-gray-700">
                                                    <span className="font-bold text-gray-900">V{idx + 1}:</span> Lat {coord[1]?.toFixed(6) || 'N/A'}, Lon {coord[0]?.toFixed(6) || 'N/A'}
                                                </p>
                                            ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-600">No vertices available</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Progress & Area Information */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <div className="flex items-center gap-3 mb-6 pb-3 border-b-2 border-blue-100">
                        <BarChart3 className="w-6 h-6 text-blue-600" />
                        <h2 className="text-xl font-bold">Progress & Area Coverage</h2>
                    </div>

                    <div className="space-y-6">
                        {/* Progress Bar */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Percent className="w-5 h-5 text-blue-600" />
                                    <span className="text-sm font-semibold text-gray-700">Overall Progress</span>
                                </div>
                                <span className="text-2xl font-bold text-gray-900">{orderData.progress}%</span>
                            </div>
                            <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                                <div
                                    className={`h-full transition-all duration-500 ${orderData.progress === 100
                                        ? 'bg-gradient-to-r from-purple-500 to-purple-600'
                                        : orderData.progress > 50
                                            ? 'bg-gradient-to-r from-green-500 to-green-600'
                                            : orderData.progress > 0
                                                ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                                                : 'bg-gray-300'
                                        }`}
                                    style={{ width: `${orderData.progress}%` }}
                                />
                            </div>
                        </div>

                        {/* Area Statistics */}
                        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <Target className="w-5 h-5 text-blue-600" />
                                    <p className="text-xs font-semibold text-blue-700 uppercase">Total Area</p>
                                </div>
                                <p className="text-2xl font-bold text-blue-900">{orderData.area.total}</p>
                                <p className="text-xs text-blue-600 mt-1">km²</p>
                            </div>

                            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <p className="text-xs font-semibold text-green-700 uppercase">Collected</p>
                                </div>
                                <p className="text-2xl font-bold text-green-900">{orderData.area.collected}</p>
                                <p className="text-xs text-green-600 mt-1">km²</p>
                            </div>

                            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertCircle className="w-5 h-5 text-orange-600" />
                                    <p className="text-xs font-semibold text-orange-700 uppercase">Unfulfilled</p>
                                </div>
                                <p className="text-2xl font-bold text-orange-900">{orderData.area.unfulfilled}</p>
                                <p className="text-xs text-orange-600 mt-1">km²</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Timeline & User Information */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center gap-3 mb-6 pb-3 border-b-2 border-blue-100">
                        <Clock className="w-6 h-6 text-blue-600" />
                        <h2 className="text-xl font-bold">Timeline & User Information</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        {/* Created Info */}
                        <div className="space-y-4">
                            <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-green-900 mb-1">Order Created</p>
                                    <div className="flex items-center gap-2 text-sm text-green-700 mb-2">
                                        <Calendar className="w-4 h-4" />
                                        <span>{formatDate(orderData.createdDate)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-green-200">
                                        <UserCircle className="w-4 h-4 text-green-600" />
                                        <span className="text-sm font-semibold text-green-800">
                                            Created by: {orderData.createdBy || 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modified Information */}
                        <div className="space-y-4">
                            <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Activity className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-blue-900 mb-1">Last Modified</p>
                                    <div className="flex items-center gap-2 text-sm text-blue-700 mb-2">
                                        <Calendar className="w-4 h-4" />
                                        <span>{formatDate(orderData.lastModifiedDate)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-blue-200">
                                        <UserCircle className="w-4 h-4 text-blue-600" />
                                        <span className="text-sm font-semibold text-blue-800">
                                            Modified by: {orderData.lastModifiedBy || 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <style>{`
                @keyframes spin {
                    to {
                        transform: rotate(360deg);
                    }
                }
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes pulse {
                    0%, 100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.5;
                    }
                }
                .animate-pulse {
                    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                .leaflet-container {
                    height: 100%;
                    width: 100%;
                    z-index: 1;
                }
                .leaflet-tile-container {
                    pointer-events: auto !important;
                }
                .leaflet-tile {
                    max-width: none !important;
                    max-height: none !important;
                }
            `}</style>
        </div>
    );
};

export default withRouter(OrderEye);