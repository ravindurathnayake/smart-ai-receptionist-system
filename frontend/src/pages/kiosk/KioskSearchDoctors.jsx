import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../../components/common/Logo';
import { apiService } from '../../services/apiService';
import { socketService } from '../../services/socketService';
import KioskTopBar from '../../components/kiosk/KioskTopBar';
import './KioskSearchDoctors.css';

// ─── Data ─────────────────────────────────────────────────────────────────────

const SPECIALTIES = [
    { label: 'All', icon: 'grid_view' },
    { label: 'Cardiologist', icon: 'favorite' },
    { label: 'Neurologist', icon: 'neurology' },
    { label: 'Pediatrician', icon: 'child_care' },
    { label: 'Endocrinologist', icon: 'water_drop' },
    { label: 'Orthopedist', icon: 'orthopedics' },
    { label: 'Ophthalmologist', icon: 'visibility' },
];

// ─── Doctor Card ──────────────────────────────────────────────────────────────

const DoctorCard = ({ doctor }) => {
    const navigate = useNavigate();
    const { name, specialty, rating, reviews, nextSlot, featured, photo } = doctor;

    return (
        <div className={`doctor-card bg-surface-container-lowest rounded-[1.75rem] p-5 border flex flex-col gap-4 ${featured ? 'border-primary/20' : 'border-transparent'}`}>
            {/* Photo + info row */}
            <div className="flex gap-4 items-start">
                <div className="shrink-0">
                    {photo ? (
                        <img
                            alt={name}
                            src={photo}
                            className="doctor-photo w-20 h-20 rounded-2xl object-cover"
                        />
                    ) : (
                        <div className="w-20 h-20 rounded-2xl bg-secondary-container flex items-center justify-center">
                            <span className="material-symbols-outlined text-3xl text-on-secondary-container">
                                medical_information
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex flex-col justify-center min-w-0">
                    {featured && (
                        <span className="text-[10px] font-bold uppercase tracking-wide text-primary bg-primary/10 px-2 py-0.5 rounded-full w-fit mb-1">
                            Top Rated
                        </span>
                    )}
                    <h3 className="text-base font-bold text-on-surface font-headline leading-tight truncate">{name}</h3>
                    <p className="text-primary font-semibold text-xs mt-0.5">{specialty}</p>
                    <div className="flex items-center gap-1 mt-1">
                        <span
                            className="material-symbols-outlined text-amber-400 text-base"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                        >
 Star
                        </span>
                        <span className="text-sm font-bold text-on-surface">{rating}</span>
                        <span className="text-xs text-outline">({reviews} reviews)</span>
                    </div>
                </div>
            </div>

            <div className="bg-surface-container-low rounded-xl p-3 space-y-2">
                <p className="text-[10px] uppercase font-bold text-outline tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">calendar_clock</span>
                    Available Sessions
                </p>
                <div className="flex flex-wrap gap-1.5">
                    {doctor.sessions && doctor.sessions.length > 0 ? (
                        doctor.sessions.slice(0, 3).map((sess, idx) => (
                            <div key={idx} className="bg-white/60 px-2 py-1 rounded-lg border border-slate-100 text-[10px] font-bold text-on-surface">
                                {sess.day_of_week.slice(0,3)} • {sess.start_time}
                            </div>
                        ))
                    ) : (
                        <span className="text-[10px] font-bold text-outline italic px-1">No sessions listed</span>
                    )}
                </div>
            </div>

            <button
                onClick={() => navigate('/sessions', { state: { doctor } })}
                className={`w-full py-3 rounded-full font-bold text-sm tracking-wide transition-all hover:scale-[1.02] active:scale-95 ${featured
                    ? 'bg-gradient-to-r from-primary to-primary-container text-white shadow-lg shadow-primary/20'
                    : 'bg-surface-container-highest text-on-primary-fixed-variant hover:bg-primary-fixed'
                    }`}
            >
                Book Appointment
            </button>
        </div>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const KioskSearchDoctors = () => {
    const navigate = useNavigate();
    const [patient, setPatient] = useState(null);
    const [doctors, setDoctors] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSpecialty, setSpecialty] = useState('All');
    const [dateFilter, setDateFilter] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchDoctors = useCallback(async () => {
        try {
            const response = await apiService.getSpecialists();
            if (response) {
                const mapped = response.map(d => ({
                    id: d.id,
                    name: d.name ? (d.title ? `${d.title} ${d.name}` : `Dr. ${d.name}`) : 'Unknown Doctor',
                    specialty: d.specialization || d.department || 'General Practice',
                    rating: d.rating || 4.8,
                    reviews: 42, 
                    nextSlot: d.sessions && d.sessions.length > 0 ? `${d.sessions[0].day_of_week} ${d.sessions[0].start_time}` : 'Not Available',
                    featured: d.rating >= 4.8,
                    photo: d.profile_image || null,
                    bio: d.bio || '',
                    languages: d.languages || 'English',
                    consultation_fee: d.consultation_fee || 0.0,
                    sessions: d.sessions || []
                }));
                setDoctors(mapped);
            }
        } catch (err) {
            console.error('Failed to fetch doctors:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const savedPatient = localStorage.getItem('activePatient');
        if (savedPatient) {
            setPatient(JSON.parse(savedPatient));
        }

        fetchDoctors();

        // Connect to Socket.IO and listen for real-time updates
        socketService.connect();

        const handleUpdate = () => {
            fetchDoctors();
        };

        socketService.on('specialist_updated', handleUpdate);
        socketService.on('appointment_booked', handleUpdate);
        socketService.on('appointment_rescheduled', handleUpdate);
        socketService.on('queue_updated', handleUpdate);

        return () => {
            socketService.off('specialist_updated', handleUpdate);
            socketService.off('appointment_booked', handleUpdate);
            socketService.off('appointment_rescheduled', handleUpdate);
            socketService.off('queue_updated', handleUpdate);
        };
    }, [fetchDoctors]);

    const filtered = doctors.filter((d) => {
        const nameStr = d.name || '';
        const specStr = d.specialty || '';
        
        const matchName = nameStr.toLowerCase().includes(searchQuery.toLowerCase());
        const matchSpec = activeSpecialty === 'All' || 
                         specStr.toLowerCase().includes(activeSpecialty.toLowerCase().replace('ist', '')) ||
                         activeSpecialty.toLowerCase().includes(specStr.toLowerCase().replace('ology', ''));
        
        let matchDate = true;
        if (dateFilter) {
            try {
                const searchDate = new Date(dateFilter);
                if (!isNaN(searchDate.getTime())) {
                    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    const searchDay = days[searchDate.getDay()];
                    matchDate = d.sessions && d.sessions.some(sess => sess.day_of_week === searchDay);
                }
            } catch (e) {
                console.error("Invalid date filter:", e);
            }
        }

        return matchName && matchSpec && matchDate;
    });

    const patientName = patient ? (patient.full_name || patient.name || 'Patient') : 'Guest Visitor';

    return (
        <div className="w-screen h-screen overflow-hidden flex font-body bg-surface text-on-surface">
            {/* ── Left Sidebar ── */}
            <aside className="hidden md:flex flex-col w-64 h-screen bg-white border-r border-outline-variant/30 z-20 shrink-0">
                <div className="p-6 pb-4 cursor-pointer" onClick={() => navigate('/')}>
                    <Logo size="sm" className="w-full" />
                </div>
                <nav className="flex-1 flex flex-col px-3 mt-4 gap-1">
                    {[
                        { icon: 'account_circle',   label: 'Personal Dashboard',   path: '/patient-dashboard' },
                        { icon: 'smart_toy',        label: 'AI Assistant',         path: '/assistant' },
                        { icon: 'hourglass_empty',  label: 'Queue Status',         path: '/queue' },
                        { icon: 'calendar_month',   label: 'Find Doctors',         path: '/doctors', active: true  },
                        { icon: 'how_to_reg',       label: 'Check-In / Check-Out', path: '/checkin-out' },
                        { icon: 'map',              label: 'Hospital Map',         path: '/hospital-map' },
                    ].map(({ icon, label, path, active }) => (
                        <div
                            key={label}
                            onClick={() => path !== '#' && navigate(path)}
                            className={`flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all font-semibold text-sm cursor-pointer ${
                                active ? 'nav-item-active' : 'text-primary hover:bg-slate-50'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[22px]" style={active ? { fontVariationSettings: "'FILL' 1" } : {}}>{icon}</span>
                            <span>{label}</span>
                        </div>
                    ))}
                </nav>
                <div className="px-4 pb-5 mt-auto">
                    <div className="p-5 bg-slate-50 rounded-xl border border-dashed border-outline-variant/40 text-center mb-4">
                        <span className="material-symbols-outlined text-primary text-2xl mb-2 block">support_agent</span>
                        <p className="text-xs font-bold text-primary mb-3">Need Assistance?</p>
                        <button className="w-full py-2.5 bg-primary text-white rounded-lg font-bold text-xs shadow-sm hover:opacity-90 transition-opacity" onClick={() => navigate('/assistant')}>Call for Help</button>
                    </div>
                    <button 
                        onClick={() => { localStorage.removeItem('activePatient'); navigate('/'); }}
                        className="flex items-center gap-4 px-5 py-3.5 w-full text-red-600 hover:bg-red-50 rounded-xl transition-all border-t border-slate-100 pt-4"
                    >
                        <span className="material-symbols-outlined">logout</span>
                        <span className="font-bold text-sm">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* ── Main Canvas ── */}
            <main className="flex-1 flex flex-col relative overflow-hidden bg-white">
                <div className="ambient-blob-top" />
                <div className="ambient-blob-bottom" />

                <KioskTopBar title="Find Doctors" patientName={patientName} />

                <div className="flex-1 overflow-hidden flex flex-col px-10 py-5 z-10 min-h-0">
                    <div className="mb-4">
                        <h2 className="font-headline text-2xl font-extrabold text-on-surface tracking-tight">Find your specialist</h2>
                        <p className="text-on-surface-variant text-sm mt-0.5">Search through our network of world-class medical professionals.</p>
                    </div>

                    <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-[0_8px_30px_rgba(0,71,141,0.05)] border border-outline-variant/10 mb-4 shrink-0">
                        <div className="grid grid-cols-5 gap-3 items-end">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-outline uppercase tracking-wider px-1">Doctor Name</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
                                    <input className="search-input w-full pl-10 pr-3 py-3 bg-surface-container-low border-none rounded-xl text-on-surface text-sm placeholder:text-outline/60" placeholder="Search by name…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} type="text" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-outline uppercase tracking-wider px-1">Specialization</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px] pointer-events-none">medical_information</span>
                                    <select className="search-input w-full pl-10 pr-3 py-3 bg-surface-container-low border-none rounded-xl text-on-surface text-sm appearance-none cursor-pointer" value={activeSpecialty} onChange={(e) => setSpecialty(e.target.value)}>
                                        {SPECIALTIES.map((s) => (<option key={s.label}>{s.label}</option>))}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-outline uppercase tracking-wider px-1">Hospital</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">local_hospital</span>
                                    <input className="w-full pl-10 pr-3 py-3 bg-surface-container-low border-none rounded-xl text-on-surface/50 text-sm font-medium" disabled value="Colombo Central General" readOnly />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-outline uppercase tracking-wider px-1">Date</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px] pointer-events-none">calendar_today</span>
                                    <input className="search-input w-full pl-10 pr-3 py-3 bg-surface-container-low border-none rounded-xl text-on-surface text-sm" type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} min={new Date().toISOString().split('T')[0]} />
                                </div>
                            </div>
                            <button className="py-3 px-6 bg-primary text-white font-bold rounded-xl hover:bg-primary-container transition-colors flex items-center justify-center gap-2 text-sm shadow-sm">
                                <span className="material-symbols-outlined text-[18px]">search</span>
                                Search
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar shrink-0">
                        {SPECIALTIES.map((s) => (
                            <button key={s.label} onClick={() => setSpecialty(s.label)} className={`spec-chip ${activeSpecialty === s.label ? 'active' : ''}`}>
                                <span className="material-symbols-outlined text-[16px]" style={activeSpecialty === s.label ? { fontVariationSettings: "'FILL' 1" } : {}}>{s.icon}</span>
                                {s.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
                        {loading ? (
                            <div className="h-full flex items-center justify-center"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
                        ) : filtered.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center">
                                <span className="material-symbols-outlined text-5xl text-outline/40 mb-3">search_off</span>
                                <p className="font-bold text-on-surface-variant">No doctors found matching your criteria.</p>
                                <button onClick={() => { setSearchQuery(''); setSpecialty('All'); }} className="mt-3 text-primary text-sm font-semibold hover:underline">Clear filters</button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-4 pb-4">
                                {filtered.map((doc) => (<DoctorCard key={doc.id} doctor={doc} />))}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <button className="ai-float-chip" onClick={() => navigate('/assistant')}>
                <div className="ai-float-glow" />
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-primary-container flex items-center justify-center text-white shrink-0">
                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                </div>
                <div className="text-left relative z-10">
                    <p className="text-[10px] font-bold text-primary uppercase tracking-tight">AI Assistant</p>
                    <p className="text-sm font-bold text-on-surface">How can I help you today, {patientName.split(' ')[0]}?</p>
                </div>
                <div className="ai-live-dot relative z-10 ml-1" />
            </button>
        </div>
    );
};

export default KioskSearchDoctors;
