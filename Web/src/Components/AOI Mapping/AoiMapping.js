/* eslint-disable no-unused-expressions */
import React, { useState, useEffect, useCallback, useRef } from "react";
import { MapContainer, GeoJSON, useMap, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";
import * as turf from "@turf/turf";
import {
    Search, AlertCircle, Loader, CheckCircle, Map, Layers, X,
    Filter, Eye, User, Package, ChevronLeft, ChevronRight,
    Calendar, Edit, FileText, Archive, ArchiveRestore, Download
} from 'lucide-react';
import MultiSelectDropdown from '../Order/MultiSelectDropdown';
import { properties } from '../../Properties/Properties';

// ─── Constants ────────────────────────────────────────────────────────────────
const PRIORITIES = ['HIGH', 'MEDIUM', 'LOW'];

const VENDOR_SENSORS = {
    'vendor-a': ['Sensor 1', 'Sensor 2', 'Sensor 3', 'Sensor 4', 'Sensor 5', 'Sensor 6', 'Sensor 7', 'Sensor 8'],
    'vendor-b': ['Sensor 11', 'Sensor 12', 'Sensor 13', 'Sensor 14', 'Sensor 15', 'Sensor 16', 'Sensor 17', 'Sensor 18', 'Sensor 19', 'Sensor 20'],
    'vendor-both': [
        'Sensor 1', 'Sensor 2', 'Sensor 3', 'Sensor 4', 'Sensor 5', 'Sensor 6', 'Sensor 7', 'Sensor 8',
        'Sensor 11', 'Sensor 12', 'Sensor 13', 'Sensor 14', 'Sensor 15', 'Sensor 16', 'Sensor 17', 'Sensor 18', 'Sensor 19', 'Sensor 20'
    ]
};

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

const EMPTY_FILTERS = {
    search: '',
    status: [],
    vendor: [],
    sensor: [],
    priority: [],
    organization: [],
    organizationType: [],
    orderType: [],
    fromDate: '',
    toDate: ''
};

// ─── Safe date parser ─────────────────────────────────────────────────────────
const safeParseDateToTimestamp = (dateVal) => {
    if (!dateVal) return null;
    if (typeof dateVal === 'number') return isNaN(dateVal) ? null : dateVal;
    const str = String(dateVal).trim();
    if (!str) return null;
    const native = Date.parse(str);
    if (!isNaN(native)) return native;
    const dmyMatch = str.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
    if (dmyMatch) {
        const attempt = Date.parse(`${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`);
        if (!isNaN(attempt)) return attempt;
    }
    return null;
};

const dateInputToRangeTs = (dateStr, endOfDay = false) => {
    if (!dateStr) return null;
    const suffix = endOfDay ? 'T23:59:59.999' : 'T00:00:00.000';
    const ts = Date.parse(dateStr + suffix);
    return isNaN(ts) ? null : ts;
};

// ─── Auth Hook ─────────────────────────────────────────────────────────────────
const AuthContext = React.createContext();
const useAuth = () => {
    const context = React.useContext(AuthContext);
    const token = sessionStorage.getItem('jwtToken');
    return context?.token ? context : { token, isAuthenticated: !!token, user: sessionStorage.getItem('username') };
};

// ─── Fix Leaflet icons ─────────────────────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

// ─── Map Instance Handler ──────────────────────────────────────────────────────
function MapInstanceHandler({ onMapReady, geoJsonData }) {
    const map = useMap();
    useEffect(() => onMapReady?.(map), [map, onMapReady]);
    useEffect(() => {
        if (map && geoJsonData) {
            try {
                const bounds = L.geoJSON(geoJsonData).getBounds();
                if (bounds.isValid()) map.fitBounds(bounds, { padding: [50, 50] });
            } catch (e) { }
        }
    }, [geoJsonData, map]);
    return null;
}

// ─── Dual Tile Layer ───────────────────────────────────────────────────────────
function DualTileLayer({ worldMaxZoom = 8, saudiMaxZoom = 13 }) {
    const map = useMap();
    useEffect(() => {
        const saudiBounds = L.latLngBounds([16.0, 34.5], [32.5, 56.0]);
        const WorldTileLayer = L.TileLayer.extend({
            getTileUrl: function (coords) {
                let { z, x, y } = coords;
                if (z > worldMaxZoom) {
                    const scale = Math.pow(2, z - worldMaxZoom);
                    return `${properties.TilesBase}/tiles/${worldMaxZoom}/${Math.floor(x / scale)}/${Math.floor(y / scale)}.png`;
                }
                return `${properties.TilesBase}/tiles/${z}/${x}/${y}.png`;
            }
        });
        const SaudiTileLayer = L.TileLayer.extend({
            getTileUrl: function (coords) {
                const { z, x, y } = coords;
                const tileCenter = this._tileCoordsToBounds(coords).getCenter();
                if (z >= 9 && z <= saudiMaxZoom && saudiBounds.contains(tileCenter)) {
                    return `${properties.TilesBase}/Saudi_tiles/${z}/${x}/${y}.png`;
                }
                return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
            }
        });
        const worldLayer = new WorldTileLayer('', {
            attribution: '© OpenStreetMap contributors',
            minZoom: 2, maxZoom: 13, maxNativeZoom: worldMaxZoom, tileSize: 256
        }).addTo(map);
        const saudiLayer = new SaudiTileLayer('', {
            attribution: '© OpenStreetMap (Saudi Arabia)',
            minZoom: 9, maxZoom: saudiMaxZoom, tileSize: 256
        }).addTo(map);
        return () => { map.removeLayer(worldLayer); map.removeLayer(saudiLayer); };
    }, [map, worldMaxZoom, saudiMaxZoom]);
    return null;
}

// ─── Draw Tool ─────────────────────────────────────────────────────────────────
function DrawTool({ setAoi, disabled }) {
    const map = useMap();
    const [drawnLayer] = useState(() => new L.FeatureGroup());
    useEffect(() => {
        if (!map || disabled) return;
        map.addLayer(drawnLayer);
        const drawControl = new L.Control.Draw({
            draw: { polygon: true, rectangle: true, circle: false, marker: false, polyline: false },
            edit: { featureGroup: drawnLayer },
        });
        map.addControl(drawControl);
        const onCreated = (e) => { drawnLayer.clearLayers(); drawnLayer.addLayer(e.layer); setAoi(e.layer.toGeoJSON()); };
        const onDeleted = () => { drawnLayer.clearLayers(); setAoi(null); };
        const onEdited = (e) => {
            let newGeo = null;
            e.layers?.eachLayer(layer => { newGeo = layer.toGeoJSON(); });
            drawnLayer.clearLayers();
            if (newGeo) { drawnLayer.addLayer(L.geoJSON(newGeo)); setAoi(newGeo); } else setAoi(null);
        };
        map.on(L.Draw.Event.CREATED, onCreated);
        map.on('draw:deleted', onDeleted);
        map.on('draw:edited', onEdited);
        return () => {
            map.off(L.Draw.Event.CREATED, onCreated);
            map.off('draw:deleted', onDeleted);
            map.off('draw:edited', onEdited);
            map.removeControl(drawControl);
        };
    }, [map, setAoi, drawnLayer, disabled]);
    return null;
}

// ─── Filter Panel ──────────────────────────────────────────────────────────────
const FilterPanel = ({
    filters, setFilters,
    sensorOptions, orderTypeOptions, organizationOptions, orgTypeOptions,
    dateRangeError, showFilters, setShowFilters,
    onApply, onClear
}) => {
    const statusOptions = ['CREATED', 'PENDING', 'CANCELLED', 'COMPLETED', 'PARTIALLY_COMPLETED'];
    const vendorOptions = ['vendor-a', 'vendor-b', 'vendor-both'];
    const availableSensors = filters.vendor.length === 0
        ? sensorOptions
        : filters.vendor.length === 1
            ? (VENDOR_SENSORS[filters.vendor[0]] || sensorOptions)
            : filters.vendor.flatMap(v => VENDOR_SENSORS[v] || []);

    return (
        <div className="bg-white rounded-2xl shadow-xl p-3 border-2 border-gray-200 mb-4">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-gray-900">Search & Filter Orders in Drawn Area</h3>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 flex items-center gap-2 transition-all shadow-lg hover:shadow-xl font-semibold"
                >
                    <Filter className="w-5 h-5" />
                    {showFilters ? 'Hide Filters' : 'Show Filters'}
                </button>
            </div>

            {showFilters && (
                <div className="space-y-3 pt-3 border-t-2 border-gray-200">
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

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-600 mb-1">From Date</span>
                            <input type="date" value={filters.fromDate}
                                onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                                className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 cursor-pointer font-semibold bg-white hover:border-gray-400 transition-all text-base" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-600 mb-1">To Date</span>
                            <input type="date" value={filters.toDate} min={filters.fromDate || undefined}
                                onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                                className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 cursor-pointer font-semibold bg-white hover:border-gray-400 transition-all text-base" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        <MultiSelectDropdown label="Status" options={statusOptions} selected={filters.status}
                            onChange={(v) => setFilters({ ...filters, status: v })} placeholder="All Statuses" />
                        <MultiSelectDropdown label="Vendor" options={vendorOptions} selected={filters.vendor}
                            onChange={(v) => setFilters({ ...filters, vendor: v, sensor: [] })} placeholder="All Vendors" />
                        <MultiSelectDropdown label="Sensor" options={availableSensors} selected={filters.sensor}
                            onChange={(v) => setFilters({ ...filters, sensor: v })} placeholder="All Sensors"
                            disabled={availableSensors.length === 0} />
                        <MultiSelectDropdown label="Priority" options={PRIORITIES} selected={filters.priority}
                            onChange={(v) => setFilters({ ...filters, priority: v })} placeholder="All Priorities" />
                        <MultiSelectDropdown label="Order Type" options={orderTypeOptions} selected={filters.orderType}
                            onChange={(v) => setFilters({ ...filters, orderType: v })} placeholder="All Order Types" />
                        <MultiSelectDropdown label="Organization" options={organizationOptions} selected={filters.organization}
                            onChange={(v) => setFilters({ ...filters, organization: v })} placeholder="All Organizations" />
                        <MultiSelectDropdown label="Org Type" options={orgTypeOptions} selected={filters.organizationType}
                            onChange={(v) => setFilters({ ...filters, organizationType: v })} placeholder="All Org Types" />
                    </div>

                    {dateRangeError && (
                        <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
                            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-600" />
                            <p className="text-sm text-red-700 font-semibold">{dateRangeError}</p>
                        </div>
                    )}

                    <div className="flex items-center gap-3 pt-4 border-t-2 border-gray-200">
                        <button onClick={onApply} disabled={!!dateRangeError}
                            className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 flex items-center gap-2 transition-all shadow-lg hover:shadow-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed">
                            <Search className="w-5 h-5" /> Apply Filters
                        </button>
                        <button onClick={onClear}
                            className="px-6 py-3 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 border-2 border-red-200 transition-all shadow-md hover:shadow-lg font-semibold flex items-center gap-2">
                            <X className="w-5 h-5" /> Clear All Filters
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Pagination ────────────────────────────────────────────────────────────────
const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, startIndex, endIndex }) => (
    <div className="px-6 py-4 bg-gray-50 border-t-2 border-gray-200 flex items-center justify-between">
        <div className="text-sm text-gray-700 font-semibold">
            Showing <span className="font-bold text-blue-700">{startIndex + 1}</span> to{' '}
            <span className="font-bold text-blue-700">{Math.min(endIndex, totalItems)}</span> of{' '}
            <span className="font-bold text-blue-700">{totalItems}</span> orders
        </div>
        <div className="flex items-center gap-2">
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}
                className="p-2 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm">
                <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            {[...Array(totalPages)].map((_, index) => {
                const pageNumber = index + 1;
                if (pageNumber === 1 || pageNumber === totalPages || (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)) {
                    return (
                        <button key={pageNumber} onClick={() => onPageChange(pageNumber)}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all ${currentPage === pageNumber
                                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                                : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                            {pageNumber}
                        </button>
                    );
                } else if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                    return <span key={pageNumber} className="px-2 text-gray-500">...</span>;
                }
                return null;
            })}
            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}
                className="p-2 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm">
                <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
        </div>
    </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────
export default function AoiMapping() {
    const { token, isAuthenticated } = useAuth();

    const [fetchedAoi, setFetchedAoi] = useState(null);
    const [allAois, setAllAois] = useState([]);
    const [selectedAoi, setSelectedAoi] = useState(null);
    const [drawAoi, setDrawAoi] = useState(null);
    const [showDrawMode, setShowDrawMode] = useState(false);
    const [aoiInsideDrawn, setAoiInsideDrawn] = useState([]);
    const [rawOrdersInsideDrawn, setRawOrdersInsideDrawn] = useState([]);
    const [tempFilters, setTempFilters] = useState(EMPTY_FILTERS);
    const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
    const [showFilters, setShowFilters] = useState(false);
    const [dateRangeError, setDateRangeError] = useState('');
    const [filterVersion, setFilterVersion] = useState(0);
    const [sensorOptions, setSensorOptions] = useState([]);
    const [orderTypeOptions, setOrderTypeOptions] = useState([]);
    const [organizationOptions, setOrganizationOptions] = useState([]);
    const [orgTypeOptions, setOrgTypeOptions] = useState([]);
    const [mapInstance, setMapInstance] = useState(null);
    const [isLoadingAll, setIsLoadingAll] = useState(false);
    const [error, setError] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [hiddenColumns, setHiddenColumns] = useState(new Set());
    const [showColumnDropdown, setShowColumnDropdown] = useState(false);
    const ordersPerPage = 10;

    const topScrollRef = useRef(null);
    const tableScrollRef = useRef(null);
    const tableRef = useRef(null);

    // ── Geometry helpers ──────────────────────────────────────────────────────
    const getDrawnGeometryType = (aoi) => {
        if (!aoi) return 'Unknown';
        if (aoi.type === 'Feature') return aoi.geometry?.type || 'Unknown';
        if (aoi.type === 'FeatureCollection') return aoi.features?.[0]?.geometry?.type || 'Unknown';
        return aoi.type || 'Unknown';
    };

    const calculateArea = useCallback((aoi) => {
        try {
            let geoFeature = aoi.type === "Feature" ? aoi
                : aoi.type === "FeatureCollection"
                    ? { type: "Feature", geometry: aoi.features[0].geometry, properties: {} }
                    : { type: "Feature", geometry: aoi, properties: {} };
            const areaSqM = turf.area(geoFeature);
            const sqKm = areaSqM / 1_000_000;
            const length = turf.length(geoFeature, { units: 'kilometers' });
            return { area: parseFloat(sqKm.toFixed(2)), perimeter: parseFloat(length.toFixed(2)) };
        } catch { return null; }
    }, []);

    const pushPolygons = (geometry, sharedProps, keyPrefix, valid) => {
        if (!geometry) return;
        const uniqueBase = `${sharedProps.orderId || 'noOid'}_${sharedProps.poId || 'noPid'}_${keyPrefix}`;
        if (geometry.type === 'MultiPolygon') {
            geometry.coordinates.forEach((polygonCoords, idx) => {
                const feature = { type: 'Feature', geometry: { type: 'Polygon', coordinates: polygonCoords }, properties: { ...sharedProps, _polygonKey: `${uniqueBase}_mp_${idx}` } };
                try { if (L.geoJSON(feature).getBounds().isValid()) valid.push(feature); } catch { }
            });
        } else if (geometry.type === 'Polygon') {
            const feature = { type: 'Feature', geometry, properties: { ...sharedProps, _polygonKey: `${uniqueBase}_poly` } };
            try { if (L.geoJSON(feature).getBounds().isValid()) valid.push(feature); } catch { }
        } else {
            const feature = { type: 'Feature', geometry, properties: { ...sharedProps, _polygonKey: `${uniqueBase}_other` } };
            try { if (L.geoJSON(feature).getBounds().isValid()) valid.push(feature); } catch { }
        }
    };

    const buildValidAois = (data) => {
        const valid = [];
        data.forEach((item) => {
            try {
                let aoi = item.abj || item.aoi || (item.type ? item : null) || (item.geometry ? { type: "Feature", geometry: item.geometry, properties: {} } : null);
                if (!aoi) return;
                const rawCreatedDate = item.createdDate || item.created_date || item.createdAt || item.created_at || item.orderDate || null;
                const sharedProps = {
                    ...aoi.properties,
                    poId: item.poId,
                    orderId: item.orderId || item.id,
                    clientName: item.clientName,
                    vendor: item.vendorNo,
                    vendorId: item.vendorNo,
                    sensorList: item.sansor || [],
                    sensors: item.sansor?.join(', ') || '',
                    priority: item.priority,
                    status: item.status,
                    orderType: item.orderType || 'Standard',
                    organization: item.organization || item.Organisation || 'N/A',
                    organizationType: item.organizationType || item.organisation_type || item.organization_type || item.organisationType || 'N/A',
                    createdDate: rawCreatedDate ? (safeParseDateToTimestamp(rawCreatedDate) ? new Date(safeParseDateToTimestamp(rawCreatedDate)).toISOString() : null) : null,
                    progress: Math.round(item.percentageCompleted) || 0,
                    totalArea: Math.round(item.totalArea) || 0,
                    collectedArea: Math.round(item.totalArea - item.remainingArea) || 0,
                    createdBy: item.createdBy,
                    price: item.price ?? 0
                };
                if (aoi.type === 'FeatureCollection') {
                    (aoi.features || []).forEach((feat, featIdx) => { if (!feat?.geometry) return; pushPolygons(feat.geometry, sharedProps, `fc_${featIdx}`, valid); });
                } else {
                    const geometry = aoi.type === 'Feature' ? aoi.geometry : aoi;
                    if (geometry) pushPolygons(geometry, sharedProps, 'root', valid);
                }
            } catch { }
        });
        return valid;
    };

    const checkAoisInsideDrawn = useCallback((drawnPolygon, allAoisList) => {
        if (!drawnPolygon || !allAoisList.length) return [];
        try {
            const drawnGeo = drawnPolygon.type === "Feature" ? drawnPolygon.geometry : drawnPolygon;
            const drawnFeature = drawnPolygon.type === "Feature" ? drawnPolygon : { type: 'Feature', geometry: drawnPolygon, properties: {} };
            let drawnCenter = null;
            try { drawnCenter = turf.center(drawnFeature); } catch { }
            return allAoisList.filter(aoi => {
                try {
                    if (drawnCenter) { try { if (turf.booleanPointInPolygon(drawnCenter, aoi)) return false; } catch { } }
                    const aoiCenter = turf.center(aoi);
                    if (turf.booleanPointInPolygon(aoiCenter, drawnGeo)) return true;
                    try { return turf.booleanIntersects(aoi, drawnGeo); } catch { return false; }
                } catch { return false; }
            });
        } catch { return []; }
    }, []);

    // ── Dual scrollbar sync ───────────────────────────────────────────────────
    useEffect(() => {
        const top = topScrollRef.current;
        const scroller = tableScrollRef.current;
        const table = tableRef.current;
        if (!top || !scroller || !table) return;
        const phantom = top.querySelector('.scroll-phantom');
        const syncWidth = () => { try { phantom.style.width = `${table.scrollWidth}px`; } catch (e) { } };
        syncWidth();
        let lock = false;
        const topToBottom = () => { if (lock) return; lock = true; scroller.scrollLeft = top.scrollLeft; requestAnimationFrame(() => (lock = false)); };
        const bottomToTop = () => { if (lock) return; lock = true; top.scrollLeft = scroller.scrollLeft; requestAnimationFrame(() => (lock = false)); };
        top.addEventListener('scroll', topToBottom, { passive: true });
        scroller.addEventListener('scroll', bottomToTop, { passive: true });
        const ro = new ResizeObserver(syncWidth);
        ro.observe(table);
        return () => {
            top.removeEventListener('scroll', topToBottom);
            scroller.removeEventListener('scroll', bottomToTop);
            ro.disconnect();
        };
    }, [filteredAoisInsideDrawn, currentPage, showDrawMode]);

    // ── Date range validation ─────────────────────────────────────────────────
    useEffect(() => {
        if (!tempFilters.fromDate || !tempFilters.toDate) { setDateRangeError(''); return; }
        try {
            const f = dateInputToRangeTs(tempFilters.fromDate, false);
            const t = dateInputToRangeTs(tempFilters.toDate, true);
            if (!f || !t) { setDateRangeError('Invalid date format'); return; }
            setDateRangeError(f > t ? '"From" date must be before or equal to "To" date' : '');
        } catch { setDateRangeError('Invalid date range'); }
    }, [tempFilters.fromDate, tempFilters.toDate]);

    const buildFilterOptions = (aois) => {
        const props = aois.map(a => a.properties || {});
        setSensorOptions(Array.from(new Set(props.flatMap(p => p.sensorList || []))).filter(Boolean).sort());
        setOrderTypeOptions(Array.from(new Set(props.map(p => p.orderType).filter(x => x && x !== 'N/A'))).sort());
        setOrganizationOptions(Array.from(new Set(props.map(p => p.organization).filter(x => x && x !== 'N/A'))).sort());
        setOrgTypeOptions(Array.from(new Set(props.map(p => p.organizationType).filter(x => x && x !== 'N/A'))).sort());
    };

    // ── When draw polygon changes ─────────────────────────────────────────────
    useEffect(() => {
        if (!drawAoi || !showDrawMode) {
            setAoiInsideDrawn([]); setRawOrdersInsideDrawn([]);
            setAppliedFilters(EMPTY_FILTERS); setTempFilters(EMPTY_FILTERS);
            setShowFilters(false); setCurrentPage(1);
            return;
        }
        if (!isAuthenticated) return;
        setIsLoadingAll(true); setError(null);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);
        fetch(`${properties.Port}${properties.getAllAoi}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
            signal: controller.signal
        })
            .then(res => { clearTimeout(timeoutId); if (!res.ok) throw new Error("Failed to fetch AOIs"); return res.json(); })
            .then(data => {
                const validAois = buildValidAois(data);
                const matched = checkAoisInsideDrawn(drawAoi, validAois);
                setAoiInsideDrawn(matched); setRawOrdersInsideDrawn(matched);
                buildFilterOptions(matched);
                setAppliedFilters(EMPTY_FILTERS); setTempFilters(EMPTY_FILTERS);
                setFilterVersion(0); setCurrentPage(1);
            })
            .catch(err => {
                if (err.name === 'AbortError') setError("Request timed out while finding orders.");
                else if (err.message === 'Failed to fetch') setError(`Cannot connect to server at ${properties.Port}.`);
                else setError("Failed to fetch AOIs: " + err.message);
            })
            .finally(() => setIsLoadingAll(false));
        return () => { clearTimeout(timeoutId); controller.abort(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [drawAoi, showDrawMode, isAuthenticated, token, checkAoisInsideDrawn]);

    // ── Filter logic ──────────────────────────────────────────────────────────
    const filteredAoisInsideDrawn = rawOrdersInsideDrawn.filter(aoi => {
        const p = aoi.properties || {};
        const searchLower = appliedFilters.search.toLowerCase();
        const matchSearch = !searchLower
            || [p.poId, p.orderId, p.clientName, p.vendor].some(f => f?.toLowerCase().includes(searchLower))
            || (p.sensorList || []).some(sensor => sensor.toLowerCase().includes(searchLower));
        const matchStatus = appliedFilters.status.length === 0 || appliedFilters.status.some(st => p.status?.toLowerCase() === st.toLowerCase());
        const matchVendor = appliedFilters.vendor.length === 0 || appliedFilters.vendor.includes(p.vendorId);
        const matchPriority = appliedFilters.priority.length === 0 || appliedFilters.priority.some(pr => p.priority?.toLowerCase() === pr.toLowerCase());
        const matchOrderType = appliedFilters.orderType.length === 0 || appliedFilters.orderType.includes(p.orderType);
        const matchOrganization = appliedFilters.organization.length === 0 || (p.organization && appliedFilters.organization.includes(p.organization));
        const matchOrgType = appliedFilters.organizationType.length === 0 || (p.organizationType && appliedFilters.organizationType.includes(p.organizationType));
        let matchSensor = true;
        if (appliedFilters.sensor.length > 0) {
            matchSensor = (p.sensorList || []).some(s => appliedFilters.sensor.some(sel => s.toLowerCase() === sel.toLowerCase()));
        }
        if (appliedFilters.vendor.length > 0 && !appliedFilters.vendor.includes(p.vendorId)) matchSensor = false;
        let matchDate = true;
        if (!dateRangeError && (appliedFilters.fromDate || appliedFilters.toDate)) {
            const createdTime = safeParseDateToTimestamp(p.createdDate);
            const fromTime = dateInputToRangeTs(appliedFilters.fromDate, false);
            const toTime = dateInputToRangeTs(appliedFilters.toDate, true);
            if (!createdTime) matchDate = false;
            else matchDate = (!fromTime || createdTime >= fromTime) && (!toTime || createdTime <= toTime);
        }
        return matchSearch && matchStatus && matchVendor && matchPriority && matchSensor && matchDate && matchOrderType && matchOrganization && matchOrgType;
    });

    // ── Pagination ────────────────────────────────────────────────────────────
    const indexOfLastOrder = currentPage * ordersPerPage;
    const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
    const currentOrders = filteredAoisInsideDrawn.slice(indexOfFirstOrder, indexOfLastOrder);
    const totalPages = Math.ceil(filteredAoisInsideDrawn.length / ordersPerPage);

    const applyFilters = () => { setAppliedFilters(tempFilters); setFilterVersion(v => v + 1); setCurrentPage(1); setShowFilters(false); };
    const clearFilters = () => { setTempFilters(EMPTY_FILTERS); setAppliedFilters(EMPTY_FILTERS); setFilterVersion(0); setCurrentPage(1); };
    const filtersActive = appliedFilters.search.trim() !== '' || appliedFilters.status.length > 0 || appliedFilters.vendor.length > 0
        || appliedFilters.sensor.length > 0 || appliedFilters.priority.length > 0 || appliedFilters.orderType.length > 0
        || appliedFilters.organization.length > 0 || appliedFilters.organizationType.length > 0
        || !!appliedFilters.fromDate || !!appliedFilters.toDate;

    const resetAll = () => {
        setFetchedAoi(null); setError(null);
        setAllAois([]); setDrawAoi(null); setShowDrawMode(false);
        setAoiInsideDrawn([]); setRawOrdersInsideDrawn([]);
        setAppliedFilters(EMPTY_FILTERS); setTempFilters(EMPTY_FILTERS);
        setShowFilters(false); setCurrentPage(1);
        mapInstance?.setView([20.5937, 78.9629], 2);
    };

    const formatDate = (d) => {
        if (!d) return 'N/A';
        try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
        catch { return 'Invalid'; }
    };

    const getVendorLabel = (v) =>
        v === 'vendor-a' ? 'Vendor A' : v === 'vendor-b' ? 'Vendor B' : v === 'vendor-both' ? 'Both Vendors A & B' : 'Not Assigned';

    const formatStatusLabel = (status) =>
        status === 'PARTIALLY_COMPLETED' ? 'PARTIALLY COMP.' : status?.replace(/_/g, ' ');

    const isColumnVisible = (colName) => !hiddenColumns.has(colName);

    const handleExportCSV = () => {
        try {
            if (!filteredAoisInsideDrawn.length) return;
            const escapeCSV = (val) => { if (val == null) return ''; let s = String(val).replace(/"/g, '""'); return s.search(/("|,|\n)/) >= 0 ? `"${s}"` : s; };
            const headers = ['PO ID', 'Order ID', 'Client', 'Vendor', 'Sensors', 'Status', 'Priority', 'Order Type', 'Organization Type', 'Organization', 'Total Area', 'Collected Area', 'Created'];
            const rows = filteredAoisInsideDrawn.map(aoi => {
                const p = aoi.properties || {};
                return [p.poId, p.orderId, p.clientName, getVendorLabel(p.vendorId), p.sensors, p.status, p.priority, p.orderType, p.organizationType, p.organization, p.totalArea, p.collectedArea, p.createdDate].map(escapeCSV).join(',');
            });
            const csvContent = [headers.join(','), ...rows].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `aoi_orders_${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
        } catch (err) { console.error('Export CSV failed:', err); }
    };

    const showFilterButton = showDrawMode && rawOrdersInsideDrawn.length > 0;

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="w-full min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-blue-50">
            {/* ── Header ── */}
            <div className="bg-white border-b border-gray-200 px-8 py-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg flex items-center justify-center">
                            <Map className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">AOI Mapping Studio - Dual Tile System</h1>
                            <p className="text-gray-500 text-sm">World map (Z:2-8) + Saudi Arabia high-detail (Z:9-13)</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="px-4 py-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-sm font-semibold text-green-700">Offline Mode</span>
                        </div>
                        <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                            <span className="text-sm font-semibold text-blue-700">🌍 Z:2-8</span>
                        </div>
                        <div className="px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg">
                            <span className="text-sm font-semibold text-orange-700">🇸🇦 Z:9-13</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="max-w-[1600px] mx-auto p-6 space-y-6">

                    {/* ── Draw Mode Controls ── */}
                    <div className="bg-white rounded-2xl shadow-xl p-5 border-2 border-gray-200">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Draw AOI Polygon</h2>
                        <div className="flex flex-wrap gap-3 items-center">
                            <button
                                onClick={() => setShowDrawMode(!showDrawMode)}
                                className={`px-7 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg hover:shadow-xl whitespace-nowrap min-w-fit overflow-visible ${
                                    showDrawMode
                                        ? 'bg-gray-800 text-white hover:bg-gray-900 ring-2 ring-gray-500'
                                        : 'bg-gray-700 text-white hover:bg-gray-800'
                                }`}
                            >
                                <Map className="w-4 h-4 flex-shrink-0" />
                                <span className="whitespace-nowrap">
                                    {showDrawMode ? '✕ Exit Draw Mode' : '✏️ Draw AOI Polygon'}
                                </span>
                            </button>

                            {(fetchedAoi || allAois.length > 0 || drawAoi) && (
                                <button onClick={resetAll} disabled={isLoadingAll}
                                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-bold text-sm disabled:opacity-50 transition-all shadow-md">
                                    Clear & Reset
                                </button>
                            )}

                            {isLoadingAll && showDrawMode && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 border-2 border-orange-200 rounded-xl">
                                    <Loader className="w-4 h-4 animate-spin text-orange-600" />
                                    <span className="text-sm font-semibold text-orange-700">Finding orders in drawn area...</span>
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border-2 border-red-200 mt-4">
                                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-600" />
                                <div>
                                    <p className="font-bold text-sm mb-0.5 text-red-900">Error</p>
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Drawn AOI info ── */}
                    {drawAoi && showDrawMode && (
                        <div className="bg-orange-50 rounded-2xl shadow-xl p-5 border-2 border-orange-200">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Drawn AOI Information</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 bg-white rounded-xl border-2 border-orange-200">
                                    <p className="text-xs text-orange-600 font-bold mb-1 uppercase">Geometry Type</p>
                                    <p className="text-lg font-bold text-orange-900">{getDrawnGeometryType(drawAoi)}</p>
                                </div>
                                <div className="p-4 bg-white rounded-xl border-2 border-orange-200">
                                    <p className="text-xs text-orange-600 font-bold mb-1 uppercase">Area (km²)</p>
                                    <p className="text-lg font-bold text-orange-900">{calculateArea(drawAoi)?.area ?? 'N/A'}</p>
                                </div>
                                <div className="p-4 bg-white rounded-xl border-2 border-orange-200">
                                    <p className="text-xs text-orange-600 font-bold mb-1 uppercase">Perimeter (km)</p>
                                    <p className="text-lg font-bold text-orange-900">{calculateArea(drawAoi)?.perimeter ?? 'N/A'}</p>
                                </div>
                                <div className="p-4 bg-white rounded-xl border-2 border-red-200">
                                    <p className="text-xs text-red-600 font-bold mb-1 uppercase">
                                        {filtersActive ? 'Filtered Polygons' : 'Polygons Inside'}
                                    </p>
                                    <p className="text-lg font-bold text-red-900">
                                        {filtersActive ? `${filteredAoisInsideDrawn.length} / ${rawOrdersInsideDrawn.length}` : rawOrdersInsideDrawn.length}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Filter Panel ── */}
                    {showFilterButton && (
                        <FilterPanel
                            filters={tempFilters} setFilters={setTempFilters}
                            sensorOptions={sensorOptions} orderTypeOptions={orderTypeOptions}
                            organizationOptions={organizationOptions} orgTypeOptions={orgTypeOptions}
                            dateRangeError={dateRangeError} showFilters={showFilters} setShowFilters={setShowFilters}
                            onApply={applyFilters} onClear={clearFilters}
                        />
                    )}

                    {/* Filter active badge */}
                    {filtersActive && showDrawMode && (
                        <div className="flex items-center gap-3 px-5 py-3 bg-blue-50 border-2 border-blue-200 rounded-2xl">
                            <Filter className="w-5 h-5 text-blue-600" />
                            <p className="text-sm font-semibold text-blue-800">
                                Filters active — showing <span className="font-bold text-blue-900">{filteredAoisInsideDrawn.length}</span> of{' '}
                                <span className="font-bold text-blue-900">{rawOrdersInsideDrawn.length}</span> polygons in drawn area
                            </p>
                            <button onClick={clearFilters} className="ml-auto text-xs text-red-600 hover:underline font-bold flex items-center gap-1">
                                <X className="w-3 h-3" /> Clear filters
                            </button>
                        </div>
                    )}

                    {/* ── Map ── */}
                    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl shadow-2xl border-2 border-blue-200 overflow-hidden">
                        <div className="px-6 py-4 border-b-2 border-blue-200 flex items-center justify-between bg-gradient-to-r from-blue-100 to-purple-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                                    <Map className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Dual Tile System Map</h2>
                                    {showDrawMode && rawOrdersInsideDrawn.length > 0 && (
                                        <p className="text-sm font-semibold text-red-700">
                                            {filtersActive
                                                ? `${filteredAoisInsideDrawn.length} filtered / ${rawOrdersInsideDrawn.length} total polygons`
                                                : `${rawOrdersInsideDrawn.length} polygon(s) in drawn area`}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <button onClick={() => mapInstance?.setView([20.5937, 78.9629], 2)}
                                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 font-semibold text-sm shadow-lg">
                                Reset View
                            </button>
                        </div>

                        <div style={{ height: "600px" }} className="relative m-4 rounded-xl overflow-hidden shadow-inner border-4 border-blue-100">
                            {showDrawMode && (
                                <div className="absolute top-4 right-4 bg-white p-4 rounded-xl shadow-xl z-[1000] border-2 border-orange-400">
                                    <p className="text-sm font-bold text-orange-700 mb-2">✏️ Drawing Mode</p>
                                    <p className="text-xs text-gray-600 mb-2">Use toolbar to:</p>
                                    <div className="space-y-1 text-xs text-gray-700">
                                        <p>• <strong>Draw Polygon:</strong> Click toolbar</p>
                                        <p>• <strong>Edit:</strong> Click edit tool</p>
                                        <p>• <strong>Delete:</strong> Click delete tool</p>
                                    </div>
                                </div>
                            )}

                            <div className="absolute top-4 left-4 bg-white p-3 rounded-xl shadow-lg z-[999] border-2 border-green-200">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    <p className="text-xs font-bold text-green-700">Dual Tile System</p>
                                </div>
                                <p className="text-xs text-gray-600">🌍 World: Z:2-8</p>
                                <p className="text-xs text-orange-600">🇸🇦 Saudi: Z:9-13</p>
                            </div>

                            <MapContainer center={[20.5937, 78.9629]} zoom={2}
                                style={{ height: "100%", width: "100%", backgroundColor: '#e8f5e9' }}
                                zoomControl={true} maxZoom={13} minZoom={2}>
                                <DualTileLayer worldMaxZoom={8} saudiMaxZoom={13} />
                                <MapInstanceHandler onMapReady={setMapInstance} geoJsonData={fetchedAoi} />
                                {showDrawMode && <DrawTool setAoi={setDrawAoi} disabled={false} />}

                                {fetchedAoi && !showDrawMode && (
                                    <GeoJSON data={fetchedAoi} key={JSON.stringify(fetchedAoi)}
                                        style={{ color: '#2563eb', weight: 3, fillColor: '#3b82f6', fillOpacity: 0.3, dashArray: '5, 5' }} />
                                )}

                                {drawAoi && showDrawMode && (
                                    <GeoJSON data={drawAoi} key={`draw-${JSON.stringify(drawAoi)}`}
                                        style={{ color: '#ea580c', weight: 3, fillColor: '#fb923c', fillOpacity: 0.15 }} />
                                )}

                                {!showDrawMode && allAois.map((aoi, i) => (
                                    <GeoJSON key={`all-aoi-${aoi.properties?._polygonKey || i}`} data={aoi}
                                        style={{ color: `hsl(${(i * 360) / allAois.length}, 70%, 50%)`, weight: 2.5, fillColor: `hsl(${(i * 360) / allAois.length}, 70%, 50%)`, fillOpacity: 0.25 }}
                                        eventHandlers={{ click: () => setSelectedAoi(aoi.properties) }}>
                                        <Popup>
                                            <div className="p-2" style={{ minWidth: '200px' }}>
                                                <h3 className="font-bold text-sm mb-2 pb-2 border-b">Order Details</h3>
                                                <p className="text-xs text-gray-500 font-semibold">PO ID</p>
                                                <p className="text-sm font-bold text-blue-600 mb-2">{aoi.properties?.poId || 'N/A'}</p>
                                                <p className="text-xs text-gray-500 font-semibold">Client Name</p>
                                                <p className="text-sm font-bold text-gray-800">{aoi.properties?.clientName || 'N/A'}</p>
                                            </div>
                                        </Popup>
                                    </GeoJSON>
                                ))}

                                {showDrawMode && filteredAoisInsideDrawn.map((aoi, i) => (
                                    <GeoJSON key={`inside-${aoi.properties?._polygonKey || i}-v${filterVersion}`} data={aoi}
                                        style={{ color: '#ef4444', weight: 3.5, dashArray: '10, 5', fillColor: '#fca5a5', fillOpacity: 0.5 }}
                                        eventHandlers={{ click: () => setSelectedAoi(aoi.properties) }}>
                                        <Popup>
                                            <div className="p-2" style={{ minWidth: '220px' }}>
                                                <h3 className="font-bold text-sm mb-2 pb-2 border-b">{filtersActive ? '🔍 Filtered Match' : '✨ Found Inside'}</h3>
                                                <p className="text-xs text-gray-500 font-semibold">PO ID</p>
                                                <p className="text-sm font-bold text-red-600 mb-1">{aoi.properties?.poId || 'N/A'}</p>
                                                <p className="text-xs text-gray-500 font-semibold">Client Name</p>
                                                <p className="text-sm font-bold text-gray-800">{aoi.properties?.clientName || 'N/A'}</p>
                                            </div>
                                        </Popup>
                                    </GeoJSON>
                                ))}

                                {showDrawMode && filtersActive && rawOrdersInsideDrawn
                                    .filter(aoi => !filteredAoisInsideDrawn.includes(aoi))
                                    .map((aoi, i) => (
                                        <GeoJSON key={`excl-${aoi.properties?._polygonKey || i}-v${filterVersion}`} data={aoi}
                                            style={{ color: '#9ca3af', weight: 1.5, dashArray: '4, 4', fillColor: '#d1d5db', fillOpacity: 0.2 }} />
                                    ))}
                            </MapContainer>

                            {/* Selected AOI detail panel */}
                            {selectedAoi && (
                                <div className="absolute top-4 right-4 bg-white rounded-xl shadow-2xl z-[1000] border-2 border-blue-400 p-5" style={{ minWidth: '350px', maxWidth: '400px' }}>
                                    <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-blue-200">
                                        <h3 className="font-bold text-lg text-gray-900">📋 Order Details</h3>
                                        <button onClick={() => setSelectedAoi(null)} className="text-gray-400 hover:text-red-600 transition-colors">
                                            <X className="w-6 h-6" />
                                        </button>
                                    </div>
                                    <div className="space-y-3 max-h-96 overflow-y-auto">
                                        {[
                                            { label: 'PO ID', value: selectedAoi.poId, bg: 'blue' },
                                            { label: 'Order ID', value: selectedAoi.orderId, bg: 'indigo' },
                                            { label: 'Client Name', value: selectedAoi.clientName, bg: 'purple' },
                                            { label: 'Vendor', value: getVendorLabel(selectedAoi.vendorId), bg: 'green' },
                                        ].map(({ label, value, bg }) => (
                                            <div key={label} className={`bg-${bg}-50 p-3 rounded-lg border border-${bg}-200`}>
                                                <p className={`text-xs text-${bg}-600 font-bold mb-1 uppercase`}>{label}</p>
                                                <p className={`text-base font-bold text-${bg}-900`}>{value || 'N/A'}</p>
                                            </div>
                                        ))}
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                                                <p className="text-xs text-orange-600 font-bold mb-1 uppercase">Priority</p>
                                                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${PRIORITY_COLORS[selectedAoi.priority] || ''}`}>{selectedAoi.priority || 'N/A'}</span>
                                            </div>
                                            <div className="bg-pink-50 p-3 rounded-lg border border-pink-200">
                                                <p className="text-xs text-pink-600 font-bold mb-1 uppercase">Status</p>
                                                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${STATUS_COLORS[selectedAoi.status] || ''}`}>{formatStatusLabel(selectedAoi.status) || 'N/A'}</span>
                                            </div>
                                        </div>
                                        <div className="bg-teal-50 p-3 rounded-lg border border-teal-200">
                                            <p className="text-xs text-teal-600 font-bold mb-1 uppercase">Progress</p>
                                            <div className="flex items-center gap-3">
                                                <p className="text-xl font-bold text-teal-900">{selectedAoi.progress || 0}%</p>
                                                <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                                                    <div className="h-full bg-gradient-to-r from-teal-500 to-green-500" style={{ width: `${selectedAoi.progress || 0}%` }} />
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
                                            <p className="text-xs text-gray-600 font-bold mb-1 uppercase">Created</p>
                                            <p className="text-sm font-bold text-gray-900">{formatDate(selectedAoi.createdDate)}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {!fetchedAoi && !allAois.length && !isLoadingAll && !showDrawMode && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="text-center">
                                        <div className="bg-white w-20 h-20 rounded-2xl inline-flex items-center justify-center mb-4 shadow-md border-2 border-green-200">
                                            <Map className="w-10 h-10 text-green-600" />
                                        </div>
                                        <p className="text-gray-900 font-bold text-lg mb-1">Dual Tile System Ready</p>
                                        <p className="text-gray-600 text-sm mb-1">🌍 World (Z:2-8) + 🇸🇦 Saudi Arabia (Z:9-13)</p>
                                        <p className="text-green-600 text-sm font-semibold">Draw a polygon to explore orders</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Orders Table (draw mode) ── */}
                    {showDrawMode && filteredAoisInsideDrawn.length > 0 && filterVersion > 0 && (
                        <>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900">
                                        {filtersActive ? '🔍 Filtered Orders in Drawn Area' : '✨ Orders Found in Drawn Area'}
                                    </h2>
                                    <p className="text-gray-600 mt-1 text-base font-medium">
                                        {filtersActive
                                            ? `${filteredAoisInsideDrawn.length} of ${rawOrdersInsideDrawn.length} orders match filters`
                                            : `${filteredAoisInsideDrawn.length} order(s) found inside drawn polygon`}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button onClick={handleExportCSV} disabled={!filteredAoisInsideDrawn.length}
                                        className="px-4 py-2 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50 transition-all shadow-sm hover:shadow-md font-semibold text-gray-700">
                                        <FileText className="w-4 h-4" /> Export CSV
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl shadow-xl p-4 border-2 border-gray-200 flex items-center justify-between">
                                <p className="text-base text-gray-700 font-semibold">
                                    Showing <span className="font-bold text-blue-700">{filteredAoisInsideDrawn.length}</span> of{' '}
                                    <span className="font-bold text-blue-700">{rawOrdersInsideDrawn.length}</span> orders in drawn area
                                </p>
                                <div className="relative">
                                    <button onClick={() => setShowColumnDropdown(!showColumnDropdown)}
                                        className="px-4 py-2 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 font-semibold text-gray-700">
                                        <Eye className="w-4 h-4" /> Columns
                                    </button>
                                    {showColumnDropdown && (
                                        <div className="absolute right-0 mt-2 w-64 bg-white border-2 border-gray-300 rounded-lg shadow-2xl z-50 max-h-96 overflow-y-auto">
                                            <div className="p-3 border-b-2 border-gray-200 font-semibold text-gray-900">Show/Hide Columns</div>
                                            {['Order ID', 'PO ID', 'Client', 'Vendor', 'Sensors', 'Status', 'Priority', 'Order Type', 'Organization Type', 'Organization', 'Created'].map(col => (
                                                <label key={col} className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 cursor-pointer">
                                                    <input type="checkbox" checked={!hiddenColumns.has(col)}
                                                        onChange={(e) => {
                                                            const newHidden = new Set(hiddenColumns);
                                                            if (e.target.checked) newHidden.delete(col); else newHidden.add(col);
                                                            setHiddenColumns(newHidden);
                                                        }} className="w-4 h-4 cursor-pointer" />
                                                    <span className="text-sm text-gray-700">{col}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-gray-200">
                                <div
                                    ref={topScrollRef}
                                    className="overflow-x-scroll overflow-y-hidden bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b-2 border-blue-200"
                                    style={{ height: '18px' }}
                                >
                                    <div className="scroll-phantom" style={{ height: '1px', width: '3000px' }}></div>
                                </div>

                                <div className="overflow-x-auto">
                                    <div ref={tableScrollRef} className="max-h-[600px] overflow-x-auto overflow-y-auto">
                                        <table ref={tableRef} className="w-full border-collapse" style={{ minWidth: '1600px' }}>
                                            <thead className="sticky top-0 z-10">
                                                <tr className="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600">
                                                    {isColumnVisible('Order ID') && <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-white border-r border-white/20">Order ID</th>}
                                                    {isColumnVisible('PO ID') && <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-white border-r border-white/20">PO ID</th>}
                                                    {isColumnVisible('Client') && <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-white border-r border-white/20">Client</th>}
                                                    {isColumnVisible('Vendor') && <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-white border-r border-white/20">Vendor</th>}
                                                    {isColumnVisible('Sensors') && <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-white border-r border-white/20">Sensors</th>}
                                                    {isColumnVisible('Status') && <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-white border-r border-white/20">Status</th>}
                                                    {isColumnVisible('Priority') && <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-white border-r border-white/20">Priority</th>}
                                                    {isColumnVisible('Order Type') && <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-white border-r border-white/20">Order Type</th>}
                                                    {isColumnVisible('Organization Type') && <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-white border-r border-white/20">Org Type</th>}
                                                    {isColumnVisible('Organization') && <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-white border-r border-white/20">Organization</th>}
                                                    {isColumnVisible('Created') && <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-white">Created</th>}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y-2 divide-gray-200 bg-white">
                                                {currentOrders.map((aoi, index) => {
                                                    const p = aoi.properties || {};
                                                    const vendorId = p.vendorId;
                                                    return (
                                                        <tr key={`row-${p._polygonKey || index}`}
                                                            className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 cursor-pointer"
                                                            onClick={() => setSelectedAoi(p)}>
                                                            {isColumnVisible('Order ID') && <td className="px-4 py-4 whitespace-nowrap border-r border-gray-200">
                                                                <span className="text-sm font-bold text-blue-700 bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200">{p.orderId || 'N/A'}</span>
                                                            </td>}
                                                            {isColumnVisible('PO ID') && <td className="px-4 py-4 whitespace-nowrap border-r border-gray-200">
                                                                <span className="text-sm text-indigo-700 font-semibold bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">{p.poId || 'N/A'}</span>
                                                            </td>}
                                                            {isColumnVisible('Client') && <td className="px-4 py-4 border-r border-gray-200">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="p-1.5 bg-gray-100 rounded-full"><User className="w-4 h-4 text-gray-600" /></div>
                                                                    <span className="text-sm font-semibold text-gray-800">{p.clientName || 'N/A'}</span>
                                                                </div>
                                                            </td>}
                                                            {isColumnVisible('Vendor') && <td className="px-4 py-4 whitespace-nowrap border-r border-gray-200">
                                                                <span className={`text-sm font-semibold px-3 py-1.5 rounded-lg ${vendorId && vendorId !== 'vendor-both' ? 'bg-green-100 text-green-700 border border-green-200' : vendorId === 'vendor-both' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-orange-100 text-orange-700 border border-orange-200'}`}>
                                                                    {getVendorLabel(vendorId)}
                                                                </span>
                                                            </td>}
                                                            {isColumnVisible('Sensors') && <td className="px-4 py-3 border-r border-gray-200" style={{ maxWidth: '220px', minWidth: '200px' }}>
                                                                <div className="space-y-1">
                                                                    {(p.sensorList || []).length > 0 ? (
                                                                        <>
                                                                            {Array.from({ length: Math.ceil(p.sensorList.length / 4) }).map((_, rowIdx) => (
                                                                                <div key={rowIdx} className="flex flex-wrap gap-1">
                                                                                    {p.sensorList.slice(rowIdx * 4, (rowIdx + 1) * 4).map((sensor, idx) => (
                                                                                        <span key={idx} className="inline-block text-xs font-semibold bg-yellow-100 text-yellow-800 px-2 py-1 rounded-md border border-yellow-200">{sensor}</span>
                                                                                    ))}
                                                                                </div>
                                                                            ))}
                                                                            <span className="inline-block mt-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{p.sensorList.length} total</span>
                                                                        </>
                                                                    ) : <span className="text-xs text-gray-500">No sensors</span>}
                                                                </div>
                                                            </td>}
                                                            {isColumnVisible('Status') && <td className="px-4 py-4 whitespace-nowrap border-r border-gray-200">
                                                                <span className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm ${STATUS_COLORS[p.status] || 'bg-gray-100 text-gray-700 border border-gray-200'}`}>{formatStatusLabel(p.status) || 'N/A'}</span>
                                                            </td>}
                                                            {isColumnVisible('Priority') && <td className="px-4 py-4 whitespace-nowrap border-r border-gray-200">
                                                                <span className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm ${PRIORITY_COLORS[p.priority] || 'bg-gray-100 text-gray-700 border border-gray-200'}`}>{p.priority || 'N/A'}</span>
                                                            </td>}
                                                            {isColumnVisible('Order Type') && <td className="px-4 py-4 whitespace-nowrap border-r border-gray-200">
                                                                <span className="text-sm font-semibold text-gray-800 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">{p.orderType || 'N/A'}</span>
                                                            </td>}
                                                            {isColumnVisible('Organization Type') && <td className="px-4 py-4 whitespace-nowrap border-r border-gray-200">
                                                                <span className="text-sm font-semibold text-gray-800 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-300">{p.organizationType || 'N/A'}</span>
                                                            </td>}
                                                            {isColumnVisible('Organization') && <td className="px-4 py-4 border-r border-gray-200">
                                                                <span className="text-sm font-semibold text-gray-800 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-300">{p.organization || 'N/A'}</span>
                                                            </td>}
                                                            {isColumnVisible('Created') && <td className="px-4 py-4 whitespace-nowrap">
                                                                <div className="flex items-center gap-2">
                                                                    <Calendar className="w-4 h-4 text-blue-500" />
                                                                    <span className="text-sm text-gray-700 font-medium">{formatDate(p.createdDate)}</span>
                                                                </div>
                                                            </td>}
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {totalPages > 1 && (
                                    <Pagination
                                        currentPage={currentPage} totalPages={totalPages}
                                        onPageChange={(p) => { setCurrentPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                        totalItems={filteredAoisInsideDrawn.length}
                                        startIndex={indexOfFirstOrder} endIndex={indexOfLastOrder}
                                    />
                                )}
                            </div>
                        </>
                    )}

                    {/* No results after filter */}
                    {showDrawMode && rawOrdersInsideDrawn.length > 0 && filteredAoisInsideDrawn.length === 0 && filtersActive && filterVersion > 0 && (
                        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-16 text-center">
                            <div className="inline-block p-5 bg-gray-100 rounded-full mb-4">
                                <Package className="w-16 h-16 text-gray-400" />
                            </div>
                            <p className="text-gray-700 font-bold text-xl">No orders match your filters</p>
                            <p className="text-gray-500 text-base mt-2 mb-6">
                                {rawOrdersInsideDrawn.length} polygon(s) found in drawn area but none match current filters
                            </p>
                            <button onClick={clearFilters} className="px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 font-bold shadow-lg">
                                Clear Filters
                            </button>
                        </div>
                    )}

                </div>
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
                .animate-spin { animation: spin 1s linear infinite; }
                .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
                .leaflet-container { height: 100%; width: 100%; z-index: 1; }
                .leaflet-tile { max-width: none !important; max-height: none !important; }
                table { border-collapse: separate; border-spacing: 0; }
                tbody tr { border-bottom: 2px solid #e5e7eb; }
                tbody tr:last-child { border-bottom: none; }
                thead { box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                ::-webkit-scrollbar { width: 12px; height: 12px; }
                ::-webkit-scrollbar-track { background: linear-gradient(to bottom, #f1f5f9, #e2e8f0); border-radius: 6px; }
                ::-webkit-scrollbar-thumb { background: linear-gradient(to right, #3b82f6, #6366f1, #8b5cf6); border-radius: 6px; border: 2px solid #f1f5f9; }
                ::-webkit-scrollbar-thumb:hover { background: linear-gradient(to right, #2563eb, #4f46e5, #7c3aed); }
                .overflow-y-auto::-webkit-scrollbar { width: 10px; }
                .overflow-y-auto::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 5px; }
                .overflow-y-auto::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 5px; }
                .overflow-y-auto::-webkit-scrollbar-thumb:hover { background: #64748b; }
            `}</style>
        </div>
    );
}