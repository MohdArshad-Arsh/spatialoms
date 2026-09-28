import React, { useEffect, useState } from 'react';
import { MapContainer, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Map, X, AlertCircle } from 'lucide-react';

// Fix default Leaflet icons
try {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  });
} catch (e) {
  // ignore if already handled
}

// Offline Tile Layer Component (same as AoiMapping.js)
function OfflineTileLayer({ minZoom = 2, maxZoom = 6 }) {
  const map = useMap();

  useEffect(() => {
    const basename = process.env.PUBLIC_URL || '';

    console.log('🗺️ Initializing Offline Tile Layer');
    console.log('   Available zoom levels: 2-6');
    console.log('   Basename:', basename || '(none)');

    const CustomTileLayer = L.TileLayer.extend({
      getTileUrl: function (coords) {
        const z = coords.z;
        const x = coords.x;
        const y = coords.y;

        // Construct tile URL: /tiles/z/x/y.png
        const tileUrl = `${window.location.origin}${basename}/tiles/${z}/${x}/${y}.png`;

        console.log(`📍 Loading tile: z=${z}, x=${x}, y=${y}`);
        return tileUrl;
      }
    });

    const tileLayer = new CustomTileLayer('', {
      attribution: '© OpenStreetMap contributors (Offline)',
      minZoom: minZoom,
      maxZoom: maxZoom,
      tileSize: 256,
      noWrap: false,
      crossOrigin: 'anonymous',
      errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
    });

    let loadedTiles = 0;
    let errorTiles = 0;

    tileLayer.on('tileload', (e) => {
      loadedTiles++;
      if (loadedTiles % 10 === 0) {
        console.log(`✅ Loaded ${loadedTiles} tiles`);
      }
    });

    tileLayer.on('tileerror', (e) => {
      errorTiles++;
      if (errorTiles <= 5) {
        console.warn(`⚠️ Tile not found: ${e.tile?.src}`);
      }
    });

    tileLayer.addTo(map);

    setTimeout(() => {
      console.log('📊 Tile Loading Summary:');
      console.log(`   ✅ Successfully loaded: ${loadedTiles} tiles`);
      console.log(`   ⚠️ Failed to load: ${errorTiles} tiles`);
    }, 3000);

    return () => {
      map.removeLayer(tileLayer);
    };
  }, [map, minZoom, maxZoom]);

  return null;
}

// Fit Bounds Component
function FitBounds({ geoJson }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !geoJson) return;
    try {
      const layer = L.geoJSON(geoJson);
      const bounds = layer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    } catch (err) {
      console.error('Fit bounds error:', err);
    }
  }, [map, geoJson]);

  return null;
}

export default function MapViewer() {
  const [geo, setGeo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('tempAoi');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setGeo(parsed);
        setError(null);
      } catch (err) {
        console.error('Invalid AOI in sessionStorage', err);
        setError('Invalid AOI data in session storage');
      }
    } else {
      setError('No AOI data found in session storage');
    }
  }, []);

  const handleClose = () => {
    sessionStorage.removeItem('tempAoi');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg border border-gray-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow flex items-center justify-center">
                <Map className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">AOI Map Viewer</h2>
                <p className="text-sm text-gray-500">Offline India Map (Zoom: 2-6)</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-semibold text-green-700">Offline Mode</span>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="px-4 py-2 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 font-semibold text-sm flex items-center gap-2 transition-colors"
              >
                <X className="w-4 h-4" />
                Close
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-amber-600" />
              <div>
                <p className="font-semibold text-sm mb-0.5 text-amber-900">Notice</p>
                <p className="text-sm text-amber-700">{error}</p>
                <p className="text-xs text-amber-600 mt-1">Use the "Open in new tab" button from an order map to view AOI here.</p>
              </div>
            </div>
          </div>
        )}

        {/* Map Container */}
        <div className="p-6">
          <div style={{ height: 600, borderRadius: 8, overflow: 'hidden', position: 'relative' }} className="border border-gray-200 shadow-sm">
            {/* Offline Mode Indicator */}
            <div className="absolute top-4 left-4 bg-white p-3 rounded-lg shadow-lg z-[1000] border border-green-200">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-sm font-semibold text-green-700">Offline Mode</p>
              </div>
              <p className="text-xs text-gray-600 mt-1">Local India tiles (Z: 2-6)</p>
              <p className="text-xs text-blue-600 mt-1">📁 Path: /tiles/z/x/y.png</p>
            </div>

            <MapContainer
              center={[20.5937, 78.9629]}
              zoom={5}
              style={{ height: '100%', width: '100%', backgroundColor: '#e8f5e9' }}
              zoomControl={true}
            >
              {/* Offline Tile Layer */}
              <OfflineTileLayer minZoom={2} maxZoom={6} />

              {/* GeoJSON Layer */}
              {geo && (
                <GeoJSON
                  data={geo}
                  style={{
                    color: '#2563eb',
                    weight: 3,
                    fillColor: '#3b82f6',
                    fillOpacity: 0.3,
                    dashArray: '5, 5'
                  }}
                />
              )}

              {/* Fit Bounds */}
              {geo && <FitBounds geoJson={geo} />}
            </MapContainer>
          </div>

          {/* No Data Message */}
          {!geo && !error && (
            <div className="p-12 text-center bg-gradient-to-b from-green-50 to-white rounded-lg mt-4">
              <div className="bg-white w-20 h-20 rounded-2xl inline-flex items-center justify-center mb-4 shadow-md border border-green-200">
                <Map className="w-10 h-10 text-green-600" />
              </div>
              <p className="text-gray-900 font-bold text-lg mb-2">Offline India Map Ready</p>
              <p className="text-gray-600 text-sm mb-1">Complete India map loaded with zoom levels 2-6</p>
              <p className="text-green-600 text-sm font-semibold">Use "Open in new tab" to view AOI boundaries</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
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
}