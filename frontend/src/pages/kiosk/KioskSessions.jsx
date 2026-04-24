import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Logo from '../../components/common/Logo';
import { apiService } from '../../services/apiService';
import './KioskSessions.css';

// ─── Data ─────────────────────────────────────────────────────────────────────

/** 14 days worth of dates starting from today */
const generateDates = () => {
    const days  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const months= ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const today = new Date();
    return Array.from({ length: 14 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        return {
            dayName:  days[d.getDay()],
            date:     d.getDate(),
            month:    months[d.getMonth()],
            iso:      d.toISOString().slice(0, 10),
            isWeekend: d.getDay() === 0 || d.getDay() === 6,
            isToday:  i === 0,
        };
    });
};

const DATES = generateDates();

const SESSIONS = {
    morning: [
        { id: 'm1', time: '09:00 AM', status: 'available' },
        { id: 'm2', time: '09:45 AM', status: 'selected'  },
        { id: 'm3', time: '10:30 AM', status: 'booked'    },
        { id: 'm4', time: '11:15 AM', status: 'available' },
    ],
    afternoon: [
        { id: 'a1', time: '02:00 PM', status: 'available' },
        { id: 'a2', time: '03:15 PM', status: 'available' },
        { id: 'a3', time: '04:30 PM', status: 'booked'    },
        { id: 'a4', time: '05:15 PM', status: 'available' },
    ],
    evening: [
        { id: 'e1', time: '06:00 PM', status: 'available' },
        { id: 'e2', time: '07:00 PM', status: 'available' },
    ],
};

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
                <Logo size="sm" className="w-full" />
            </div>

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
                <span className="text-slate-500 font-medium text-sm">Session Selection</span>
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

// ─── Doctor Profile Panel (left column) ───────────────────────────────────────

const DoctorProfile = () => (
    <div className="w-72 shrink-0 bg-surface-container-low overflow-y-auto custom-scrollbar flex flex-col">
        <div className="p-6 flex flex-col gap-5 flex-1">
            {/* Photo with glow + availability badge */}
            <div className="relative group mb-8">
                <div className="doctor-photo-glow" />
                <img
                    alt="Dr. Aruni Rajapaksa"
                    className="relative w-full aspect-[4/5] object-cover rounded-3xl shadow-xl border border-white/50"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDmvOtKm8ynio5IWqs-sHhBEnG5hv7d1clKeLtF72P27djFgkBPqymdJopwFpvmm-y0RbrXPb_aa2nFbinVBtawvG1-JF0QHRqne0JDbTlwmbf4H-5rJBkn6AWLjZBs96BV78dXhf8TSyH2A5eXwD52Vp6Iyas1w71MTt6sRfu5bQM-OMqoR72HiptwHrD4518OP1u_sQ4L9kJobYQGFLxqG22VDe8XEta_l6gXBHtVnESEiXW2XsIcja5zGCOEf8Y2Has-IupZMOc"
                />
                {/* Availability badge */}
                <div className="avail-badge">
                    <div className="bg-secondary-container p-1.5 rounded-lg">
                        <span className="material-symbols-outlined text-secondary text-[18px]"
                            style={{ fontVariationSettings: "'FILL' 1" }}>
                            verified
                        </span>
                    </div>
                    <div>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">Availability</p>
                        <p className="text-xs font-bold text-secondary">Accepting Patients</p>
                    </div>
                </div>
            </div>

            {/* Name & specialty */}
            <div className="mt-4">
                <h2 className="text-2xl font-extrabold text-on-surface font-headline leading-tight">
                    Dr. Aruni Rajapaksa
                </h2>
                <p className="text-primary font-semibold text-sm mt-1">Senior Consultant Cardiologist</p>
            </div>

            {/* Stats row */}
            <div className="flex gap-3">
                <div className="bg-white/80 p-3 rounded-2xl flex-1 border border-white shadow-sm text-center">
                    <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Experience</p>
                    <p className="text-base font-bold text-on-surface">15+ Yrs</p>
                </div>
                <div className="bg-white/80 p-3 rounded-2xl flex-1 border border-white shadow-sm text-center">
                    <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Rating</p>
                    <div className="flex items-center justify-center gap-1">
                        <span className="text-base font-bold text-on-surface">4.9</span>
                        <span className="material-symbols-outlined text-yellow-500 text-sm"
                            style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    </div>
                </div>
            </div>

            {/* About */}
            <div>
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">About</h3>
                <p className="text-on-surface-variant text-xs leading-relaxed">
                    Dr. Rajapaksa is a world-renowned cardiologist specialising in non-invasive cardiac imaging and empathetic patient care, leading 2,000+ complex diagnostics at the Ethereal Clinic.
                </p>
            </div>

            {/* Languages */}
            <div>
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Languages</h3>
                <div className="flex gap-2 flex-wrap">
                    {['Sinhala', 'English', 'Tamil'].map((lang) => (
                        <span key={lang} className="px-3 py-1 bg-white rounded-full text-xs font-semibold shadow-sm border border-slate-100">
                            {lang}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

// ─── Session Selection Panel (right column) ───────────────────────────────────

const slotIcon  = { morning: 'light_mode', afternoon: 'partly_cloudy_day', evening: 'dark_mode' };
const slotColor = { morning: 'text-orange-400', afternoon: 'text-blue-400', evening: 'text-indigo-400' };
const slotLabel = { morning: 'Morning Slots', afternoon: 'Afternoon Slots', evening: 'Evening Slots' };

const SessionPanel = ({ doctor, selectedDate, onDateSelect, selectedSlot, onSlotSelect }) => {
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);

    const handleConfirm = async () => {
        if (!selectedSlot || !doctor) return;
        
        setSubmitting(true);
        try {
            // Mocking patient name from UI state or localStorage
            const patientName = "Anura Perera";
            const phoneNumber = "0712345678";
            
            const response = await apiService.bookAppointment({
                full_name: patientName,
                phone_number: phoneNumber,
                specialist_id: doctor.id,
                symptom: "General consultation",
                appointment_date: selectedDate
            });
            
            if (response.data) {
                // Store appointment details for the queue status page
                localStorage.setItem('last_appointment', JSON.stringify(response.data));
                navigate('/queue');
            }
        } catch (err) {
            console.error('Failed to book appointment:', err);
            alert('Failed to book appointment. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };
    return (
        <div className="flex-1 bg-white flex flex-col overflow-hidden relative">
            <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-6">
                {/* Heading */}
                <div className="text-center mb-5">
                    <h2 className="text-2xl font-bold font-headline text-on-surface">Select Your Session</h2>
                    <p className="text-slate-500 text-sm mt-1">Choose a preferred date and time for your consultation</p>
                </div>

                {/* ── Horizontal Date Scroll ── */}
                <div className="mb-5">
                    <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-2">Choose a Date</p>
                    <div className="date-scroll-track">
                        {DATES.map((d) => {
                            const isSelected = selectedDate === d.iso;
                            return (
                                <button
                                    key={d.iso}
                                    onClick={() => !d.isWeekend && onDateSelect(d.iso)}
                                    disabled={d.isWeekend}
                                    className={`date-card flex flex-col items-center py-3 px-3 rounded-2xl border transition-all ${
                                        d.isWeekend
                                            ? 'opacity-35 cursor-not-allowed border-slate-100 bg-slate-50'
                                            : isSelected
                                            ? 'bg-primary text-white shadow-lg shadow-primary/25 border-transparent'
                                            : 'border-slate-100 hover:bg-slate-50 cursor-pointer'
                                    }`}
                                >
                                    <span className={`text-[10px] font-bold uppercase mb-1 ${isSelected ? 'opacity-75' : 'text-slate-400'}`}>
                                        {d.dayName}
                                    </span>
                                    <span className="text-lg font-bold leading-none">{d.date}</span>
                                    {d.isToday && (
                                        <span className={`text-[9px] font-bold mt-1 ${isSelected ? 'opacity-80' : 'text-primary'}`}>
                                            Today
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Time Slot Categories ── */}
                <div className="space-y-5">
                    {(['morning', 'afternoon', 'evening']).map((period) => (
                        <div key={period}>
                            <div className="flex items-center gap-2 mb-3">
                                <span className={`material-symbols-outlined ${slotColor[period]}`}>
                                    {slotIcon[period]}
                                </span>
                                <h3 className="font-bold text-slate-700 text-sm">{slotLabel[period]}</h3>
                            </div>
                            <div className="grid grid-cols-4 gap-3">
                                {SESSIONS[period].map((slot) => {
                                    const isSelected = selectedSlot?.id === slot.id;
                                    const isBooked   = slot.status === 'booked';
                                    return (
                                        <button
                                            key={slot.id}
                                            disabled={isBooked}
                                            onClick={() => !isBooked && onSlotSelect(slot)}
                                            className={`time-slot glass-panel p-3 rounded-2xl border text-sm text-center font-semibold ${
                                                isBooked
                                                    ? 'booked'
                                                    : isSelected
                                                    ? 'selected border-primary'
                                                    : 'border-slate-100'
                                            }`}
                                        >
                                            {slot.time}
                                            {isBooked && (
                                                <span className="block text-[9px] font-bold text-slate-300 mt-0.5">
                                                    Booked
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Sticky Summary & CTA ── */}
            <div className="shrink-0 bg-white/90 backdrop-blur-md border-t border-slate-100 px-8 py-4 z-10">
                <div className="flex items-center justify-between bg-slate-50 rounded-2xl p-4 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-slate-100 shadow-sm">
                            <span className="material-symbols-outlined text-primary text-[20px]">event_available</span>
                        </div>
                        <div>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Appointment Summary</p>
                            <p className="text-sm font-bold text-on-surface">
                                {selectedSlot
                                    ? `${DATES.find(d => d.iso === selectedDate)?.dayName}, ${
                                        DATES.find(d => d.iso === selectedDate)?.date
                                      } ${DATES.find(d => d.iso === selectedDate)?.month} • ${selectedSlot.time}`
                                    : 'Select a date & time slot'}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Consultation Fee</p>
                        <p className="text-xl font-bold text-primary">Rs. 4,500</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate('/search-doctors')}
                        className="flex-1 py-3.5 px-6 bg-surface-container-highest text-on-surface-variant rounded-full font-bold text-sm hover:bg-slate-200 transition-all">
                        ← Back to Search
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!selectedSlot || submitting}
                        className={`flex-[2] py-3.5 px-6 rounded-full font-bold text-sm transition-all ${
                            selectedSlot && !submitting
                                ? 'bg-gradient-to-br from-primary to-primary-container text-white shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]'
                                : 'bg-surface-container-highest text-outline cursor-not-allowed'
                        }`}
                    >
                        {submitting ? 'Confirming...' : 'Confirm Appointment'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Floating AI Button ───────────────────────────────────────────────────────

const AIFloatingBtn = () => {
    const navigate = useNavigate();
    return (
        <div className="ai-fab-wrapper" style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 60 }}>
            <div className="ai-tooltip">
                <p className="text-xs font-bold text-primary mb-1">MediAssist AI</p>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                    "Dr. Rajapaksa is highly rated for patient empathy. This slot is usually quiet — perfect for a detailed discussion."
                </p>
            </div>
            <button className="ai-fab-sq ai-pulse" aria-label="Open AI Assistant" onClick={() => navigate('/assistant')}>
                <div className="relative">
                    <span className="material-symbols-outlined text-3xl text-primary"
                        style={{ fontVariationSettings: "'FILL' 1" }}>
                        smart_toy
                    </span>
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-secondary rounded-full border-2 border-white" />
                </div>
            </button>
        </div>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

/**
 * KioskSessions
 * Full-screen kiosk page (1280×1024) — no scroll, no overflow on outer shell.
 * Layout: [SideNav | TopBar + (DoctorProfile | SessionPanel)]
 * Date strip scrolls horizontally; time slot section scrolls vertically.
 */
const KioskSessions = () => {
    const location = useLocation();
    const doctor = location.state?.doctor;
    const [selectedDate, setSelectedDate] = useState(DATES[0].iso);
    const [selectedSlot, setSelectedSlot] = useState(null);

    if (!doctor) {
        // Fallback for demo if no doctor was passed
        return (
            <div className="w-screen h-screen flex flex-col items-center justify-center bg-surface">
                <h2 className="text-2xl font-bold mb-4">Please select a doctor first</h2>
                <button 
                    onClick={() => window.history.back()}
                    className="bg-primary text-white px-6 py-2 rounded-full font-bold"
                >
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="w-screen h-screen overflow-hidden flex font-body bg-surface text-on-surface">
            {/* Left Sidebar — KioskAIAssistant style */}
            <SideNav />

            {/* Main Canvas */}
            <main className="flex-1 flex flex-col relative overflow-hidden">
                {/* Ambient blobs */}
                <div className="ambient-blob-top" />
                <div className="ambient-blob-bottom" />

                {/* Top Bar */}
                <TopBar />

                {/* Content area: two-column split */}
                <div className="flex-1 flex overflow-hidden min-h-0 z-10">
                    {/* Left: Doctor profile */}
                    <DoctorProfile />

                    {/* Right: Session selection */}
                    <SessionPanel
                        doctor={doctor}
                        selectedDate={selectedDate}
                        onDateSelect={setSelectedDate}
                        selectedSlot={selectedSlot}
                        onSlotSelect={setSelectedSlot}
                    />
                </div>
            </main>

            {/* Floating AI Button */}
            <AIFloatingBtn />
        </div>
    );
};


export default KioskSessions;
