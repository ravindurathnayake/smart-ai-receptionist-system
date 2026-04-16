import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

const DOCTORS = [
    {
        id: 1,
        name: 'Dr. Kavindi Perera',
        specialty: 'Cardiologist',
        rating: 4.9,
        reviews: 124,
        nextSlot: 'Tomorrow, 09:30 AM',
        featured: true,
        photo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCvX2wS63-d97wyr9R0PY8cRq8Bdw6xNtsOTpDy6ycziukY_TAJAXrw-GegYtWEhSJBa9FdEebA9fM1_8JgL9Fk_aEHioTHv7hG9OUKJdu2QVUVPmcpauHxGc43nDkfra3LyG0lZthSiU4FwpvLsYQoMuxX03H8mleZAtWaXy3eTavG-mKuDgS_hLZSB94-4eOycOQxm85liWqNoxHJlJgfXrKvD7h9BbnwU0Oh5Kgd_QbTO4X-KU7ddbGsZrUoMeN8Dmu0-a9Yn8Q',
    },
    {
        id: 2,
        name: 'Dr. Rohan Jayasinghe',
        specialty: 'Neurologist',
        rating: 4.7,
        reviews: 98,
        nextSlot: 'Monday, 02:00 PM',
        featured: false,
        photo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDISPBloIbpKm0uYgADE8Lu3_9pikgB6fWg_HqFJTBM9LDP6V_Lv7aiT21ZxD9Ed-qHgfWDKlBgjJQ-onGs5ap0bQw3Fo62QwGOysDP1v1Qum-TXXn8amG8RoFCXkjZu-THfSen3iBHaUX8PVKkj-IvUqt9TAf9PQl6wewn6zVKrcTDFmrSYeXm-PyCQ0Cb0Vqwx5tlC0QrKPkjX7ybCZq2S7WSD1IvgSR35YtzZ3kIcYYIQ-n4Z1KNPrHdiyfPioV2dSjmG2pMqe4',
    },
    {
        id: 3,
        name: 'Dr. Sarah de Silva',
        specialty: 'Pediatrician',
        rating: 5.0,
        reviews: 210,
        nextSlot: 'Tomorrow, 11:15 AM',
        featured: false,
        photo: null, // uses icon fallback
    },
    {
        id: 4,
        name: 'Dr. Nimal Jayawardena',
        specialty: 'Endocrinologist',
        rating: 4.8,
        reviews: 76,
        nextSlot: 'Wednesday, 10:00 AM',
        featured: false,
        photo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAmIvjZRhfhIaH78qJmB16DT1d-wf32Es1BK4QBq4BPgWYERIowVIPhsTmJp-tYAezjGyCTIFW9LyHG8lYbX5ZxYYCkEdeXCqaBdbTELmbmuZGPYISJYqCnPOf0XFL2P-pQSSRXEIKh886WqzJmosxM2N5Gb_WKlGdbVi_NY709h8ApzDUkOZjTfM8azM3r62rWVMZyCQackDU34IUORaVgEpxIHGLjhEMdsBAj5rZUrGCmlCCHv1zZihpkO6HiFDYSjGKyS4M1p3Y',
    },
    {
        id: 5,
        name: 'Dr. Chamari Wijesinghe',
        specialty: 'Ophthalmologist',
        rating: 4.6,
        reviews: 55,
        nextSlot: 'Friday, 09:00 AM',
        featured: false,
        photo: null,
    },
    {
        id: 6,
        name: 'Dr. Asanka Fernando',
        specialty: 'Orthopedist',
        rating: 4.5,
        reviews: 89,
        nextSlot: 'Thursday, 03:30 PM',
        featured: false,
        photo: null,
    },
];

// ─── Shared Components (identical to KioskAIAssistant) ────────────────────────

const SideNav = () => {
    const navigate = useNavigate();
    const navItems = [
        { icon: 'home',             label: 'Home',                 path: '/' },
        { icon: 'smart_toy',        label: 'AI Assistant',         path: '/assistant' },
        { icon: 'hourglass_empty',  label: 'Queue Status',         path: '/queue' },
        { icon: 'calendar_month',   label: 'Find Doctors',         path: '/doctors', active: true  },
        { icon: 'how_to_reg',       label: 'Check-In / Check-Out', path: '/checkin-out' },
        { icon: 'map',              label: 'Hospital Map',         path: '#' },
    ];

    return (
        <aside className="hidden md:flex flex-col w-64 h-screen bg-white border-r border-outline-variant/30 z-20 shrink-0">
            {/* Logo */}
            <div className="p-6 pb-4 cursor-pointer" onClick={() => navigate('/')}>
                <img
                    alt="MediAssist AI Logo"
                    className="h-auto w-full object-contain"
                    src="https://lh3.googleusercontent.com/aida/ADBb0ujXwF6C1p4tSb8vEq_Vmwl_53J0InGaheovhXLH7KGxUAskWVzcmzRsAs4hNU6BDpnzzgqIddtDEE2uKDp7voQktbfUaXQqNCZbJy-zXfZepWAjM1L0U9AF10_W9r1H4ZajR8yZC60FtPSzwt4s6LU5DYKM4PuwSNmLqlHjnd1GpTrYwyE43IkdQkjzasfMPYu577RrcaQ7m44ZjDXHlFvqJh3bkIFwJbJEfn-rtsmpCtyZlecRtVcsOJwJGz1hb3L15Gl0yN9F_Q"
                />
            </div>

            {/* Nav links */}
            <nav className="flex-1 flex flex-col px-3 mt-4 gap-1">
                {navItems.map(({ icon, label, path, active }) => (
                    <div
                        key={label}
                        onClick={() => path !== '#' && navigate(path)}
                        className={`flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all font-semibold text-sm cursor-pointer ${
                            active ? 'nav-item-active' : 'text-primary hover:bg-slate-50'
                        }`}
                    >
                        <span
                            className="material-symbols-outlined text-[22px]"
                            style={active ? { fontVariationSettings: "'FILL' 1" } : {}}
                        >
                            {icon}
                        </span>
                        <span>{label}</span>
                    </div>
                ))}
            </nav>

            {/* Bottom panel — exact match to KioskAIAssistant */}
            <div className="px-4 pb-5 mt-auto">
                <div className="p-5 bg-slate-50 rounded-xl border border-dashed border-outline-variant/40 text-center mb-4">
                    <span className="material-symbols-outlined text-primary text-2xl mb-2 block">support_agent</span>
                    <p className="text-xs font-bold text-primary mb-3">Need Assistance?</p>
                    <button className="w-full py-2.5 bg-primary text-white rounded-lg font-bold text-xs shadow-sm hover:opacity-90 transition-opacity" onClick={() => navigate('/assistant')}>
                        Call for Help
                    </button>
                </div>
                <button 
                    onClick={() => navigate('/')}
                    className="flex items-center gap-4 px-5 py-3.5 w-full text-red-600 hover:bg-red-50 rounded-xl transition-all border-t border-slate-100 pt-4"
                >
                    <span className="material-symbols-outlined">logout</span>
                    <span className="font-bold text-sm">Sign Out</span>
                </button>
            </div>
        </aside>
    );
};

const TopBar = () => {
    const navigate = useNavigate();
    return (
        <header className="flex justify-between items-center w-full px-10 h-16 bg-white border-b border-outline-variant/20 z-30 shrink-0">
            <div className="flex items-center gap-3">
                <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 transition-colors" onClick={() => navigate(-1)}>
                    <span className="material-symbols-outlined text-slate-600">arrow_back</span>
                </button>
                <h1 className="text-xl font-extrabold tracking-tight text-primary font-headline">
                    MediAssist AI
                </h1>
                <div className="h-4 w-px bg-outline-variant mx-1" />
                <span className="text-slate-500 font-medium text-sm">Find Doctors</span>
            </div>
            <div className="flex items-center gap-6">
                <div className="flex gap-3">
                    <span 
                        onClick={() => navigate('/assistant')}
                        className="material-symbols-outlined text-slate-400 hover:text-primary cursor-pointer transition-colors">
                        notifications
                    </span>
                    <span 
                        onClick={() => navigate('/assistant')}
                        className="material-symbols-outlined text-slate-400 hover:text-primary cursor-pointer transition-colors">
                        help
                    </span>
                </div>
                {/* Patient pill */}
                <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-full border border-slate-100 font-headline">
                    <div className="text-right">
                        <p className="text-sm font-bold text-on-surface leading-none">Anura Perera</p>
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Patient</p>
                    </div>
                    <img
                        alt="User profile"
                        className="w-9 h-9 rounded-full object-cover ring-2 ring-white shadow-sm"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBht8v8MUCoalsCJKH_f177xanYgg1TmGV36SAVTRwabFw5fo8NfAwbNNXkZ-Mmo7Jn6eHWvlFVmsd8T9-FsJNR6ziPDbMF6GPVO954kIMIxX4MYklrUV0IPpfcfs4EFmWtou_-wjzEwT7BKIGNz0at73I4ilP-6BSIJ1lV8aFAriHreEzO4O-O4sWp_bjI2KvTyGQIx0fVPu_20gnSTy0H98j7V4Dxz38Ksq6fZDZmc2oOxRB8RUKmpo-a9aE5T_kZwNLVn0gm7Eg"
                    />
                </div>
            </div>
        </header>
    );
};

// ─── Doctor Card ──────────────────────────────────────────────────────────────

const DoctorCard = ({ doctor }) => {
    const navigate = useNavigate();
    const { name, specialty, rating, reviews, nextSlot, featured, photo } = doctor;

    return (
        <div className={`doctor-card bg-surface-container-lowest rounded-[1.75rem] p-5 border flex flex-col gap-4 ${featured ? 'border-primary/20' : 'border-transparent'}`}>
            {/* Photo + info row */}
            <div className="flex gap-4 items-start">
                {/* Avatar */}
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

                {/* Name / specialty / rating */}
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
                            star
                        </span>
                        <span className="text-sm font-bold text-on-surface">{rating}</span>
                        <span className="text-xs text-outline">({reviews} reviews)</span>
                    </div>
                </div>
            </div>

            {/* Next available slot */}
            <div className="bg-surface-container-low rounded-xl p-3 space-y-1">
                <p className="text-[10px] uppercase font-bold text-outline tracking-wider">Next Available</p>
                <div className="flex items-center justify-between">
                    <span className="text-on-surface font-semibold text-sm">{nextSlot}</span>
                    <button className="text-primary text-xs font-bold hover:underline" onClick={() => navigate('/sessions')}>View Slots</button>
                </div>
            </div>

            {/* CTA button */}
            <button
                onClick={() => navigate('/sessions')}
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

// ─── Floating AI Chip ─────────────────────────────────────────────────────────

const AIFloatingChip = () => {
    const navigate = useNavigate();
    return (
        <button className="ai-float-chip" aria-label="Open AI Assistant" onClick={() => navigate('/assistant')}>
            <div className="ai-float-glow" />
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-primary-container flex items-center justify-center text-white shrink-0">
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    smart_toy
                </span>
            </div>
            <div className="text-left relative z-10">
                <p className="text-[10px] font-bold text-primary uppercase tracking-tight">AI Assistant</p>
                <p className="text-sm font-bold text-on-surface">How can I help you today, Anura?</p>
            </div>
            <div className="ai-live-dot relative z-10 ml-1" />
        </button>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

/**
 * KioskSearchDoctors
 * Full-screen kiosk page (1280×1024) — no scroll, no overflow.
 * Layout: [SideNav (KioskAIAssistant-style) | TopBar + search bar + specialty chips + 3-col doctor grid]
 */
const KioskSearchDoctors = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSpecialty, setSpecialty] = useState('All');
    const [dateFilter, setDateFilter] = useState('');

    const filtered = DOCTORS.filter((d) => {
        const matchName = d.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchSpec = activeSpecialty === 'All' || d.specialty === activeSpecialty;
        return matchName && matchSpec;
    });

    return (
        <div className="w-screen h-screen overflow-hidden flex font-body bg-surface text-on-surface">
            {/* ── Left Sidebar (KioskAIAssistant style) ── */}
            <SideNav />

            {/* ── Main Canvas ── */}
            <main className="flex-1 flex flex-col relative overflow-hidden bg-white">
                {/* Ambient blobs */}
                <div className="ambient-blob-top" />
                <div className="ambient-blob-bottom" />

                {/* Top Bar */}
                <TopBar />

                {/* Content — no overflow, flex column fills remaining height */}
                <div className="flex-1 overflow-hidden flex flex-col px-10 py-5 z-10 min-h-0">

                    {/* Section heading */}
                    <div className="mb-4">
                        <h2 className="font-headline text-2xl font-extrabold text-on-surface tracking-tight">
                            Find your specialist
                        </h2>
                        <p className="text-on-surface-variant text-sm mt-0.5">
                            Search through our network of world-class medical professionals.
                        </p>
                    </div>

                    {/* ── Search & Filter Bar ── */}
                    <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-[0_8px_30px_rgba(0,71,141,0.05)] border border-outline-variant/10 mb-4 shrink-0">
                        <div className="grid grid-cols-5 gap-3 items-end">
                            {/* Doctor name */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-outline uppercase tracking-wider px-1">
                                    Doctor Name
                                </label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                                        search
                                    </span>
                                    <input
                                        className="search-input w-full pl-10 pr-3 py-3 bg-surface-container-low border-none rounded-xl text-on-surface text-sm placeholder:text-outline/60"
                                        placeholder="Search by name…"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        type="text"
                                    />
                                </div>
                            </div>

                            {/* Specialisation */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-outline uppercase tracking-wider px-1">
                                    Specialization
                                </label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px] pointer-events-none">
                                        medical_information
                                    </span>
                                    <select
                                        className="search-input w-full pl-10 pr-3 py-3 bg-surface-container-low border-none rounded-xl text-on-surface text-sm appearance-none cursor-pointer"
                                        value={activeSpecialty}
                                        onChange={(e) => setSpecialty(e.target.value)}
                                    >
                                        {SPECIALTIES.map((s) => (
                                            <option key={s.label}>{s.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Hospital (locked) */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-outline uppercase tracking-wider px-1">
                                    Hospital
                                </label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                                        local_hospital
                                    </span>
                                    <input
                                        className="w-full pl-10 pr-3 py-3 bg-surface-container-low border-none rounded-xl text-on-surface/50 text-sm font-medium"
                                        disabled
                                        value="Colombo Central General"
                                        readOnly
                                    />
                                </div>
                            </div>

                            {/* Date */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-outline uppercase tracking-wider px-1">
                                    Date
                                </label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px] pointer-events-none">
                                        calendar_today
                                    </span>
                                    <input
                                        className="search-input w-full pl-10 pr-3 py-3 bg-surface-container-low border-none rounded-xl text-on-surface text-sm"
                                        placeholder="MM/DD/YYYY"
                                        type="text"
                                        value={dateFilter}
                                        onChange={(e) => setDateFilter(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Search button */}
                            <button className="py-3 px-6 bg-primary text-white font-bold rounded-xl hover:bg-primary-container transition-colors flex items-center justify-center gap-2 text-sm shadow-sm">
                                <span className="material-symbols-outlined text-[18px]">search</span>
                                Search
                            </button>
                        </div>
                    </div>

                    {/* ── Specialty Quick-Filter Chips ── */}
                    <div className="flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar shrink-0">
                        {SPECIALTIES.map((s) => (
                            <button
                                key={s.label}
                                onClick={() => setSpecialty(s.label)}
                                className={`spec-chip ${activeSpecialty === s.label ? 'active' : ''}`}
                            >
                                <span
                                    className="material-symbols-outlined text-[16px]"
                                    style={activeSpecialty === s.label ? { fontVariationSettings: "'FILL' 1" } : {}}
                                >
                                    {s.icon}
                                </span>
                                {s.label}
                            </button>
                        ))}
                    </div>

                    {/* ── Doctor Cards Grid (vertically scrollable, hidden scrollbar) ── */}
                    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
                        {filtered.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center">
                                <span className="material-symbols-outlined text-5xl text-outline/40 mb-3">search_off</span>
                                <p className="font-bold text-on-surface-variant">No doctors found matching your criteria.</p>
                                <button
                                    onClick={() => { setSearchQuery(''); setSpecialty('All'); }}
                                    className="mt-3 text-primary text-sm font-semibold hover:underline"
                                >
                                    Clear filters
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-4 pb-4">
                                {filtered.map((doc) => (
                                    <DoctorCard key={doc.id} doctor={doc} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* ── Floating AI Chip (bottom-right, matches Stitch design) ── */}
            <AIFloatingChip />
        </div>
    );
};


export default KioskSearchDoctors;
