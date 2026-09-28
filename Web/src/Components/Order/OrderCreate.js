import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { MapContainer, GeoJSON, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";
import * as turf from "@turf/turf";
import { MapPin, Upload, Check, AlertCircle, X } from 'lucide-react';
import shp from "shpjs";
import JSZip from "jszip";
import { kml } from "@tmcw/togeojson";

import { properties } from '../../Properties/Properties';

// Mock AuthContext



const AuthContext = React.createContext();
const useAuth = () => {
    const context = React.useContext(AuthContext);
    const token = sessionStorage.getItem('jwtToken');
    const username = sessionStorage.getItem('username');
    if (context && context.token) return context;
    return { token, isAuthenticated: !!token, user: username };
};

// Fix Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

const normalizeGeoJSON = (geo) => {
    if (!geo) throw new Error("Empty GeoJSON");

    // FeatureCollection → return as-is (keep ALL features)
    if (geo.type === "FeatureCollection") {
        const hasPolygons = geo.features.some(
            f => f.geometry &&
                (f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon")
        );
        if (!hasPolygons) throw new Error("No polygon found in file");
        return geo; // ✅ Return entire FeatureCollection
    }

    // Geometry → wrap in Feature
    if (geo.type === "Polygon" || geo.type === "MultiPolygon") {
        return { type: "Feature", properties: {}, geometry: geo };
    }

    // Already a Feature
    if (geo.type === "Feature") return geo;

    throw new Error("Unsupported geometry");
};

// Dual Tile Layer - World (Z:2-8) + Saudi Arabia (Z:9-13)
function DualTileLayer({ worldMaxZoom = 8, saudiMaxZoom = 13 }) {
    const map = useMap();

    useEffect(() => {
        const basename = process.env.PUBLIC_URL || '';
        const saudiBounds = L.latLngBounds([16.0, 34.5], [32.5, 56.0]);

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

// Component to auto-fit bounds when GeoJSON loads
function FitBoundsToGeoJSON({ geoJsonData }) {
    const map = useMap();

    useEffect(() => {
        if (geoJsonData) {
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

const SAUDI_BOUNDS = L.latLngBounds(
    [16.0, 34.5],   // SW
    [32.5, 56.0]    // NE
);

function ZoomToSaudi({ active }) {
    const map = useMap();
    const hasZoomed = React.useRef(false);

    useEffect(() => {
        if (!active || hasZoomed.current) return;

        map.flyToBounds(SAUDI_BOUNDS, {
            padding: [40, 40],
            maxZoom: 9,
            duration: 1.2
        });

        hasZoomed.current = true;
    }, [active, map]);

    return null;
}

// Zoom to drawn polygon
function ZoomToPolygon({ geoJsonData }) {
    const map = useMap();

    useEffect(() => {
        if (geoJsonData) {
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


// Draw Tool Component
function DrawTool({ setAoi, disabled }) {
    const map = useMap();
    const [drawnLayer] = useState(() => new L.FeatureGroup());

    useEffect(() => {
        if (!map || disabled) return;
        map.addLayer(drawnLayer);
        const drawControl = new L.Control.Draw({
            draw: {
                polygon: true,
                rectangle: true,
                circle: false,
                marker: false,
                polyline: false
            },
            edit: { featureGroup: drawnLayer },
        });
        map.addControl(drawControl);

        const onCreated = (e) => {
            drawnLayer.clearLayers();
            drawnLayer.addLayer(e.layer);
            const geo = e.layer.toGeoJSON();
            setAoi(geo);
        };

        const onDeleted = (e) => {
            try {
                drawnLayer.clearLayers();
                setAoi(null);
            } catch (err) {
                console.error('Error handling draw:deleted:', err);
            }
        };

        const onEdited = (e) => {
            try {
                let newGeo = null;
                if (e.layers) {
                    e.layers.eachLayer((layer) => {
                        newGeo = layer.toGeoJSON();
                    });
                }
                drawnLayer.clearLayers();
                if (newGeo) {
                    drawnLayer.addLayer(L.geoJSON(newGeo));
                    setAoi(newGeo);
                } else {
                    setAoi(null);
                }
            } catch (err) {
                console.error('Error handling draw:edited:', err);
            }
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

// MAIN COMPONENT - OrderCreate
export default function OrderCreate() {
    const [latLngPoints, setLatLngPoints] = useState([
        { lat: "", lng: "" }
    ]);

    const [mapKey, setMapKey] = useState(0);
    const [price, setPrice] = useState('');
    const { token, isAuthenticated, user } = useAuth();

    // Form state management
    const [formData, setFormData] = useState({
        poId: '',
        clientName: '',
        vendorNo: 'vendor-a',
        priority: '',
        organization_type: '',
        organization: '',
        sansor: [],
        aoiMethod: null,
        uploadAoi: null,
        drawAoi: null,
        totalArea: 0,
        perimeter: 0,
        price: '',
        orderType: '',
        contactPerson: '',
        contactNumber: '',
        email: ''
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDrawMap, setShowDrawMap] = useState(false);
    const [showUploadMap, setShowUploadMap] = useState(false);
    const [aoiReady, setAoiReady] = useState(false);
    const [clientOptions, setClientOptions] = useState([]);

    // Vendor data with associated sensors
    const vendors = useMemo(() => [
        {
            id: 'vendor-a',
            name: 'Vendor A',
            description: 'High-resolution imaging',
            available: true,
            sensors: ['Sensor 1', 'Sensor 2', 'Sensor 3', 'Sensor 4', 'Sensor 5', 'Sensor 6', 'Sensor 7', 'Sensor 8', 'Sensor 9', 'Sensor 10']
        },
        {
            id: 'vendor-b',
            name: 'Vendor B',
            description: 'Multi-spectral analysis',
            available: true,
            sensors: ['Sensor 11', 'Sensor 12', 'Sensor 13', 'Sensor 14', 'Sensor 15', 'Sensor 16', 'Sensor 17', 'Sensor 18', 'Sensor 19', 'Sensor 20']
        },
        {
            id: 'vendor-both',
            name: 'Both Vendors',
            description: 'Combined services (A + B)',
            available: true,
            sensors: ['Sensor 1', 'Sensor 2', 'Sensor 3', 'Sensor 4', 'Sensor 5', 'Sensor 6', 'Sensor 7', 'Sensor 8', 'Sensor 9', 'Sensor 10', 'Sensor 11', 'Sensor 12', 'Sensor 13', 'Sensor 14', 'Sensor 15', 'Sensor 16', 'Sensor 17', 'Sensor 18', 'Sensor 19', 'Sensor 20']
        }
    ], []);

    // Get available sensors based on selected vendor with grouping info
    const availableSensors = useMemo(() => {
        const selectedVendor = vendors.find(v => v.id === formData.vendorNo);
        if (!selectedVendor) return { sensors: [], grouped: false };

        return {
            sensors: selectedVendor.sensors,
            grouped: selectedVendor.id === 'vendor-both'
        };
    }, [formData.vendorNo, vendors]);

    // Setup axios with token
    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete axios.defaults.headers.common['Authorization'];
        }
    }, [token]);

    // Fetch client names for autocomplete hints
    useEffect(() => {
        let mounted = true;
        const fetchClients = async () => {
            if (!isAuthenticated || !token) return;
            try {
                const res = await fetch(properties.Port + properties.getAllClientName, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Failed to fetch client names');
                const data = await res.json();
                if (!mounted) return;
                if (Array.isArray(data)) {
                    const names = data.map(d => typeof d === 'string' ? d : (d.clientName || d.name || '')).filter(Boolean);
                    setClientOptions(Array.from(new Set(names)));
                }
            } catch (err) {
                console.error('Failed to load client suggestions:', err);
            }
        };
        fetchClients();
        return () => { mounted = false; };
    }, [token, isAuthenticated]);

    // Handle client name change with org auto-fill
    const handleClientNameChange = useCallback((value) => {
        handleInputChange('clientName', value);

        // Check if typed value matches a known organization
        const match = orgMap.find(
            o => o.name.toLowerCase() === value.toLowerCase()
        );

        if (match) {
            setFormData(prev => ({
                ...prev,
                clientName: value,
                organization_type: match.type,
                organization: match.name,
            }));
            // Clear related errors
            setErrors(prev => {
                const e = { ...prev };
                delete e.clientName;
                delete e.organization_type;
                delete e.organization;
                return e;
            });
        }
    }, [handleInputChange, orgMap]);

    // Handle input changes
    const handleInputChange = useCallback((field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    }, [errors]);

    // Handle vendor selection - clear sensors when vendor changes
    const handleVendorSelect = useCallback((vendorId) => {
        const vendor = vendors.find(v => v.id === vendorId);
        if (vendor && vendor.available) {
            setFormData(prev => ({
                ...prev,
                vendorNo: vendorId,
                sansor: []
            }));
        }
    }, [vendors]);

    // Handle sensor selection
    const handleSensorToggle = useCallback((sensor) => {
        setFormData(prev => {
            const isSelected = prev.sansor.includes(sensor);
            return {
                ...prev,
                sansor: isSelected
                    ? prev.sansor.filter(s => s !== sensor)
                    : [...prev.sansor, sensor]
            };
        });
    }, []);

    // Calculate AOI Area
    const calculateArea = useCallback((aoi) => {
    try {
        // For FeatureCollection, compute area of all features combined
        const target = aoi.type === "FeatureCollection"
            ? turf.union(...aoi.features.filter(f =>
                f.geometry?.type === "Polygon" || f.geometry?.type === "MultiPolygon"
              )) ?? aoi.features[0]
            : normalizeGeoJSON(aoi);

        const areaSqM = turf.area(target);
        const sqKm = areaSqM / 1_000_000;
        const length = turf.length(target, { units: 'kilometers' });

        setFormData(prev => ({
            ...prev,
            totalArea: parseFloat(sqKm.toFixed(2)),
            perimeter: parseFloat(length.toFixed(2))
        }));
    } catch (err) {
        // Fallback: sum individual areas
        try {
            const features = aoi.type === "FeatureCollection" ? aoi.features : [aoi];
            const totalSqM = features.reduce((sum, f) => sum + turf.area(f), 0);
            setFormData(prev => ({
                ...prev,
                totalArea: parseFloat((totalSqM / 1_000_000).toFixed(2)),
                perimeter: 0
            }));
        } catch (e) {
            console.error(e);
        }
    }
}, []);

    // Draw polygon from latitude/longitude points
    const drawPolygonFromLatLng = useCallback(() => {
        if (latLngPoints.length < 3) {
            alert("At least 3 points are required to draw a polygon");
            return;
        }

        try {
            const coordinates = latLngPoints.map(p => [
                parseFloat(p.lng),
                parseFloat(p.lat)
            ]);

            // Close polygon
            coordinates.push(coordinates[0]);

            const geoJson = {
                type: "Feature",
                properties: {},
                geometry: {
                    type: "Polygon",
                    coordinates: [coordinates]
                }
            };

            setFormData(prev => ({
                ...prev,
                aoiMethod: "draw",
                drawAoi: geoJson,
                uploadAoi: null
            }));

            calculateArea(geoJson);
            setShowDrawMap(true);
            setShowUploadMap(false);
            setAoiReady(true);

        } catch (err) {
            console.error(err);
            alert("Invalid latitude/longitude values");
        }
    }, [latLngPoints, calculateArea]);

    const handleGeoJSONUpload = async (e) => {
        const file = e.target.files[0];

        if (!file) return;

        setFormData(prev => ({
            ...prev,
            uploadAoi: null,
            drawAoi: null
        }));

        setShowUploadMap(false);
        setShowDrawMap(false);

        // ✅ increment ONLY ONCE per upload
        setMapKey(prev => prev + 1);

        const name = file.name.toLowerCase();

        try {
            let geoJson;

            // =========================
            // KMZ (HANDLE FIRST & EXIT)
            // =========================
            if (name.endsWith(".kmz")) {
                const zip = await JSZip.loadAsync(await file.arrayBuffer());

                const kmlFile = Object.values(zip.files).find(f =>
                    f.name.toLowerCase().endsWith(".kml")
                );

                if (!kmlFile) {
                    throw new Error("KMZ does not contain a KML file");
                }

                const kmlText = await kmlFile.async("text");
                const dom = new DOMParser().parseFromString(kmlText, "text/xml");

                geoJson = normalizeGeoJSON(kml(dom));

                setFormData(prev => ({
                    ...prev,
                    aoiMethod: "upload",
                    uploadAoi: geoJson,
                    drawAoi: null
                }));

                calculateArea(geoJson);
                setShowUploadMap(true);
                setShowDrawMap(false);

                return; // ✅ VERY IMPORTANT - Exit after KMZ processing
            }

            // =========================
            // SHAPEFILE ZIP (NOT KMZ)
            // =========================
            if (name.endsWith(".zip")) {
    geoJson = await shp(await file.arrayBuffer());
    // shpjs returns array of FeatureCollections or a single one
    if (Array.isArray(geoJson)) {
        // Merge all into one FeatureCollection
        geoJson = {
            type: "FeatureCollection",
            features: geoJson.flatMap(fc =>
                fc.type === "FeatureCollection" ? fc.features : [fc]
            )
        };
    }
}

            // =========================
            // KML
            // =========================
            else if (name.endsWith(".kml")) {
                const dom = new DOMParser().parseFromString(
                    await file.text(),
                    "text/xml"
                );
                geoJson = normalizeGeoJSON(kml(dom));
            }

            // =========================
            // GEOJSON
            // =========================
            else if (name.endsWith(".json") || name.endsWith(".geojson")) {
                geoJson = JSON.parse(await file.text());
            }

            else {
                throw new Error("Unsupported file format");
            }

            geoJson = normalizeGeoJSON(geoJson);

            setFormData(prev => ({
                ...prev,
                aoiMethod: "upload",
                uploadAoi: geoJson,
                drawAoi: null
            }));

            calculateArea(geoJson);
            setShowUploadMap(true);
            setShowDrawMap(false);
            setAoiReady(true);

        } catch (err) {
            console.error("AOI upload failed:", err);
            alert("Invalid AOI file:\n" + err.message);
        }
    };

    const handleDrawPolygon = useCallback(() => {
        setFormData(prev => ({
            ...prev,
            aoiMethod: 'draw',
            uploadAoi: null
        }));

        setShowUploadMap(false);
        setShowDrawMap(true);
    }, []);

    // Handle draw AOI
    const handleDrawAoi = useCallback((geo) => {
        setFormData(prev => ({
            ...prev,
            drawAoi: geo
        }));
        calculateArea(geo);
    }, [calculateArea]);

    // Form validation
    const validateForm = useCallback(() => {
        const newErrors = {};

        if (!formData.poId.trim()) {
            newErrors.poId = 'PO ID is required';
        }

        if (!formData.clientName.trim()) {
            newErrors.clientName = 'Client name is required';
        }

        if (!formData.priority) {
            newErrors.priority = 'Please select a priority type';
        }

        if (!formData.organization_type) {
            newErrors.organization_type = 'Please select an organization type';
        }

        if (formData.organization_type && !formData.organization) {
            newErrors.organization = 'Please select an organization';
        }

        // if (!formData.price) {
        //     newErrors.price = 'Price is required';\n        // }

        if (formData.sansor.length === 0) {
            newErrors.sensors = 'Please select at least one sensor';
        }

        if (!formData.aoiMethod) {
            newErrors.aoi = 'Please define area of interest';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData]);

    // Submit Order API
    const handleSubmit = useCallback(async () => {
        if (!validateForm()) {
            return;
        }

        if (!isAuthenticated || !token) {
            alert("Please login first!");
            return;
        }

        setIsSubmitting(true);

        try {
            const aoiToSend = formData.aoiMethod === 'upload' ? formData.uploadAoi : formData.drawAoi;
if (!aoiToSend) { alert("AOI Missing!"); return; }

// Calculate area across all features
const features = aoiToSend.type === "FeatureCollection"
    ? aoiToSend.features
    : [aoiToSend];
const areaSQM = features.reduce((sum, f) => sum + turf.area(f), 0);
const areaSQKM = areaSQM / 1_000_000;

            const req = {
                poId: formData.poId,
                clientName: formData.clientName,
                vendorNo: formData.vendorNo,
                priority: formData.priority,
                organization_type: formData.organization_type,
                organization: formData.organization,
                totalArea: Math.round(areaSQKM),
                orderType: formData.orderType,
                remainingArea: Math.round(areaSQKM),
                percentageCompleted: 0,
                sansor: formData.sansor,
                aoi: aoiToSend,
                //price: Number(formData.price),
                contactPerson: formData.contactPerson || null,
                contactNumber: formData.contactNumber ? Number(formData.contactNumber) : null,
                email: formData.email || null
            };

            const formDataToSend = new FormData();
            formDataToSend.append("req", new Blob([JSON.stringify(req)], { type: "application/json" }));
            console.log("Submitting order with data:", req);

            const res = await axios.post(
                properties.Port + properties.createOrder,
                formDataToSend
            );

            alert(res.data || "Order created successfully!");

            // Reset form
            setFormData({
                poId: '',
                clientName: '',
                vendorNo: 'vendor-a',
                priority: '',
                organization_type: '',
                organization: '',
                sansor: [],
                aoiMethod: null,
                uploadAoi: null,
                drawAoi: null,
                totalArea: 0,
                orderType: '',
                perimeter: 0,
                price: '',
                contactPerson: '',
                contactNumber: '',
                email: ''
            });
            setErrors({});
            setShowDrawMap(false);
            setShowUploadMap(false);

        } catch (err) {
            console.error("Order creation error:", err);

            if (err.response?.status === 401 || err.response?.status === 403) {
                alert("Session expired! Please login again.");
            } else {
                const errorMsg = err.response?.data?.message || err.response?.data || err.message;
                alert("Order creation failed: " + errorMsg);
            }
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, validateForm, isAuthenticated, token]);

    // Handle cancel
    const handleCancel = useCallback(() => {
        if (window.confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
            setFormData({
                poId: '',
                clientName: '',
                vendorNo: 'vendor-a',
                priority: '',
                organization_type: '',
                organization: '',
                sansor: [],
                aoiMethod: null,
                uploadAoi: null,
                drawAoi: null,
                totalArea: 0,
                perimeter: 0
            });
            setErrors({});
            setShowDrawMap(false);
            setShowUploadMap(false);
        }
    }, []);

    // Check if form is valid
    const isFormValid = useMemo(() => {
        return (
            formData.poId.trim() &&
            formData.clientName.trim() &&
            formData.priority &&
            formData.sansor.length > 0 &&
            formData.aoiMethod &&
            (formData.uploadAoi || formData.drawAoi)
        );
    }, [formData]);

    // Master organization map for auto-fill
    const orgMap = useMemo(() => [
        // Public Sector - Executive
        { name: "Royal Court", type: "Public Sector" },
        { name: "Council of Ministers", type: "Public Sector" },
        // Public Sector - Ministries
        { name: "Ministry of Interior", type: "Public Sector" },
        { name: "Ministry of Foreign Affairs", type: "Public Sector" },
        { name: "Ministry of Finance", type: "Public Sector" },
        { name: "Ministry of Energy", type: "Public Sector" },
        { name: "Ministry of Transport and Logistics", type: "Public Sector" },
        { name: "Ministry of Communications and Information Technology", type: "Public Sector" },
        { name: "Ministry of Municipal, Rural Affairs and Housing", type: "Public Sector" },
        // Public Sector - Authorities
        { name: "Saudi Data & AI Authority", type: "Public Sector" },
        { name: "General Authority for Survey & Geospatial Information", type: "Public Sector" },
        { name: "General Authority of Civil Aviation", type: "Public Sector" },
        { name: "Communications, Space & Technology Commission", type: "Public Sector" },
        { name: "Digital Government Authority", type: "Public Sector" },
        // Public Sector - Other
        { name: "Municipalities", type: "Public Sector" },
        { name: "Vision 2030 Program Offices", type: "Public Sector" },
        // Defense & Security
        { name: "Ministry of Defense", type: "Defense & Security" },
        { name: "Ministry of National Guard", type: "Defense & Security" },
        { name: "Presidency of State Security", type: "Defense & Security" },
        { name: "Royal Saudi Land Forces", type: "Defense & Security" },
        { name: "Royal Saudi Air Force", type: "Defense & Security" },
        { name: "Royal Saudi Naval Forces", type: "Defense & Security" },
        { name: "Royal Saudi Air Defense Forces", type: "Defense & Security" },
        { name: "General Directorate of Border Guard", type: "Defense & Security" },
        { name: "General Authority for Military Industries", type: "Defense & Security" },
        { name: "Saudi Arabian Military Industries", type: "Defense & Security" },
        { name: "Defense R&D / Military Research Centers", type: "Defense & Security" },
        // Commercial & Private
        { name: "Saudi Aramco", type: "Commercial & Private" },
        { name: "SABIC", type: "Commercial & Private" },
        { name: "Saudi Electricity Company", type: "Commercial & Private" },
        { name: "Saudi Telecom Company", type: "Commercial & Private" },
        { name: "Saline Water Conversion Corporation", type: "Commercial & Private" },
        { name: "Government-Linked Companies", type: "Commercial & Private" },
        { name: "Tier-1 System Integrators", type: "Commercial & Private" },
        { name: "Tier-2 / Sub-Contractors", type: "Commercial & Private" },
        { name: "Local SMEs", type: "Commercial & Private" },
        { name: "International Corporations", type: "Commercial & Private" },
        { name: "Startups / Innovation Partners", type: "Commercial & Private" },
        // Academic / Research
        { name: "King Abdulaziz City for Science and Technology", type: "Academic / Research" },
        { name: "King Abdullah University of Science and Technology", type: "Academic / Research" },
        { name: "King Fahd University of Petroleum & Minerals", type: "Academic / Research" },
        { name: "King Saud University", type: "Academic / Research" },
        { name: "Imam Mohammad Ibn Saud Islamic University", type: "Academic / Research" },
        { name: "Military Academies", type: "Academic / Research" },
        { name: "National Research Labs", type: "Academic / Research" },
        { name: "Innovation & Technology Hubs", type: "Academic / Research" },
        // Non-Profit / NGO
        { name: "King Salman Humanitarian Aid & Relief Centre", type: "Non-Profit / NGO" },
        { name: "Charitable Foundations", type: "Non-Profit / NGO" },
        { name: "Endowments", type: "Non-Profit / NGO" },
        { name: "Local NGOs", type: "Non-Profit / NGO" },
        { name: "International NGOs", type: "Non-Profit / NGO" },
        { name: "Non-Profit Research Bodies", type: "Non-Profit / NGO" },
        // Other / Unknown
        { name: "Multi-Agency Joint Programs", type: "Other / Unknown" },
        { name: "Classified / Undisclosed Government Entities", type: "Other / Unknown" },
        { name: "Temporary / Ad-hoc Customers", type: "Other / Unknown" },
        { name: "Pilot / Trial Accounts", type: "Other / Unknown" },
        { name: "Legacy / Unclassified Records", type: "Other / Unknown" },
    ], []);

    return (
        <div className="bg-slate-50 min-h-screen p-8 pt-4">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Create New Order</h2>
                        <p className="text-slate-600 mt-1">Dual tile system: World (Z:2-8) + Saudi Arabia (Z:9-13)</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
                            <span className="text-xs font-semibold text-green-700">🌍 Offline</span>
                        </div>
                        <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                            <span className="text-xs font-semibold text-blue-700">🌍 Z:2-8</span>
                        </div>
                        <div className="px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-lg">
                            <span className="text-xs font-semibold text-orange-700">🇸🇦 Z:9-13</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                    {/* Main Form Section */}
                    <div className="col-span-2 space-y-6">
                        {/* Order Information */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">Order Information</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="poId" className="block text-sm font-medium text-slate-700 mb-2">
                                        PO ID <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="poId"
                                        type="text"
                                        placeholder="Enter PO ID"
                                        value={formData.poId}
                                        onChange={(e) => handleInputChange('poId', e.target.value)}
                                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.poId ? 'border-red-500' : 'border-slate-300'}`}
                                    />
                                    {errors.poId && (
                                        <p className="text-red-500 text-xs mt-1">{errors.poId}</p>
                                    )}
                                </div>
                                <div>
                                    <label htmlFor="clientName" className="block text-sm font-medium text-slate-700 mb-2">
                                        Client Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="clientName"
                                        type="text"
                                        placeholder="Enter client name or select organization"
                                        value={formData.clientName}
                                        onChange={(e) => handleClientNameChange(e.target.value)}
                                        list="clientAndOrgNames"
                                        autoComplete="off"
                                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.clientName ? 'border-red-500' : 'border-slate-300'}`}
                                    />
                                    <datalist id="clientAndOrgNames">
                                        {/* Fetched client names */}
                                        {clientOptions.map((c) => (
                                            <option key={`client-${c}`} value={c} />
                                        ))}
                                        {/* All organizations */}
                                        {orgMap.map((o) => (
                                            <option key={`org-${o.name}`} value={o.name} label={`[${o.type}]`} />
                                        ))}
                                    </datalist>
                                    {formData.organization_type && formData.organization && (
                                        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 rounded px-2 py-1">
                                            <Check size={12} />
                                            <span>Auto-filled: <strong>{formData.organization_type}</strong> → <strong>{formData.organization}</strong></span>
                                        </div>
                                    )}
                                    {errors.clientName && (
                                        <p className="text-red-500 text-xs mt-1">{errors.clientName}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="priority" className="block text-sm font-medium text-slate-700 mb-2">
                                        Priority Type <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="priority"
                                        value={formData.priority}
                                        onChange={(e) => handleInputChange('priority', e.target.value)}
                                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.priority ? 'border-red-500' : 'border-slate-300'}`}
                                    >
                                        <option value="">Select Priority type</option>
                                        <option value="high">High</option>
                                        <option value="medium">Medium</option>
                                        <option value="low">Low</option>
                                    </select>
                                    {errors.priority && (
                                        <p className="text-red-500 text-xs mt-1">{errors.priority}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="organization_type" className="block text-sm font-medium text-slate-700 mb-2">
                                        Organization Type <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="organization_type"
                                        value={formData.organization_type}
                                        onChange={(e) => {
                                            handleInputChange('organization_type', e.target.value);
                                            handleInputChange('organization', '');
                                        }}
                                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.organization_type ? 'border-red-500' : 'border-slate-300'}`}
                                    >
                                        <option value="">Select Organization Type</option>
                                        <option value="Public Sector">Public Sector (Civil Government – KSA)</option>
                                        <option value="Defense & Security">Defense & Security (KSA)</option>
                                        <option value="Commercial & Private">Commercial & Private</option>
                                        <option value="Academic / Research">Academic / Research</option>
                                        <option value="Non-Profit / NGO">Non-Profit / NGO</option>
                                        <option value="Other / Unknown">Other / Unknown</option>
                                    </select>
                                    {errors.organization_type && (
                                        <p className="text-red-500 text-xs mt-1">{errors.organization_type}</p>
                                    )}
                                </div>

                                {formData.organization_type && (
                                    <div>
                                        <label htmlFor="organization" className="block text-sm font-medium text-slate-700 mb-2">
                                            Organization <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            id="organization"
                                            value={formData.organization}
                                            onChange={(e) => handleInputChange('organization', e.target.value)}
                                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.organization ? 'border-red-500' : 'border-slate-300'}`}
                                        >
                                            <option value="">Select Organization</option>

                                            {formData.organization_type === 'Public Sector' && (
                                                <>
                                                    <optgroup label="Executive">
                                                        <option value="Royal Court">Royal Court (الديوان الملكي)</option>
                                                        <option value="Council of Ministers">Council of Ministers</option>
                                                    </optgroup>
                                                    <optgroup label="Ministries">
                                                        <option value="Ministry of Interior">Ministry of Interior (MOI)</option>
                                                        <option value="Ministry of Foreign Affairs">Ministry of Foreign Affairs (MOFA)</option>
                                                        <option value="Ministry of Finance">Ministry of Finance (MOF)</option>
                                                        <option value="Ministry of Energy">Ministry of Energy</option>
                                                        <option value="Ministry of Transport and Logistics">Ministry of Transport and Logistics (MOT)</option>
                                                        <option value="Ministry of Communications and Information Technology">Ministry of Communications and Information Technology (MCIT)</option>
                                                        <option value="Ministry of Municipal, Rural Affairs and Housing">Ministry of Municipal, Rural Affairs and Housing (MOMRAH)</option>
                                                    </optgroup>
                                                    <optgroup label="Authorities & Commissions">
                                                        <option value="Saudi Data & AI Authority">Saudi Data & AI Authority (SDAIA)</option>
                                                        <option value="General Authority for Survey & Geospatial Information">General Authority for Survey & Geospatial Information (GEOSA)</option>
                                                        <option value="General Authority of Civil Aviation">General Authority of Civil Aviation (GACA)</option>
                                                        <option value="Communications, Space & Technology Commission">Communications, Space & Technology Commission (CST)</option>
                                                        <option value="Digital Government Authority">Digital Government Authority (DGA)</option>
                                                    </optgroup>
                                                    <optgroup label="Other">
                                                        <option value="Municipalities">Municipalities (under MOMRAH)</option>
                                                        <option value="Vision 2030 Program Offices">Vision 2030 Program Offices</option>
                                                    </optgroup>
                                                </>
                                            )}

                                            {formData.organization_type === 'Defense & Security' && (
                                                <>
                                                    <optgroup label="Ministry & Leadership">
                                                        <option value="Ministry of Defense">Ministry of Defense (MOD)</option>
                                                        <option value="Ministry of National Guard">Ministry of National Guard (MNG)</option>
                                                        <option value="Presidency of State Security">Presidency of State Security (PSS)</option>
                                                    </optgroup>
                                                    <optgroup label="Armed Forces">
                                                        <option value="Royal Saudi Land Forces">Royal Saudi Land Forces (RSLF)</option>
                                                        <option value="Royal Saudi Air Force">Royal Saudi Air Force (RSAF)</option>
                                                        <option value="Royal Saudi Naval Forces">Royal Saudi Naval Forces (RSNF)</option>
                                                        <option value="Royal Saudi Air Defense Forces">Royal Saudi Air Defense Forces (RSADF)</option>
                                                    </optgroup>
                                                    <optgroup label="Security & Defense Industry">
                                                        <option value="General Directorate of Border Guard">General Directorate of Border Guard</option>
                                                        <option value="General Authority for Military Industries">General Authority for Military Industries (GAMI)</option>
                                                        <option value="Saudi Arabian Military Industries">Saudi Arabian Military Industries (SAMI)</option>
                                                        <option value="Defense R&D / Military Research Centers">Defense R&D / Military Research Centers</option>
                                                    </optgroup>
                                                </>
                                            )}

                                            {formData.organization_type === 'Commercial & Private' && (
                                                <>
                                                    <optgroup label="State-Owned Enterprises">
                                                        <option value="Saudi Aramco">Saudi Aramco</option>
                                                        <option value="SABIC">SABIC</option>
                                                        <option value="Saudi Electricity Company">Saudi Electricity Company (SEC)</option>
                                                        <option value="Saudi Telecom Company">Saudi Telecom Company (stc)</option>
                                                        <option value="Saline Water Conversion Corporation">Saline Water Conversion Corporation (SWCC)</option>
                                                    </optgroup>
                                                    <optgroup label="Corporate">
                                                        <option value="Government-Linked Companies">Government-Linked Companies (PIF Portfolio)</option>
                                                        <option value="Tier-1 System Integrators">Tier-1 System Integrators (Local Primes)</option>
                                                        <option value="Tier-2 / Sub-Contractors">Tier-2 / Sub-Contractors</option>
                                                        <option value="Local SMEs">Local SMEs</option>
                                                        <option value="International Corporations">International Corporations</option>
                                                        <option value="Startups / Innovation Partners">Startups / Innovation Partners</option>
                                                    </optgroup>
                                                </>
                                            )}

                                            {formData.organization_type === 'Academic / Research' && (
                                                <>
                                                    <optgroup label="Universities">
                                                        <option value="King Abdulaziz City for Science and Technology">King Abdulaziz City for Science and Technology (KACST)</option>
                                                        <option value="King Abdullah University of Science and Technology">King Abdullah University of Science and Technology (KAUST)</option>
                                                        <option value="King Fahd University of Petroleum & Minerals">King Fahd University of Petroleum & Minerals (KFUPM)</option>
                                                        <option value="King Saud University">King Saud University (KSU)</option>
                                                        <option value="Imam Mohammad Ibn Saud Islamic University">Imam Mohammad Ibn Saud Islamic University</option>
                                                    </optgroup>
                                                    <optgroup label="Research & Innovation">
                                                        <option value="Military Academies">Military Academies</option>
                                                        <option value="National Research Labs">National Research Labs</option>
                                                        <option value="Innovation & Technology Hubs">Innovation & Technology Hubs</option>
                                                    </optgroup>
                                                </>
                                            )}

                                            {formData.organization_type === 'Non-Profit / NGO' && (
                                                <>
                                                    <optgroup label="Organizations">
                                                        <option value="King Salman Humanitarian Aid & Relief Centre">King Salman Humanitarian Aid & Relief Centre (KSrelief)</option>
                                                        <option value="Charitable Foundations">Charitable Foundations</option>
                                                        <option value="Endowments">Endowments (Waqf)</option>
                                                        <option value="Local NGOs">Local NGOs (Registered in KSA)</option>
                                                        <option value="International NGOs">International NGOs (Licensed in KSA)</option>
                                                        <option value="Non-Profit Research Bodies">Non-Profit Research Bodies</option>
                                                    </optgroup>
                                                </>
                                            )}

                                            {formData.organization_type === 'Other / Unknown' && (
                                                <>
                                                    <optgroup label="Other">
                                                        <option value="Multi-Agency Joint Programs">Multi-Agency Joint Programs</option>
                                                        <option value="Classified / Undisclosed Government Entities">Classified / Undisclosed Government Entities</option>
                                                        <option value="Temporary / Ad-hoc Customers">Temporary / Ad-hoc Customers</option>
                                                        <option value="Pilot / Trial Accounts">Pilot / Trial Accounts</option>
                                                        <option value="Legacy / Unclassified Records">Legacy / Unclassified Records</option>
                                                    </optgroup>
                                                </>
                                            )}
                                        </select>
                                        {errors.organization && (
                                            <p className="text-red-500 text-xs mt-1">{errors.organization}</p>
                                        )}
                                    </div>
                                )}

                                <div>
                                    <label htmlFor="orderType" className="block text-sm font-medium text-slate-700 mb-2">
                                        Order Type <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="orderType"
                                        value={formData.orderType}
                                        onChange={(e) => handleInputChange('orderType', e.target.value)}
                                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.orderType ? 'border-red-500' : 'border-slate-300'
                                            }`}
                                    >
                                        <option value="">Select Later</option>
                                        <option value="Archiving">Archiving</option>
                                        <option value="Tasking">Tasking</option>
                                        <option value="Tasking/Archive">Tasking/Archive</option>
                                    </select>
                                    {errors.orderType && (
                                        <p className="text-red-500 text-xs mt-1">{errors.orderType}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="contactPerson" className="block text-sm font-medium text-slate-700 mb-2">
                                        Contact Person
                                    </label>
                                    <input
                                        id="contactPerson"
                                        type="text"
                                        placeholder="Enter contact person name (optional)"
                                        value={formData.contactPerson}
                                        onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.contactPerson ? 'border-red-500' : 'border-slate-300'}`}
                                    />
                                    {errors.contactPerson && (
                                        <p className="text-red-500 text-xs mt-1">{errors.contactPerson}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="contactNumber" className="block text-sm font-medium text-slate-700 mb-2">
                                        Contact Number
                                    </label>
                                    <input
                                        id="contactNumber"
                                        type="tel"
                                        placeholder="Enter contact number (optional)"
                                        value={formData.contactNumber}
                                        onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.contactNumber ? 'border-red-500' : 'border-slate-300'}`}
                                    />
                                    {errors.contactNumber && (
                                        <p className="text-red-500 text-xs mt-1">{errors.contactNumber}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                                        Email
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        placeholder="Enter email address (optional)"
                                        value={formData.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-500' : 'border-slate-300'}`}
                                    />
                                    {errors.email && (
                                        <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                                    )}
                                </div>

                            </div>
                        </div>

                        {/* Vendor and Sensor Selection */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">Vendor and Sensor Selection</h3>
                            <div className="space-y-6">
                                {/* Vendor Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-3">
                                        Select Vendor <span className="text-red-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {vendors.map((vendor) => (
                                            <button
                                                key={vendor.id}
                                                type="button"
                                                onClick={() => handleVendorSelect(vendor.id)}
                                                disabled={!vendor.available}
                                                className={`border-2 rounded-lg p-3 transition-all ${formData.vendorNo === vendor.id
                                                    ? 'border-blue-600 bg-gradient-to-br from-blue-50 to-blue-100 shadow-md'
                                                    : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm'
                                                    } ${!vendor.available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className="font-bold text-slate-800 text-sm">{vendor.name}</h4>
                                                    <div
                                                        className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${formData.vendorNo === vendor.id
                                                            ? 'bg-blue-600 shadow-md'
                                                            : 'border-2 border-slate-300 bg-white'
                                                            }`}
                                                    >
                                                        {formData.vendorNo === vendor.id && (
                                                            <Check size={14} className="text-white" />
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="text-xs text-slate-600 text-left">{vendor.description}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Sensor Selection */}


                                {/* Sensor Selection */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-sm font-medium text-slate-700">
                                            Select Sensors <span className="text-red-500">*</span>
                                            <span className="ml-2 text-xs text-slate-500 font-normal">
                                                ({formData.sansor.length} selected)
                                            </span>
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (formData.sansor.length === availableSensors.sensors.length) {
                                                    // Deselect all
                                                    setFormData(prev => ({ ...prev, sansor: [] }));
                                                } else {
                                                    // Select all
                                                    setFormData(prev => ({ ...prev, sansor: [...availableSensors.sensors] }));
                                                }
                                            }}
                                            className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border-2 shadow-sm hover:shadow-md"
                                            style={{
                                                borderColor: formData.sansor.length === availableSensors.sensors.length ? '#ef4444' : '#3b82f6',
                                                backgroundColor: formData.sansor.length === availableSensors.sensors.length ? '#fee2e2' : '#dbeafe',
                                                color: formData.sansor.length === availableSensors.sensors.length ? '#991b1b' : '#1e40af'
                                            }}
                                        >
                                            {formData.sansor.length === availableSensors.sensors.length ? '✕ Deselect All' : '✓ Select All'}
                                        </button>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                                        {availableSensors.grouped ? (
                                            // Both vendors selected - show grouped sensors
                                            <div className="space-y-4">
                                                {/* Vendor A Sensors */}
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="h-px flex-1 bg-blue-200"></div>
                                                        <span className="text-xs font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
                                                            Vendor A Sensors (1-10)
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const vendorASensors = availableSensors.sensors.slice(0, 10);
                                                                const allVendorASelected = vendorASensors.every(s => formData.sansor.includes(s));

                                                                if (allVendorASelected) {
                                                                    // Deselect all Vendor A sensors
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        sansor: prev.sansor.filter(s => !vendorASensors.includes(s))
                                                                    }));
                                                                } else {
                                                                    // Select all Vendor A sensors
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        sansor: [...new Set([...prev.sansor, ...vendorASensors])]
                                                                    }));
                                                                }
                                                            }}
                                                            className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-200 text-blue-800 hover:bg-blue-300 transition-colors"
                                                        >
                                                            {availableSensors.sensors.slice(0, 10).every(s => formData.sansor.includes(s)) ? 'Deselect' : 'Select'} All
                                                        </button>
                                                        <div className="h-px flex-1 bg-blue-200"></div>
                                                    </div>
                                                    <div className="grid grid-cols-5 gap-2">
                                                        {availableSensors.sensors.slice(0, 10).map((sensor) => (
                                                            <button
                                                                key={sensor}
                                                                type="button"
                                                                onClick={() => handleSensorToggle(sensor)}
                                                                className={`relative p-2 rounded-md border-2 transition-all text-center font-medium text-xs ${formData.sansor.includes(sensor)
                                                                    ? 'border-blue-500 bg-blue-500 text-white shadow-md transform scale-105'
                                                                    : 'border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50'
                                                                    }`}
                                                            >
                                                                {formData.sansor.includes(sensor) && (
                                                                    <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5">
                                                                        <Check size={10} className="text-white" />
                                                                    </div>
                                                                )}
                                                                <div className="text-[10px] opacity-90 mb-0.5">
                                                                    {sensor.split(' ')[0]}
                                                                </div>
                                                                <div className="text-sm font-bold">
                                                                    {sensor.split(' ')[1]}
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Vendor B Sensors */}
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="h-px flex-1 bg-purple-200"></div>
                                                        <span className="text-xs font-bold text-purple-700 bg-purple-100 px-3 py-1 rounded-full">
                                                            Vendor B Sensors (11-20)
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const vendorBSensors = availableSensors.sensors.slice(10, 20);
                                                                const allVendorBSelected = vendorBSensors.every(s => formData.sansor.includes(s));

                                                                if (allVendorBSelected) {
                                                                    // Deselect all Vendor B sensors
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        sansor: prev.sansor.filter(s => !vendorBSensors.includes(s))
                                                                    }));
                                                                } else {
                                                                    // Select all Vendor B sensors
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        sansor: [...new Set([...prev.sansor, ...vendorBSensors])]
                                                                    }));
                                                                }
                                                            }}
                                                            className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-200 text-purple-800 hover:bg-purple-300 transition-colors"
                                                        >
                                                            {availableSensors.sensors.slice(10, 20).every(s => formData.sansor.includes(s)) ? 'Deselect' : 'Select'} All
                                                        </button>
                                                        <div className="h-px flex-1 bg-purple-200"></div>
                                                    </div>
                                                    <div className="grid grid-cols-5 gap-2">
                                                        {availableSensors.sensors.slice(10, 20).map((sensor) => (
                                                            <button
                                                                key={sensor}
                                                                type="button"
                                                                onClick={() => handleSensorToggle(sensor)}
                                                                className={`relative p-2 rounded-md border-2 transition-all text-center font-medium text-xs ${formData.sansor.includes(sensor)
                                                                    ? 'border-purple-500 bg-purple-500 text-white shadow-md transform scale-105'
                                                                    : 'border-slate-300 bg-white text-slate-700 hover:border-purple-300 hover:bg-purple-50'
                                                                    }`}
                                                            >
                                                                {formData.sansor.includes(sensor) && (
                                                                    <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5">
                                                                        <Check size={10} className="text-white" />
                                                                    </div>
                                                                )}
                                                                <div className="text-[10px] opacity-90 mb-0.5">
                                                                    {sensor.split(' ')[0]}
                                                                </div>
                                                                <div className="text-sm font-bold">
                                                                    {sensor.split(' ')[1]}
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            // Single vendor selected - show normal grid
                                            <div className="grid grid-cols-5 gap-2">
                                                {availableSensors.sensors.map((sensor) => (
                                                    <button
                                                        key={sensor}
                                                        type="button"
                                                        onClick={() => handleSensorToggle(sensor)}
                                                        className={`relative p-2 rounded-md border-2 transition-all text-center font-medium text-xs ${formData.sansor.includes(sensor)
                                                            ? 'border-blue-500 bg-blue-500 text-white shadow-md transform scale-105'
                                                            : 'border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50'
                                                            }`}
                                                    >
                                                        {formData.sansor.includes(sensor) && (
                                                            <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5">
                                                                <Check size={10} className="text-white" />
                                                            </div>
                                                        )}
                                                        <div className="text-[10px] opacity-90 mb-0.5">
                                                            {sensor.split(' ')[0]}
                                                        </div>
                                                        <div className="text-sm font-bold">
                                                            {sensor.split(' ')[1]}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {errors.sensors && (
                                        <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                                            <AlertCircle size={14} />
                                            {errors.sensors}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Area of Interest */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">
                                Area of Interest <span className="text-red-500">*</span>
                            </h3>
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <h4 className="text-sm font-bold text-slate-700 mb-2">
                                    Define AOI using Latitude & Longitude
                                </h4>

                                {latLngPoints.map((p, index) => (
                                    <div key={index} className="flex gap-2 mb-2">
                                        <input
                                            type="number"
                                            step="any"
                                            placeholder="Latitude"
                                            value={p.lat}
                                            onChange={(e) => {
                                                const copy = [...latLngPoints];
                                                copy[index].lat = e.target.value;
                                                setLatLngPoints(copy);
                                            }}
                                            className="flex-1 px-3 py-2 border rounded-lg text-sm"
                                        />

                                        <input
                                            type="number"
                                            step="any"
                                            placeholder="Longitude"
                                            value={p.lng}
                                            onChange={(e) => {
                                                const copy = [...latLngPoints];
                                                copy[index].lng = e.target.value;
                                                setLatLngPoints(copy);
                                            }}
                                            className="flex-1 px-3 py-2 border rounded-lg text-sm"
                                        />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setLatLngPoints(prev => prev.filter((_, i) => i !== index))
                                            }
                                            disabled={latLngPoints.length <= 3}
                                            className="px-3 text-red-600"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}

                                <div className="flex gap-2 mt-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setLatLngPoints(prev => [...prev, { lat: "", lng: "" }])
                                        }
                                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                                    >
                                        + Add Point
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => drawPolygonFromLatLng()}
                                        className="px-3 py-1 bg-green-600 text-white rounded text-xs"
                                    >
                                        Draw Polygon
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setLatLngPoints([{ lat: "", lng: "" }]);
                                            setFormData(prev => ({
                                                ...prev,
                                                drawAoi: null,
                                                aoiMethod: null
                                            }));
                                            setShowDrawMap(false);
                                        }}
                                        className="px-3 py-1 bg-red-600 text-white rounded text-xs"
                                    >
                                        Clear All
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={handleDrawPolygon}
                                        className={`flex-1 py-3 border-2 border-dashed rounded-lg transition-colors flex flex-col items-center justify-center gap-1.5 ${formData.aoiMethod === 'draw'
                                            ? 'border-blue-600 bg-blue-50'
                                            : 'border-blue-300 hover:bg-blue-50'
                                            }`}
                                    >
                                        <MapPin size={20} className="text-blue-600" />
                                        <span className="text-xs font-medium text-blue-600">Draw Polygon on Map</span>
                                    </button>

                                    <label
                                        className={`flex-1 py-3 border-2 border-dashed rounded-lg transition-colors flex flex-col items-center justify-center gap-1.5 cursor-pointer ${formData.aoiMethod === 'upload'
                                            ? 'border-slate-600 bg-slate-100'
                                            : 'border-slate-300 hover:bg-slate-50'
                                            }`}
                                    >
                                        <input
                                            type="file"
                                            accept=".json,.geojson,.zip,.kml,.kmz"
                                            onChange={handleGeoJSONUpload}
                                            className="hidden"
                                        />
                                        <Upload size={20} className="text-slate-600" />
                                        <span className="text-xs font-medium text-slate-600">Upload GeoJSON / Shapefile</span>
                                        {formData.uploadAoi && (
                                            <span className="text-xs text-green-600 mt-0.5">
                                                ✔ AOI Loaded
                                            </span>
                                        )}
                                    </label>
                                </div>

                                {errors.aoi && (
                                    <p className="text-red-500 text-xs">{errors.aoi}</p>
                                )}

                                {/* Draw Map - WITH DUAL TILES (World + Saudi) */}
                                {showDrawMap && (
                                    <div className="relative">
                                        <div className="absolute top-2 right-2 z-[1000]">
                                            <button
                                                onClick={() => setShowDrawMap(false)}
                                                className="bg-white hover:bg-red-50 text-red-600 rounded-lg p-2 shadow-lg transition-colors"
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>
                                        <div className="absolute top-2 left-2 z-[1000] bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-lg border border-green-200">
                                            <p className="text-xs font-semibold text-green-700">🌍 World + 🇸🇦 Saudi Tiles Active</p>
                                        </div>
                                        <div style={{ height: "400px", border: '2px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
                                            <MapContainer
                                                center={[20.5937, 78.9629]}
                                                zoom={5}
                                                minZoom={2}
                                                maxZoom={13}
                                                maxBounds={[[-85, -180], [85, 180]]}
                                                style={{ height: "100%", width: "100%" }}
                                            >
                                                <DualTileLayer worldMaxZoom={8} saudiMaxZoom={13} />
                                                {formData.drawAoi ? (
                                                    <ZoomToPolygon geoJsonData={formData.drawAoi} />
                                                ) : (
                                                    <ZoomToSaudi active={showDrawMap} />
                                                )}
                                                <DrawTool setAoi={handleDrawAoi} disabled={false} />
                                                {formData.drawAoi && <GeoJSON data={formData.drawAoi} />}
                                            </MapContainer>
                                        </div>
                                    </div>
                                )}

                                {/* Upload Map - WITH DUAL TILES (World + Saudi) */}
                                {showUploadMap && formData.uploadAoi && (
                                    <div className="relative">
                                        <div className="absolute top-2 right-2 z-[1000]">
                                            <button
                                                onClick={() => setShowUploadMap(false)}
                                                className="bg-white hover:bg-gray-50 text-gray-600 rounded-lg p-2 shadow-lg transition-colors"
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>
                                        <div className="absolute top-2 left-2 z-[1000] bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-lg border border-green-200">
                                            <p className="text-xs font-semibold text-green-700">🌍 World + 🇸🇦 Saudi Tiles Active</p>
                                        </div>
                                        <div style={{ height: "400px", border: '2px solid #10b981', borderRadius: '8px', overflow: 'hidden' }}>
                                            <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: "100%", width: "100%", backgroundColor: '#e8f5e9' }} maxZoom={13} minZoom={2}>
                                                <DualTileLayer worldMaxZoom={8} saudiMaxZoom={13} />
                                                <GeoJSON
                                                    data={formData.uploadAoi}
                                                    style={{ color: '#10b981', weight: 3, fillOpacity: 0.2 }}
                                                />
                                                <FitBoundsToGeoJSON geoJsonData={formData.uploadAoi} />
                                            </MapContainer>
                                        </div>
                                        <div className="mt-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                                            <p className="text-sm text-green-700 font-medium">
                                                ✓ Uploaded AOI displayed on map (Dual Tile System: World + Saudi Arabia)
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="p-4 bg-slate-50 rounded-lg">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-slate-600">Total Area:</span>
                                            <span className="ml-2 font-semibold text-slate-800">
                                                {formData.totalArea > 0 ? `${formData.totalArea} km²` : '-- km²'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-slate-600">Perimeter:</span>
                                            <span className="ml-2 font-semibold text-slate-800">
                                                {formData.perimeter > 0 ? `${formData.perimeter} km` : '-- km'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl border border-slate-200 p-6 sticky top-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">Order Summary</h3>
                            <div className="space-y-4">
                                <div className="p-3 bg-slate-50 rounded-lg">
                                    <p className="text-xs text-slate-600 mb-1">Initial Status</p>
                                    <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                                        Pending Approval
                                    </span>
                                </div>

                                <div className="p-3 bg-slate-50 rounded-lg">
                                    <p className="text-xs text-slate-600 mb-1">Selected Vendor</p>
                                    <p className="text-sm font-semibold text-slate-800">
                                        {vendors.find(v => v.id === formData.vendorNo)?.name || 'Not Selected'}
                                    </p>
                                </div>

                                {formData.sansor.length > 0 && (
                                    <div className="p-3 bg-slate-50 rounded-lg">
                                        <p className="text-xs text-slate-600 mb-2">Selected Sensors</p>
                                        <div className="flex flex-wrap gap-1">
                                            {formData.sansor.map((sensor) => (
                                                <span
                                                    key={sensor}
                                                    className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                                                >
                                                    {sensor}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="pt-4 border-t border-slate-200">
                                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                                        <AlertCircle size={16} />
                                        <span>Manager approval required</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={!isFormValid || isSubmitting || !isAuthenticated}
                                        className={`w-full py-3 rounded-lg font-medium transition-colors ${isFormValid && !isSubmitting && isAuthenticated
                                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                                            : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                            }`}
                                    >
                                        {isSubmitting ? 'Creating Order...' : 'Create Order'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        disabled={isSubmitting}
                                        className="w-full py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
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
}