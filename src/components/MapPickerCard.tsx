import React, { useRef, useState } from 'react';
import { MapPin, ZoomIn, ZoomOut, Search, Navigation, Compass, Globe } from 'lucide-react';

interface MapPickerCardProps {
  latitude: number;
  longitude: number;
  onChange: (lat: number, lng: number) => void;
  address?: string;
  isReadOnly?: boolean;
}

// Map bounds for Itaituba, PA region translation
const MAP_BOUNDS = {
  minLat: -4.25,
  maxLat: -4.30,
  minLng: -56.02,
  maxLng: -55.95,
};

export default function MapPickerCard({
  latitude,
  longitude,
  onChange,
  address,
  isReadOnly = false
}: MapPickerCardProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(14);
  const [isSatellite, setIsSatellite] = useState(false);

  // Translate lat/lng coordinates to percentage position on the SVG map
  const getPercentPos = (lat: number, lng: number) => {
    const latSpan = MAP_BOUNDS.minLat - MAP_BOUNDS.maxLat; // e.g. -23.53 - (-23.60) = 0.07
    const lngSpan = MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng; // e.g. -46.60 - (-46.72) = 0.12

    const top = ((MAP_BOUNDS.minLat - lat) / latSpan) * 100;
    const left = ((lng - MAP_BOUNDS.minLng) / lngSpan) * 100;

    // Clamp values between 2% and 98% to prevent pin from floating outside map border
    return {
      top: Math.max(2, Math.min(98, top)),
      left: Math.max(2, Math.min(98, left)),
    };
  };

  const pinPos = getPercentPos(latitude, longitude);

  // Handle map click to position pin
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isReadOnly || !mapRef.current) return;

    const rect = mapRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const percentX = clickX / rect.width;
    const percentY = clickY / rect.height;

    const latSpan = MAP_BOUNDS.minLat - MAP_BOUNDS.maxLat; // 0.07
    const lngSpan = MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng; // 0.12

    const clickedLng = MAP_BOUNDS.minLng + percentX * lngSpan;
    const clickedLat = MAP_BOUNDS.minLat - percentY * latSpan;

    // Fixed precision of 4 decimals is extremely clean
    onChange(Number(clickedLat.toFixed(4)), Number(clickedLng.toFixed(4)));
  };

  // Quick preset locations in Itaituba for testing
  const PRESET_PLACES = [
    { name: 'Centro', lat: -4.2687, lng: -55.9895 },
    { name: 'Bela Vista', lat: -4.2705, lng: -55.9870 },
    { name: 'Perpétuo Socorro', lat: -4.2721, lng: -55.9812 },
    { name: 'Orla do Tapajós', lat: -4.2660, lng: -55.9920 }
  ];

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs space-y-3 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1">
            <span className="p-1 bg-indigo-50 text-indigo-600 rounded-md">📍</span>
            {isReadOnly ? 'Localização Exata no MAPS' : 'Posicionar Pin de Localização no MAPS'}
          </h4>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {isReadOnly 
              ? 'Verifique onde o espaço de eventos está localizado no mapa' 
              : 'Clique em qualquer lugar do mapa interativo para mover o marcador do seu espaço'}
          </p>
        </div>
        
        {/* Status indicator */}
        <div className="flex items-center gap-1.5 shrink-0 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 text-[9px] font-bold text-slate-500 font-mono">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span>GPS MAPS CONECTADO</span>
        </div>
      </div>

      {/* Lat/lng coordinates status */}
      <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[10px]">
        <div>
          <span className="text-[9px] text-slate-400 block uppercase font-extrabold tracking-wide">Latitude</span>
          <strong className="text-slate-700 font-bold font-mono">{latitude.toFixed(4)}</strong>
        </div>
        <div>
          <span className="text-[9px] text-slate-400 block uppercase font-extrabold tracking-wide">Longitude</span>
          <strong className="text-slate-700 font-bold font-mono">{longitude.toFixed(4)}</strong>
        </div>
      </div>

      {/* Responsive interactive MAP view */}
      <div 
        ref={mapRef}
        onClick={handleMapClick}
        className={`relative h-60 w-full rounded-xl overflow-hidden border border-slate-200 select-none ${
          isReadOnly ? 'cursor-default' : 'cursor-crosshair'
        }`}
      >
        {/* Satellite or standard map background theme */}
        {isSatellite ? (
          // Satellite View style
          <div className="absolute inset-0 bg-slate-900 overflow-hidden">
            {/* Ambient grid and landmass blobs */}
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />
            <div className="absolute top-1/4 left-1/4 w-36 h-36 bg-emerald-950/40 rounded-full blur-2xl" />
            <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-emerald-900/10 rounded-full blur-3xl animate-pulse" />
            
            {/* Visual rivers */}
            <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
              <path d="M 0,160 Q 120,150 200,100 T 400,20" fill="none" stroke="#0284c7" strokeWidth="12" />
              <path d="M 120,240 Q 240,180 320,120 T 400,80" fill="none" stroke="#0284c7" strokeWidth="4" />
            </svg>

            {/* Label texts */}
            <div className="absolute top-1/3 left-1/4 text-[9px] text-slate-500 font-bold font-mono uppercase tracking-widest pointer-events-none">BELA VISTA</div>
            <div className="absolute top-10 right-20 text-[9px] text-slate-500 font-bold font-mono uppercase tracking-widest pointer-events-none">AV. GETÚLIO VARGAS</div>
            <div className="absolute bottom-12 left-1/3 text-[9px] text-slate-500 font-bold font-mono uppercase tracking-widest pointer-events-none">ORLA TAPAJÓS</div>
            <div className="absolute top-2/3 right-1/4 text-[9px] text-slate-500 font-bold font-mono uppercase tracking-widest pointer-events-none">PERPÉTUO SOCORRO</div>
          </div>
        ) : (
          // Vector Map style (soft off-white elegant layout)
          <div className="absolute inset-0 bg-[#f8fafc] overflow-hidden">
            {/* Blocks and streets layout pattern */}
            <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 opacity-30">
              {Array.from({ length: 36 }).map((_, i) => (
                <div key={i} className="border-r border-b border-dashed border-slate-300" />
              ))}
            </div>

            {/* Custom stylized green parks (Orla, Trianon, etc) */}
            <div className="absolute bottom-4 left-1/3 w-32 h-16 bg-emerald-150 bg-emerald-100 rounded-full border border-emerald-250/50 opacity-80 flex items-center justify-center p-2 text-center pointer-events-none">
              <span className="text-[8px] font-black text-emerald-800 uppercase tracking-widest">🌳 Orla do Tapajós</span>
            </div>
            
            <div className="absolute top-8 left-12 w-16 h-12 bg-emerald-100/60 rounded-xl border border-emerald-200/50 flex items-center justify-center pointer-events-none">
              <span className="text-[7px] font-black text-emerald-800 uppercase tracking-widest">🌳 Bosque</span>
            </div>

            {/* Rivers (Rio Tapajós) */}
            <svg className="absolute inset-0 w-full h-full opacity-60" xmlns="http://www.w3.org/2000/svg">
              <path d="M -10,30 Q 150,110 240,20 T 520,30" fill="none" stroke="#bae6fd" strokeWidth="14" />
              <path d="M -10,30 Q 150,110 240,20 T 520,30" fill="none" stroke="#e0f2fe" strokeWidth="6" />
            </svg>

            {/* Major avenues / roads */}
            <svg className="absolute inset-0 w-full h-full opacity-70" xmlns="http://www.w3.org/2000/svg">
              {/* Av. Getúlio Vargas */}
              <line x1="-20" y1="50" x2="420" y2="45" stroke="#ffffff" strokeWidth="10" />
              <line x1="-20" y1="50" x2="420" y2="45" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="4,4" />
              
              {/* Av. Marechal Rondon */}
              <line x1="280" y1="0" x2="280" y2="280" stroke="#ffffff" strokeWidth="8" />
              
              {/* Rod. Transamazônica */}
              <line x1="80" y1="0" x2="180" y2="280" stroke="#ffffff" strokeWidth="8" />
            </svg>

            {/* Landmark text indicators */}
            <div className="absolute top-12 left-1/4 select-none pointer-events-none border border-slate-200 bg-white/70 backdrop-blur-xs rounded px-1.5 py-0.5 text-[8px] font-bold text-slate-500 font-mono uppercase tracking-wider">
              Av. Getúlio Vargas
            </div>
            <div className="absolute bottom-28 right-8 select-none pointer-events-none border border-slate-200 bg-white/70 backdrop-blur-xs rounded px-1.5 py-0.5 text-[8px] font-bold text-slate-500 font-mono uppercase tracking-wider">
              Perpétuo Socorro
            </div>
            <div className="absolute top-28 left-4 select-none pointer-events-none border border-slate-200 bg-white/70 backdrop-blur-xs rounded px-1.5 py-0.5 text-[8px] font-bold text-slate-500 font-mono uppercase tracking-wider">
              Bela Vista
            </div>
          </div>
        )}

        {/* Placing PIN Marker coordinates indicator */}
        <div 
          className="absolute z-20 flex flex-col items-center pointer-events-none -translate-x-1/2 -translate-y-full transition-all duration-300"
          style={{ top: `${pinPos.top}%`, left: `${pinPos.left}%` }}
        >
          {/* Pulsating sonar indicator */}
          <div className="absolute w-6 h-6 bg-indigo-500/20 rounded-full animate-ping mt-1" />
          
          <div className="relative group/pin">
            {/* Elegant SVG Map Pin layout */}
            <div className="bg-indigo-600 text-white rounded-full p-2 shadow-lg border border-white hover:scale-110 active:scale-95 transition-all">
              <MapPin className="w-5 h-5 fill-white text-indigo-600" />
            </div>
          </div>

          {/* Quick micro tooltip address label */}
          <div className="mt-1 bg-slate-900/90 text-[9px] font-bold text-white px-2 py-0.5 rounded shadow-lg border border-slate-800 tracking-wide text-center uppercase whitespace-nowrap">
            {address ? address.split(',')[0].slice(0, 16) : 'LOCAL SELECIONADO'}
          </div>
        </div>

        {/* Simulated Google Maps layout floating controls */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-20">
          <div className="bg-white/95 backdrop-blur-xs p-1.5 rounded-lg shadow-md border border-slate-200 flex items-center gap-1">
            <span className="p-1 text-slate-400">
              <Search className="w-3.5 h-3.5" />
            </span>
            <input 
              type="text" 
              placeholder={address ? address.slice(0, 24) + '...' : 'Procurar no mapa...'}
              disabled 
              className="text-[9.5px] font-semibold text-slate-600 bg-transparent border-0 w-36 focus:outline-none"
            />
          </div>
        </div>

        {/* Bottom controls: zoom keys & satellite toggle selector */}
        <div className="absolute bottom-3 right-3 flex flex-col gap-1.5 z-20">
          <div className="flex flex-col bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setZoom(z => Math.min(18, z + 1)); }}
              className="p-1.5 hover:bg-slate-50 transition-colors border-b border-slate-100 text-slate-600 cursor-pointer text-xs flex justify-center items-center"
              title="Aproximar"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setZoom(z => Math.max(10, z - 1)); }}
              className="p-1.5 hover:bg-slate-50 transition-colors text-slate-600 cursor-pointer text-xs flex justify-center items-center"
              title="Afastar"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setIsSatellite(!isSatellite); }}
            className="px-2.5 py-1.5 bg-white hover:bg-slate-50 rounded-lg shadow-md border border-slate-200 text-[9px] font-bold text-slate-600 transition-colors flex items-center gap-1 cursor-pointer"
            title="Mudar visual do Mapa"
          >
            {isSatellite ? <Globe className="w-3 h-3 text-indigo-600" /> : <Compass className="w-3 h-3 text-emerald-600" />}
            {isSatellite ? 'FOTO/SATÉLITE' : 'ESTILO MAPA'}
          </button>
        </div>
      </div>

      {/* Preset fast selector shortcuts */}
      {!isReadOnly && (
        <div className="pt-1.5 border-t border-slate-100">
          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">Ajuste Rápido de Localização:</span>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_PLACES.map((pt) => {
              const isSelected = Math.abs(latitude - pt.lat) < 0.005 && Math.abs(longitude - pt.lng) < 0.005;
              return (
                <button
                  key={pt.name}
                  type="button"
                  onClick={() => onChange(pt.lat, pt.lng)}
                  className={`text-[9.5px] px-2.5 py-1.5 rounded-lg border font-semibold cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-650/15'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                  }`}
                >
                  📍 {pt.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
