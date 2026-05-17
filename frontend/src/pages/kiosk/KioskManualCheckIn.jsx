import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Logo from '../../components/common/Logo';
import { apiService } from '../../services/apiService';
import queueService from '../../services/queueService';
import { sanitizeImageSrc } from '../../utils/imageUtils';
import './KioskManualCheckIn.css';

// ─── Form field component ─────────────────────────────────────────────────────

const FormField = ({ id, label, icon, type = 'text', placeholder, value, onChange }) => (
    <div className="space-y-2">
        <label htmlFor={id} className="block font-headline font-bold text-on-surface text-sm ml-1">
            {label}
        </label>
        <div className="relative">
            <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-primary text-[22px]">
                {icon}
            </span>
            <input
                id={id}
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className="form-input w-full pl-14 pr-6 py-4 bg-surface-container-low border-none rounded-2xl text-base font-medium transition-all placeholder:text-slate-400 focus:bg-white"
            />
        </div>
    </div>
);

// ─── Step indicator ───────────────────────────────────────────────────────────

const StepIndicator = ({ current = 0, total = 3 }) => (
    <div className="flex items-center gap-2 justify-center">
        {Array.from({ length: total }).map((_, i) => (
            <div key={i} className={`step-dot ${i === current ? 'active' : ''}`} />
        ))}
    </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const KioskManualCheckIn = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const isCheckOutMode = location.state?.mode === 'checkout';
    const [patient, setPatient] = useState(null);
    const [form, setForm] = useState({ name: '', phone: '', nic: '' });
    const [profiles, setProfiles] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [bookingData, setBookingData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [noAppointment, setNoAppointment] = useState(false);
    const [appointmentsList, setAppointmentsList] = useState(null);
    const [sessionEndedData, setSessionEndedData] = useState(null);
    const [selectedProfileId, setSelectedProfileId] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const savedPatient = localStorage.getItem('activePatient');
        if (savedPatient) {
            const parsed = JSON.parse(savedPatient);
            setPatient(parsed);
            setForm({
                name: parsed.full_name || parsed.name || '',
                phone: parsed.phone || '',
                nic: parsed.nic || ''
            });
        }
    }, []);

    const handleChange = (field) => (e) =>
        setForm((prev) => ({ ...prev, [field]: e.target.value }));

    const isValid = form.name.trim() && (form.phone.trim() || form.nic.trim());

    const saveSession = (id, name, nic) => {
        localStorage.setItem('activePatient', JSON.stringify({
            id: id,
            name: name,
            full_name: name,
            nic: nic
        }));
    };

    const getErrorMessage = (error, fallback = 'Identification failed. Please try again.') => {
        if (!error) return fallback;
        if (typeof error === 'string') return error;
        if (typeof error.error === 'string' && error.error.trim()) return error.error;
        if (typeof error.message === 'string' && error.message.trim()) return error.message;
        return fallback;
    };

    const resetFlow = () => {
        setProfiles(null);
        setAppointmentsList(null);
        setSessionEndedData(null);
        setSelectedProfileId(null);
        setSubmitted(false);
        setBookingData(null);
        setNoAppointment(false);
        setErrorMessage('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isValid) return;

        setLoading(true);
        setNoAppointment(false);
        try {
            if (isCheckOutMode) {
                const identifier = form.nic || form.phone;
                // Use loginByNic which returns profiles if linked
                const response = await apiService.loginByNic(identifier);
                
                if (response.success === true && response.data) {
                    const data = response.data;
                    if (data.length > 1) {
                        setProfiles(data);
                    } else if (data.length === 1) {
                        const p = data[0];
                        saveSession(p.id, p.name || p.full_name, p.nic);
                        navigate('/checkout');
                    } else if (data.id) { // Single object response
                        saveSession(data.id, data.name || data.full_name, data.nic);
                        navigate('/checkout');
                    }
                }
            } else {
                const identifier = form.nic || form.phone;
                const response = await queueService.manualCheckIn(identifier);

                if (response.requires_selection) {
                    setAppointmentsList(response.appointments);
                    setSelectedProfileId(response.patient_id || identifier); // Pass patient identity down
                } else if (response.session_ended) {
                    setSessionEndedData(response);
                } else if (response.profiles) {
                    setProfiles(response.profiles);
                } else if (response.success) {
                    saveSession(response.patient_id, response.patient_name, form.nic);
                    setBookingData(response);
                    setSubmitted(true);
                } else if (response.error && response.error.includes("No appointment found")) {
                    setNoAppointment(true);
                } else if (response.error) {
                    setErrorMessage(response.error);
                }
            }
        } catch (err) {
            console.error('Identification error:', err);
            const message = getErrorMessage(err);
            if (message.includes("No appointment found")) {
                setNoAppointment(true);
            } else {
                setErrorMessage(message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSelectProfile = async (profile) => {
        setLoading(true);
        setNoAppointment(false);
        try {
            if (isCheckOutMode) {
                saveSession(profile.id, profile.name || profile.full_name, profile.nic);
                navigate('/checkout');
            } else {
                const response = await queueService.manualCheckIn(null, profile.id);
                if (response.requires_selection) {
                    setAppointmentsList(response.appointments);
                    setSelectedProfileId(profile.id);
                    setProfiles(null);
                } else if (response.session_ended) {
                    setSessionEndedData(response);
                    setProfiles(null);
                } else if (response.success) {
                    saveSession(profile.id, profile.name, profile.nic);
                    setBookingData(response);
                    setSubmitted(true);
                    setProfiles(null);
                } else if (response.error && response.error.includes("No appointment found")) {
                    setNoAppointment(true);
                    setProfiles(null);
                } else if (response.error) {
                    setErrorMessage(response.error);
                    setProfiles(null);
                }
            }
        } catch (err) {
            const message = getErrorMessage(err);
            if (message.includes("No appointment found")) {
                setNoAppointment(true);
                setProfiles(null);
            } else {
                setErrorMessage(message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAppointment = async (appointmentId) => {
        setLoading(true);
        setAppointmentsList(null);
        try {
            // Since we know the patient ID from earlier, we can use checkIn directly or manualCheckIn
            const identifier = form.nic || form.phone;
            const response = await queueService.manualCheckIn(identifier, selectedProfileId, appointmentId);
            
            if (response.session_ended) {
                setSessionEndedData(response);
            } else if (response.success) {
                saveSession(response.patient_id, response.patient_name, form.nic);
                setBookingData(response);
                setSubmitted(true);
            } else if (response.error) {
                setErrorMessage(response.error);
            }
        } catch (err) {
            setErrorMessage(getErrorMessage(err, 'Appointment selection failed.'));
        } finally {
            setLoading(false);
        }
    };

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
                        { icon: 'calendar_month',   label: 'Find Doctors',         path: '/doctors' },
                        { icon: 'how_to_reg',       label: 'Check-In / Check-Out', path: '/checkin-out', active: true  },
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
            <main className="flex-1 flex flex-col relative overflow-hidden bg-surface">
                <div className="ai-pulse-blob" style={{ top: '10%', right: '5%' }} />
                <div className="ai-pulse-blob" style={{ bottom: '20%', left: '10%', opacity: 0.5 }} />

                <header className="flex justify-between items-center w-full px-10 h-16 bg-white border-b border-outline-variant/20 z-30 shrink-0">
                    <div className="flex items-center gap-3">
                        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 transition-colors" onClick={() => navigate(-1)}>
                            <span className="material-symbols-outlined text-slate-600">arrow_back</span>
                        </button>
                        <h1 className="text-xl font-extrabold tracking-tight text-primary font-headline">MediAssist AI</h1>
                        <div className="h-4 w-px bg-outline-variant mx-1" />
                        <span className="text-slate-500 font-medium text-sm">{isCheckOutMode ? 'Manual Check-Out' : 'Manual Check-In'}</span>
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
                                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">{patient ? 'Patient' : 'Visitor'}</p>
                            </div>
                            <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-white">
                                {patientName.charAt(0)}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-hidden flex flex-col px-10 py-5 z-10">
                    <div className="text-center mb-5 shrink-0">
                        <h2 className="font-headline text-3xl font-black text-on-surface tracking-tight mb-1">{isCheckOutMode ? 'Manual Check-Out' : 'Manual Check-In'}</h2>
                        <p className="text-on-surface-variant text-sm mb-3">{isCheckOutMode ? 'Please enter your NIC or Appointment ID to finalize your visit.' : 'Please enter your details to verify your appointment.'}</p>
                        <StepIndicator current={0} total={3} />
                    </div>

                    <div className="flex-1 flex flex-col min-h-0 max-w-3xl w-full mx-auto">
                        {submitted ? (
                            <div className="animate-scale-up w-full max-w-xl mx-auto bg-white rounded-[3rem] shadow-2xl overflow-y-auto max-h-[85vh] scrollbar-hide border border-slate-100 flex flex-col">
                                <div className="bg-green-500 p-8 text-white text-center">
                                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                                        <span className="material-symbols-outlined text-5xl">check_circle</span>
                                    </div>
                                    <h2 className="text-3xl font-black font-headline">✅ Check-In Successful</h2>
                                    <p className="text-white/80 font-medium mt-1">Your appointment is confirmed</p>
                                </div>

                                <div className="p-10 space-y-8">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Patient</span>
                                            <span className="text-lg font-bold text-on-surface">{bookingData.patient_name}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Queue Number</span>
                                                <span className="text-5xl font-black text-primary tracking-tighter">
                                                    {bookingData.queue_number.toString().padStart(2, '0')}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Est. Wait Time</span>
                                                <span className="text-2xl font-black text-on-surface">{bookingData.estimated_wait_time} <small className="text-xs text-slate-400 uppercase">min</small></span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 pt-4">
                                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Assigned Doctor</span>
                                                <span className="text-sm font-bold text-on-surface">{bookingData.doctor}</span>
                                            </div>
                                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Room</span>
                                                <span className="text-sm font-bold text-primary">{bookingData.room}</span>
                                            </div>
                                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Department</span>
                                                <span className="text-sm font-bold text-on-surface">{bookingData.department}</span>
                                            </div>
                                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Appt. Time</span>
                                                <span className="text-sm font-bold text-on-surface">{bookingData.appointment_time}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-center text-slate-400 text-sm font-medium italic">Please wait until your queue number is called in the waiting area.</p>

                                    <div className="flex flex-col gap-3 pt-2">
                                        <button 
                                            onClick={() => navigate('/queue')}
                                            className="w-full py-4 bg-primary text-white rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 no-print"
                                        >
                                            <span className="material-symbols-outlined">analytics</span>
                                            View Queue Status
                                        </button>
                                        <div className="grid grid-cols-2 gap-3 no-print">
                                            <button 
                                                onClick={() => { localStorage.removeItem('activePatient'); navigate('/'); }}
                                                className="py-4 bg-red-50 text-red-600 rounded-2xl font-bold text-sm hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                                            >
                                                <span className="material-symbols-outlined text-lg">logout</span>
                                                Log Out
                                            </button>
                                            <button 
                                                onClick={() => window.print()}
                                                className="py-4 bg-slate-100 text-primary rounded-2xl font-bold text-sm border border-primary/10 flex items-center justify-center gap-2 hover:bg-white transition-all"
                                            >
                                                <span className="material-symbols-outlined text-lg">print</span>
                                                Print Token
                                            </button>
                                        </div>
                                        <button 
                                            onClick={() => navigate('/')}
                                            className="w-full py-3 text-slate-400 font-bold text-xs hover:text-primary transition-colors no-print"
                                        >
                                            Back to Home Screen
                                        </button>
                                    </div>
                                </div>

                                {/* ─── Professional Printable Token (Hidden on screen) ─── */}
                                <div className="printable-token">
                                    <div className="text-center pb-4 border-b border-black mb-4">
                                        <h1 className="text-xl font-black uppercase tracking-widest">MediAssist</h1>
                                        <p className="text-[8px] font-bold uppercase tracking-[0.3em]">Smart Medical Center</p>
                                    </div>
                                    
                                    <div className="text-center py-6 border-b-2 border-dashed border-black mb-6">
                                        <p className="text-[10px] font-bold uppercase tracking-widest mb-1">Queue Token</p>
                                        <h2 className="text-7xl font-black leading-none">
                                            {bookingData.queue_number.toString().padStart(2, '0')}
                                        </h2>
                                    </div>

                                    <div className="space-y-4 mb-6">
                                        <div className="flex justify-between items-baseline border-b border-slate-100 pb-1">
                                            <span className="text-[8px] font-black uppercase text-slate-500">Patient</span>
                                            <span className="text-sm font-bold">{bookingData.patient_name}</span>
                                        </div>
                                        <div className="flex justify-between items-baseline border-b border-slate-100 pb-1">
                                            <span className="text-[8px] font-black uppercase text-slate-500">Doctor</span>
                                            <span className="text-sm font-bold">{bookingData.doctor}</span>
                                        </div>
                                        <div className="flex justify-between items-baseline border-b border-slate-100 pb-1">
                                            <span className="text-[8px] font-black uppercase text-slate-500">Dept/Room</span>
                                            <span className="text-sm font-bold">{bookingData.department} • {bookingData.room}</span>
                                        </div>
                                        <div className="flex justify-between items-baseline border-b border-slate-100 pb-1">
                                            <span className="text-[8px] font-black uppercase text-slate-500">Time</span>
                                            <span className="text-sm font-bold">{bookingData.appointment_time}</span>
                                        </div>
                                    </div>

                                    <div className="text-center pt-4 opacity-70">
                                        <p className="text-[9px] font-bold italic">Please wait until your number is called.</p>
                                        <p className="text-[7px] font-black uppercase mt-3 tracking-widest">
                                            {new Date().toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : errorMessage ? (
                            <div className="animate-scale-up w-full max-w-xl mx-auto bg-white rounded-[3rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
                                <div className="bg-red-50 p-10 text-red-600 text-center border-b border-red-100">
                                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                                        <span className="material-symbols-outlined text-5xl">error</span>
                                    </div>
                                    <h2 className="text-3xl font-black font-headline">Check-In Error</h2>
                                    <p className="text-red-600/80 font-medium mt-2">{errorMessage}</p>
                                </div>

                                <div className="p-10 space-y-4">
                                    <button
                                        onClick={resetFlow}
                                        className="w-full py-4 bg-primary text-white rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                                    >
                                        <span className="material-symbols-outlined">refresh</span>
                                        Try Again
                                    </button>
                                    <button
                                        onClick={() => navigate('/')}
                                        className="w-full py-3 text-slate-400 font-bold text-xs hover:text-primary transition-colors"
                                    >
                                        Back to Home Screen
                                    </button>
                                </div>
                            </div>
                        ) : noAppointment ? (
                            <div className="animate-scale-up w-full max-w-xl mx-auto bg-white rounded-[3rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
                                <div className="bg-warning-container p-10 text-on-warning-container text-center">
                                    <div className="w-20 h-20 bg-warning text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-pulse">
                                        <span className="material-symbols-outlined text-5xl">event_busy</span>
                                    </div>
                                    <h2 className="text-3xl font-black font-headline">No Appointment Found</h2>
                                    <p className="text-on-warning-container/80 font-medium mt-2">We couldn't find a scheduled appointment for you today.</p>
                                </div>

                                <div className="p-10 space-y-6">
                                    <div className="p-6 bg-surface-container rounded-3xl border border-outline-variant/30">
                                        <h4 className="font-bold text-on-surface mb-2">Possible Reasons:</h4>
                                        <ul className="text-sm text-on-surface-variant space-y-2 list-disc ml-5 font-medium">
                                            <li>The appointment is scheduled for another day.</li>
                                            <li>The NIC or Phone Number entered was incorrect.</li>
                                            <li>The appointment has already been completed or cancelled.</li>
                                        </ul>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        <button 
                                            onClick={() => setNoAppointment(false)}
                                            className="w-full py-4 bg-primary text-white rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                                        >
                                            <span className="material-symbols-outlined">refresh</span>
                                            Try Again
                                        </button>
                                        <button 
                                            onClick={() => navigate('/doctors')}
                                            className="w-full py-4 bg-white text-primary border-2 border-primary rounded-2xl font-bold text-base hover:bg-primary/5 transition-all flex items-center justify-center gap-3"
                                        >
                                            <span className="material-symbols-outlined">calendar_add_on</span>
                                            Book New Appointment
                                        </button>
                                        <button 
                                            onClick={() => navigate('/')}
                                            className="w-full py-3 text-slate-400 font-bold text-xs hover:text-primary transition-colors"
                                        >
                                            Back to Home Screen
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : sessionEndedData ? (
                            <div className="animate-scale-up w-full max-w-xl mx-auto bg-white rounded-[3rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
                                <div className="bg-red-50 p-10 text-red-600 text-center border-b border-red-100">
                                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                                        <span className="material-symbols-outlined text-5xl">event_busy</span>
                                    </div>
                                    <h2 className="text-3xl font-black font-headline">Session Ended</h2>
                                    <p className="text-red-600/80 font-medium mt-2">{sessionEndedData.message}</p>
                                </div>
                                <div className="p-10 space-y-4">
                                    <button onClick={() => { alert('Refund request initiated.'); setSessionEndedData(null); }} className="w-full py-4 bg-white text-red-600 border-2 border-red-200 rounded-2xl font-bold text-base hover:bg-red-50 transition-all flex items-center justify-center gap-3">
                                        <span className="material-symbols-outlined">payments</span>
                                        Request Refund
                                    </button>
                                    <button onClick={() => navigate('/doctors')} className="w-full py-4 bg-primary text-white rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                                        <span className="material-symbols-outlined">calendar_month</span>
                                        Reschedule Appointment
                                    </button>
                                    <button onClick={() => navigate('/doctors', { state: { filter_department: sessionEndedData.department } })} className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black text-lg shadow-xl shadow-slate-800/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                                        <span className="material-symbols-outlined">group</span>
                                        Find Alternative Doctor
                                    </button>
                                    <button onClick={() => setSessionEndedData(null)} className="w-full py-3 text-slate-400 font-bold text-xs hover:text-primary transition-colors mt-2">
                                        ← Cancel
                                    </button>
                                </div>
                            </div>
                        ) : appointmentsList ? (
                            <div className="animate-scale-up w-full max-w-2xl mx-auto space-y-6 flex flex-col">
                                <div className="text-center">
                                    <h3 className="text-2xl font-black font-headline text-on-surface">Select Appointment</h3>
                                    <p className="text-on-surface-variant text-sm">You have multiple appointments today. Which session are you checking into?</p>
                                </div>
                                <div className="grid gap-4">
                                    {appointmentsList.map(appt => (
                                        <button 
                                            key={appt.id}
                                            onClick={() => handleSelectAppointment(appt.id)}
                                            className="flex items-center justify-between gap-4 p-5 bg-white rounded-3xl border border-slate-100 shadow-sm hover:border-primary hover:shadow-md transition-all text-left group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                                                    <span className="material-symbols-outlined text-3xl">stethoscope</span>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-lg text-on-surface">{appt.doctor}</p>
                                                    <p className="text-xs font-semibold text-slate-500">{appt.department} • Room {appt.room}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-black text-xl text-primary">{appt.time}</p>
                                                <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${appt.session_status === 'ACTIVE' ? 'text-green-500' : appt.session_status === 'ENDED' ? 'text-red-500' : 'text-slate-400'}`}>{appt.session_status}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                <button onClick={() => setAppointmentsList(null)} className="py-3 text-slate-400 font-bold text-sm hover:text-primary transition-colors mt-2">
                                    ← Back
                                </button>
                            </div>
                        ) : profiles ? (
                            <div className="animate-scale-up w-full max-w-2xl mx-auto space-y-6 flex flex-col">
                                <div className="text-center">
                                <h3 className="text-2xl font-black font-headline text-on-surface">Select Patient Profile</h3>
                                <p className="text-on-surface-variant text-sm">Multiple accounts found for this identifier. Who is {isCheckOutMode ? 'checking out' : 'checking in'}?</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {profiles.map((p) => {
                                        const imageSrc = sanitizeImageSrc(p.image);
                                        return (
                                        <button 
                                            key={p.id}
                                            onClick={() => handleSelectProfile(p)}
                                            className="flex items-center gap-4 p-5 bg-white rounded-3xl border border-slate-100 shadow-sm hover:border-primary hover:shadow-md transition-all text-left"
                                        >
                                            <div className="w-14 h-14 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                                                {imageSrc ? (
                                                    <img src={imageSrc} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="material-symbols-outlined text-slate-400 text-3xl">person</span>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-on-surface truncate">{p.name}</p>
                                                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">{p.role}</p>
                                            </div>
                                        </button>
                                        );
                                    })}
                                </div>
                                <button onClick={() => setProfiles(null)} className="py-3 text-slate-400 font-bold text-sm hover:text-primary transition-colors mt-2">
                                    ← Back to entry form
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="glass-card flex-1 rounded-3xl p-8 border border-white/40 shadow-[0_20px_50px_rgba(0,71,141,0.04)] flex flex-col gap-5">
                                <FormField id="full_name" label="Full Name" icon="person" placeholder="As it appears on your ID" value={form.name} onChange={handleChange('name')} />
                                <div className="grid grid-cols-2 gap-5">
                                    <FormField id="phone" label="Phone Number" icon="phone" type="tel" placeholder="07x xxx xxxx" value={form.phone} onChange={handleChange('phone')} />
                                    <FormField id="nic" label="National Identity Card (NIC)" icon="badge" placeholder="e.g. 199012345678" value={form.nic} onChange={handleChange('nic')} />
                                </div>
                                <div className="flex items-start gap-3 p-4 bg-surface-container rounded-2xl shrink-0">
                                    <span className="material-symbols-outlined text-primary text-xl mt-0.5">info</span>
                                    <p className="text-xs text-on-surface-variant leading-relaxed">By clicking continue, you agree that the information provided will be used solely for identification and clinic management purposes during your visit today.</p>
                                </div>
                                <button type="submit" disabled={!isValid || loading} className={`submit-btn w-full py-4 rounded-full text-xl font-bold flex items-center justify-center gap-3 shadow-xl shrink-0 ${isValid && !loading ? 'bg-gradient-to-r from-primary to-primary-container text-white' : 'bg-surface-container-highest text-outline cursor-not-allowed'}`}>
                                    <span>{loading ? 'Verifying...' : 'Continue to Verification'}</span>
                                    {!loading && <span className="material-symbols-outlined text-2xl">arrow_forward</span>}
                                </button>
                            </form>
                        )}

                        {!submitted && (
                            <div className="shrink-0 flex items-center justify-between p-5 mt-4 bg-surface-container-lowest rounded-2xl shadow-sm border border-slate-100">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-on-secondary-container text-2xl">support_agent</span>
                                    </div>
                                    <div className="text-left">
                                        <h4 className="font-bold text-sm text-on-surface">Need help with the form?</h4>
                                        <p className="text-on-surface-variant text-xs">Tap for instant AI assistance or speak to a receptionist.</p>
                                    </div>
                                </div>
                                <button className="assist-btn px-6 py-3 border-2 border-primary/20 text-primary font-bold rounded-full text-sm" onClick={() => navigate('/assistant')}>Get Assistance</button>
                            </div>
                        )}
                    </div>

                    <div className="shrink-0 flex justify-between items-center pt-3 mt-2 border-t border-slate-100">
                        <p className="text-xs text-slate-400">© 2024 MediAssist AI. All rights reserved.</p>
                        <div className="flex gap-5">
                            <a href="#" className="text-xs text-slate-500 hover:text-primary font-medium transition-colors">Privacy Policy</a>
                            <a href="#" className="text-xs text-slate-500 hover:text-primary font-medium transition-colors">Terms of Use</a>
                        </div>
                    </div>
                </div>
            </main>

            <button className="qr-fab">
                <span className="material-symbols-outlined text-4xl">qr_code_scanner</span>
                <span className="text-[10px] font-bold uppercase tracking-widest">Scan QR</span>
            </button>
        </div>
    );
};

export default KioskManualCheckIn;
