import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useTheme } from '../context/ThemeContext';

export default function ReportMap({ 
  center = [-6.74412, 108.53982], 
  zoom = 18, 
  reports = [], 
  selectedPoint = null, 
  onPointSelect = null, 
  height = '360px',
  interactive = true
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const { isDark } = useTheme();

  // Create custom HTML divIcon for markers with clean SVG vector icons (no emojis)
  const createMarkerIcon = (status, isCurrentGps = false) => {
    if (isCurrentGps) {
      return L.divIcon({
        className: 'custom-gps-pin',
        html: `
          <div class="relative flex items-center justify-center">
            <span class="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-emerald-400 opacity-75"></span>
            <div class="w-8 h-8 rounded-full bg-emerald-600 border-2 border-white shadow-lg flex items-center justify-center text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
      });
    }

    let colorClass = 'bg-rose-500 border-white text-white';
    let iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
    let pingClass = 'bg-rose-400';

    if (status === 'proses') {
      colorClass = 'bg-amber-500 border-white text-white';
      iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
      pingClass = 'bg-amber-400';
    } else if (status === 'selesai') {
      colorClass = 'bg-emerald-500 border-white text-white';
      iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
      pingClass = 'bg-emerald-400';
    }

    return L.divIcon({
      className: 'custom-report-pin',
      html: `
        <div class="relative flex items-center justify-center cursor-pointer group">
          ${status === 'baru' ? `<span class="animate-ping absolute inline-flex h-6 w-6 rounded-full ${pingClass} opacity-60"></span>` : ''}
          <div class="w-8 h-8 rounded-full ${colorClass} border-2 shadow-xl flex items-center justify-center transition-transform group-hover:scale-125">
            ${iconSvg}
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16]
    });
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Destroy existing instance if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: selectedPoint ? [selectedPoint.lat, selectedPoint.lng] : center,
      zoom: zoom,
      zoomControl: interactive,
      dragging: interactive,
      scrollWheelZoom: interactive,
      attributionControl: false
    });

    // Theme tile layer using standard OpenStreetMap (clean, no api key watermark)
    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c'],
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    if (isDark) {
      const tilePane = map.getPane('tilePane');
      if (tilePane) {
        tilePane.style.filter = 'brightness(0.65) invert(1) contrast(1.4) hue-rotate(200deg) saturate(0.4)';
      }
    }

    // Marker Layer Group
    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    // Single selected GPS Point mode (User report preview)
    if (selectedPoint) {
      const marker = L.marker([selectedPoint.lat, selectedPoint.lng], {
        icon: createMarkerIcon(null, true),
        draggable: !!onPointSelect
      }).addTo(markersGroup);

      marker.bindPopup(`
        <div class="p-2 text-slate-800 text-xs">
          <div style="display:flex;align-items:center;gap:4px;color:#047857;font-weight:700;margin-bottom:4px;">
            <svg style="width:14px;height:14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            <span>Titik Lokasi Anda</span>
          </div>
          <span>Lat: ${selectedPoint.lat.toFixed(5)}</span><br/>
          <span>Lng: ${selectedPoint.lng.toFixed(5)}</span><br/>
          <span class="text-[10px] text-slate-500">Akurasi: ±${selectedPoint.accuracy || 5} meter</span>
        </div>
      `);

      if (onPointSelect) {
        marker.on('dragend', (e) => {
          const latlng = e.target.getLatLng();
          onPointSelect({ lat: latlng.lat, lng: latlng.lng, accuracy: selectedPoint.accuracy || 5 });
        });
      }
    }

    // Allow clicking anywhere on map to reposition coordinates if onPointSelect is active
    if (onPointSelect) {
      map.on('click', (e) => {
        onPointSelect({ lat: e.latlng.lat, lng: e.latlng.lng, accuracy: 5 });
      });
    }

    // Multiple reports mode (Admin map view)
    if (reports && reports.length > 0) {
      const bounds = [];

      reports.forEach(report => {
        if (!report.coords || !report.coords.lat || !report.coords.lng) return;
        const pt = [report.coords.lat, report.coords.lng];
        bounds.push(pt);

        const marker = L.marker(pt, {
          icon: createMarkerIcon(report.status, false)
        }).addTo(markersGroup);

        const statusBadge = report.status === 'baru' 
          ? '<span style="background:#ef4444;color:white;padding:2px 6px;border-radius:10px;font-size:10px;font-weight:bold;">Baru</span>'
          : report.status === 'proses'
          ? '<span style="background:#f59e0b;color:white;padding:2px 6px;border-radius:10px;font-size:10px;font-weight:bold;">Diproses</span>'
          : '<span style="background:#10b981;color:white;padding:2px 6px;border-radius:10px;font-size:10px;font-weight:bold;">Selesai</span>';

        marker.bindPopup(`
          <div style="font-family:sans-serif;font-size:12px;color:#1e293b;min-width:180px;line-height:1.4;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <strong style="color:#0f172a;font-size:13px;">${report.id}</strong>
              ${statusBadge}
            </div>
            <div style="display:flex;align-items:center;gap:4px;color:#047857;font-weight:600;margin-bottom:2px;">
              <svg style="width:13px;height:13px;flex-shrink:0;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              <span>${report.location}</span>
            </div>
            <div style="display:flex;align-items:center;gap:4px;color:#64748b;font-size:11px;margin-bottom:4px;">
              <svg style="width:12px;height:12px;flex-shrink:0;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><circle cx="7" cy="7" r="1.5"/></svg>
              <span>${report.category} • Urgensi: ${report.urgency}</span>
            </div>
            <p style="margin:4px 0;background:#f8fafc;padding:4px;border-radius:4px;font-size:11px;color:#334155;">
              "${report.description || 'Tidak ada deskripsi'}"
            </p>
            <div style="font-size:10px;color:#94a3b8;margin-top:4px;">
              Pelapor: ${report.reporter} • ${report.date || ''}
            </div>
            <div style="font-size:9px;color:#059669;margin-top:2px;">
              GPS: ${report.coords.lat.toFixed(5)}, ${report.coords.lng.toFixed(5)}
            </div>
          </div>
        `);
      });

      if (bounds.length > 0 && !selectedPoint) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 19 });
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [center, zoom, isDark, selectedPoint, reports]);

  return (
    <div 
      className="relative rounded-2xl overflow-hidden border border-emerald-500/30 shadow-md w-full"
      style={{ height }}
    >
      <div ref={mapContainerRef} className="w-full h-full z-10" />
      
      {/* Map Overlay Badge */}
      <div className="absolute bottom-2 left-2 z-20 px-2.5 py-1 rounded-lg bg-white/90 dark:bg-obsidian-950/90 backdrop-blur-md border border-emerald-500/30 text-[10px] text-slate-700 dark:text-emerald-300 font-semibold shadow-sm flex items-center gap-1.5 pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
        <span>Peta Kampus SMA IT Akmala Sabila</span>
      </div>
    </div>
  );
}
