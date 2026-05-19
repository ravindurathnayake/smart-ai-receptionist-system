import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { mapData, floors } from '../../utils/mapData';
import PatientHeader from '../../components/common/PatientHeader';
import '../kiosk/HospitalMap.css';

const PatientMap = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeFloor, setActiveFloor] = useState('Ground Floor');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDirections, setShowDirections] = useState(false);
  const [patient, setPatient] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
      const savedPatient = localStorage.getItem('activePatient');
      if (savedPatient) {
          setPatient(JSON.parse(savedPatient));
      }
  }, []);

  const patientName = patient ? (patient.full_name || patient.name || 'Patient') : 'Guest Visitor';

  // Handle URL parameters for chatbot integration
  useEffect(() => {
    const destId = searchParams.get('destination');
    if (destId) {
      const location = mapData.find(loc => loc.id === destId.toLowerCase() || loc.name.toLowerCase().includes(destId.toLowerCase()));
      if (location) {
        handleSelectLocation(location);
      }
    }
  }, [searchParams]);

  const filteredLocations = useMemo(() => {
    if (!searchQuery) return [];
    return mapData.filter(loc => 
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleSelectLocation = (location) => {
    setSelectedLocation(location);
    setActiveFloor(location.floor);
    setSearchQuery('');
    setShowDirections(true);
  };

  const currentFloorLocations = mapData.filter(loc => loc.floor === activeFloor);

  // SVG dimensions
  const viewBox = "0 0 800 800";

  // You are here marker (Reception on Ground Floor)
  const userLocation = { x: 120, y: 500, floor: "Ground Floor" };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-body text-slate-800 flex flex-col relative selection:bg-primary selection:text-white overflow-x-hidden">
      <PatientHeader />

      <main className="h-[calc(100vh-5rem)] flex flex-col relative overflow-hidden bg-white z-10">
        <div className="flex-grow flex flex-col lg:flex-row overflow-hidden relative">
          {/* Left Sidebar: Search & Info */}
          <aside className="w-full lg:w-96 bg-white shadow-2xl z-40 flex flex-col border-r border-outline-variant/10 shrink-0">
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-on-surface-variant/60 ml-1 text-left block">Search Destination</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60">search</span>
                  <input 
                    type="text"
                    placeholder="Where do you want to go?"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-[#005eb8]/20 transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-outline-variant/20 overflow-hidden z-50">
                      {filteredLocations.length > 0 ? (
                        filteredLocations.map(loc => (
                          <button
                            key={loc.id}
                            onClick={() => handleSelectLocation(loc)}
                            className="w-full p-4 text-left hover:bg-primary/5 flex items-center gap-4 transition-colors border-b border-outline-variant/10 last:border-0"
                          >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${loc.category === 'Emergency' ? 'bg-error/10 text-error' : 'bg-primary/10 text-[#005eb8]'}`}>
                              <span className="material-symbols-outlined text-xl">
                                {loc.category === 'Emergency' ? 'emergency' : loc.category === 'Lab' ? 'biotech' : 'medical_services'}
                              </span>
                            </div>
                            <div>
                              <div className="font-bold text-on-surface">{loc.name}</div>
                              <div className="text-xs font-medium text-on-surface-variant">{loc.floor} • {loc.room}</div>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="p-6 text-center text-on-surface-variant font-medium">No locations found</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Select Chips */}
              <div className="flex flex-wrap gap-2">
                {['Emergency', 'Pharmacy', 'Lab', 'Radiology', 'Restroom'].map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setSearchQuery(cat)}
                    className="px-4 py-2 rounded-full bg-slate-50 text-xs font-bold text-slate-500 hover:bg-[#005eb8]/10 hover:text-[#005eb8] transition-all border border-slate-200"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-grow overflow-y-auto custom-scrollbar p-6 pt-0 text-left">
              {selectedLocation ? (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-2xl font-black font-headline text-[#005eb8] leading-tight">{selectedLocation.name}</h2>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">{selectedLocation.floor} • {selectedLocation.room}</p>
                      </div>
                      <button 
                        onClick={() => setSelectedLocation(null)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    </div>
                    
                    <div className="h-px bg-slate-200 w-full"></div>
                    
                    <div className="space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">directions</span>
                        Step-by-Step Directions
                      </h3>
                      <div className="space-y-3">
                        {selectedLocation.directions.map((step, i) => (
                          <div key={i} className="flex gap-4 group">
                            <div className="flex flex-col items-center">
                              <div className="w-6 h-6 rounded-full bg-[#005eb8] text-white text-[10px] font-black flex items-center justify-center shrink-0">
                                {i + 1}
                              </div>
                              {i < selectedLocation.directions.length - 1 && (
                                <div className="w-0.5 h-full bg-slate-200 my-1"></div>
                              )}
                            </div>
                            <p className="text-sm font-medium text-slate-600 leading-relaxed group-hover:text-slate-900 transition-colors">
                              {step}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-[2rem] bg-blue-50/40 border border-blue-100 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined">accessibility_new</span>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-800">Need help?</div>
                      <div className="text-xs font-medium text-slate-500">Ask staff at any information desk.</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 opacity-50">
                  <span className="material-symbols-outlined text-6xl text-slate-300">map_search</span>
                  <div>
                    <h3 className="text-lg font-bold text-slate-700">Select a destination</h3>
                    <p className="text-sm font-medium text-slate-400">Select a room on the map or search to see directions</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100">
              <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#005eb8]"></div>
                  <span>Current Path</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span>You are here</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Right Section: Map Display */}
          <div className="flex-1 flex flex-col relative bg-slate-50 p-6 overflow-hidden">
            {/* Floor Selector Tabs */}
            <div className="z-30 flex p-1.5 bg-white rounded-2xl shadow-md border border-slate-100 max-w-sm mx-auto mb-6 shrink-0">
              {floors.map(floor => (
                <button
                  key={floor.id}
                  onClick={() => setActiveFloor(floor.name)}
                  className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all tracking-wide uppercase ${
                    activeFloor === floor.name 
                      ? 'bg-[#005eb8] text-white shadow-md' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  {floor.name}
                </button>
              ))}
            </div>

            {/* Map Canvas */}
            <div className="flex-grow flex items-center justify-center overflow-hidden">
              <div className="relative w-full h-full max-w-3xl max-h-[600px] bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden flex items-center justify-center">
                <svg 
                  viewBox={viewBox} 
                  className="w-full h-full p-6"
                  style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.02))' }}
                >
                  {/* Schematic Floor Background */}
                  <rect x="50" y="50" width="700" height="700" rx="32" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2" />
                  
                  {/* Corridors (simplified) */}
                  <path d="M 400 100 L 400 700" stroke="#f1f5f9" strokeWidth="60" strokeLinecap="round" />
                  <path d="M 100 400 L 700 400" stroke="#f1f5f9" strokeWidth="60" strokeLinecap="round" />
                  
                  {/* Draw rooms for current floor */}
                  {activeFloor === "Ground Floor" && <GroundFloorSVG selectedLocation={selectedLocation} onSelect={handleSelectLocation} />}
                  {activeFloor === "First Floor" && <FirstFloorSVG selectedLocation={selectedLocation} onSelect={handleSelectLocation} />}
                  {activeFloor === "Second Floor" && <SecondFloorSVG selectedLocation={selectedLocation} onSelect={handleSelectLocation} />}

                  {/* Path highlighting */}
                  {selectedLocation && selectedLocation.floor === activeFloor && (
                    <path 
                      d={`M ${selectedLocation.path.map(p => `${p.x} ${p.y}`).join(' L ')}`}
                      fill="none"
                      stroke="#005eb8"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray="12 12"
                      className="path-animation"
                    />
                  )}

                  {/* Markers */}
                  {userLocation.floor === activeFloor && (
                    <g transform={`translate(${userLocation.x}, ${userLocation.y})`}>
                      <circle r="15" fill="#10b981" className="animate-pulse opacity-20" />
                      <circle r="8" fill="#10b981" stroke="white" strokeWidth="3" />
                      <text y="-25" textAnchor="middle" className="text-[10px] font-black fill-emerald-600 uppercase tracking-wider">You are here</text>
                    </g>
                  )}

                  {selectedLocation && selectedLocation.floor === activeFloor && (
                    <g transform={`translate(${selectedLocation.coordinates.x}, ${selectedLocation.coordinates.y})`}>
                      <circle r="20" fill="#005eb8" className="animate-ping opacity-10" />
                      <circle r="10" fill="#005eb8" stroke="white" strokeWidth="3" />
                      <text y="-25" textAnchor="middle" className="text-[12px] font-black fill-[#005eb8] uppercase tracking-wider">{selectedLocation.name}</text>
                    </g>
                  )}
                </svg>

                {/* Map Legend (Overlay) */}
                <div className="absolute bottom-6 right-6 p-4 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-slate-100 space-y-2 text-left shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-3.5 h-3.5 rounded bg-[#005eb8]/10 border border-[#005eb8]/20"></div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">Departments</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3.5 h-3.5 rounded bg-emerald-500/10 border border-emerald-500/20"></div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">Services</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3.5 h-3.5 rounded bg-red-500/10 border border-red-500/20"></div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">Emergency</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// Floor SVG Components
const GroundFloorSVG = ({ selectedLocation, onSelect }) => {
  const rooms = [
    { id: 'reception', name: 'Reception', x: 80, y: 450, w: 150, h: 100, cat: 'Service' },
    { id: 'pharmacy', name: 'Pharmacy', x: 300, y: 550, w: 120, h: 100, cat: 'Service' },
    { id: 'emergency', name: 'Emergency', x: 80, y: 150, w: 150, h: 120, cat: 'Emergency' },
    { id: 'radiology', name: 'Radiology', x: 550, y: 400, w: 150, h: 120, cat: 'Lab' },
    { id: 'elevators', name: 'Elevators', x: 380, y: 380, w: 40, h: 40, cat: 'Service', icon: 'elevator' },
    { id: 'stairs', name: 'Stairs', x: 380, y: 320, w: 40, h: 40, cat: 'Service' },
    { id: 'restroom_g', name: 'Restroom', x: 380, y: 600, w: 60, h: 60, cat: 'Service' },
  ];

  return (
    <g>
      {rooms.map(room => (
        <g 
          key={room.id} 
          className="cursor-pointer group" 
          onClick={() => {
            const loc = mapData.find(l => l.id === room.id);
            if (loc) onSelect(loc);
          }}
        >
          <rect 
            x={room.x} y={room.y} width={room.w} height={room.h} rx="12" 
            fill={selectedLocation?.id === room.id ? (room.cat === 'Emergency' ? '#ffdad6' : '#d6e3ff') : (room.cat === 'Emergency' ? '#fff1f0' : '#f8fafc')}
            stroke={selectedLocation?.id === room.id ? (room.cat === 'Emergency' ? '#ba1a1a' : '#005eb8') : '#e2e8f0'}
            strokeWidth={selectedLocation?.id === room.id ? "3" : "1"}
            className="transition-all duration-300 group-hover:stroke-[#005eb8] group-hover:stroke-[2]"
          />
          <text 
            x={room.x + room.w/2} y={room.y + room.h/2 + 5} 
            textAnchor="middle" 
            className={`text-[9px] font-black uppercase tracking-tighter ${selectedLocation?.id === room.id ? 'fill-[#005eb8]' : 'fill-slate-400'}`}
          >
            {room.name}
          </text>
        </g>
      ))}
    </g>
  );
};

const FirstFloorSVG = ({ selectedLocation, onSelect }) => {
  const rooms = [
    { id: 'lab', name: 'Main Lab', x: 150, y: 250, w: 120, h: 100, cat: 'Lab' },
    { id: 'elevators', name: 'Elevators', x: 380, y: 380, w: 40, h: 40, cat: 'Service', icon: 'elevator' },
  ];

  return (
    <g>
      {rooms.map(room => (
        <g key={room.id} className="cursor-pointer group" onClick={() => {
          const loc = mapData.find(l => l.id === room.id);
          if (loc) onSelect(loc);
        }}>
          <rect 
            x={room.x} y={room.y} width={room.w} height={room.h} rx="12" 
            fill={selectedLocation?.id === room.id ? '#d6e3ff' : '#f8fafc'}
            stroke={selectedLocation?.id === room.id ? '#005eb8' : '#e2e8f0'}
            strokeWidth={selectedLocation?.id === room.id ? "3" : "1"}
            className="transition-all duration-300 group-hover:stroke-[#005eb8] group-hover:stroke-[2]"
          />
          <text x={room.x + room.w/2} y={room.y + room.h/2 + 5} textAnchor="middle" className={`text-[9px] font-black uppercase tracking-tighter ${selectedLocation?.id === room.id ? 'fill-[#005eb8]' : 'fill-slate-400'}`}>{room.name}</text>
        </g>
      ))}
    </g>
  );
};

const SecondFloorSVG = ({ selectedLocation, onSelect }) => {
  const rooms = [
    { id: 'cardiology', name: 'Cardiology', x: 600, y: 280, w: 120, h: 100, cat: 'Department' },
    { id: 'neurology', name: 'Neurology', x: 600, y: 100, w: 120, h: 100, cat: 'Department' },
    { id: 'orthopedics', name: 'Orthopedics', x: 100, y: 100, w: 120, h: 100, cat: 'Department' },
    { id: 'dermatology', name: 'Dermatology', x: 100, y: 280, w: 120, h: 100, cat: 'Department' },
    { id: 'elevators', name: 'Elevators', x: 380, y: 380, w: 40, h: 40, cat: 'Service', icon: 'elevator' },
  ];

  return (
    <g>
      {rooms.map(room => (
        <g key={room.id} className="cursor-pointer group" onClick={() => {
          const loc = mapData.find(l => l.id === room.id);
          if (loc) onSelect(loc);
        }}>
          <rect 
            x={room.x} y={room.y} width={room.w} height={room.h} rx="12" 
            fill={selectedLocation?.id === room.id ? '#d6e3ff' : '#f8fafc'}
            stroke={selectedLocation?.id === room.id ? '#005eb8' : '#e2e8f0'}
            strokeWidth={selectedLocation?.id === room.id ? "3" : "1"}
            className="transition-all duration-300 group-hover:stroke-[#005eb8] group-hover:stroke-[2]"
          />
          <text x={room.x + room.w/2} y={room.y + room.h/2 + 5} textAnchor="middle" className={`text-[9px] font-black uppercase tracking-tighter ${selectedLocation?.id === room.id ? 'fill-[#005eb8]' : 'fill-slate-400'}`}>{room.name}</text>
        </g>
      ))}
    </g>
  );
};

export default PatientMap;
