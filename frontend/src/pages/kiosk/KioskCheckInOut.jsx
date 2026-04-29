import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Logo from '../../components/common/Logo';
import { apiService } from '../../services/apiService';
import queueService from '../../services/queueService';
import Webcam from 'react-webcam';
import KioskTopBar from '../../components/kiosk/KioskTopBar';
import './KioskCheckInOut.css';

// ─── Biometric Scanner ────────────────────────────────────────────────────────

const BiometricScanner = ({ scanning, webcamRef }) => (
    <div className="relative flex items-center justify-center">
        <div className={`scanner-ring-ping ${scanning ? '' : 'opacity-0'}`} />
        <div className="relative w-72 h-72 rounded-full p-3 glass-panel border border-white/40 scanner-glow flex items-center justify-center">
            {scanning && <div className="scanner-spin-border" />}
            <div className="w-full h-full rounded-full overflow-hidden relative border-4 border-white shadow-inner bg-black">
                {scanning ? (
                    <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        className="w-full h-full object-cover opacity-80"
                        videoConstraints={{ width: 480, height: 480, facingMode: "user" }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-900">
                        <span className="material-symbols-outlined text-slate-700 text-6xl">face</span>
                    </div>
                )}
                {scanning && <div className="scan-line" />}
                <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent flex items-end justify-center pb-5">
                    <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary" />
                        </span>
                        <span className="text-xs font-bold text-primary">
                            {scanning ? 'System: Scanning…' : 'Paused'}
                        </span>
                    </div>
                </div>
            </div>
            <div className="corner-tl" />
            <div className="corner-tr" />
            <div className="corner-bl" />
            <div className="corner-br" />
        </div>
    </div>
);

// ─── Action Cards ─────────────────────────────────────────────────────────────

const ActionCard = ({ icon, title, subtitle, accentClass, arrowClass, onClick }) => (
    <button
        onClick={onClick}
        className={`action-card flex items-center justify-between p-6 bg-surface-container-lowest rounded-[1.75rem] shadow-[0_12px_40px_rgba(0,71,141,0.06)] text-left w-full group border border-transparent hover:border-outline-variant/20`}
    >
        <div className="flex items-center gap-5">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${accentClass}`}>
                <span className="material-symbols-outlined text-3xl">{icon}</span>
            </div>
            <div>
                <h3 className="text-base font-bold font-headline text-on-surface">{title}</h3>
                <p className="text-on-surface-variant text-sm mt-0.5">{subtitle}</p>
            </div>
        </div>
        <span className={`material-symbols-outlined text-xl transition-colors ${arrowClass}`}>arrow_forward_ios</span>
    </button>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const KioskCheckInOut = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const isCheckOutMode = location.state?.mode === 'checkout';
    const [patient, setPatient] = useState(null);
    const [scanning, setScanning]   = useState(true);
    const [language, setLanguage]   = useState('en');
    const [isProcessing, setIsProcessing] = useState(false);
    const [profiles, setProfiles] = useState(null);
    const [checkInData, setCheckInData] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [noAppointment, setNoAppointment] = useState(false);
    const webcamRef = React.useRef(null);

    useEffect(() => {
        const savedPatient = localStorage.getItem('activePatient');
        if (savedPatient) {
            setPatient(JSON.parse(savedPatient));
        }
    }, []);

    useEffect(() => {
        let interval = null;
        if (scanning && !isProcessing && !showSuccessModal && !profiles && !noAppointment) {
            interval = setInterval(() => {
                captureAndRecognize();
            }, 3000); // Try every 3 seconds
        }
        return () => clearInterval(interval);
    }, [scanning, isProcessing, showSuccessModal, profiles, noAppointment]);

    const saveSession = (id, name, nic) => {
        localStorage.setItem('activePatient', JSON.stringify({
            id: id,
            name: name,
            full_name: name,
            nic: nic
        }));
        setPatient({ id, full_name: name }); // Update local state too
    };

    const captureAndRecognize = async () => {
        if (!webcamRef.current || isProcessing) return;

        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) return;

        setIsProcessing(true);
        try {
            console.log('Attempting face recognition...');
            // Use login face for checkout to avoid auto-checkin, use faceCheckIn for checkin
            const response = isCheckOutMode 
                ? await apiService.loginPatientWithFace(imageSrc)
                : await apiService.faceCheckIn(imageSrc);
            
            // Normalize data: login-face uses success_response (data.data), 
            // while face-check-in returns it directly.
            let payload = response.data || response;
            if (payload.success === true && payload.data) {
                payload = payload.data;
            }

            if (payload.profiles) {
                setScanning(false);
                setProfiles(payload.profiles);
            } else if (payload.success || payload.id || payload.patient_id) {
                setScanning(false);
                const pId = payload.id || payload.patient_id;
                const pName = payload.name || payload.patient_name || payload.full_name;
                saveSession(pId, pName, payload.nic || null);
                
                if (isCheckOutMode) {
                    navigate('/checkout');
                } else {
                    setCheckInData(payload);
                    setShowSuccessModal(true);
                }
            } else if (payload.error && payload.error.includes("No appointment found")) {
                setScanning(false);
                setNoAppointment(true);
            }
        } catch (err) {
            console.log('Face not recognized yet...');
            if (err.error && err.error.includes("No appointment found")) {
                setScanning(false);
                setNoAppointment(true);
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSelectProfile = async (profile) => {
        setIsProcessing(true);
        setNoAppointment(false);
        try {
            if (isCheckOutMode) {
                saveSession(profile.id, profile.name, profile.nic);
                navigate('/checkout');
            } else {
                const response = await apiService.faceCheckIn(null, profile.id);
                if (response.success) {
                    saveSession(profile.id, profile.name, profile.nic);
                    setCheckInData(response);
                    setShowSuccessModal(true);
                    setProfiles(null);
                } else if (response.error && response.error.includes("No appointment found")) {
                    setNoAppointment(true);
                    setProfiles(null);
                }
            }
        } catch (err) {
            if (err.error && err.error.includes("No appointment found")) {
                setNoAppointment(true);
                setProfiles(null);
            } else {
                alert(err.error || 'Selection failed');
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const langs = [
        { code: 'si', label: 'සිංහල' },
        { code: 'ta', label: 'තමිල්' },
        { code: 'en', label: 'English' },
    ];

    const patientName = patient ? (patient.full_name || patient.name || 'Patient') : 'Guest Visitor';

    return (
        <div className="w-screen h-screen overflow-hidden flex font-body bg-surface text-on-surface">
            {/* Success Modal */}
            {showSuccessModal && checkInData && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-fade-in">
                    <div className="w-full max-w-lg bg-white rounded-[3rem] shadow-2xl overflow-y-auto max-h-[90vh] border border-white animate-scale-up scrollbar-hide">
                        <div className="bg-green-500 p-8 text-white text-center">
                            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                                <span className="material-symbols-outlined text-5xl">check_circle</span>
                            </div>
                            <h2 className="text-3xl font-black font-headline">Check-In Successful</h2>
                            <p className="text-white/80 font-medium mt-1">Your appointment is confirmed</p>
                        </div>

                        <div className="p-10 space-y-8">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Patient</span>
                                    <span className="text-lg font-bold text-on-surface">{checkInData.patient_name}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Queue Number</span>
                                        <span className="text-5xl font-black text-primary tracking-tighter">
                                            {checkInData.queue_number.toString().padStart(2, '0')}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Est. Wait Time</span>
                                        <span className="text-2xl font-black text-on-surface">{checkInData.estimated_wait_time} <small className="text-xs text-slate-400 uppercase">min</small></span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4">
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Assigned Doctor</span>
                                        <span className="text-sm font-bold text-on-surface">{checkInData.doctor}</span>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Room</span>
                                        <span className="text-sm font-bold text-primary">{checkInData.room}</span>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Department</span>
                                        <span className="text-sm font-bold text-on-surface">{checkInData.department}</span>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Appt. Time</span>
                                        <span className="text-sm font-bold text-on-surface">{checkInData.appointment_time}</span>
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

                            {/* ─── Professional Printable Token (Hidden on screen) ─── */}
                            <div className="printable-token">
                                <div className="text-center pb-4 border-b border-black mb-4">
                                    <h1 className="text-xl font-black uppercase tracking-widest">MediAssist</h1>
                                    <p className="text-[8px] font-bold uppercase tracking-[0.3em]">Smart Medical Center</p>
                                </div>
                                
                                <div className="text-center py-6 border-b-2 border-dashed border-black mb-6">
                                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1">Queue Token</p>
                                    <h2 className="text-7xl font-black leading-none">
                                        {checkInData.queue_number.toString().padStart(2, '0')}
                                    </h2>
                                </div>

                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between items-baseline border-b border-slate-100 pb-1">
                                        <span className="text-[8px] font-black uppercase text-slate-500">Patient</span>
                                        <span className="text-sm font-bold">{checkInData.patient_name}</span>
                                    </div>
                                    <div className="flex justify-between items-baseline border-b border-slate-100 pb-1">
                                        <span className="text-[8px] font-black uppercase text-slate-500">Doctor</span>
                                        <span className="text-sm font-bold">{checkInData.doctor}</span>
                                    </div>
                                    <div className="flex justify-between items-baseline border-b border-slate-100 pb-1">
                                        <span className="text-[8px] font-black uppercase text-slate-500">Dept/Room</span>
                                        <span className="text-sm font-bold">{checkInData.department} • {checkInData.room}</span>
                                    </div>
                                    <div className="flex justify-between items-baseline border-b border-slate-100 pb-1">
                                        <span className="text-[8px] font-black uppercase text-slate-500">Time</span>
                                        <span className="text-sm font-bold">{checkInData.appointment_time}</span>
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
                    </div>
                </div>
            )}

            {/* No Appointment Modal */}
            {noAppointment && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-fade-in">
                    <div className="w-full max-w-lg bg-white rounded-[3rem] shadow-2xl border border-white animate-scale-up overflow-hidden">
                        <div className="bg-warning-container p-10 text-on-warning-container text-center">
                            <div className="w-20 h-20 bg-warning text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-pulse">
                                <span className="material-symbols-outlined text-5xl">event_busy</span>
                            </div>
                            <h2 className="text-3xl font-black font-headline">No Appointment Found</h2>
                            <p className="text-on-warning-container/80 font-medium mt-2">We recognized you, but you don't have a scheduled appointment for today.</p>
                        </div>

                        <div className="p-10 space-y-6">
                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={() => { setNoAppointment(false); setScanning(true); }}
                                    className="w-full py-4 bg-primary text-white rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                                >
                                    <span className="material-symbols-outlined">refresh</span>
                                    Try Scanning Again
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
                </div>
            )}
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
            <main className="flex-1 flex flex-col relative overflow-hidden bg-surface-container-low">
                <div className="ambient-blob-top" />
                <div className="ambient-blob-bottom" />

                <KioskTopBar title={isCheckOutMode ? 'Quick Check-Out' : 'Check-In / Check-Out'} patientName={patientName} showNotifications={false} />

                <div className="flex-1 overflow-hidden flex flex-col items-center justify-center px-8 py-4 z-10 gap-6">
                    {profiles ? (
                        <div className="animate-scale-up w-full max-w-2xl mx-auto space-y-6 flex flex-col">
                            <div className="text-center">
                                <h3 className="text-2xl font-black font-headline text-on-surface">Select Patient Profile</h3>
                                <p className="text-on-surface-variant text-sm">We've identified you as a guardian. Who is {isCheckOutMode ? 'checking out' : 'checking in'}?</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {profiles.map(p => (
                                    <button 
                                        key={p.id}
                                        onClick={() => handleSelectProfile(p)}
                                        className="flex items-center gap-4 p-5 bg-white rounded-3xl border border-slate-100 shadow-sm hover:border-primary hover:shadow-md transition-all text-left"
                                    >
                                        <div className="w-14 h-14 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                                            {p.image ? (
                                                <img src={p.image} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="material-symbols-outlined text-slate-400 text-3xl">person</span>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-on-surface truncate">{p.name}</p>
                                            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">{p.role}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => { setProfiles(null); setScanning(true); }} className="py-3 text-slate-400 font-bold text-sm hover:text-primary transition-colors mt-2">
                                ← Back to biometric scan
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="text-center space-y-2">
                                <div className="inline-flex items-center gap-3 px-5 py-2 bg-primary/10 text-primary rounded-full font-bold text-[10px] uppercase tracking-widest mx-auto">
                                    <span className="material-symbols-outlined text-lg animate-pulse">biometric_adp</span>
                                    AI Biometric System
                                </div>
                                <h2 className="text-4xl font-extrabold font-headline text-on-surface tracking-tight">
                                    {isCheckOutMode ? 'Express Check-Out' : 'Express Check-In'}
                                </h2>
                                <p className="text-on-surface-variant text-base font-light max-w-lg mx-auto">
                                    {isCheckOutMode 
                                        ? "Stand within the highlighted zone to finalize your visit and collect your digital receipt."
                                        : "Stand within the highlighted zone for biometric authentication. Our AI will recognise you instantly."}
                                </p>
                            </div>

                            <BiometricScanner scanning={scanning} webcamRef={webcamRef} />

                            <button onClick={() => setScanning((s) => !s)} className="text-xs text-outline hover:text-primary transition-colors font-semibold tracking-wide">
                                {scanning ? '⏸ Pause scan preview' : '▶ Resume scan preview'}
                            </button>

                            <button onClick={() => navigate('/manual-checkin', { state: { mode: isCheckOutMode ? 'checkout' : 'checkin' } })} className="px-6 py-2 border border-outline-variant/50 rounded-full text-[10px] font-black uppercase tracking-widest text-outline hover:bg-white hover:text-primary hover:border-primary transition-all">
                                {isCheckOutMode ? 'Skip to Manual Check-Out' : 'Skip to Manual Check-In'}
                            </button>

                            <div className="grid grid-cols-2 gap-5 w-full max-w-3xl">
                                <ActionCard onClick={() => navigate('/manual-checkin', { state: { mode: isCheckOutMode ? 'checkout' : 'checkin' } })} icon={isCheckOutMode ? "logout" : "fingerprint"} title={isCheckOutMode ? "Manual Check-Out" : "Manual Check-In"} subtitle={isCheckOutMode ? "Use NIC or Appointment ID" : "Use NIC or Phone Number"} accentClass={isCheckOutMode ? "bg-secondary-container text-secondary group-hover:bg-secondary group-hover:text-white" : "bg-blue-100 text-primary group-hover:bg-primary group-hover:text-white"} arrowClass={isCheckOutMode ? "text-slate-300 group-hover:text-secondary" : "text-slate-300 group-hover:text-primary"} />
                                <ActionCard onClick={() => navigate('/assistant')} icon="help" title="Need Assistance?" subtitle="Talk to our AI health concierge" accentClass="bg-slate-100 text-slate-500 group-hover:bg-slate-600 group-hover:text-white" arrowClass="text-slate-300 group-hover:text-slate-600" />
                            </div>

                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-slate-400">Preferred language?</span>
                                <div className="flex gap-2">
                                    {langs.map((l) => (
                                        <button key={l.code} onClick={() => setLanguage(l.code)} className={`lang-btn px-4 py-1.5 rounded-full border text-sm font-semibold transition-all ${language === l.code ? 'active' : 'border-slate-200 text-on-surface'}`}>{l.label}</button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>

            <div className="ai-bubble-float">
                <div className="ai-speech-bubble"><p className="text-sm font-medium text-primary">"I'm here if you need help finding your appointment details."</p></div>
                <div className="ai-circle" onClick={() => navigate('/assistant')}><span className="material-symbols-outlined text-3xl z-10 relative" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span></div>
            </div>
        </div>
    );
};

export default KioskCheckInOut;
