import React, { useState, useEffect, useRef } from 'react';
import { withRouter } from 'react-router-dom';
import { MapContainer, GeoJSON, useMap, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import shpwrite from "shp-write";
import MultiSelectDropdown from './MultiSelectDropdown';

// import { useRef } from 'react';
import { Download } from 'lucide-react';
import {
    Search, Filter, Eye, MapPin, User, Package, ChevronDown, X,
    Maximize2, Minimize2, RefreshCw, AlertCircle, Calendar, Loader, Edit, FileText, ChevronLeft, ChevronRight,
    Archive, ArchiveRestore
} from 'lucide-react';
import { properties } from '../../Properties/Properties';

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});


const ExportDropdown = ({ onExportCSV, onExportShapefile }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    // Close when clicking outside
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
                className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-300 rounded-xl shadow-sm hover:bg-gray-50 font-semibold"
            >
                <Download className="w-4 h-4" />
                Export
                <ChevronDown className="w-4 h-4" />
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-52 bg-white border-2 border-gray-200 rounded-xl shadow-xl z-50">
                    <button
                        onClick={() => {
                            onExportCSV();
                            setOpen(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center gap-3 font-semibold text-sm"
                    >
                        <FileText className="w-4 h-4 text-blue-600" />
                        Export CSV
                    </button>

                    <button
                        onClick={() => {
                            onExportShapefile();
                            setOpen(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-green-50 flex items-center gap-3 font-semibold text-sm border-t"
                    >
                        🗺️ Export Shapefile
                    </button>
                </div>
            )}
        </div>
    );
};
// Constants
const VENDORS = [
    { value: 'vendor-a', label: 'Vendor A' },
    { value: 'vendor-b', label: 'Vendor B' }
];
const PRIORITIES = ['HIGH', 'MEDIUM', 'LOW'];
const STATUS_COLORS = {
    'CREATED': 'bg-orange-100 text-orange-700 border border-orange-200',
    'PENDING': 'bg-blue-100 text-blue-700 border border-blue-200',
    'PARTIALLY_COMPLETED': 'bg-blue-100 text-blue-700 border border-blue-200',
    'CANCELLED': 'bg-red-100 text-red-700 border border-red-200',
    'COMPLETED': 'bg-green-100 text-green-700 border border-green-200',
    'Completed': 'bg-green-100 text-green-700 border border-green-200'
};
const PRIORITY_COLORS = {
    'HIGH': 'bg-red-100 text-red-700 border border-red-200',
    'MEDIUM': 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    'LOW': 'bg-gray-100 text-gray-700 border border-gray-200'
};

// Vendor-Sensor Mapping
const VENDOR_SENSORS = {
    'vendor-a': ['Sensor 1', 'Sensor 2', 'Sensor 3', 'Sensor 4', 'Sensor 5', 'Sensor 6', 'Sensor 7', 'Sensor 8'],
    'vendor-b': ['Sensor 11', 'Sensor 12', 'Sensor 13', 'Sensor 14', 'Sensor 15', 'Sensor 16', 'Sensor 17', 'Sensor 18', 'Sensor 19', 'Sensor 20'],
    'vendor-both': ['Sensor 1', 'Sensor 2', 'Sensor 3', 'Sensor 4', 'Sensor 5', 'Sensor 6', 'Sensor 7', 'Sensor 8', 'Sensor 11', 'Sensor 12', 'Sensor 13', 'Sensor 14', 'Sensor 15', 'Sensor 16', 'Sensor 17', 'Sensor 18', 'Sensor 19', 'Sensor 20']
};

// Hooks
const useAuth = () => ({
    token: sessionStorage.getItem('jwtToken'),
    isAuthenticated: !!sessionStorage.getItem('jwtToken'),
    user: sessionStorage.getItem('username')
});

// Dual Tile Layer Component
function DualTileLayer({ worldMaxZoom = 8, saudiMaxZoom = 13 }) {
    const map = useMap();

    useEffect(() => {
        const basename = process.env.PUBLIC_URL || '';
        const saudiBounds = L.latLngBounds([16.0, 34.5], [32.5, 56.0]);

        const createTileLayer = (getTileUrlFn, options) => {
            const TileLayer = L.TileLayer.extend({ getTileUrl: getTileUrlFn });
            return new TileLayer('', {
                ...options,
                tileSize: 256,
                noWrap: false,
                crossOrigin: 'anonymous',
                errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
            });
        };

        const worldLayer = createTileLayer(
            function (coords) {
                let { z, x, y } = coords;
                if (z > worldMaxZoom) {
                    const scale = Math.pow(2, z - worldMaxZoom);
                    return `${window.location.origin}${basename}/tiles/${worldMaxZoom}/${Math.floor(x / scale)}/${Math.floor(y / scale)}.png`;
                }
                return `${properties.TilesBase}/tiles/${z}/${x}/${y}.png`;
            },
            {
                attribution: '© OpenStreetMap contributors (Offline)',
                minZoom: 2,
                maxZoom: 13,
                maxNativeZoom: worldMaxZoom
            }
        );

        const saudiLayer = createTileLayer(
            function (coords) {
                const { z, x, y } = coords;
                const tileCenter = this._tileCoordsToBounds(coords).getCenter();
                if (z >= 9 && z <= saudiMaxZoom && saudiBounds.contains(tileCenter)) {
                    return `${properties.TilesBase}/Saudi_tiles/${z}/${x}/${y}.png`;
                }
                return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
            },
            {
                attribution: '© OpenStreetMap contributors (Saudi Arabia - High Detail)',
                minZoom: 9,
                maxZoom: saudiMaxZoom
            }
        );

        worldLayer.addTo(map);
        saudiLayer.addTo(map);

        return () => {
            map.removeLayer(worldLayer);
            map.removeLayer(saudiLayer);
        };
    }, [map, worldMaxZoom, saudiMaxZoom]);

    return null;
}

// Map Handler Component
function MapHandler({ onMapReady, allAois }) {
    const map = useMap();

    useEffect(() => {
        if (onMapReady) onMapReady(map);
    }, [map, onMapReady]);

    useEffect(() => {
        if (!map || !allAois?.length) return;

        try {
            const bounds = allAois
                .map(aoi => {
                    try {
                        const layer = L.geoJSON(aoi);
                        return layer.getBounds().isValid() ? layer.getBounds() : null;
                    } catch { return null; }
                })
                .filter(Boolean);

            if (bounds.length) {
                const group = L.featureGroup(bounds.map(b => L.rectangle(b)));
                map.fitBounds(group.getBounds(), { padding: [50, 50] });
            }
        } catch (err) {
            console.error("Map bounds error:", err);
        }
    }, [allAois, map]);

    return null;
}

// AOI Map Component
const AOIMap = ({ token, isAuthenticated, filteredOrders = [], filtersApplied = false }) => {
    const [aois, setAois] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [expanded, setExpanded] = useState(false);
    const [selectedAoi, setSelectedAoi] = useState(null);
    const [mapInstance, setMapInstance] = useState(null);
    const [mapSearchQuery, setMapSearchQuery] = useState('');

    const displayedAois = filtersApplied
        ? aois.filter(a => {
            const aoiPoId = String(a.properties?.poId ?? '');
            const aoiOrderId = String(a.properties?.orderId ?? '');
            return filteredOrders.some(order =>
                (aoiPoId && aoiPoId !== 'undefined' && aoiPoId === String(order.poId ?? '')) ||
                (aoiOrderId && aoiOrderId !== 'undefined' && aoiOrderId === String(order.orderId ?? ''))
            );
        })
        : aois;

    const fetchAois = async () => {
        if (!token || !isAuthenticated) {
            setError("Please login first!");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(properties.Port + properties.getAllAoi, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error(res.status === 401 ? 'Auth failed' : 'Fetch failed');

            const data = await res.json();
            if (!Array.isArray(data) || !data.length) {
                setError("No AOIs found");
                return;
            }

            const validAois = data.map((item) => {
                try {
                    const aoi = item.abj || item.aoi || item;
                    if (!aoi.type) return null;

                    const layer = L.geoJSON(aoi);
                    if (!layer.getBounds().isValid()) return null;

                    return {
                        ...aoi,
                        properties: {
                            ...aoi.properties,
                            poId: item.poId,
                            orderId: item.orderId || item.id,
                            clientName: item.clientName,
                            vendor: item.vendorNo,
                            sensors: item.sansor?.join(', ') || 'N/A',
                            priority: item.priority,
                            status: item.status,
                            progress: Math.round(item.percentageCompleted) || 0,
                            totalArea: Math.round(item.totalArea) || 0,
                            collectedArea: Math.round(item.totalArea - item.remainingArea) || 0,
                            createdDate: item.createdDate,
                            createdBy: item.createdBy
                        }
                    };
                } catch { return null; }
            }).filter(Boolean);

            setAois(validAois);
            if (validAois.length < data.length) {
                setError(`Loaded ${validAois.length}/${data.length} AOIs`);
            }
        } catch (err) {
            setError(err.message || "Failed to fetch AOIs");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token && isAuthenticated) fetchAois();
    }, [token, isAuthenticated]);

    const handleMapSearch = () => {
        if (!mapSearchQuery.trim() || !displayedAois.length || !mapInstance) return;

        const query = mapSearchQuery.toLowerCase();
        const foundAoi = displayedAois.find(aoi =>
            aoi.properties?.poId?.toLowerCase().includes(query) ||
            aoi.properties?.orderId?.toLowerCase().includes(query) ||
            aoi.properties?.clientName?.toLowerCase().includes(query)
        );

        if (foundAoi) {
            try {
                const bounds = L.geoJSON(foundAoi).getBounds();
                if (bounds.isValid()) {
                    mapInstance.fitBounds(bounds, { padding: [100, 100], maxZoom: 10 });
                    setSelectedAoi(foundAoi.properties);
                }
            } catch (err) {
                console.error('Search navigation error:', err);
            }
        }
    };

    const formatDate = (d) => {
        if (!d) return 'N/A';
        try {
            return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch {
            return 'Invalid';
        }
    };

    const getVendorLabel = (vendorId) => {
        if (vendorId === 'vendor-a') return 'Vendor A';
        if (vendorId === 'vendor-b') return 'Vendor B';
        if (vendorId === 'vendor-both') return 'Both Vendors';
        return 'Not Assigned';
    };

    return (
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl shadow-2xl border-2 border-blue-200 overflow-hidden">
            <div className="px-6 py-4 border-b-2 border-blue-200 flex items-center justify-between bg-gradient-to-r from-blue-100 to-purple-100">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                        <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">All Orders AOI Map - Dual Tile System</h2>
                        <p className="text-sm text-blue-700 font-semibold">
                            {loading ? 'Loading...' : `${displayedAois.length} of ${aois.length} AOIs displayed`}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="px-3 py-1.5 bg-white border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-xs font-semibold text-green-700">Offline</span>
                        </div>
                    </div>
                    <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                        <span className="text-xs font-semibold text-blue-700">🌍 Z:2-8</span>
                    </div>
                    <div className="px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-lg">
                        <span className="text-xs font-semibold text-orange-700">🇸🇦 Z:9-13</span>
                    </div>
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="p-2.5 bg-white hover:bg-gray-50 rounded-xl transition-all shadow-md hover:shadow-lg border-2 border-gray-200"
                    >
                        {expanded ? <Minimize2 className="w-5 h-5 text-gray-700" /> : <Maximize2 className="w-5 h-5 text-gray-700" />}
                    </button>
                </div>
            </div>

            {error && (
                <div className={`mx-6 mt-4 flex gap-3 p-4 rounded-xl ${error.includes('/')
                    ? 'bg-yellow-50 border-2 border-yellow-300'
                    : 'bg-red-50 border-2 border-red-300'}`}>
                    <AlertCircle className={`w-5 h-5 ${error.includes('/') ? 'text-yellow-600' : 'text-red-600'}`} />
                    <p className={`text-sm font-semibold ${error.includes('/') ? 'text-yellow-700' : 'text-red-700'}`}>{error}</p>
                </div>
            )}

            <div style={{ height: expanded ? "700px" : "500px" }} className="relative bg-white border-4 border-blue-100 rounded-xl overflow-hidden m-4 shadow-inner">
                {loading && (
                    <div className="absolute inset-0 bg-white/75 z-10 flex items-center justify-center backdrop-blur-sm">
                        <div className="text-center">
                            <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-3" />
                            <p className="text-blue-700 font-semibold">Loading AOIs...</p>
                        </div>
                    </div>
                )}

                {/* Map Search Box */}
                <div className="absolute top-4 left-4 z-[1000] w-80">
                    <div className="bg-white rounded-lg shadow-xl border-2 border-blue-200 overflow-hidden">
                        <div className="flex items-center p-2 gap-2">
                            <Search className="w-5 h-5 text-gray-400 ml-2" />
                            <input
                                type="text"
                                placeholder="Search by PO ID, Order ID, Client..."
                                value={mapSearchQuery}
                                onChange={(e) => setMapSearchQuery(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleMapSearch()}
                                className="flex-1 px-2 py-2 text-sm focus:outline-none"
                            />
                            <button
                                onClick={handleMapSearch}
                                disabled={!mapSearchQuery.trim()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
                            >
                                Search
                            </button>
                        </div>
                        <div className="px-3 py-2 bg-gradient-to-r from-green-50 to-blue-50 border-t border-gray-200">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <p className="text-xs font-semibold text-green-700">Dual Tile System Active</p>
                            </div>
                            <p className="text-xs text-gray-600">🌍 World: Z:2-8 | 🇸🇦 Saudi: Z:9-13</p>
                        </div>
                    </div>
                </div>

                {/* Selected AOI Details Box */}
                {selectedAoi && (
                    <div className="absolute top-4 right-4 bg-white rounded-xl shadow-2xl z-[1000] border-2 border-blue-400 p-5" style={{ minWidth: '350px', maxWidth: '400px' }}>
                        <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-blue-200">
                            <h3 className="font-bold text-lg text-gray-900">📋 Order Details</h3>
                            <button onClick={() => setSelectedAoi(null)} className="text-gray-400 hover:text-red-600 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                <p className="text-xs text-blue-600 font-bold mb-1 uppercase">PO ID</p>
                                <p className="text-base font-bold text-blue-900">{selectedAoi.poId || 'N/A'}</p>
                            </div>
                            <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                                <p className="text-xs text-indigo-600 font-bold mb-1 uppercase">Order ID</p>
                                <p className="text-base font-bold text-indigo-900">{selectedAoi.orderId || 'N/A'}</p>
                            </div>
                            <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                                <p className="text-xs text-purple-600 font-bold mb-1 uppercase">Client Name</p>
                                <p className="text-base font-bold text-purple-900">{selectedAoi.clientName || 'N/A'}</p>
                            </div>
                            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                <p className="text-xs text-green-600 font-bold mb-1 uppercase">Vendor</p>
                                <p className="text-base font-bold text-green-900">{getVendorLabel(selectedAoi.vendor)}</p>
                            </div>
                            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                                <p className="text-xs text-yellow-600 font-bold mb-1 uppercase">Sensors</p>
                                <p className="text-sm font-semibold text-yellow-900">{selectedAoi.sensors || 'N/A'}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                                    <p className="text-xs text-orange-600 font-bold mb-1 uppercase">Priority</p>
                                    <p className="text-base font-bold text-orange-900">{selectedAoi.priority || 'N/A'}</p>
                                </div>
                                <div className="bg-pink-50 p-3 rounded-lg border border-pink-200">
                                    <p className="text-xs text-pink-600 font-bold mb-1 uppercase">Status</p>
                                    <p className="text-base font-bold text-pink-900">{selectedAoi.status || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="bg-teal-50 p-3 rounded-lg border border-teal-200">
                                <p className="text-xs text-teal-600 font-bold mb-1 uppercase">Progress</p>
                                <div className="flex items-center gap-3">
                                    <p className="text-xl font-bold text-teal-900">{selectedAoi.progress || 0}%</p>
                                    <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-teal-500 to-green-500 transition-all"
                                            style={{ width: `${selectedAoi.progress || 0}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-cyan-50 p-3 rounded-lg border border-cyan-200">
                                    <p className="text-xs text-cyan-600 font-bold mb-1 uppercase">Total Area</p>
                                    <p className="text-base font-bold text-cyan-900">{selectedAoi.totalArea || 0} km²</p>
                                </div>
                                <div className="bg-lime-50 p-3 rounded-lg border border-lime-200">
                                    <p className="text-xs text-lime-600 font-bold mb-1 uppercase">Collected</p>
                                    <p className="text-base font-bold text-lime-900">{selectedAoi.collectedArea || 0} km²</p>
                                </div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <p className="text-xs text-gray-600 font-bold mb-1 uppercase">Created Date</p>
                                <p className="text-sm font-bold text-gray-900">{formatDate(selectedAoi.createdDate)}</p>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                <p className="text-xs text-slate-600 font-bold mb-1 uppercase">Created By</p>
                                <p className="text-sm font-bold text-slate-900">{selectedAoi.createdBy || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                )}

                <MapContainer
                    center={[20.5937, 78.9629]}
                    zoom={5}
                    style={{ height: "100%", width: "100%", backgroundColor: '#e8f5e9' }}
                    maxZoom={13}
                    minZoom={2}
                >
                    <DualTileLayer worldMaxZoom={8} saudiMaxZoom={13} />
                    <MapHandler allAois={displayedAois} onMapReady={setMapInstance} />

                    {displayedAois.map((aoi, i) => (
                        <GeoJSON
                            key={`aoi-${i}-${aoi.properties?.poId}`}
                            data={aoi}
                            style={{
                                color: `hsl(${(i * 360) / (displayedAois.length || 1)}, 70%, 50%)`,
                                weight: 3,
                                fillOpacity: 0.3,
                                fillColor: `hsl(${(i * 360) / (displayedAois.length || 1)}, 70%, 60%)`
                            }}
                            eventHandlers={{
                                click: () => setSelectedAoi(aoi.properties)
                            }}
                        >
                            <Popup>
                                <div className="p-3" style={{ minWidth: '250px' }}>
                                    <h3 className="font-bold text-sm mb-3 pb-2 border-b-2 border-blue-300 text-blue-900">Order Details</h3>
                                    <div className="space-y-2">
                                        <div>
                                            <p className="text-xs text-gray-500 font-semibold">PO ID</p>
                                            <p className="text-sm font-bold text-blue-600">{aoi.properties?.poId || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-semibold">Client Name</p>
                                            <p className="text-sm font-bold text-gray-800">{aoi.properties?.clientName || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-semibold">Status</p>
                                            <p className="text-sm font-bold text-green-700">{aoi.properties?.status || 'N/A'}</p>
                                        </div>
                                        <button
                                            onClick={() => setSelectedAoi(aoi.properties)}
                                            className="w-full mt-2 px-3 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700"
                                        >
                                            View Full Details
                                        </button>
                                    </div>
                                </div>
                            </Popup>
                        </GeoJSON>
                    ))}
                </MapContainer>

                {!loading && !displayedAois.length && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
                        <div className="text-center">
                            <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-600 font-bold text-lg">No AOIs Available</p>
                            <p className="text-gray-500 text-sm mt-2">Create orders to see AOIs on the map</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const FilterPanel = ({
    filters,
    setFilters,
    sensorOptions,
    orderTypeOptions,
    organizationOptions,
    orgTypeOptions,
    dateRangeError,
    showFilters,
    setShowFilters,
    onApply,
    onClear,
    selectedVendor
}) => {
    // Calculate available sensors based on selected vendors
    const availableSensors = filters.vendor.length === 0
        ? sensorOptions
        : filters.vendor.length === 1
            ? (VENDOR_SENSORS[filters.vendor[0]] || sensorOptions)
            : filters.vendor.flatMap(v => VENDOR_SENSORS[v] || []);

    // Prepare options for dropdowns
    const statusOptions = ['CREATED', 'PENDING', 'CANCELLED', 'COMPLETED', 'PARTIALLY_COMPLETED'];
    const vendorOptions = [
        'vendor-a',
        'vendor-b',
        'vendor-both'
    ];
    const vendorLabels = {
        'vendor-a': 'Vendor A',
        'vendor-b': 'Vendor B',
        'vendor-both': 'Both Vendors A & B'
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl p-3 border-2 border-gray-200">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-gray-900">Search & Filter Orders</h3>
                <div className="group relative">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        title={showFilters ? 'Hide Filters' : 'Show Filters'}
                        className="p-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 flex items-center justify-center transition-all shadow-lg hover:shadow-xl"
                    >
                        <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} />
                    </button>
                    <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        {showFilters ? 'Hide Filters' : 'Show Filters'}
                    </span>
                </div>
            </div>

            {showFilters && (
                <div className="space-y-3 pt-3 border-t-2 border-gray-200">
                    {/* Search Input */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by Order ID, PO ID, Client, or Vendor..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            className="w-full pl-14 pr-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-base font-medium"
                        />
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-600 mb-1">From Date</span>
                            <input
                                type="date"
                                value={filters.fromDate}
                                onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                                className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 cursor-pointer font-semibold bg-white hover:border-gray-400 transition-all text-base"
                            />
                        </div>

                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-600 mb-1">To Date</span>
                            <input
                                type="date"
                                value={filters.toDate}
                                onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                                min={filters.fromDate || undefined}
                                className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 cursor-pointer font-semibold bg-white hover:border-gray-400 transition-all text-base"
                            />
                        </div>
                    </div>

                    {/* Multi-Select Filters */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        <MultiSelectDropdown
                            label="Status"
                            options={statusOptions}
                            selected={filters.status}
                            onChange={(newValue) => setFilters({ ...filters, status: newValue })}
                            placeholder="All Statuses"
                        />

                        <MultiSelectDropdown
                            label="Vendor"
                            options={vendorOptions}
                            selected={filters.vendor}
                            onChange={(newValue) => {
                                setFilters({
                                    ...filters,
                                    vendor: newValue,
                                    sensor: [] // Clear sensors when vendor changes
                                });
                            }}
                            placeholder="All Vendors"
                        />

                        <MultiSelectDropdown
                            label="Sensor"
                            options={availableSensors}
                            selected={filters.sensor}
                            onChange={(newValue) => setFilters({ ...filters, sensor: newValue })}
                            placeholder="All Sensors"
                            disabled={availableSensors.length === 0}
                        />

                        <MultiSelectDropdown
                            label="Priority"
                            options={PRIORITIES}
                            selected={filters.priority}
                            onChange={(newValue) => setFilters({ ...filters, priority: newValue })}
                            placeholder="All Priorities"
                        />

                        <MultiSelectDropdown
                            label="Order Type"
                            options={orderTypeOptions}
                            selected={filters.orderType}
                            onChange={(newValue) => setFilters({ ...filters, orderType: newValue })}
                            placeholder="All Order Types"
                        />

                        <MultiSelectDropdown
                            label="Organization"
                            options={organizationOptions}
                            selected={filters.organization}
                            onChange={(newValue) => setFilters({ ...filters, organization: newValue })}
                            placeholder="All Organizations"
                        />

                        <MultiSelectDropdown
                            label="Org Type"
                            options={orgTypeOptions}
                            selected={filters.organizationType}
                            onChange={(newValue) => setFilters({ ...filters, organizationType: newValue })}
                            placeholder="All Org Types"
                        />
                    </div>

                    {/* Date Range Error */}
                    {dateRangeError && (
                        <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
                            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-600" />
                            <p className="text-sm text-red-700 font-semibold">{dateRangeError}</p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 pt-4 border-t-2 border-gray-200">
                        <button
                            onClick={onApply}
                            disabled={!!dateRangeError}
                            className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 flex items-center gap-2 transition-all shadow-lg hover:shadow-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Search className="w-5 h-5" />
                            Apply Filters
                        </button>

                        <button
                            onClick={onClear}
                            className="px-6 py-3 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 border-2 border-red-200 transition-all shadow-md hover:shadow-lg font-semibold flex items-center gap-2"
                        >
                            <X className="w-5 h-5" />
                            Clear All Filters
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// Pagination Component
const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, startIndex, endIndex }) => (
    <div className="px-6 py-4 bg-gray-50 border-t-2 border-gray-200 flex items-center justify-between">
        <div className="text-sm text-gray-700 font-semibold">
            Showing <span className="font-bold text-blue-700">{startIndex + 1}</span> to{' '}
            <span className="font-bold text-blue-700">{Math.min(endIndex, totalItems)}</span> of{' '}
            <span className="font-bold text-blue-700">{totalItems}</span> orders
        </div>
        <div className="flex items-center gap-2">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>

            {[...Array(totalPages)].map((_, index) => {
                const pageNumber = index + 1;
                if (
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                ) {
                    return (
                        <button
                            key={pageNumber}
                            onClick={() => onPageChange(pageNumber)}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all ${currentPage === pageNumber
                                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                                : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            {pageNumber}
                        </button>
                    );
                } else if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                    return <span key={pageNumber} className="px-2 text-gray-500">...</span>;
                }
                return null;
            })}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
                <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
        </div>
    </div>
);

// Main Component
const OrderList = ({ history, defaultHiddenColumns = [], showHeader = true, showFilterPanel = true }) => {
    const { token, isAuthenticated } = useAuth();
    const [orders, setOrders] = useState([]);
    const [archivedOrders, setArchivedOrders] = useState([]);
    const [showArchived, setShowArchived] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sensorOptions, setSensorOptions] = useState([]);
    const [orderTypeOptions, setOrderTypeOptions] = useState([]);
    const [organizationOptions, setOrganizationOptions] = useState([]);
    const [orgTypeOptions, setOrgTypeOptions] = useState([]);
    const [showFilters, setShowFilters] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hiddenColumns, setHiddenColumns] = useState(new Set(defaultHiddenColumns));
    const [showColumnDropdown, setShowColumnDropdown] = useState(false);
    const ordersPerPage = 10;
    const [showCoveredArea, setShowCoveredArea] = useState(false);
    const [showUncoveredArea, setShowUncoveredArea] = useState(false);
    const [showTotalPrice, setShowTotalPrice] = useState(false);

    // Refs for scrollbar synchronization
    const topScrollRef = useRef(null);
    const tableScrollRef = useRef(null);
    const tableRef = useRef(null);

    // NEW CODE:
    const [tempFilters, setTempFilters] = useState({
        search: '',
        status: [],           // Changed to array
        vendor: [],           // Changed to array
        sensor: [],           // Changed to array
        priority: [],         // Changed to array
        organization: [],     // Changed to array
        organizationType: [], // Changed to array
        orderType: [],        // Changed to array
        fromDate: '',
        toDate: ''
    });

    const [appliedFilters, setAppliedFilters] = useState(tempFilters);
    const [dateRangeError, setDateRangeError] = useState('');

    const transformOrder = (o) => {
        console.log('Order data:', o);
        return ({
            id: o.id,
            orderId: (o.orderId ?? o.id)?.toString(),
            poId: (o.poId ?? '')?.toString(),
            client: (o.clientName ?? '')?.toString(),
            organization: o.organization || o.Organisation || 'N/A',
            organizationType: o.organizationType || o.organization_type || o.organisationType || 'N/A',
            vendor: o.vendorNo ?
                (o.vendorNo === 'vendor-a' ? 'Vendor A' :
                    o.vendorNo === 'vendor-b' ? 'Vendor B' :
                        o.vendorNo === 'vendor-both' ? 'Both Vendors A & B' :
                            'Not Assigned') : 'Not Assigned',
            vendorId: o.vendorNo,
            sensors: o.sansor?.join(', ') || 'Not Selected',
            sensorList: o.sansor || [],
            priority: o.priority,
            price: o.price ?? 0,
            status: o.status,
            statusColor: STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-700 border border-gray-200',
            orderType: o.orderType || 'Standard',
            progress: Math.round(o.percentageCompleted) || 0,
            area: {
                total: Math.round(o.totalArea) || 0,
                collected: Math.max(0, Math.min(Math.round(o.totalArea - o.remainingArea), Math.round(o.totalArea))),
                unfulfilled: Math.round(o.remainingArea) || 0
            },
            createdDate: o.createdDate,
            lastModifiedDate: o.lastModifiedDate,
            createdBy: o.createdBy,
            lastModifiedBy: o.lastModifiedBy,
            contactPerson: o.contactPerson || null,
            contactNumber: o.contactNumber || null,
            email: o.email || null,
            createdTimestamp: o.createdDate ? new Date(o.createdDate).getTime() : 0,
            geometry: o.abj || o.aoi || null  // ADD THIS LINE
        });
    };

    const fetchOrders = async () => {
        if (!isAuthenticated || !token) {
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
            const transformed = data.map(transformOrder).sort((a, b) => b.createdTimestamp - a.createdTimestamp);

            const storedArchived = JSON.parse(localStorage.getItem('archivedOrders') || '[]');
            const archivedIds = new Set(storedArchived.map(o => o.id));

            const active = transformed.filter(o => !archivedIds.has(o.id));
            const archived = transformed.filter(o => archivedIds.has(o.id));

            setOrders(active);
            setArchivedOrders(archived);
            setSensorOptions(Array.from(new Set(transformed.flatMap(o => o.sensorList || []))).filter(Boolean));
            setOrderTypeOptions(Array.from(new Set(transformed.map(o => o.orderType).filter(Boolean))).sort());
            setOrganizationOptions(Array.from(new Set(transformed.map(o => o.organization).filter(x => x && x !== 'N/A'))).sort());
            setOrgTypeOptions(Array.from(new Set(transformed.map(o => o.organizationType).filter(x => x && x !== 'N/A'))).sort());
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [token, isAuthenticated]);

    useEffect(() => {
        const top = topScrollRef.current;
        const scroller = tableScrollRef.current;
        const table = tableRef.current;

        if (!top || !scroller || !table) return;

        const phantom = top.querySelector('.scroll-phantom');

        // Make top scrollbar width match table width
        const syncWidth = () => {
            try {
                phantom.style.width = `${table.scrollWidth}px`;
            } catch (e) { }
        };

        syncWidth();

        let lock = false;

        const topToBottom = () => {
            if (lock) return;
            lock = true;
            scroller.scrollLeft = top.scrollLeft;
            requestAnimationFrame(() => (lock = false));
        };

        const bottomToTop = () => {
            if (lock) return;
            lock = true;
            top.scrollLeft = scroller.scrollLeft;
            requestAnimationFrame(() => (lock = false));
        };

        top.addEventListener('scroll', topToBottom, { passive: true });
        scroller.addEventListener('scroll', bottomToTop, { passive: true });

        const ro = new ResizeObserver(syncWidth);
        ro.observe(table);

        return () => {
            top.removeEventListener('scroll', topToBottom);
            scroller.removeEventListener('scroll', bottomToTop);
            ro.disconnect();
        };
    }, [orders, archivedOrders, showArchived, currentPage]);

    useEffect(() => {
        if (!tempFilters.fromDate || !tempFilters.toDate) {
            setDateRangeError('');
            return;
        }

        try {
            const f = new Date(tempFilters.fromDate);
            const t = new Date(tempFilters.toDate);
            if (isNaN(f.getTime()) || isNaN(t.getTime())) {
                setDateRangeError('Invalid date format');
                return;
            }
            setDateRangeError(f > t ? '"From" date must be before or equal to "To" date' : '');
        } catch {
            setDateRangeError('Invalid date range');
        }
    }, [tempFilters.fromDate, tempFilters.toDate]);

    const applyFilters = () => {
        setAppliedFilters(tempFilters);
        setCurrentPage(1);
        setShowFilters(false);
    };

    const clearFilters = () => {
        const resetFilters = {
            search: '',
            status: [],           // Changed to array
            vendor: [],           // Changed to array
            sensor: [],           // Changed to array
            priority: [],         // Changed to array
            orderType: [],        // Changed to array
            organization: [],     // Changed to array
            organizationType: [], // Changed to array
            fromDate: '',
            toDate: ''
        };
        setTempFilters(resetFilters);
        setAppliedFilters(resetFilters);
        setCurrentPage(1);
    };

    const handleArchive = (order) => {
        const updatedOrders = orders.filter(o => o.id !== order.id);
        const updatedArchived = [...archivedOrders, { ...order, archivedAt: new Date().toISOString() }];

        setOrders(updatedOrders);
        setArchivedOrders(updatedArchived);
        localStorage.setItem('archivedOrders', JSON.stringify(updatedArchived));
    };

    const handleUnarchive = (order) => {
        const updatedArchived = archivedOrders.filter(o => o.id !== order.id);
        const { archivedAt, ...orderWithoutArchiveDate } = order;
        const updatedOrders = [orderWithoutArchiveDate, ...orders].sort((a, b) => b.createdTimestamp - a.createdTimestamp);

        setArchivedOrders(updatedArchived);
        setOrders(updatedOrders);
        localStorage.setItem('archivedOrders', JSON.stringify(updatedArchived));
    };

    const currentOrderList = showArchived ? archivedOrders : orders;

    const filtered = currentOrderList.filter(o => {
        const s = appliedFilters.search.toLowerCase();
        const matchSearch = !s || [o.orderId, o.poId, o.client, o.vendor].some(field =>
            field?.toLowerCase().includes(s)
        ) || o.sensorList.some(sensor => sensor.toLowerCase().includes(s));

        // Multi-select aware matching
        const matchStatus = appliedFilters.status.length === 0 ||
            appliedFilters.status.some(status => o.status?.toLowerCase() === status.toLowerCase());

        const matchVendor = appliedFilters.vendor.length === 0 ||
            appliedFilters.vendor.includes(o.vendorId);

        const matchPriority = appliedFilters.priority.length === 0 ||
            appliedFilters.priority.some(priority => o.priority?.toLowerCase() === priority.toLowerCase());

        const matchOrderType = appliedFilters.orderType.length === 0 ||
            appliedFilters.orderType.includes(o.orderType);

        const matchOrganization = appliedFilters.organization.length === 0 ||
            (o.organization && appliedFilters.organization.includes(o.organization));

        const matchOrgType = appliedFilters.organizationType.length === 0 ||
            (o.organizationType && appliedFilters.organizationType.includes(o.organizationType));

        let matchSensor = true;
        if (appliedFilters.sensor.length > 0) {
            matchSensor = o.sensorList.some(s =>
                appliedFilters.sensor.some(selected => s.toLowerCase() === selected.toLowerCase())
            );
        }

        // Vendor-sensor constraint
        if (appliedFilters.vendor.length > 0 && !appliedFilters.vendor.includes(o.vendorId)) {
            matchSensor = false;
        }

        // Date filtering remains the same
        let matchDate = true;
        if (!dateRangeError && (appliedFilters.fromDate || appliedFilters.toDate)) {
            const createdTime = o.createdDate ? Date.parse(o.createdDate) : null;
            const fromTime = appliedFilters.fromDate ? new Date(appliedFilters.fromDate).setHours(0, 0, 0, 0) : null;
            const toTime = appliedFilters.toDate ? new Date(appliedFilters.toDate).setHours(23, 59, 59, 999) : null;
            matchDate = createdTime && (!fromTime || createdTime >= fromTime) && (!toTime || createdTime <= toTime);
        }

        return matchSearch && matchStatus && matchVendor && matchPriority && matchSensor &&
            matchDate && matchOrderType && matchOrganization && matchOrgType;
    });

    const indexOfLastOrder = currentPage * ordersPerPage;
    const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
    const currentOrders = filtered.slice(indexOfFirstOrder, indexOfLastOrder);
    const totalPages = Math.ceil(filtered.length / ordersPerPage);

    const totals = React.useMemo(() => {
        const totalCovered = filtered.reduce((s, o) => s + Math.max(0, Math.min(o.area?.collected || 0, o.area?.total || 0)), 0);
        const totalUncovered = filtered.reduce((s, o) => s + Math.max(0, o.area?.unfulfilled || 0), 0);
        const totalPrice = filtered.reduce((s, o) => s + (Number(o.price) || 0), 0);
        return { totalCovered, totalUncovered, totalPrice };
    }, [filtered]);

    const filtersApplied = appliedFilters.search.trim() !== '' ||
        appliedFilters.status.length > 0 ||
        appliedFilters.vendor.length > 0 ||
        appliedFilters.sensor.length > 0 ||
        appliedFilters.priority.length > 0 ||
        appliedFilters.orderType.length > 0 ||
        appliedFilters.organization.length > 0 ||
        appliedFilters.organizationType.length > 0 ||
        appliedFilters.fromDate ||
        appliedFilters.toDate;

    const formatDate = (d) => {
        if (!d) return 'N/A';
        try {
            return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch {
            return 'Invalid';
        }
    };

    const formatStatusLabel = (status) => {
        if (status === 'PARTIALLY_COMPLETED') return 'PARTIALLY COMP.';
        return status?.replace('_', ' ');
    };

    const handleExportCSV = () => {
        try {
            if (!filtered?.length) return;

            const escapeCSV = (val) => {
                if (val == null) return '';
                let s = String(val).replace(/"/g, '""');
                return s.search(/("|,|\n)/) >= 0 ? `"${s}"` : s;
            };

            // Map of display column name => data key
            const displayMap = {
                'Order ID': 'orderId',
                'PO ID': 'poId',
                'Client': 'client',
                'Organization': 'organization',
                'Org Type': 'organizationType',
                'Vendor': 'vendor',
                'Sensors': 'sensors',
                'Priority': 'priority',
                'Price': 'price',
                'Status': 'status',
                'Order Type': 'orderType',
                'Progress': 'progress',
                'Created': 'createdDate',
                'Created By': 'createdBy',
                'Modified': 'lastModifiedDate',
                'Modified By': 'lastModifiedBy'
            };

            // Columns available in the Columns dropdown (order matters)
            const displayOrder = ['Order ID', 'PO ID', 'Client', 'Organization', 'Org Type', 'Vendor', 'Sensors', 'Priority', 'Price', 'Status', 'Order Type', 'Progress', 'Created', 'Created By', 'Modified', 'Modified By'];

            // Build headers & keys from visible columns
            const headers = [];
            const keys = [];
            displayOrder.forEach(displayName => {
                if (isColumnVisible(displayName)) {
                    const key = displayMap[displayName];
                    if (key) {
                        headers.push(displayName);
                        keys.push(key);
                    }
                }
            });

            // If no visible data columns, fallback to a minimal set
            if (!keys.length) {
                headers.push('Order ID');
                keys.push('orderId');
            }

            const rows = filtered.map(o => keys.map(k => {
                if (k === 'sensors') return escapeCSV(o.sensors || (o.sensorList || []).join(', '));
                if (k === 'progress') return escapeCSV(o.progress);
                if (k === 'price') return escapeCSV(Number(o.price || 0));
                if (k === 'createdDate' || k === 'lastModifiedDate') return escapeCSV(o[k] ? new Date(o[k]).toISOString() : '');
                return escapeCSV(k.startsWith('area_') ? o.area?.[k.split('_')[1]] : o[k]);
            }).join(','));

            const csvContent = [headers.join(','), ...rows].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `orders_${showArchived ? 'archived_' : ''}${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export CSV failed:', err);
        }
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Helper function to check if column should be visible
    const isColumnVisible = (colName) => !hiddenColumns.has(colName);

    if (loading && !orders.length && !archivedOrders.length) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
                <div className="text-center">
                    <RefreshCw className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-700 font-bold text-xl">Loading orders...</p>
                </div>
            </div>
        );
    }

    if (error && !orders.length && !archivedOrders.length) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                    <p className="text-red-700 font-bold text-xl mb-2">Failed to Load</p>
                    <p className="text-gray-600 text-sm mb-6">{error}</p>
                    <button onClick={fetchOrders} className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg font-semibold">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const handleExportShapefile = async () => {
        try {
            if (!filtered || filtered.length === 0) {
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
            console.log("AOI Data:", aoiData);

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

            console.log("Geometry Map:", geometryMap);

            // Build features array
            const features = [];
            filtered.forEach(o => {
                const poIdStr = String(o.poId);
                const orderIdStr = String(o.orderId);

                let geomSource = geometryMap[poIdStr] || geometryMap[orderIdStr];
                let geometry =
                    geomSource?.type === "Feature" ? geomSource.geometry : geomSource;

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
                        organization: String(o.organization || '').substring(0, 50),
                        org_type: String(o.organizationType || '').substring(0, 30),
                        vendor: String(o.vendor || '').substring(0, 30),
                        sensors: String(o.sensors || '').substring(0, 100),
                        priority: String(o.priority || '').substring(0, 20),
                        price: Number(o.price || 0),
                        status: String(o.status || '').substring(0, 30),
                        progress: Number(o.progress || 0),
                        area_total: Number(o.area.total || 0),
                        area_coll: Number(o.area.collected || 0)
                    }
                };

                features.push(feature);
            });

            console.log("Features created:", features.length);

            if (!features.length) {
                alert(`No geometries found for the ${filtered.length} filtered orders.`);
                return;
            }

            // Convert to Shapefile using shp-write
            const geojson = { type: "FeatureCollection", features };
            shpwrite.download(geojson, {
                folder: "orders",
                types: { point: "orders" }
            });

            alert(`✅ Successfully exported ${features.length} orders as Shapefile!`);

        } catch (err) {
            console.error("Export failed:", err);
            alert("Failed to export: " + err.message);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
            <div className="max-w-[1600px] mx-auto space-y-6">
                {/* Header */}
                {showHeader && (
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-4xl font-bold text-gray-900">Order Management</h2>
                            <p className="text-gray-600 mt-2 text-lg font-medium">
                                {orders.length} active orders • {archivedOrders.length} archived
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="group relative">
                                <button
                                    onClick={() => {
                                        setShowArchived(!showArchived);
                                        setCurrentPage(1);
                                    }}
                                    title={showArchived ? 'View Active Orders' : `Archived Orders (${archivedOrders.length})`}
                                    className={`p-2.5 rounded-xl flex items-center justify-center transition-all shadow-lg hover:shadow-xl ${showArchived
                                        ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700'
                                        : 'bg-white border-2 border-purple-400 text-purple-700 hover:bg-purple-50'
                                        }`}
                                >
                                    {showArchived ? <ArchiveRestore className="w-5 h-5" /> : <Archive className="w-5 h-5" />}
                                </button>
                                <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                    {showArchived ? 'View Active Orders' : `Archived Orders (${archivedOrders.length})`}
                                </span>
                            </div>
<div className="group relative">
    <button
        onClick={fetchOrders}
        disabled={loading}
        className="p-2.5 bg-white border-2 border-blue-400 rounded-xl hover:bg-blue-50 hover:border-blue-500 flex items-center justify-center disabled:opacity-50 transition-all shadow-lg hover:shadow-xl text-blue-700"
        title="Refresh"
    >
        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
    </button>
    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        Refresh
    </span>
</div>

<div className="group relative">
    <button
        onClick={handleExportCSV}
        disabled={loading || !filtered?.length}
        className="p-2.5 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 flex items-center justify-center disabled:opacity-50 transition-all shadow-sm hover:shadow-md text-gray-700"
        title="Export CSV"
    >
        <FileText className="w-5 h-5" />
    </button>
    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        Export CSV
    </span>
</div>

<div className="group relative">
    <button
        onClick={handleExportShapefile}
        disabled={loading || !filtered?.length}
        className="p-2.5 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 flex items-center justify-center disabled:opacity-50 transition-all shadow-sm hover:shadow-md text-gray-700"
        title="Export Shapefile"
    >
        <Download className="w-5 h-5" />
    </button>
    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        Export Shapefile
    </span>
</div>
                        </div>
                    </div>
                )}

                {/* Filter Panel */}
                {showFilterPanel && (
                    <FilterPanel
                        filters={tempFilters}
                        setFilters={setTempFilters}
                        sensorOptions={sensorOptions}
                        orderTypeOptions={orderTypeOptions}
                        organizationOptions={organizationOptions}
                        orgTypeOptions={orgTypeOptions}
                        dateRangeError={dateRangeError}
                        showFilters={showFilters}
                        setShowFilters={setShowFilters}
                        onApply={applyFilters}
                        onClear={clearFilters}
                        selectedVendor={tempFilters.vendor}
                    />
                )}

                {/* Active Filters Display + Column Visibility */}
                {filtersApplied && (
                    <div className="bg-white rounded-2xl shadow-xl p-4 border-2 border-gray-200 flex items-center justify-between">
                        <p className="text-base text-gray-700 font-semibold">
                            Showing <span className="font-bold text-blue-700">{filtered.length}</span> of <span className="font-bold text-blue-700">{currentOrderList.length}</span> {showArchived ? 'archived ' : ''}orders
                        </p>
                        <div className="relative">
                            <button
                                onClick={() => setShowColumnDropdown(!showColumnDropdown)}
                                className="px-4 py-2 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 font-semibold text-gray-700"
                            >
                                <Eye className="w-4 h-4" />
                                Columns
                            </button>
                            {showColumnDropdown && (
                                <div className="absolute right-0 mt-2 w-64 bg-white border-2 border-gray-300 rounded-lg shadow-2xl z-50 max-h-96 overflow-y-auto">
                                    <div className="p-3 border-b-2 border-gray-200 font-semibold text-gray-900">
                                        Show/Hide Columns
                                    </div>
                                    {['Archive', 'Update', 'Order ID', 'PO ID', 'Client', 'Organization', 'Org Type', 'Vendor', 'Sensors', 'Priority', 'Price', 'Status', 'Order Type', 'Progress', 'Created', 'Created By', 'Modified', 'Modified By', 'View'].map(col => (
                                        <label key={col} className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={!hiddenColumns.has(col)}
                                                onChange={(e) => {
                                                    const newHidden = new Set(hiddenColumns);
                                                    if (e.target.checked) {
                                                        newHidden.delete(col);
                                                    } else {
                                                        newHidden.add(col);
                                                    }
                                                    setHiddenColumns(newHidden);
                                                }}
                                                className="w-4 h-4 cursor-pointer"
                                            />
                                            <span className="text-sm text-gray-700">{col}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-xl p-4 border-2 border-gray-200 flex flex-wrap gap-6 items-center">

                    {/* Covered Area */}
                    <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <input
                                type="checkbox"
                                checked={showCoveredArea}
                                onChange={() => setShowCoveredArea(v => !v)}
                            />
                            Display Total Covered Area
                        </label>

                        {showCoveredArea && (
                            <span className="px-3 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 font-bold text-sm">
                                {totals.totalCovered.toLocaleString()} km²
                            </span>
                        )}
                    </div>

                    {/* Uncovered Area */}
                    <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <input
                                type="checkbox"
                                checked={showUncoveredArea}
                                onChange={() => setShowUncoveredArea(v => !v)}
                            />
                            Display Total Uncovered Area
                        </label>

                        {showUncoveredArea && (
                            <span className="px-3 py-1 rounded-lg bg-orange-50 border border-orange-200 text-orange-700 font-bold text-sm">
                                {totals.totalUncovered.toLocaleString()} km²
                            </span>
                        )}
                    </div>

                    {/* Total Price */}
                    <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <input
                                type="checkbox"
                                checked={showTotalPrice}
                                onChange={() => setShowTotalPrice(v => !v)}
                            />
                            Display Total Price
                        </label>

                        {showTotalPrice && (
                            <span className="px-3 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 font-bold text-sm">
                                {totals.totalPrice.toLocaleString()} ﷼
                            </span>
                        )}
                    </div>

                </div>


                {/* Orders Table with WORKING Top Scrollbar */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-gray-200">
                    {/* Top Scrollbar - FUNCTIONAL */}
                    <div
                        ref={topScrollRef}
                        className="overflow-x-scroll overflow-y-hidden bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b-2 border-blue-200"
                        style={{ height: '18px' }}
                    >
                        <div className="scroll-phantom" style={{ height: '1px', width: '2000px' }}></div>
                    </div>

                    <div className="overflow-x-auto">
                        <div ref={tableScrollRef} className="max-h-[600px] overflow-x-auto overflow-y-auto">
                            <table ref={tableRef} className="w-full border-collapse" style={{ minWidth: '1800px' }}>
                                <thead className="sticky top-0 z-10">
                                    <tr className="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600">
                                        {isColumnVisible('Archive') && <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-white border-r border-white/20">
                                            {showArchived ? 'Unarchive' : 'Archive'}
                                        </th>}
                                        {isColumnVisible('Update') && <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-white border-r border-white/20">Update</th>}
                                        {isColumnVisible('Order ID') && <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-white border-r border-white/20">Order ID</th>}
                                        {isColumnVisible('PO ID') && <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-white border-r border-white/20">PO ID</th>}
                                        {isColumnVisible('Client') && <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-white border-r border-white/20">Client</th>}
                                        {isColumnVisible('Organization') && <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-white border-r border-white/20">Organization</th>}
                                        {isColumnVisible('Org Type') && <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-white border-r border-white/20">Org Type</th>}
                                        {isColumnVisible('Vendor') && <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-white border-r border-white/20">Vendor</th>}
                                        {isColumnVisible('Sensors') && <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-white border-r border-white/20">Sensors</th>}
                                        {isColumnVisible('Priority') && <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-white border-r border-white/20">Priority</th>}
                                        {isColumnVisible('Price') && <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-white border-r border-white/20">Price</th>}
                                        {isColumnVisible('Status') && <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-white border-r border-white/20">Status</th>}
                                        {isColumnVisible('Order Type') && <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-white border-r border-white/20">Order Type</th>}
                                        {isColumnVisible('Progress') && <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-white border-r border-white/20">Progress</th>}
                                        {isColumnVisible('Created') && <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-white border-r border-white/20">Created</th>}
                                        {isColumnVisible('Created By') && <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-white border-r border-white/20">Created By</th>}
                                        {isColumnVisible('Modified') && <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-white border-r border-white/20">Modified</th>}
                                        {isColumnVisible('Modified By') && <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-white border-r border-white/20">Modified By</th>}
                                        {isColumnVisible('Contact Person') && <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-white border-r border-white/20">Contact Person</th>}
                                        {isColumnVisible('Contact Number') && <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-white border-r border-white/20">Contact Number</th>}
                                        {isColumnVisible('Email') && <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-white border-r border-white/20">Email</th>}
                                        {isColumnVisible('View') && <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-white">View</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y-2 divide-gray-200 bg-white">
                                    {currentOrders.map((o) => (
                                        <tr key={o.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200">
                                            {isColumnVisible('Archive') && <td className="px-4 py-4 whitespace-nowrap border-r border-gray-200">
                                                <button
                                                    onClick={() => showArchived ? handleUnarchive(o) : handleArchive(o)}
                                                    className={`p-2.5 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 transform ${showArchived
                                                        ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
                                                        : 'bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 text-white'
                                                        }`}
                                                    title={showArchived ? 'Unarchive this order' : 'Archive this order'}
                                                >
                                                    {showArchived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                                                </button>
                                            </td>}
                                            {isColumnVisible('Update') && <td className="px-4 py-4 whitespace-nowrap border-r border-gray-200">
                                                <button
                                                    onClick={() => history.push('/order/update', { orderData: o })}
                                                    className="p-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 transform"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            </td>}
                                            {isColumnVisible('Order ID') && <td className="px-4 py-4 whitespace-nowrap border-r border-gray-200">
                                                <span className="text-sm font-bold text-blue-700 bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200">
                                                    {o.orderId}
                                                </span>
                                            </td>}
                                            {isColumnVisible('PO ID') && <td className="px-4 py-4 whitespace-nowrap border-r border-gray-200">
                                                <span className="text-sm text-indigo-700 font-semibold bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">
                                                    {o.poId}
                                                </span>
                                            </td>}
                                            {isColumnVisible('Client') && <td className="px-4 py-4 border-r border-gray-200">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 bg-gray-100 rounded-full">
                                                        <User className="w-4 h-4 text-gray-600" />
                                                    </div>
                                                    <span className="text-sm font-semibold text-gray-800">{o.client}</span>
                                                </div>
                                            </td>}
                                            {isColumnVisible('Organization') && <td className="px-4 py-4 border-r border-gray-200">
                                                <span className="text-sm font-semibold text-gray-800 bg-gray-100 px-3 py-1 rounded-lg">
                                                    {o.organization}
                                                </span>
                                            </td>}
                                            {isColumnVisible('Org Type') && <td className="px-4 py-4 whitespace-nowrap border-r border-gray-200">
                                                <span className="px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm bg-teal-100 text-teal-700 border border-teal-200">
                                                    {o.organizationType}
                                                </span>
                                            </td>}
                                            {isColumnVisible('Vendor') && <td className="px-4 py-4 whitespace-nowrap border-r border-gray-200">
                                                <span className={`text-sm font-semibold px-3 py-1.5 rounded-lg ${o.vendorId && o.vendorId !== 'vendor-both' ? 'bg-green-100 text-green-700 border border-green-200' : o.vendorId === 'vendor-both' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-orange-100 text-orange-700 border border-orange-200'}`}>
                                                    {o.vendor}
                                                </span>
                                            </td>}
                                            {isColumnVisible('Sensors') && <td className="px-4 py-3 border-r border-gray-200" style={{ maxWidth: '220px', minWidth: '200px' }}>
                                                <div className="space-y-1">
                                                    {o.sensorList.length > 0 ? (
                                                        <>
                                                            {Array.from({ length: Math.ceil(o.sensorList.length / 4) }).map((_, rowIndex) => (
                                                                <div key={rowIndex} className="flex flex-wrap gap-1">
                                                                    {o.sensorList.slice(rowIndex * 4, (rowIndex + 1) * 4).map((sensor, idx) => (
                                                                        <span key={idx} className="inline-block text-xs font-semibold bg-yellow-100 text-yellow-800 px-2 py-1 rounded-md border border-yellow-200">
                                                                            {sensor}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            ))}
                                                            <span className="inline-block mt-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                                                {o.sensorList.length} total
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="text-xs text-gray-500">No sensors</span>
                                                    )}
                                                </div>
                                            </td>}
                                            {isColumnVisible('Priority') && <td className="px-4 py-4 whitespace-nowrap border-r border-gray-200">
                                                <span className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm ${PRIORITY_COLORS[o.priority] || 'bg-gray-100 text-gray-700 border border-gray-200'}`}>
                                                    {o.priority || 'N/A'}
                                                </span>
                                            </td>}
                                            {isColumnVisible('Price') && <td className="px-4 py-4 whitespace-nowrap border-r border-gray-200">
                                                <span className="px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm bg-gray-100 text-gray-700 border border-gray-200">
                                                    {o.price}
                                                </span>
                                            </td>}
                                            {isColumnVisible('Status') && <td className="px-4 py-4 whitespace-nowrap border-r border-gray-200">
                                                <span className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm ${o.statusColor}`}>
                                                    {formatStatusLabel(o.status)}
                                                </span>
                                            </td>}
                                            {isColumnVisible('Order Type') && <td className="px-4 py-4 whitespace-nowrap border-r border-gray-200">
                                                <span className="px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm bg-indigo-100 text-indigo-700 border border-indigo-200">
                                                    {o.orderType || 'N/A'}
                                                </span>
                                            </td>}
                                            {isColumnVisible('Progress') && <td className="px-4 py-4 border-r border-gray-200">
                                                <div className="space-y-2" style={{ minWidth: '160px' }}>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-bold text-gray-900">{o.progress}%</span>
                                                        <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-full">
                                                            {o.area.collected} / {o.area.total} km²
                                                        </span>
                                                    </div>
                                                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                                                        <div
                                                            className={`h-full transition-all duration-500 ${o.progress === 100 ? 'bg-gradient-to-r from-purple-500 to-purple-600' : o.progress > 50 ? 'bg-gradient-to-r from-green-500 to-green-600' : o.progress > 0 ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gray-300'}`}
                                                            style={{ width: `${o.progress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>}
                                            {isColumnVisible('Created') && <td className="px-4 py-4 whitespace-nowrap border-r border-gray-200">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-blue-500" />
                                                    <span className="text-sm text-gray-700 font-medium">{formatDate(o.createdDate)}</span>
                                                </div>
                                            </td>}
                                            {isColumnVisible('Created By') && <td className="px-4 py-4 whitespace-nowrap border-r border-gray-200">
                                                <span className="text-sm font-semibold text-gray-800 bg-gray-100 px-3 py-1 rounded-lg">
                                                    {o.createdBy || 'N/A'}
                                                </span>
                                            </td>}
                                            {isColumnVisible('Modified') && <td className="px-4 py-4 whitespace-nowrap border-r border-gray-200">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-purple-500" />
                                                    <span className="text-sm text-gray-700 font-medium">{formatDate(o.lastModifiedDate)}</span>
                                                </div>
                                            </td>}
                                            {isColumnVisible('Modified By') && <td className="px-4 py-4 whitespace-nowrap border-r border-gray-200">
                                                <span className="text-sm font-semibold text-gray-800 bg-gray-100 px-3 py-1 rounded-lg">
                                                    {o.lastModifiedBy || 'N/A'}
                                                </span>
                                            </td>}
                                            {isColumnVisible('Contact Person') && <td className="px-4 py-4 whitespace-nowrap border-r border-gray-200">
                                                <span className="text-sm font-semibold text-gray-800">
                                                    {o.contactPerson || 'N/A'}
                                                </span>
                                            </td>}
                                            {isColumnVisible('Contact Number') && <td className="px-4 py-4 whitespace-nowrap border-r border-gray-200">
                                                <span className="text-sm font-semibold text-gray-800">
                                                    {o.contactNumber || 'N/A'}
                                                </span>
                                            </td>}
                                            {isColumnVisible('Email') && <td className="px-4 py-4 whitespace-nowrap border-r border-gray-200">
                                                <span className="text-sm font-semibold text-blue-600 break-all">
                                                    {o.email ? <a href={`mailto:${o.email}`} className="hover:underline">{o.email}</a> : 'N/A'}
                                                </span>
                                            </td>}
                                            {isColumnVisible('View') && <td className="px-4 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => history.push('/order/eye', { orderData: o })}
                                                        className="p-2.5 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 transform"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>

                                                    <button
                                                        onClick={() => history.push(`/order/history/${o.orderId}`, { orderData: o })}
                                                        className="p-2.5 bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                                                    >
                                                        <FileText className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {!currentOrders.length && !loading && (
                        <div className="text-center py-20 bg-gradient-to-b from-gray-50 to-white">
                            <div className="inline-block p-5 bg-gray-100 rounded-full mb-4">
                                <Package className="w-16 h-16 text-gray-400" />
                            </div>
                            <p className="text-gray-700 font-bold text-xl">
                                {showArchived ? 'No archived orders found' : 'No orders found'}
                            </p>
                            <p className="text-gray-500 text-base mt-2">
                                {dateRangeError || (showArchived ? 'Archived orders will appear here' : 'Try adjusting your filters or search criteria')}
                            </p>
                        </div>
                    )}

                    {totalPages > 1 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                            totalItems={filtered.length}
                            startIndex={indexOfFirstOrder}
                            endIndex={indexOfLastOrder}
                        />
                    )}
                </div>

                {/* AOI Map - Only show for active orders */}
                {!showArchived && (
                    <AOIMap
                        token={token}
                        isAuthenticated={isAuthenticated}
                        filteredOrders={filtered}
                        filtersApplied={filtersApplied}
                    />
                )}
            </div>

            <style>{`
                .leaflet-container { height: 100%; width: 100%; z-index: 1; }
                .leaflet-tile-container { pointer-events: auto !important; }
                .leaflet-tile { max-width: none !important; max-height: none !important; }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
                .animate-spin { animation: spin 1s linear infinite; }
                .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
                
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
                
                thead {
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                
                /* Scrollbar styling - VISIBLE AND FUNCTIONAL */
                ::-webkit-scrollbar {
                    width: 12px;
                    height: 12px;
                }
                
                ::-webkit-scrollbar-track {
                    background: linear-gradient(to bottom, #f1f5f9, #e2e8f0);
                    border-radius: 6px;
                }
                
                ::-webkit-scrollbar-thumb {
                    background: linear-gradient(to right, #3b82f6, #6366f1, #8b5cf6);
                    border-radius: 6px;
                    border: 2px solid #f1f5f9;
                }
                
                ::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(to right, #2563eb, #4f46e5, #7c3aed);
                }
                
                .overflow-y-auto::-webkit-scrollbar {
                    width: 10px;
                }
                
                .overflow-y-auto::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 5px;
                }
                
                .overflow-y-auto::-webkit-scrollbar-thumb {
                
                    background: #94a3b8;
                    border-radius: 5px;
                }
                
                .overflow-y-auto::-webkit-scrollbar-thumb:hover {
                    background: #64748b;
                }
            `}</style>
        </div>
    );
};

export default withRouter(OrderList);