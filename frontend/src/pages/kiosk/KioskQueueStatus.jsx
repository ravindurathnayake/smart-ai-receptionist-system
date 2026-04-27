import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../../components/common/Logo';
import { apiService } from '../../services/apiService';
import './KioskQueueStatus.css';

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

const PrimaryQueueCard = ({ stats, patientQueue }) => (
    <div className="col-span-8 glass-card rounded-[2rem] p-8 flex flex-col justify-between shadow-[0_12px_40px_rgba(0,71,141,0.06)] relative overflow-hidden border border-white/40">
        <div className="relative z-10 text-left">
            <div className="flex justify-between items-start mb-5">
                <div>
                    <span className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-bold tracking-wide">
                        Currently Serving
                    </span>
                    <div className="mt-3 flex items-baseline gap-4">
                        <span className="font-headline text-7xl font-black text-primary leading-none">
                            {stats.current_serving !== '---' ? stats.current_serving : '--'}
                        </span>
                        <span className="text-on-surface-variant font-medium text-sm">Main Counter</span>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-on-surface-variant text-xs font-semibold block mb-1">Your Ticket</span>
                    <span className="font-headline text-5xl font-bold text-on-surface">
                        {patientQueue?.token || '#---'}
                    </span>
                </div>
            </div>
 
            <div className="bg-surface-container-low/60 rounded-2xl p-5 flex items-center gap-6">
                <div className="w-14 h-14 rounded-full border-4 border-primary/20 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-3xl text-primary">schedule</span>
                </div>
                <div>
                    <h3 className="text-2xl font-extrabold text-on-surface font-headline">
                        {patientQueue?.status === 'In Queue' ? `~ ${patientQueue.estimated_wait} mins` : 
                         patientQueue?.status === 'Scheduled' ? 'Check-in required' : 
                         stats.estimated_wait}
                    </h3>
                    <p className="text-on-surface-variant text-sm">Estimated wait until your turn</p>
                </div>
                <div className="ml-auto bg-secondary-container text-on-secondary-container px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 text-sm shrink-0">
                    <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                        person_search
                    </span>
                    {patientQueue?.status === 'In Queue' ? patientQueue.people_ahead : stats.total_waiting} people ahead
                </div>
            </div>
        </div>

        <div className="relative z-10 mt-6 text-left">
            <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-5">
                Your Journey Today
            </h4>
            <div className="flex items-center w-full px-2">
                {steps.map((step, i) => (
                    <JourneyStep key={step.label} {...step} isLast={i === steps.length - 1} />
                ))}
            </div>
        </div>

        <span className="queue-bg-icon material-symbols-outlined">pulse_alert</span>
    </div>
);

// ─── Right Column Cards ───────────────────────────────────────────────────────

const AppointmentDetailsCard = ({ patientQueue, onCancel, onReschedule }) => (
    <div className="bg-surface-container-lowest p-6 rounded-[1.75rem] shadow-sm border border-outline-variant/10 font-headline text-left relative overflow-hidden group">
        <div className="absolute -right-4 -top-4 w-20 h-20 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-500" />
        
        <div className="flex justify-between items-start mb-5">
            <h4 className="text-base font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-xl">bookmark_check</span>
                Active Appointment
            </h4>
            {patientQueue?.status && (
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    patientQueue.status === 'In Queue' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                }`}>
                    {patientQueue.status}
                </span>
            )}
        </div>
        
        <div className="space-y-5 relative z-10">
            <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                    <span className="material-symbols-outlined text-primary">medical_services</span>
                </div>
                <div>
                    <p className="text-[10px] font-bold text-outline uppercase tracking-tight mb-0.5">Assigned Specialist</p>
                    <p className="text-on-surface font-bold text-sm">{patientQueue?.doctor || 'No active appointment'}</p>
                    <p className="text-[11px] text-on-surface-variant font-medium">{patientQueue?.department || 'Select a specialist to begin'}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
                    <p className="text-[9px] font-bold text-outline uppercase tracking-wider mb-1">Room</p>
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-secondary text-sm">meeting_room</span>
                        <span className="text-sm font-bold text-on-surface">{patientQueue?.room || '---'}</span>
                    </div>
                </div>
                <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
                    <p className="text-[9px] font-bold text-outline uppercase tracking-wider mb-1">Time</p>
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-sm">schedule</span>
                        <span className="text-sm font-bold text-on-surface">{patientQueue?.time || '--:--'}</span>
                    </div>
                </div>
            </div>

            <div className="bg-primary/5 p-3 rounded-2xl border border-primary/10 flex items-center justify-between">
                <div>
                    <p className="text-[9px] font-bold text-primary uppercase tracking-wider mb-0.5">Date</p>
                    <p className="text-xs font-bold text-on-surface">{patientQueue?.date || 'N/A'}</p>
                </div>
                <span className="material-symbols-outlined text-primary opacity-50">calendar_today</span>
            </div>

            {patientQueue?.appointment_id && (
                <div className="flex gap-2 pt-2">
                    <button 
                        onClick={() => onReschedule(patientQueue)}
                        className="flex-1 py-2.5 rounded-xl text-[10px] font-bold border border-primary text-primary hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-1.5"
                    >
                        <span className="material-symbols-outlined text-sm">event_repeat</span>
                        RESCHEDULE
                    </button>
                    <button 
                        onClick={() => onCancel(patientQueue.appointment_id)}
                        className="flex-1 py-2.5 rounded-xl text-[10px] font-bold border border-red-200 text-red-500 hover:bg-red-50 transition-all flex items-center justify-center gap-1.5"
                    >
                        <span className="material-symbols-outlined text-sm">cancel</span>
                        CANCEL
                    </button>
                </div>
            )}
        </div>
    </div>
);

const UpcomingAppointmentsCard = ({ appointments = [] }) => (
    <div className="flex-1 bg-surface-container-lowest rounded-[1.75rem] p-5 shadow-sm border border-outline-variant/10 flex flex-col min-h-0 font-headline text-left">
        <div className="flex items-center justify-between mb-4 shrink-0">
            <h4 className="text-base font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    history
                </span>
                Recent Activity
            </h4>
            <span className="text-xs font-semibold text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">
                {appointments.length} records
            </span>
        </div>

        <div className="appt-scroll-track flex-1 min-w-0">
            {appointments.length > 0 ? appointments.map((appt) => (
                <div key={appt.id} className="appt-card bg-surface-container-low rounded-2xl p-3 flex flex-col gap-2 border border-outline-variant/10 hover:border-primary/20 hover:shadow-md transition-all cursor-pointer">
                    <div className="flex justify-between items-start">
                        <span className={`text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full w-fit bg-secondary-container text-on-secondary-container`}>
                            {appt.date}
                        </span>
                        <span className="text-[10px] font-black text-primary">{appt.status}</span>
                    </div>
                    <p className="text-base font-black text-on-surface font-headline leading-tight">{appt.specialist}</p>
                    <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-primary text-base"
                            style={{ fontVariationSettings: "'FILL' 1" }}>
                            stethoscope
                        </span>
                        <p className="text-[11px] font-semibold text-on-surface leading-tight">{appt.department}</p>
                    </div>
                </div>
            )) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 p-4">
                    <span className="material-symbols-outlined text-4xl mb-2">event_available</span>
                    <p className="text-xs font-bold uppercase tracking-widest">No previous history</p>
                </div>
            )}
        </div>
    </div>
);

// ─── Main Page Component ──────────────────────────────────────────────────────

const KioskQueueStatus = () => {
    const navigate = useNavigate();
    const [patient, setPatient] = useState(null);
    const [patientQueue, setPatientQueue] = useState(null);
    const [patientHistory, setPatientHistory] = useState([]);
    const [stats, setStats] = useState({
        current_serving: '---',
        total_waiting: 0,
        estimated_wait: '0m'
    });

    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [selectedRescheduleAppt, setSelectedRescheduleAppt] = useState(null);

    const fetchQueue = async (pData) => {
        try {
            const response = await apiService.getQueueStatus();
            if (response) {
                setStats({
                    current_serving: response.current_serving ? `#${response.current_serving.toString().padStart(2, '0')}` : '---',
                    total_waiting: response.total_waiting,
                    estimated_wait: `${response.estimated_wait_time} mins`
                });
            }
            
            // Fetch patient specific queue info (now returns upcoming appts too)
            const pQueue = await apiService.getPatientQueueStatus(pData.id);
            if (pQueue) {
                setPatientQueue(pQueue);
            } else {
                setPatientQueue(null);
            }

            // Fetch patient history
            const history = await apiService.getPatientHistory(pData.id);
            if (history && history.appointments) {
                setPatientHistory(history.appointments);
            }

        } catch (err) {
            console.error('Failed to fetch queue data:', err);
        }
    };

    useEffect(() => {
        const savedPatient = localStorage.getItem('activePatient');
        if (!savedPatient) {
            navigate('/patient-login');
            return;
        }
        const pData = JSON.parse(savedPatient);
        setPatient(pData);

        fetchQueue(pData);
        const interval = setInterval(() => fetchQueue(pData), 10000);
        return () => clearInterval(interval);
    }, [navigate]);

    const handleCancelAppointment = async (apptId) => {
        if (window.confirm("Are you sure you want to cancel this appointment?")) {
            try {
                await apiService.cancelAppointment(apptId);
                alert("Appointment cancelled successfully.");
                fetchQueue(patient);
            } catch (err) {
                console.error("Cancel failed:", err);
                alert("Failed to cancel appointment.");
            }
        }
    };

    const handleReschedule = (appt) => {
        setSelectedRescheduleAppt(appt);
        setShowRescheduleModal(true);
    };

    const submitReschedule = async (newDate) => {
        try {
            await apiService.rescheduleAppointment(selectedRescheduleAppt.appointment_id, newDate);
            alert("Appointment rescheduled successfully.");
            setShowRescheduleModal(false);
            fetchQueue(patient);
        } catch (err) {
            console.error("Reschedule failed:", err);
            alert("Failed to reschedule appointment.");
        }
    };

    if (!patient) return null;

    const patientName = patient.full_name || patient.name || 'Patient';

    return (
    <div className="w-screen h-screen overflow-hidden flex font-body bg-surface text-on-surface text-left">
        {/* ── Left Sidebar ── */}
        <aside className="hidden md:flex flex-col w-64 h-screen bg-white border-r border-outline-variant/30 z-20 shrink-0 no-print">
            <div className="p-6 pb-4 cursor-pointer" onClick={() => navigate('/')}>
                <Logo size="sm" className="w-full" />
            </div>
            <nav className="flex-1 flex flex-col px-3 mt-4 gap-1">
                {[
                    { icon: 'account_circle',   label: 'Personal Dashboard',   path: '/patient-dashboard' },
                    { icon: 'smart_toy',        label: 'AI Assistant',         path: '/assistant' },
                    { icon: 'hourglass_empty',  label: 'Queue Status',         path: '/queue', active: true  },
                    { icon: 'calendar_month',   label: 'Find Doctors',         path: '/doctors' },
                    { icon: 'how_to_reg',       label: 'Check-In / Check-Out', path: '/checkin-out' },
                    { icon: 'map',              label: 'Hospital Map',         path: '#' },
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
            <div className="px-4 pb-5 mt-auto text-center">
                <div className="p-5 bg-slate-50 rounded-xl border border-dashed border-outline-variant/40 mb-4">
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
            <div className="ambient-blob-top no-print" />
            <div className="ambient-blob-bottom no-print" />

            {/* Top Bar */}
            <header className="flex justify-between items-center w-full px-10 h-16 bg-white border-b border-outline-variant/20 z-30 shrink-0 no-print">
                <div className="flex items-center gap-3">
                    <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 transition-colors" onClick={() => navigate(-1)}>
                        <span className="material-symbols-outlined text-slate-600">arrow_back</span>
                    </button>
                    <h1 className="text-xl font-extrabold tracking-tight text-primary font-headline">MediAssist AI</h1>
                    <div className="h-4 w-px bg-outline-variant mx-1" />
                    <span className="text-slate-500 font-medium text-sm">Queue Status</span>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex gap-4">
                        <button onClick={() => window.print()} className="p-2.5 text-slate-400 hover:text-primary rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 font-bold text-xs uppercase">
                            <span className="material-symbols-outlined text-xl">print</span>
                            Print
                        </button>
                        <button onClick={() => { localStorage.removeItem('activePatient'); navigate('/'); }} className="p-2.5 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-all flex items-center gap-2 font-bold text-xs uppercase">
                            <span className="material-symbols-outlined text-xl">logout</span>
                            Log Out
                        </button>
                    </div>
                    <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-full border border-slate-100 font-headline">
                        <div className="text-right">
                            <p className="text-sm font-bold text-on-surface leading-none">{patientName}</p>
                            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Patient</p>
                        </div>
                        <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-white">
                            {patientName.charAt(0)}
                        </div>
                    </div>
                </div>
            </header>

            {/* Content area */}
            <div className="flex-1 overflow-hidden flex flex-col px-10 py-5 z-10 no-print">
                <div className="text-center mb-4 font-headline">
                    <p className="text-secondary font-bold tracking-widest uppercase text-xs mb-1">Live Status Update</p>
                    <h2 className="text-3xl font-extrabold text-on-surface leading-tight">Clinic Queue & Appointment</h2>
                    <p className="text-on-surface-variant text-sm mt-1 max-w-xl mx-auto">Please check your appointment details and queue position below.</p>
                </div>

                <div className="grid grid-cols-12 gap-5 flex-1 min-h-0">
                    <PrimaryQueueCard stats={stats} patientQueue={patientQueue} />
                    <div className="col-span-4 flex flex-col gap-4 min-h-0 overflow-hidden">
                        <AppointmentDetailsCard 
                            patientQueue={patientQueue} 
                            onCancel={handleCancelAppointment}
                            onReschedule={handleReschedule}
                        />
                        <UpcomingAppointmentsCard appointments={patientHistory} />
                    </div>
                </div>
            </div>

            {/* Reschedule Modal */}
            {showRescheduleModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 no-print">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="p-8 border-b border-slate-100 bg-primary/5">
                            <h3 className="text-2xl font-bold text-on-surface font-headline">Reschedule Appointment</h3>
                            <p className="text-sm text-on-surface-variant font-medium">Select a new date for your visit.</p>
                        </div>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            submitReschedule(e.target.new_date.value);
                        }} className="p-8 space-y-6">
                            <div className="space-y-2 text-left">
                                <label className="text-xs font-black uppercase tracking-widest text-outline ml-1">New Appointment Date</label>
                                <input 
                                    name="new_date"
                                    type="date"
                                    required
                                    min={new Date().toISOString().split('T')[0]}
                                    defaultValue={selectedRescheduleAppt?.date}
                                    className="w-full bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white px-5 py-4 rounded-2xl outline-none transition-all font-bold text-lg"
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowRescheduleModal(false)} className="flex-1 py-4 rounded-2xl font-bold text-outline hover:bg-slate-100 transition-all">Cancel</button>
                                <button type="submit" className="flex-[2] py-4 rounded-2xl font-bold bg-primary text-white shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all">Update Date</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ─── Professional Printable Token (Hidden on screen) ─── */}
            {patientQueue && (
                <div className="printable-token">
                    <div className="text-center pb-4 border-b border-black mb-4">
                        <h1 className="text-xl font-black uppercase tracking-widest">MediAssist</h1>
                        <p className="text-[8px] font-bold uppercase tracking-[0.3em]">Smart Medical Center</p>
                    </div>
                    
                    <div className="text-center py-6 border-b-2 border-dashed border-black mb-6">
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-1">Queue Token</p>
                        <h2 className="text-7xl font-black leading-none">
                            {patientQueue.token || '--'}
                        </h2>
                    </div>

                    <div className="space-y-4 mb-6">
                        <div className="flex justify-between items-baseline border-b border-slate-100 pb-1">
                            <span className="text-[8px] font-black uppercase text-slate-500">Patient</span>
                            <span className="text-sm font-bold">{patientName}</span>
                        </div>
                        <div className="flex justify-between items-baseline border-b border-slate-100 pb-1">
                            <span className="text-[8px] font-black uppercase text-slate-500">Doctor</span>
                            <span className="text-sm font-bold">{patientQueue.doctor}</span>
                        </div>
                        <div className="flex justify-between items-baseline border-b border-slate-100 pb-1">
                            <span className="text-[8px] font-black uppercase text-slate-500">Dept/Room</span>
                            <span className="text-sm font-bold">{patientQueue.department} • {patientQueue.room}</span>
                        </div>
                        <div className="flex justify-between items-baseline border-b border-slate-100 pb-1">
                            <span className="text-[8px] font-black uppercase text-slate-500">Time</span>
                            <span className="text-sm font-bold">{patientQueue.time}</span>
                        </div>
                    </div>

                    <div className="text-center pt-4 opacity-70">
                        <p className="text-[9px] font-bold italic">Please wait until your number is called.</p>
                        <p className="text-[7px] font-black uppercase mt-3 tracking-widest">
                            {new Date().toLocaleString()}
                        </p>
                    </div>
                </div>
            )}
        </main>

        <button className="ai-fab" onClick={() => navigate('/assistant')}>
            <div className="ai-fab-dot" />
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
            <span>Ask MediAssist AI</span>
        </button>
    </div>
    );
};

export default KioskQueueStatus;
