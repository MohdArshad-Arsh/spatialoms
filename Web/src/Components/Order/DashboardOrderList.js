import React, { useState, useEffect, useRef } from 'react';
import { withRouter } from 'react-router-dom';
import { MapContainer, GeoJSON, useMap, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import shpwrite from "shp-write";
import { Download } from 'lucide-react';
import {
    Search, Filter, Eye, MapPin, User, Package, ChevronDown, X,
    Maximize2, Minimize2, RefreshCw, AlertCircle, Calendar, Loader, Edit,
    FileText, ChevronLeft, ChevronRight, Archive, ArchiveRestore
} from 'lucide-react';
import { properties } from '../../Properties/Properties';

/* ─────────────────────────────────────────────────────────────── */
/*  Injected styles — keeps existing colour palette, lifts polish  */
/* ─────────────────────────────────────────────────────────────── */
const INJECTED_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

.dol-wrap * { box-sizing: border-box; }
.dol-wrap { font-family: 'Plus Jakarta Sans', sans-serif; }

/* ── Table shell ── */
.dol-shell {
  background: #fff;
  border-radius: 20px;
  border: 1.5px solid #e2e8f0;
  box-shadow: 0 4px 24px rgba(99,102,241,0.07), 0 1px 4px rgba(0,0,0,0.04);
  overflow: hidden;
}

/* ── Top phantom scrollbar ── */
.dol-top-scroll {
  overflow-x: scroll;
  overflow-y: hidden;
  height: 10px;
  background: linear-gradient(90deg, #eef2ff 0%, #f0f9ff 50%, #faf5ff 100%);
  border-bottom: 1.5px solid #c7d2fe;
}
.dol-top-scroll::-webkit-scrollbar       { height: 10px; }
.dol-top-scroll::-webkit-scrollbar-track { background: transparent; }
.dol-top-scroll::-webkit-scrollbar-thumb { background: #a5b4fc; border-radius: 5px; }

/* ── Table scroll area ── */
.dol-scroll { overflow-x: auto; }
.dol-scroll::-webkit-scrollbar       { height: 6px; }
.dol-scroll::-webkit-scrollbar-track { background: #f1f5f9; }
.dol-scroll::-webkit-scrollbar-thumb { background: #c7d2fe; border-radius: 3px; }

/* ── Table ── */
.dol-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  min-width: 1800px;
  font-size: 13px;
}

/* ── Header ── */
.dol-thead tr {
  background: linear-gradient(90deg, #4f46e5 0%, #2563eb 55%, #7c3aed 100%);
}
.dol-thead th {
  padding: 14px 16px;
  text-align: left;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.9px;
  text-transform: uppercase;
  color: rgba(255,255,255,0.92);
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 10;
  border-right: 1px solid rgba(255,255,255,0.15);
}
.dol-thead th:last-child { border-right: none; }
.dol-thead th::after {
  content: '';
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, rgba(255,255,255,0.3), rgba(255,255,255,0));
}

/* ── Rows ── */
.dol-tbody tr {
  transition: background 0.15s;
  border-bottom: 1px solid #f1f5f9;
}
.dol-tbody tr:last-child { border-bottom: none; }
.dol-tbody tr:hover { background: linear-gradient(90deg, #eef2ff, #f0f9ff 60%, #faf5ff); }

.dol-td {
  padding: 13px 16px;
  vertical-align: middle;
  border-right: 1px solid #f1f5f9;
  color: #374151;
}
.dol-td:last-child { border-right: none; }

/* ── Cell chips ── */
.chip {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 10px; border-radius: 8px;
  font-size: 12px; font-weight: 600; white-space: nowrap;
  line-height: 1.6;
}
.chip-order-id  { background: #dbeafe; color: #1d4ed8; border: 1px solid #bfdbfe; font-family: 'JetBrains Mono', monospace; font-size: 11.5px; }
.chip-po-id     { background: #ede9fe; color: #5b21b6; border: 1px solid #ddd6fe; font-family: 'JetBrains Mono', monospace; font-size: 11.5px; }
.chip-vendor-a  { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
.chip-vendor-b  { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
.chip-vendor-both{ background: #f3e8ff; color: #7e22ce; border: 1px solid #e9d5ff; }
.chip-vendor-na { background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; }
.chip-sensor    { background: #fefce8; color: #92400e; border: 1px solid #fde68a; font-size: 11px; padding: 2px 7px; }
.chip-priority-HIGH  { background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; }
.chip-priority-MEDIUM{ background: #fef9c3; color: #92400e; border: 1px solid #fde68a; }
.chip-priority-LOW   { background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; }
.chip-price     { background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; font-family: 'JetBrains Mono', monospace; }

/* Status chips — exact original colours */
.chip-status-CREATED            { background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; }
.chip-status-PENDING            { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
.chip-status-PARTIALLY_COMPLETED{ background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
.chip-status-CANCELLED          { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
.chip-status-COMPLETED          { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }

/* ── Client cell ── */
.client-cell { display: flex; align-items: center; gap: 8px; }
.client-avatar {
  width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0;
  background: linear-gradient(135deg, #e0e7ff, #ede9fe);
  display: flex; align-items: center; justify-content: center;
}

/* ── Progress bar ── */
.progress-wrap { min-width: 130px; }
.progress-row  { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
.progress-pct  { font-size: 12px; font-weight: 700; color: #1e40af; }
.progress-track{ height: 6px; background: #e0e7ff; border-radius: 999px; overflow: hidden; }
.progress-fill {
  height: 100%; border-radius: 999px;
  background: linear-gradient(90deg, #4f46e5, #2563eb);
  transition: width 0.5s ease;
  position: relative;
}
.progress-fill::after {
  content: '';
  position: absolute; top: 0; right: 0; bottom: 0; width: 30%;
  background: rgba(255,255,255,0.35);
  border-radius: 999px;
}

/* ── Date cell ── */
.date-cell { display: flex; flex-direction: column; gap: 1px; }
.date-main { font-size: 12.5px; color: #374151; font-weight: 500; }
.date-sub  { font-size: 10.5px; color: #9ca3af; }

/* ── Sensor grid ── */
.sensor-grid { display: flex; flex-wrap: wrap; gap: 4px; max-width: 220px; }
.sensor-count { font-size: 10.5px; color: #6b7280; background: #f9fafb; border: 1px solid #e5e7eb; padding: 1px 7px; border-radius: 999px; margin-top: 2px; }

/* ── Pagination ── */
.dol-pagination {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px;
  border-top: 1.5px solid #e0e7ff;
  background: linear-gradient(90deg, #f8faff 0%, #faf5ff 100%);
}
.dol-pagination-info { font-size: 12.5px; color: #6b7280; font-weight: 500; }
.dol-pagination-info strong { color: #374151; }
.dol-pager { display: flex; align-items: center; gap: 6px; }
.page-btn {
  width: 34px; height: 34px; border-radius: 9px; border: 1.5px solid #d1d5db;
  background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center;
  font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12.5px; font-weight: 600;
  color: #374151; transition: all 0.15s;
}
.page-btn:hover:not(:disabled)  { border-color: #4f46e5; color: #4f46e5; background: #eef2ff; }
.page-btn:disabled               { opacity: 0.35; cursor: not-allowed; }
.page-btn.active                 {
  background: linear-gradient(135deg, #4f46e5, #2563eb);
  border-color: transparent; color: #fff;
  box-shadow: 0 2px 8px rgba(79,70,229,0.35);
}
.page-ellipsis { padding: 0 4px; color: #9ca3af; font-size: 13px; }

/* ── Empty / loading states ── */
.dol-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 64px 24px; gap: 12px; }
.dol-state-icon { opacity: 0.35; }
.dol-state-title { font-size: 15px; font-weight: 700; color: #374151; }
.dol-state-sub   { font-size: 13px; color: #9ca3af; }

/* ── Row fade-in ── */
@keyframes rowIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
.dol-tbody tr { animation: rowIn 0.22s ease both; }
${Array.from({length:10},(_,i)=>`
.dol-tbody tr:nth-child(${i+1}) { animation-delay: ${i*0.03}s; }
`).join('')}
`;

/* ─── Fix Leaflet icons ─────────────────────────────────────── */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    iconUrl:       "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    shadowUrl:     "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

/* ─── Colour maps (original palette preserved) ─────────────── */
const STATUS_COLORS = {
    'CREATED':             'bg-orange-100 text-orange-700 border border-orange-200',
    'PENDING':             'bg-blue-100 text-blue-700 border border-blue-200',
    'PARTIALLY_COMPLETED': 'bg-blue-100 text-blue-700 border border-blue-200',
    'CANCELLED':           'bg-red-100 text-red-700 border border-red-200',
    'COMPLETED':           'bg-green-100 text-green-700 border border-green-200',
    'Completed':           'bg-green-100 text-green-700 border border-green-200',
};
const PRIORITY_COLORS = {
    'HIGH':   'bg-red-100 text-red-700 border border-red-200',
    'MEDIUM': 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    'LOW':    'bg-gray-100 text-gray-700 border border-gray-200',
};

/* ─── Auth hook ─────────────────────────────────────────────── */
const useAuth = () => ({
    token:           sessionStorage.getItem('jwtToken'),
    isAuthenticated: !!sessionStorage.getItem('jwtToken'),
    user:            sessionStorage.getItem('username'),
});

/* ─── Map helpers ───────────────────────────────────────────── */
function DualTileLayer({ worldMaxZoom = 8, saudiMaxZoom = 13 }) {
    const map = useMap();
    useEffect(() => {
        const basename    = process.env.PUBLIC_URL || '';
        const saudiBounds = L.latLngBounds([16.0, 34.5], [32.5, 56.0]);

        const createTileLayer = (fn, opts) => {
            const TL = L.TileLayer.extend({ getTileUrl: fn });
            return new TL('', { ...opts, tileSize: 256, noWrap: false, crossOrigin: 'anonymous',
                errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=' });
        };

        const worldLayer = createTileLayer(function (c) {
            let { z, x, y } = c;
            if (z > worldMaxZoom) {
                const s = Math.pow(2, z - worldMaxZoom);
                return `${window.location.origin}${basename}/tiles/${worldMaxZoom}/${Math.floor(x/s)}/${Math.floor(y/s)}.png`;
            }
            return `${properties.TilesBase}/tiles/${z}/${x}/${y}.png`;
        }, { attribution:'© OSM (Offline)', minZoom:2, maxZoom:13, maxNativeZoom:worldMaxZoom });

        const saudiLayer = createTileLayer(function (c) {
            const { z, x, y } = c;
            const center = this._tileCoordsToBounds(c).getCenter();
            if (z >= 9 && z <= saudiMaxZoom && saudiBounds.contains(center))
                return `${properties.TilesBase}/Saudi_tiles/${z}/${x}/${y}.png`;
            return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
        }, { attribution:'© OSM (Saudi)', minZoom:9, maxZoom:saudiMaxZoom });

        worldLayer.addTo(map);
        saudiLayer.addTo(map);
        return () => { map.removeLayer(worldLayer); map.removeLayer(saudiLayer); };
    }, [map, worldMaxZoom, saudiMaxZoom]);
    return null;
}

function MapHandler({ onMapReady, allAois }) {
    const map = useMap();
    useEffect(() => { if (onMapReady) onMapReady(map); }, [map, onMapReady]);
    useEffect(() => {
        if (!map || !allAois?.length) return;
        try {
            const bounds = allAois.map(a => { try { const l = L.geoJSON(a); return l.getBounds().isValid() ? l.getBounds() : null; } catch { return null; } }).filter(Boolean);
            if (bounds.length) { const g = L.featureGroup(bounds.map(b => L.rectangle(b))); map.fitBounds(g.getBounds(), { padding:[20,20] }); }
        } catch (e) { console.error(e); }
    }, [map, allAois]);
    return null;
}

/* ─── Helpers ───────────────────────────────────────────────── */
const formatDate = d => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' }); }
    catch { return '—'; }
};
const formatStatusLabel = s => {
    if (!s) return 'N/A';
    if (s === 'PARTIALLY_COMPLETED') return 'Partial';
    return s.replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase());
};
const vendorChipClass = id =>
    !id            ? 'chip chip-vendor-na'   :
    id==='vendor-both' ? 'chip chip-vendor-both' :
    'chip chip-vendor-a';

const statusChipClass = s => `chip chip-status-${s}`;
const priorityChipClass = p => `chip chip-priority-${p}` || 'chip chip-priority-LOW';

/* ─── Main component ────────────────────────────────────────── */
const DashboardOrderList = ({ history, showMap = false }) => {
    const { token } = useAuth();
    const [orders,       setOrders]       = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [error,        setError]        = useState(null);
    const [currentPage,  setCurrentPage]  = useState(1);
    const ordersPerPage = 10;

    const tableScrollRef = useRef(null);
    const tableRef       = useRef(null);
    const topScrollRef   = useRef(null);

    const [appliedFilters] = useState({ search:'', status:'all', vendor:'all', sensor:'all', priority:'all', fromDate:'', toDate:'' });

    /* transform */
    const transformOrder = o => ({
        id:             o.id,
        orderId:        (o.orderId ?? o.id)?.toString(),
        poId:           (o.poId ?? '')?.toString(),
        client:         (o.clientName ?? '')?.toString(),
        vendor:         o.vendorNo ? (o.vendorNo==='vendor-a'?'Vendor A':o.vendorNo==='vendor-b'?'Vendor B':o.vendorNo==='vendor-both'?'Both A & B':'Not Assigned') : 'Not Assigned',
        vendorId:       o.vendorNo,
        sensors:        o.sansor?.join(', ') || '',
        sensorList:     o.sansor || [],
        priority:       o.priority,
        price:          o.price ?? 0,
        status:         o.status,
        statusColor:    STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-700 border border-gray-200',
        progress:       Math.round(o.percentageCompleted) || 0,
        totalArea:      Math.round(o.totalArea) || 0,
        collectedArea:  Math.round(o.totalArea - o.remainingArea) || 0,
        unfulfilledArea:Math.round(o.remainingArea) || 0,
        createdDate:    o.createdDate,
        lastModifiedDate:o.lastModifiedDate,
        createdBy:      o.createdBy,
        lastModifiedBy: o.lastModifiedBy,
    });

    /* fetch */
    const fetchOrders = async () => {
        if (!token) { setError('Please login'); setLoading(false); return; }
        setLoading(true);
        try {
            const res = await fetch(properties.Port + properties.getAllOrders, { headers:{ Authorization:`Bearer ${token}` } });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            setOrders((await res.json()).map(transformOrder));
            setError(null);
        } catch(e) { setError(e.message); }
        finally { setLoading(false); }
    };
    useEffect(() => { fetchOrders(); }, [token]);

    /* scrollbar sync */
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
    }, [orders, currentPage]);

    /* filter / sort */
    const filteredOrders = orders.filter(o => {
        const matchSearch   = !appliedFilters.search    || [o.orderId,o.poId,o.client,o.vendor].some(v=>String(v??'').toLowerCase().includes(appliedFilters.search.toLowerCase()));
        const matchStatus   = appliedFilters.status==='all'   || o.status===appliedFilters.status;
        const matchVendor   = appliedFilters.vendor==='all'   || o.vendorId===appliedFilters.vendor;
        const matchPriority = appliedFilters.priority==='all' || o.priority===appliedFilters.priority;
        const matchSensor   = appliedFilters.sensor==='all'   || (o.sensorList||[]).some(s=>s.toLowerCase().includes(appliedFilters.sensor.toLowerCase()));
        return matchSearch && matchStatus && matchVendor && matchSensor && matchPriority;
    });
    const sortedOrders = [...filteredOrders].sort((a,b) => b.id - a.id);

    const totalPages      = Math.ceil(sortedOrders.length / ordersPerPage);
    const indexOfFirst    = (currentPage-1) * ordersPerPage;
    const indexOfLast     = indexOfFirst + ordersPerPage;
    const currentOrders   = sortedOrders.slice(indexOfFirst, indexOfLast);

    /* map state */
    const [mapInstance,   setMapInstance]   = useState(null);
    const [selectedAoi,   setSelectedAoi]   = useState(null);
    const [displayedAois, setDisplayedAois] = useState([]);

    useEffect(() => {
        const fetchAois = async () => {
            if (!currentOrders.length || !token) return;
            try {
                const res = await fetch(properties.Port + properties.getAllAoi, { headers:{ Authorization:`Bearer ${token}` } });
                if (!res.ok) return;
                const aoiData = await res.json();
                setDisplayedAois(
                    aoiData
                        .filter(item => currentOrders.some(o => String(o.poId)===String(item.poId) || String(o.orderId)===String(item.orderId||item.id)))
                        .map(item => {
                            const aoi = item.abj || item.aoi || item;
                            return { ...aoi, properties:{ ...aoi.properties, poId:item.poId, orderId:item.orderId||item.id, clientName:item.clientName, status:item.status } };
                        })
                );
            } catch(e) { console.error(e); }
        };
        fetchAois();
    }, [currentPage, token, orders.length]);

    /* ── Pagination component ── */
    const Pagination = () => {
        if (totalPages <= 1) return null;
        const pages = [];
        if (totalPages <= 5) { for(let i=1;i<=totalPages;i++) pages.push(i); }
        else if (currentPage <= 3) { for(let i=1;i<=4;i++) pages.push(i); pages.push('...'); pages.push(totalPages); }
        else if (currentPage >= totalPages-2) { pages.push(1); pages.push('...'); for(let i=totalPages-3;i<=totalPages;i++) pages.push(i); }
        else { pages.push(1); pages.push('...'); pages.push(currentPage-1); pages.push(currentPage); pages.push(currentPage+1); pages.push('...'); pages.push(totalPages); }

        return (
            <div className="dol-pagination">
                <p className="dol-pagination-info">
                    Showing <strong>{indexOfFirst+1}</strong>–<strong>{Math.min(indexOfLast,sortedOrders.length)}</strong> of <strong>{sortedOrders.length}</strong> orders
                </p>
                <div className="dol-pager">
                    <button className="page-btn" onClick={()=>setCurrentPage(p=>p-1)} disabled={currentPage===1}>
                        <ChevronLeft style={{width:15,height:15}} />
                    </button>
                    {pages.map((p,i) =>
                        p==='...' ? <span key={`e${i}`} className="page-ellipsis">…</span> :
                        <button key={p} className={`page-btn ${currentPage===p?'active':''}`} onClick={()=>setCurrentPage(p)}>{p}</button>
                    )}
                    <button className="page-btn" onClick={()=>setCurrentPage(p=>p+1)} disabled={currentPage===totalPages}>
                        <ChevronRight style={{width:15,height:15}} />
                    </button>
                </div>
            </div>
        );
    };

    /* ── Loading / error states ── */
    if (loading) return (
        <div className="dol-wrap">
            <style>{INJECTED_STYLES}</style>
            <div className="dol-shell">
                <div className="dol-state">
                    <RefreshCw className="dol-state-icon" style={{width:40,height:40,color:'#4f46e5',animation:'spin 1s linear infinite'}} />
                    <p className="dol-state-title">Loading orders…</p>
                </div>
            </div>
        </div>
    );

    if (error) return (
        <div className="dol-wrap">
            <style>{INJECTED_STYLES}</style>
            <div className="dol-shell">
                <div className="dol-state">
                    <AlertCircle className="dol-state-icon" style={{width:40,height:40,color:'#ef4444'}} />
                    <p className="dol-state-title">Failed to load</p>
                    <p className="dol-state-sub">{error}</p>
                    <button onClick={fetchOrders} style={{marginTop:8,padding:'8px 20px',background:'#4f46e5',color:'#fff',border:'none',borderRadius:10,fontFamily:'inherit',fontWeight:600,cursor:'pointer',fontSize:13}}>
                        Retry
                    </button>
                </div>
            </div>
        </div>
    );

    /* ── Main render ── */
    return (
        <div className="dol-wrap" style={{maxWidth:'100%',margin:'0 auto'}}>
            <style>{INJECTED_STYLES}</style>

            <div className="dol-shell">
                {/* Top Scrollbar - FUNCTIONAL */}
                <div
                    ref={topScrollRef}
                    className="overflow-x-scroll overflow-y-hidden bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b-2 border-blue-200"
                    style={{ height: '18px' }}
                >
                    <div className="scroll-phantom" style={{ height: '1px', width: '2000px' }}></div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <div className="dol-scroll" ref={tableScrollRef} style={{ maxHeight: '600px', overflowX: 'auto', overflowY: 'auto' }}>
                        <table ref={tableRef} className="dol-table">
                            <thead className="dol-thead">
                                <tr>
                                    {['Order ID','PO ID','Client','Vendor','Sensors','Priority','Price','Status','Progress','Created','Created By','Modified','Modified By'].map(h => (
                                        <th key={h}>{h}</th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody className="dol-tbody">
                                {currentOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={13} style={{padding:0}}>
                                            <div className="dol-state">
                                                <Package className="dol-state-icon" style={{width:40,height:40,color:'#4f46e5'}} />
                                                <p className="dol-state-title">No orders found</p>
                                                <p className="dol-state-sub">Try adjusting your filters</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : currentOrders.map(o => (
                                    <tr key={o.id}>
                                        {/* Order ID */}
                                        <td className="dol-td">
                                            <span className="chip chip-order-id">#{o.orderId}</span>
                                        </td>

                                        {/* PO ID */}
                                        <td className="dol-td">
                                            <span className="chip chip-po-id">{o.poId || '—'}</span>
                                        </td>

                                        {/* Client */}
                                        <td className="dol-td">
                                            <div className="client-cell">
                                                <div className="client-avatar">
                                                    <User style={{width:13,height:13,color:'#4f46e5'}} />
                                                </div>
                                                <span style={{fontSize:12.5,fontWeight:600,color:'#1e293b',whiteSpace:'nowrap'}}>{o.client || '—'}</span>
                                            </div>
                                        </td>

                                        {/* Vendor */}
                                        <td className="dol-td">
                                            <span className={vendorChipClass(o.vendorId)}>{o.vendor}</span>
                                        </td>

                                        {/* Sensors */}
                                        <td className="dol-td">
                                            {o.sensorList.length > 0 ? (
                                                <div>
                                                    <div className="sensor-grid">
                                                        {o.sensorList.slice(0,6).map((s,i) => (
                                                            <span key={i} className="chip chip-sensor">{s}</span>
                                                        ))}
                                                    </div>
                                                    {o.sensorList.length > 0 && (
                                                        <span className="sensor-count">{o.sensorList.length} sensor{o.sensorList.length>1?'s':''}</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span style={{fontSize:12,color:'#9ca3af'}}>None</span>
                                            )}
                                        </td>

                                        {/* Priority */}
                                        <td className="dol-td">
                                            <span className={priorityChipClass(o.priority)}>{o.priority || 'N/A'}</span>
                                        </td>

                                        {/* Price */}
                                        <td className="dol-td">
                                            <span className="chip chip-price">﷼{(o.price||0).toLocaleString()}</span>
                                        </td>

                                        {/* Status */}
                                        <td className="dol-td">
                                            <span className={statusChipClass(o.status)}>{formatStatusLabel(o.status)}</span>
                                        </td>

                                        {/* Progress */}
                                        <td className="dol-td">
                                            <div className="progress-wrap">
                                                <div className="progress-row">
                                                    <span className="progress-pct">{o.progress}%</span>
                                                </div>
                                                <div className="progress-track">
                                                    <div className="progress-fill" style={{width:`${o.progress}%`}} />
                                                </div>
                                            </div>
                                        </td>

                                        {/* Created */}
                                        <td className="dol-td">
                                            <div className="date-cell">
                                                <span className="date-main">{formatDate(o.createdDate)}</span>
                                            </div>
                                        </td>

                                        {/* Created By */}
                                        <td className="dol-td">
                                            <span style={{fontSize:12.5,color:'#374151',fontWeight:500}}>{o.createdBy||'—'}</span>
                                        </td>

                                        {/* Modified */}
                                        <td className="dol-td">
                                            <div className="date-cell">
                                                <span className="date-main">{formatDate(o.lastModifiedDate)}</span>
                                            </div>
                                        </td>

                                        {/* Modified By */}
                                        <td className="dol-td">
                                            <span style={{fontSize:12.5,color:'#374151',fontWeight:500}}>{o.lastModifiedBy||'—'}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <Pagination />
            </div>

            {/* Map */}
            {showMap && (
                <div style={{background:'#fff',borderRadius:20,border:'1.5px solid #e2e8f0',boxShadow:'0 4px 24px rgba(99,102,241,0.07)',overflow:'hidden',marginTop:20,position:'relative',height:600}}>
                    <MapContainer center={[20.5937,78.9629]} zoom={5} style={{height:'100%',width:'100%',backgroundColor:'#e8f5e9'}} maxZoom={13} minZoom={2}>
                        <DualTileLayer worldMaxZoom={8} saudiMaxZoom={13} />
                        <MapHandler allAois={displayedAois} onMapReady={setMapInstance} />
                        {displayedAois.map((aoi,i) => (
                            <GeoJSON key={`aoi-${i}-${aoi.properties?.poId}`} data={aoi}
                                style={{ color:`hsl(${(i*360)/(displayedAois.length||1)},70%,50%)`, weight:3, fillOpacity:0.3, fillColor:`hsl(${(i*360)/(displayedAois.length||1)},70%,60%)` }}
                                eventHandlers={{ click:()=>setSelectedAoi(aoi.properties) }}
                            >
                                <Popup>
                                    <div style={{minWidth:240,fontFamily:'Plus Jakarta Sans, sans-serif',padding:4}}>
                                        <h3 style={{fontWeight:700,fontSize:13,marginBottom:12,paddingBottom:8,borderBottom:'2px solid #c7d2fe',color:'#1e40af'}}>Order Details</h3>
                                        {[['PO ID',aoi.properties?.poId],['Client',aoi.properties?.clientName],['Status',aoi.properties?.status]].map(([l,v])=>(
                                            <div key={l} style={{marginBottom:8}}>
                                                <p style={{fontSize:10.5,color:'#6b7280',fontWeight:600,marginBottom:2}}>{l}</p>
                                                <p style={{fontSize:13,fontWeight:700,color:'#1e293b'}}>{v||'N/A'}</p>
                                            </div>
                                        ))}
                                    </div>
                                </Popup>
                            </GeoJSON>
                        ))}
                    </MapContainer>
                    {!loading && !displayedAois.length && (
                        <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(248,250,252,0.85)'}}>
                            <div style={{textAlign:'center'}}>
                                <AlertCircle style={{width:48,height:48,color:'#c7d2fe',margin:'0 auto 12px'}} />
                                <p style={{fontSize:15,fontWeight:700,color:'#374151'}}>No AOI Data</p>
                                <p style={{fontSize:13,color:'#9ca3af',marginTop:4}}>Map shows order boundaries when AOI data is available.</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default withRouter(DashboardOrderList);