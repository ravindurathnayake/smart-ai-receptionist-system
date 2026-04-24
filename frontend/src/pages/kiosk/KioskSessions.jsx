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
const DoctorProfile = ({ doctor }) => (
    <div className="w-72 shrink-0 bg-surface-container-low overflow-y-auto custom-scrollbar flex flex-col">
        <div className="p-6 flex flex-col gap-5 flex-1">
            {/* Photo with glow + availability badge */}
            <div className="relative group mb-8">
                <div className="doctor-photo-glow" />
                {doctor.photo ? (
                    <img
                        alt={doctor.name}
                        className="relative w-full aspect-[4/5] object-cover rounded-3xl shadow-xl border border-white/50"
                        src={doctor.photo}
                    />
                ) : (
                    <div className="relative w-full aspect-[4/5] bg-secondary-container rounded-3xl shadow-xl border border-white/50 flex items-center justify-center">
                        <span className="material-symbols-outlined text-6xl text-on-secondary-container">medical_information</span>
                    </div>
                )}
                <div className="avail-badge">
                    <div className="bg-secondary-container p-1.5 rounded-lg">
                        <span className="material-symbols-outlined text-secondary text-[18px]"
                            style={{ fontVariationSettings: "'FILL' 1" }}>
                            verified
                        </span>
                    </div>
                    <div>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">Status</p>
                        <p className="text-xs font-bold text-secondary">Verified Specialist</p>
                    </div>
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-extrabold text-on-surface font-headline leading-tight">
                    {doctor.name}
                </h2>
                <p className="text-primary font-semibold text-sm mt-1">{doctor.specialty}</p>
            </div>

            <div className="flex gap-3">
                <div className="bg-white/80 p-3 rounded-2xl flex-1 border border-white shadow-sm text-center">
                    <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Fee</p>
                    <p className="text-sm font-bold text-on-surface">Rs. {doctor.consultation_fee || 'N/A'}</p>
                </div>
                <div className="bg-white/80 p-3 rounded-2xl flex-1 border border-white shadow-sm text-center">
                    <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Rating</p>
                    <div className="flex items-center justify-center gap-1">
                        <span className="text-sm font-bold text-on-surface">{doctor.rating || '4.8'}</span>
                        <span className="material-symbols-outlined text-yellow-500 text-sm"
                            style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">About</h3>
                <p className="text-on-surface-variant text-xs leading-relaxed line-clamp-4">
                    {doctor.bio || 'Expert specialist providing comprehensive medical care and diagnostics with a focus on patient well-being.'}
                </p>
            </div>

            <div>
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Languages</h3>
                <div className="flex gap-2 flex-wrap">
                    {(doctor.languages ? doctor.languages.split(',') : ['English', 'Sinhala']).map((lang) => (
                        <span key={lang} className="px-3 py-1 bg-white rounded-full text-[10px] font-semibold shadow-sm border border-slate-100 uppercase tracking-wider">
                            {lang.trim()}
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
const slotLabel = { morning: 'Morning Sessions', afternoon: 'Afternoon Sessions', evening: 'Evening Sessions' };

const SessionPanel = ({ doctor, selectedDate, onDateSelect, selectedSlot, onSlotSelect }) => {
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);

    // Filter sessions by selected date's day of week
    const selectedDayName = DATES.find(d => d.iso === selectedDate)?.dayNameFull; // Need to add dayNameFull to generateDates
    
    // Day name from date (e.g. "Monday")
    const dateObj = new Date(selectedDate);
    const dayOfWeek = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(dateObj);

    const availableSessions = (doctor.sessions || []).filter(s => s.day_of_week === dayOfWeek);

    const groupedSessions = {
        morning: availableSessions.filter(s => parseInt(s.start_time.split(':')[0]) < 12),
        afternoon: availableSessions.filter(s => {
            const h = parseInt(s.start_time.split(':')[0]);
            return h >= 12 && h < 17;
        }),
        evening: availableSessions.filter(s => parseInt(s.start_time.split(':')[0]) >= 17)
    };

    const handleConfirm = async () => {
        if (!selectedSlot || !doctor) return;
        
        setSubmitting(true);
        try {
            const patientName = "Anura Perera";
            const phoneNumber = "0712345678";
            
            const response = await apiService.bookAppointment({
                full_name: patientName,
                phone_number: phoneNumber,
                specialist_id: doctor.id,
                symptom: "General consultation",
                appointment_date: selectedDate,
                session_id: selectedSlot.id
            });
            
            if (response) {
                localStorage.setItem('last_appointment', JSON.stringify(response));
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
                <div className="text-center mb-5">
                    <h2 className="text-2xl font-bold font-headline text-on-surface">Choose Your Session</h2>
                    <p className="text-slate-500 text-sm mt-1">Select an available time for {doctor.name}</p>
                </div>

                {/* ── Horizontal Date Scroll ── */}
                <div className="mb-8">
                    <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-2 px-1">Available Dates</p>
                    <div className="date-scroll-track pb-2">
                        {DATES.map((d) => {
                            const isSelected = selectedDate === d.iso;
                            const dObj = new Date(d.iso);
                            const dNameFull = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(dObj);
                            const hasSessions = (doctor.sessions || []).some(s => s.day_of_week === dNameFull);

                            return (
                                <button
                                    key={d.iso}
                                    onClick={() => onDateSelect(d.iso)}
                                    className={`date-card relative flex flex-col items-center py-4 px-5 rounded-2xl border transition-all min-w-[80px] ${
                                        isSelected
                                            ? 'bg-primary text-white shadow-xl shadow-primary/25 border-transparent scale-105 z-10'
                                            : hasSessions
                                            ? 'bg-primary/5 border-primary/20 hover:bg-primary/10 cursor-pointer'
                                            : 'border-slate-100 hover:bg-slate-50 cursor-pointer opacity-60'
                                    }`}
                                >
                                    {hasSessions && !isSelected && (
                                        <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full" />
                                    )}
                                    <span className={`text-[10px] font-bold uppercase mb-1.5 tracking-wider ${isSelected ? 'opacity-80' : 'text-slate-400'}`}>
                                        {d.dayName}
                                    </span>
                                    <span className="text-xl font-black leading-none">{d.date}</span>
                                    {d.isToday && (
                                        <div className={`mt-2 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter ${isSelected ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'}`}>
                                            Today
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Time Slot Categories ── */}
                <div className="space-y-8">
                    {availableSessions.length === 0 ? (
                        <div className="text-center py-10 bg-slate-50 rounded-[2rem] border border-dashed border-outline-variant/30">
                            <span className="material-symbols-outlined text-4xl text-outline/30 mb-2">event_busy</span>
                            <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">No sessions available on this day</p>
                            <p className="text-xs text-slate-400 mt-1">Please try another date from the calendar above.</p>
                        </div>
                    ) : (
                        (['morning', 'afternoon', 'evening']).map((period) => (
                            groupedSessions[period].length > 0 && (
                                <div key={period}>
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className={`material-symbols-outlined ${slotColor[period]}`}>
                                            {slotIcon[period]}
                                        </span>
                                        <h3 className="font-bold text-slate-700 text-sm tracking-tight">{slotLabel[period]}</h3>
                                    </div>
                                    <div className="grid grid-cols-4 gap-4">
                                        {groupedSessions[period].map((sess, idx) => {
                                            const slotId = `${sess.day_of_week}-${sess.start_time}`;
                                            const isSelected = selectedSlot && `${selectedSlot.day_of_week}-${selectedSlot.start_time}` === slotId;
                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => onSlotSelect(sess)}
                                                    className={`time-slot group glass-panel p-4 rounded-[1.5rem] border text-left transition-all ${
                                                        isSelected
                                                            ? 'selected border-primary bg-primary/5 shadow-lg shadow-primary/5'
                                                            : 'border-slate-100 hover:border-primary/30 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <div className="flex justify-between items-start mb-3">
                                                        <span className={`text-base font-black ${isSelected ? 'text-primary' : 'text-on-surface'}`}>
                                                            {sess.start_time}
                                                        </span>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isSelected ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500'}`}>
                                                            {sess.room_number}
                                                        </span>
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tight text-slate-400">
                                                            <span>Patients</span>
                                                            <span className={isSelected ? 'text-primary' : ''}>0/{sess.max_patients}</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                            <div 
                                                                className={`h-full transition-all duration-1000 ${isSelected ? 'bg-primary' : 'bg-slate-300'}`} 
                                                                style={{ width: '0%' }} 
                                                            />
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )
                        ))
                    )}
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
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Selected Session</p>
                            <p className="text-sm font-bold text-on-surface">
                                {selectedSlot
                                    ? `${dayOfWeek}, ${new Date(selectedDate).getDate()} ${new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(selectedDate))} • ${selectedSlot.start_time}`
                                    : 'Please choose a session'}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Consultation Fee</p>
                        <p className="text-xl font-bold text-primary">Rs. {doctor.consultation_fee || '4,500'}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate('/doctors')}
                        className="flex-1 py-3.5 px-6 bg-surface-container-highest text-on-surface-variant rounded-full font-bold text-sm hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-sm">arrow_back</span>
                        Back
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
                        {submitting ? 'Processing...' : 'Confirm Appointment'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Floating AI Button ───────────────────────────────────────────────────────

const AIFloatingBtn = ({ doctor }) => {
    const navigate = useNavigate();
    return (
        <div className="ai-fab-wrapper" style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 60 }}>
            <div className="ai-tooltip w-64">
                <p className="text-xs font-bold text-primary mb-1">MediAssist AI Insights</p>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                    "{doctor.name} is highly recommended for {doctor.specialty.toLowerCase()}. The morning slots usually have shorter wait times."
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

const KioskSessions = () => {
    const location = useLocation();
    const doctor = location.state?.doctor;
    const [selectedDate, setSelectedDate] = useState(DATES[0].iso);
    const [selectedSlot, setSelectedSlot] = useState(null);

    // Reset selected slot when date changes
    useEffect(() => {
        setSelectedSlot(null);
    }, [selectedDate]);

    if (!doctor) {
        return (
            <div className="w-screen h-screen flex flex-col items-center justify-center bg-surface p-10 text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-4xl text-primary">person_search</span>
                </div>
                <h2 className="text-3xl font-extrabold mb-2 font-headline">Doctor not selected</h2>
                <p className="text-slate-500 mb-8 max-w-md">Please go back to the specialist directory and select a doctor to view their available sessions.</p>
                <button 
                    onClick={() => window.history.back()}
                    className="bg-primary text-white px-10 py-4 rounded-full font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                >
                    Return to Directory
                </button>
            </div>
        );
    }

    return (
        <div className="w-screen h-screen overflow-hidden flex font-body bg-surface text-on-surface">
            <SideNav />

            <main className="flex-1 flex flex-col relative overflow-hidden">
                <div className="ambient-blob-top" />
                <div className="ambient-blob-bottom" />

                <TopBar />

                <div className="flex-1 flex overflow-hidden min-h-0 z-10">
                    <DoctorProfile doctor={doctor} />

                    <SessionPanel
                        doctor={doctor}
                        selectedDate={selectedDate}
                        onDateSelect={setSelectedDate}
                        selectedSlot={selectedSlot}
                        onSlotSelect={setSelectedSlot}
                    />
                </div>
            </main>

            <AIFloatingBtn doctor={doctor} />
        </div>
    );
};


export default KioskSessions;
