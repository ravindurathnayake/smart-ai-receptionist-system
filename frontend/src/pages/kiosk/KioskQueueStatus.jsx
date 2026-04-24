import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../../components/common/Logo';
import { apiService } from '../../services/apiService';
import './KioskQueueStatus.css';

// ─── Shared Sub-components (EXACT match to KioskAIAssistant) ─────────────────

/**
 * SideNav — identical styles to KioskAIAssistant:
 *   bg-white, border-r, rounded-xl nav pills, slate-50 bottom panel
 *   Only difference: active item = Queue Status
 */
const SideNav = () => {
    const navigate = useNavigate();
    const navItems = [
        { icon: 'home',             label: 'Home',                 path: '/' },
        { icon: 'smart_toy',        label: 'AI Assistant',         path: '/assistant' },
        { icon: 'hourglass_empty',  label: 'Queue Status',         path: '/queue', active: true  },
        { icon: 'calendar_month',   label: 'Find Doctors',         path: '/doctors' },
        { icon: 'how_to_reg',       label: 'Check-In / Check-Out', path: '/checkin-out' },
        { icon: 'map',              label: 'Hospital Map',         path: '#' },
    ];

    return (
        <aside className="hidden md:flex flex-col w-64 h-screen bg-white border-r border-outline-variant/30 z-20 shrink-0">
            {/* Logo */}
            <div className="p-6 pb-4 cursor-pointer" onClick={() => navigate('/')}>
                <Logo size="sm" className="w-full" />
            </div>

            {/* Nav links — rounded-xl + hover:bg-slate-50 like KioskAIAssistant */}
            <nav className="flex-1 flex flex-col px-3 mt-4 gap-1">
                {navItems.map(({ icon, label, path, active }) => (
                    <div
                        key={label}
                        onClick={() => path !== '#' && navigate(path)}
                        className={`flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all font-semibold text-sm cursor-pointer ${
                            active
                                ? 'nav-item-active'
                                : 'text-primary hover:bg-slate-50'
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

            {/* Bottom panel — exact copy from KioskAIAssistant */}
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

/**
 * TopBar — exact copy from KioskAIAssistant:
 *   bg-white, h-16, border-b, back button, icon group + patient pill
 */
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
                <span className="text-slate-500 font-medium text-sm">Queue Status</span>
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
                {/* Patient pill — exact match to KioskAIAssistant */}
                <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-full border border-slate-100 font-headline">
                    <div className="text-right">
                        <p className="text-sm font-bold text-on-surface leading-none">Anura Perera</p>
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Patient</p>
                    </div>
                    <img
                        alt="User profile photo"
                        className="w-9 h-9 rounded-full object-cover ring-2 ring-white shadow-sm"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBht8v8MUCoalsCJKH_f177xanYgg1TmGV36SAVTRwabFw5fo8NfAwbNNXkZ-Mmo7Jn6eHWvlFVmsd8T9-FsJNR6ziPDbMF6GPVO954kIMIxX4MYklrUV0IPpfcfs4EFmWtou_-wjzEwT7BKIGNz0at73I4ilP-6BSIJ1lV8aFAriHreEzO4O-O4sWp_bjI2KvTyGQIx0fVPu_20gnSTy0H98j7V4Dxz38Ksq6fZDZmc2oOxRB8RUKmpo-a9aE5T_kZwNLVn0gm7Eg"
                    />
                </div>
            </div>
        </header>
    );
};

// ─── Journey Steps ────────────────────────────────────────────────────────────

const steps = [
    { icon: 'check',         label: 'Check-in',     status: 'done'    },
    { icon: 'hourglass_top', label: 'In Queue',      status: 'current' },
    { icon: 'stethoscope',   label: 'Consultation',  status: 'pending' },
    { icon: 'medication',    label: 'Pharmacy',      status: 'pending' },
];

const JourneyStep = ({ icon, label, status, isLast }) => {
    const isDone    = status === 'done';
    const isCurrent = status === 'current';

    const circleClass = isDone
        ? 'w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center z-10 relative'
        : isCurrent
        ? 'w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center z-10 relative ring-4 ring-primary-fixed'
        : 'w-8 h-8 rounded-full bg-surface-container-highest text-outline flex items-center justify-center z-10 relative';

    const labelClass = isDone ? 'mt-2 text-xs font-bold text-secondary'
        : isCurrent ? 'mt-2 text-xs font-bold text-primary'
        : 'mt-2 text-xs font-bold text-outline';

    return (
        <div className="flex flex-col items-center flex-1 relative">
            <div className={circleClass}>
                <span className="material-symbols-outlined text-sm"
                    style={isDone ? { fontVariationSettings: "'wght' 700" } : {}}>
                    {isDone ? 'check' : icon}
                </span>
            </div>
            <span className={labelClass}>{label}</span>
            {!isLast && (
                <div
                    className={`absolute h-1 top-4 left-1/2 w-full ${isDone ? 'step-line-done' : 'step-line-pending'}`}
                    style={{ zIndex: 0 }}
                />
            )}
        </div>
    );
};

// ─── Primary Queue Card ───────────────────────────────────────────────────────

const PrimaryQueueCard = ({ stats }) => (
    <div className="col-span-8 glass-card rounded-[2rem] p-8 flex flex-col justify-between shadow-[0_12px_40px_rgba(0,71,141,0.06)] relative overflow-hidden border border-white/40">
        {/* Serving vs ticket row */}
        <div className="relative z-10">
            <div className="flex justify-between items-start mb-5">
                <div>
                    <span className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-bold tracking-wide">
                        Currently Serving
                    </span>
                    <div className="mt-3 flex items-baseline gap-4">
                        <span className="font-headline text-7xl font-black text-primary leading-none">
                            {stats.current_serving !== '---' ? stats.current_serving : '--'}
                        </span>
                        <span className="text-on-surface-variant font-medium text-sm">Counter 04</span>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-on-surface-variant text-xs font-semibold block mb-1">Your Ticket</span>
                    <span className="font-headline text-5xl font-bold text-on-surface">#148</span>
                </div>
            </div>
 
            {/* Wait time row */}
            <div className="bg-surface-container-low/60 rounded-2xl p-5 flex items-center gap-6">
                <div className="w-14 h-14 rounded-full border-4 border-primary/20 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-3xl text-primary">schedule</span>
                </div>
                <div>
                    <h3 className="text-2xl font-extrabold text-on-surface font-headline">~ {stats.estimated_wait}</h3>
                    <p className="text-on-surface-variant text-sm">Estimated wait until your turn</p>
                </div>
                <div className="ml-auto bg-secondary-container text-on-secondary-container px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 text-sm shrink-0">
                    <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                        person_search
                    </span>
                    {stats.total_waiting} people ahead
                </div>
            </div>
        </div>

        {/* Journey progress */}
        <div className="relative z-10 mt-6">
            <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-5">
                Your Journey Today
            </h4>
            <div className="flex items-center w-full px-2">
                {steps.map((step, i) => (
                    <JourneyStep key={step.label} {...step} isLast={i === steps.length - 1} />
                ))}
            </div>
        </div>

        {/* Decorative bg icon */}
        <span className="queue-bg-icon material-symbols-outlined">pulse_alert</span>
    </div>
);

// ─── Right Column Cards ───────────────────────────────────────────────────────

/** Appointment details (top of right column, unchanged) */
const AppointmentDetailsCard = () => (
    <div className="bg-surface-container-lowest p-6 rounded-[1.75rem] shadow-sm border border-outline-variant/10 font-headline">
        <h4 className="text-base font-bold mb-5 text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-xl">info</span>
            Current Visit Details
        </h4>
        <div className="space-y-4">
            <div>
                <p className="text-xs font-bold text-outline uppercase tracking-tight mb-1">Clinic Department</p>
                <p className="text-on-surface font-semibold text-sm">General Cardiology – West Wing</p>
            </div>
            <div>
                <p className="text-xs font-bold text-outline uppercase tracking-tight mb-1">Assigned Specialist</p>
                <div className="flex items-center gap-3 mt-1">
                    <img
                        alt="Doctor Profile"
                        className="w-9 h-9 rounded-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAmIvjZRhfhIaH78qJmB16DT1d-wf32Es1BK4QBq4BPgWYERIowVIPhsTmJp-tYAezjGyCTIFW9LyHG8lYbX5ZxYYCkEdeXCqaBdbTELmbmuZGPYISJYqCnPOf0XFL2P-pQSSRXEIKh886WqzJmosxM2N5Gb_WKlGdbVi_NY709h8ApzDUkOZjTfM8azM3r62rWVMZyCQackDU34IUORaVgEpxIHGLjhEMdsBAj5rZUrGCmlCCHv1zZihpkO6HiFDYSjGKyS4M1p3Y"
                    />
                    <p className="text-on-surface font-semibold text-sm">Dr. Anura Perera</p>
                </div>
            </div>
            <div>
                <p className="text-xs font-bold text-outline uppercase tracking-tight mb-1">Estimated Duration</p>
                <p className="text-on-surface font-semibold text-sm">15 – 20 minutes</p>
            </div>
        </div>
    </div>
);

// ─── Upcoming Appointments (replaces AI card) ─────────────────────────────────

/** Colour accent per appointment status / recency */
const dateTagColors = {
    today:     'bg-secondary-container text-on-secondary-container',
    nextWeek:  'bg-primary-fixed text-on-primary-fixed',
    upcoming:  'bg-surface-container-high text-on-surface-variant',
};

const appointments = [
    {
        id: 1,
        time:       '10:30 AM',
        dateLabel:  'Today',
        dateTag:    'today',
        specialist: 'Dr. K. Fernando',
        role:       'Cardiologist',
        reason:     'ECG Follow-up',
        icon:       'favorite',
    },
    {
        id: 2,
        time:       '02:15 PM',
        dateLabel:  'Next Week',
        dateTag:    'nextWeek',
        specialist: 'Dr. R. Silva',
        role:       'Endocrinologist',
        reason:     'Blood Sugar Review',
        icon:       'water_drop',
    },
    {
        id: 3,
        time:       '09:00 AM',
        dateLabel:  '22 Apr',
        dateTag:    'upcoming',
        specialist: 'Dr. S. Perera',
        role:       'Neurologist',
        reason:     'Headache Assessment',
        icon:       'neurology',
    },
    {
        id: 4,
        time:       '11:45 AM',
        dateLabel:  '28 Apr',
        dateTag:    'upcoming',
        specialist: 'Dr. M. Jayawardena',
        role:       'Ophthalmologist',
        reason:     'Vision Check',
        icon:       'visibility',
    },
];

const UpcomingAppointmentsCard = () => (
    <div className="flex-1 bg-surface-container-lowest rounded-[1.75rem] p-5 shadow-sm border border-outline-variant/10 flex flex-col min-h-0 font-headline">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 shrink-0">
            <h4 className="text-base font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    calendar_month
                </span>
                Upcoming Appointments
            </h4>
            <span className="text-xs font-semibold text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">
                {appointments.length} scheduled
            </span>
        </div>

        {/* Horizontally scrollable appointment cards */}
        <div className="appt-scroll-track flex-1 min-w-0">
            {appointments.map((appt) => (
                <div key={appt.id} className="appt-card bg-surface-container-low rounded-2xl p-3 flex flex-col gap-2 border border-outline-variant/10 hover:border-primary/20 hover:shadow-md transition-all cursor-pointer">
                    {/* Date tag */}
                    <span className={`text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full w-fit ${dateTagColors[appt.dateTag]}`}>
                        {appt.dateLabel}
                    </span>

                    {/* Time */}
                    <p className="text-lg font-black text-on-surface font-headline leading-none">{appt.time}</p>

                    {/* Icon + Reason */}
                    <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-primary text-base"
                            style={{ fontVariationSettings: "'FILL' 1" }}>
                            {appt.icon}
                        </span>
                        <p className="text-xs font-semibold text-on-surface leading-tight">{appt.reason}</p>
                    </div>

                    {/* Specialist */}
                    <div className="mt-auto pt-2 border-t border-outline-variant/20">
                        <p className="text-xs font-bold text-on-surface truncate">{appt.specialist}</p>
                        <p className="text-[10px] text-on-surface-variant">{appt.role}</p>
                    </div>
                </div>
            ))}
        </div>

        {/* Scroll hint */}
        <p className="text-[10px] text-on-surface-variant text-center mt-2 shrink-0 flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-sm">swipe</span>
            Swipe to see more
        </p>
    </div>
);

// ─── Floating AI FAB ─────────────────────────────────────────────────────────

const AIFloatingTag = () => {
    const navigate = useNavigate();
    return (
        <button className="ai-fab" aria-label="Open MediAssist AI" onClick={() => navigate('/assistant')}>
            <div className="ai-fab-dot" />
            <span className="material-symbols-outlined text-lg"
                style={{ fontVariationSettings: "'FILL' 1" }}>
                smart_toy
            </span>
            <span>Ask MediAssist AI</span>
        </button>
    );
};

// ─── Main Page Component ──────────────────────────────────────────────────────

/**
 * KioskQueueStatus
 * Full-screen kiosk page (1280×1024) — no scroll, no overflow.
 * Layout: [SideNav (white, KioskAIAssistant style) | TopBar (white, KioskAIAssistant style) + content]
 * Changes vs original:
 *   • SideNav/TopBar now match KioskAIAssistant (white BG, rounded-xl pills, patient pill)
 *   • AI card replaced with horizontally-scrollable Upcoming Appointments card
 *   • Floating AI FAB pinned to bottom-right corner
 */
const KioskQueueStatus = () => {
    const [stats, setStats] = useState({
        current_serving: '---',
        total_waiting: 0,
        estimated_wait: '0m'
    });

    const fetchQueue = async () => {
        try {
            const response = await apiService.getQueueStatus();
            if (response) {
                setStats({
                    current_serving: response.current_serving ? `#${response.current_serving.toString().padStart(3, '0')}` : '---',
                    total_waiting: response.total_waiting,
                    estimated_wait: `${response.estimated_wait_time} mins`
                });
            }
        } catch (err) {
            console.error('Failed to fetch queue status:', err);
        }
    };

    useEffect(() => {
        fetchQueue();
        const interval = setInterval(fetchQueue, 15000); // Kiosk refreshes faster
        return () => clearInterval(interval);
    }, []);

    return (
    <div className="w-screen h-screen overflow-hidden flex font-body bg-surface text-on-surface">
        {/* ── Left Sidebar (KioskAIAssistant style) ── */}
        <SideNav />

        {/* ── Main Canvas ── */}
        <main className="flex-1 flex flex-col relative overflow-hidden bg-white">
            {/* Ambient blobs — same as KioskAIAssistant */}
            <div className="ambient-blob-top" />
            <div className="ambient-blob-bottom" />

            {/* Top Bar (KioskAIAssistant style) */}
            <TopBar />

            {/* Content area */}
            <div className="flex-1 overflow-hidden flex flex-col px-10 py-5 z-10">
                {/* Section heading */}
                <div className="text-center mb-4 font-headline">
                    <p className="text-secondary font-bold tracking-widest uppercase text-xs mb-1">
                        Live Status Update
                    </p>
                    <h2 className="text-3xl font-extrabold text-on-surface leading-tight">
                        Your health is our priority.
                    </h2>
                    <p className="text-on-surface-variant text-sm mt-1 max-w-xl mx-auto">
                        Please relax — you'll be notified when it's your turn.
                    </p>
                </div>

                {/* Bento grid */}
                <div className="grid grid-cols-12 gap-5 flex-1 min-h-0">
                    {/* Primary Queue Card — 8 cols */}
                    <PrimaryQueueCard stats={stats} />

                    {/* Right column — 4 cols, two stacked cards */}
                    <div className="col-span-4 flex flex-col gap-4 min-h-0 overflow-hidden">
                        <AppointmentDetailsCard />
                        <UpcomingAppointmentsCard />
                    </div>
                </div>
            </div>
        </main>

        {/* ── Floating AI Tag (bottom-right) ── */}
        <AIFloatingTag />
    </div>
    );
};


export default KioskQueueStatus;
