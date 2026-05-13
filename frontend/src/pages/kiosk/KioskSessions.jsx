import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Webcam from 'react-webcam';
import Logo from '../../components/common/Logo';
import { apiService } from '../../services/apiService';
import { socketService } from '../../services/socketService';
import './KioskSessions.css';

// ─── Data ─────────────────────────────────────────────────────────────────────

/** 14 days worth of dates starting from today */
const generateDates = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const today = new Date();
    return Array.from({ length: 14 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        return {
            dayName: days[d.getDay()],
            date: d.getDate(),
            month: months[d.getMonth()],
            iso: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
            isWeekend: d.getDay() === 0 || d.getDay() === 6,
            isToday: i === 0,
        };
    });
};

const DATES = generateDates();

// ─── Shared Components ────────────────────────────────────────────────────────

const SideNav = () => {
    const navigate = useNavigate();
    const navItems = [
        { icon: 'account_circle', label: 'Personal Dashboard', path: '/patient-dashboard' },
        { icon: 'smart_toy', label: 'AI Assistant', path: '/assistant' },
        { icon: 'hourglass_empty', label: 'Queue Status', path: '/queue' },
        { icon: 'calendar_month', label: 'Find Doctors', path: '/doctors', active: true },
        { icon: 'how_to_reg', label: 'Check-In / Check-Out', path: '/checkin-out' },
        { icon: 'map', label: 'Hospital Map', path: '/hospital-map' },
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
                        className={`flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all font-semibold text-sm cursor-pointer ${active ? 'nav-item-active' : 'text-primary hover:bg-slate-50'
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

            <div className="px-4 pb-5 mt-auto">
                <div className="p-5 bg-slate-50 rounded-xl border border-dashed border-outline-variant/40 text-center mb-4">
                    <span className="material-symbols-outlined text-primary text-2xl mb-2 block">support_agent</span>
                    <p className="text-xs font-bold text-primary mb-3">Need Assistance?</p>
                    <button className="w-full py-2.5 bg-primary text-white rounded-lg font-bold text-xs shadow-sm hover:opacity-90 transition-opacity" onClick={() => navigate('/assistant')}>
                        Call for Help
                    </button>
                </div>
                <button
                    onClick={() => {
                        localStorage.removeItem('activePatient');
                        navigate('/');
                    }}
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
    const [patient, setPatient] = useState(null);

    useEffect(() => {
        const savedPatient = localStorage.getItem('activePatient');
        if (savedPatient) {
            setPatient(JSON.parse(savedPatient));
        }
    }, []);

    const patientName = patient?.full_name || patient?.name || 'Guest';

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
    );
};

// ─── Identity Modal ───────────────────────────────────────────────────────────

const IdentityModal = ({ isOpen, onClose, onIdentified }) => {
    const [mode, setMode] = useState('select'); // select, nic, face, confirm, register, profiles
    const [nic, setNic] = useState('');
    const [searching, setSearching] = useState(false);
    const [patient, setPatient] = useState(null);
    const [faceStatus, setFaceStatus] = useState('idle'); // idle, scanning, success, error
    const webcamRef = useRef(null);

    const handleNicSearch = async () => {
        if (!nic.trim()) return;
        setSearching(true);
        try {
            const res = await apiService.findPatientByNic(nic);
            if (res.success && res.data) {
                if (res.data.profiles) {
                    setPatient(res.data.profiles);
                    setMode('profiles');
                } else {
                    setPatient(res.data);
                    setMode('confirm');
                }
            } else {
                alert(res.message || 'Patient not found. Please register as a new patient.');
                setMode('register');
            }
        } catch (err) {
            console.error(err);
            alert('Patient not found. Please register as a new patient.');
            setMode('register');
        } finally {
            setSearching(false);
        }
    };

    const handleFaceId = async () => {
        setFaceStatus('scanning');
        try {
            const imageSrc = webcamRef.current.getScreenshot();
            if (!imageSrc) throw new Error('Failed to capture photo');
            const res = await apiService.loginPatientWithFace(imageSrc);
            if (res.success && res.data) {
                if (res.data.profiles) {
                    setPatient(res.data.profiles); // Store array of profiles
                    setFaceStatus('success');
                    setTimeout(() => setMode('profiles'), 1000);
                } else {
                    setPatient(res.data);
                    setFaceStatus('success');
                    setTimeout(() => setMode('confirm'), 1000);
                }
            } else {
                setFaceStatus('error');
                setTimeout(() => setFaceStatus('idle'), 2000);
            }
        } catch (err) {
            console.error(err);
            setFaceStatus('error');
            setTimeout(() => setFaceStatus('idle'), 2000);
        }
    };

    const handleNewPatientSubmit = (newPatient) => {
        if (newPatient) {
            onIdentified(newPatient);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h2 className="text-2xl font-black text-primary font-headline">Identify Yourself</h2>
                        <p className="text-sm text-slate-500 font-medium">Please verify your identity to proceed with the booking.</p>
                    </div>
                    <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-100 transition-all shadow-sm">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                    {mode === 'select' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <button onClick={() => setMode('nic')} className="group p-8 rounded-[2rem] border-2 border-slate-100 hover:border-primary/30 hover:bg-primary/5 transition-all text-left">
                                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                                    <span className="material-symbols-outlined text-3xl">fingerprint</span>
                                </div>
                                <h3 className="text-xl font-bold text-on-surface mb-2">Search by NIC</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">Fastest for existing patients. Enter your National ID card number.</p>
                            </button>

                            <button onClick={() => setMode('face')} className="group p-8 rounded-[2rem] border-2 border-slate-100 hover:border-primary/30 hover:bg-primary/5 transition-all text-left">
                                <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary mb-6 group-hover:scale-110 transition-transform">
                                    <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>face</span>
                                </div>
                                <h3 className="text-xl font-bold text-on-surface mb-2">Face Recognition</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">Secure biometric login. Just look at the camera to be identified.</p>
                            </button>

                            <button onClick={() => setMode('register')} className="col-span-1 md:col-span-2 group p-6 rounded-3xl border border-dashed border-slate-200 hover:border-primary/40 hover:bg-slate-50 transition-all flex items-center justify-between">
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                        <span className="material-symbols-outlined">person_add</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-on-surface">New to MediAssist AI?</h3>
                                        <p className="text-xs text-slate-500">Quick 1-minute registration for first-time visitors.</p>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all">arrow_forward</span>
                            </button>
                        </div>
                    )}

                    {mode === 'nic' && (
                        <div className="max-w-md mx-auto py-8">
                            <div className="text-center mb-8">
                                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-4">
                                    <span className="material-symbols-outlined text-4xl">fingerprint</span>
                                </div>
                                <h3 className="text-2xl font-bold text-on-surface">NIC Identification</h3>
                                <p className="text-slate-500 text-sm mt-1">Enter your National identity card number</p>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-outline ml-1">NIC Number</label>
                                    <input
                                        autoFocus
                                        className="w-full bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white px-5 py-4 rounded-2xl outline-none transition-all font-bold text-lg text-primary placeholder:text-slate-300"
                                        placeholder="e.g. 199512345678"
                                        value={nic}
                                        onChange={e => setNic(e.target.value)}
                                        onKeyPress={e => e.key === 'Enter' && handleNicSearch()}
                                    />
                                </div>

                                <div className="flex gap-4">
                                    <button onClick={() => setMode('select')} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all">
                                        Back
                                    </button>
                                    <button
                                        onClick={handleNicSearch}
                                        disabled={!nic || searching}
                                        className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        {searching ? (
                                            <>
                                                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                                Searching...
                                            </>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined text-xl">search</span>
                                                Find My Details
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {mode === 'face' && (
                        <div className="max-w-md mx-auto py-4">
                            <div className="text-center mb-6">
                                <h3 className="text-2xl font-bold text-on-surface">Face Identification</h3>
                                <p className="text-slate-500 text-sm mt-1">Position your face in the center of the frame</p>
                            </div>

                            <div className="relative rounded-[2.5rem] overflow-hidden bg-slate-900 aspect-square border-4 border-slate-100 shadow-inner mb-8">
                                <Webcam
                                    audio={false}
                                    ref={webcamRef}
                                    screenshotFormat="image/jpeg"
                                    className="w-full h-full object-cover"
                                    videoConstraints={{ facingMode: 'user' }}
                                />
                                <div className="absolute inset-0 border-[40px] border-black/20 pointer-events-none" />
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="w-64 h-80 border-2 border-white/40 rounded-[4rem] border-dashed" />
                                </div>

                                {faceStatus === 'scanning' && (
                                    <div className="absolute inset-0 bg-primary/20 backdrop-blur-[2px] flex flex-col items-center justify-center animate-in fade-in duration-300">
                                        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mb-4" />
                                        <p className="text-white font-bold tracking-widest uppercase text-xs">Identifying...</p>
                                    </div>
                                )}

                                {faceStatus === 'success' && (
                                    <div className="absolute inset-0 bg-green-500/40 backdrop-blur-[2px] flex flex-col items-center justify-center animate-in fade-in duration-300">
                                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-green-600 mb-4 scale-up animate-in zoom-in duration-500">
                                            <span className="material-symbols-outlined text-4xl font-bold">check</span>
                                        </div>
                                        <p className="text-white font-bold tracking-widest uppercase text-xs">Identified!</p>
                                    </div>
                                )}

                                {faceStatus === 'error' && (
                                    <div className="absolute inset-0 bg-red-500/40 backdrop-blur-[2px] flex flex-col items-center justify-center animate-in fade-in duration-300">
                                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-red-600 mb-4 animate-bounce">
                                            <span className="material-symbols-outlined text-4xl font-bold">close</span>
                                        </div>
                                        <p className="text-white font-bold tracking-widest uppercase text-xs">Identification Failed</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-4">
                                <button onClick={() => setMode('select')} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all">
                                    Back
                                </button>
                                <button
                                    onClick={handleFaceId}
                                    disabled={faceStatus !== 'idle'}
                                    className="flex-[2] py-4 bg-secondary text-white rounded-2xl font-bold shadow-lg shadow-secondary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined">photo_camera</span>
                                    Identify Now
                                </button>
                            </div>
                        </div>
                    )}

                    {mode === 'profiles' && Array.isArray(patient) && (
                        <div className="max-w-md mx-auto py-4">
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-4">
                                    <span className="material-symbols-outlined text-3xl">group</span>
                                </div>
                                <h3 className="text-xl font-bold text-on-surface">Who is visiting today?</h3>
                                <p className="text-sm text-slate-500 mt-1">We found multiple profiles linked to this identity.</p>
                            </div>

                            <div className="space-y-3 mb-8">
                                {patient.map(profile => (
                                    <button
                                        key={profile.id}
                                        onClick={() => {
                                            setPatient(profile);
                                            setMode('confirm');
                                        }}
                                        className="w-full flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-primary/40 hover:bg-white transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                                                {profile.name.charAt(0)}
                                            </div>
                                            <div className="text-left">
                                                <p className="font-bold text-on-surface group-hover:text-primary transition-colors">{profile.name}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{profile.role || 'Patient'}</p>
                                            </div>
                                        </div>
                                        <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-all">arrow_forward</span>
                                    </button>
                                ))}
                            </div>

                            <button onClick={() => setMode('select')} className="w-full py-4 text-slate-400 font-bold text-sm">
                                Not any of these? Go Back
                            </button>
                        </div>
                    )}

                    {mode === 'confirm' && patient && (
                        <div className="max-w-md mx-auto py-8">
                            <div className="text-center mb-8">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto mb-4">
                                    <span className="material-symbols-outlined text-4xl">verified</span>
                                </div>
                                <h3 className="text-2xl font-bold text-on-surface">Identity Confirmed</h3>
                                <p className="text-slate-500 text-sm mt-1">Welcome back, {patient.full_name || patient.name}</p>
                            </div>

                            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 space-y-4 mb-8">
                                <div className="flex justify-between items-center pb-3 border-b border-white">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</span>
                                    <span className="text-sm font-bold text-on-surface">{patient.full_name || patient.name}</span>
                                </div>
                                <div className="flex justify-between items-center pb-3 border-b border-white">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone</span>
                                    <span className="text-sm font-bold text-on-surface">{patient.phone_number || patient.phone}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</span>
                                    <span className="text-sm font-bold text-on-surface">{patient.email || 'N/A'}</span>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button onClick={() => setMode('select')} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all">
                                    Not Me
                                </button>
                                <button
                                    onClick={() => onIdentified(patient)}
                                    className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/25 hover:scale-[1.02] active:scale-95 transition-all"
                                >
                                    Confirm & Book Appointment
                                </button>
                            </div>
                        </div>
                    )}

                    {mode === 'register' && (
                        <div className="py-4">
                            <RegistrationForm
                                onBack={() => setMode('select')}
                                onSubmit={handleNewPatientSubmit}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── Simplified Registration Form ─────────────────────────────────────────────

const RegistrationForm = ({ onBack, onSubmit }) => {
    const [formData, setFormData] = useState({
        full_name: '',
        phone_number: '',
        dob: '',
        gender: 'Male',
        blood_type: 'Don\'t Know',
        nic: '',
        email: '',
        address: '',
        guardian_name: '',
        guardian_phone: '',
        guardian_nic: '',
        guardian_relationship: 'Father',
        face_image: null
    });

    const [submitting, setSubmitting] = useState(false);
    const [successData, setSuccessData] = useState(null);
    const [showCamera, setShowCamera] = useState(false);
    const webcamRef = useRef(null);

    const calculateAge = (dob) => {
        if (!dob) return 0;
        const today = new Date();
        const birthDate = new Date(dob);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        return age;
    };

    const isMinor = calculateAge(formData.dob) > 0 && calculateAge(formData.dob) < 18;

    const isValid = () => {
        const basic = formData.full_name && formData.phone_number && formData.dob;
        if (isMinor) {
            return basic && formData.guardian_name && formData.guardian_phone && formData.guardian_nic && formData.guardian_relationship;
        }
        return basic && formData.nic;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                age: calculateAge(formData.dob),
                nic: isMinor || !formData.nic.trim() ? null : formData.nic.trim(),
                guardian_name: isMinor ? formData.guardian_name.trim() : null,
                guardian_nic: isMinor ? formData.guardian_nic.trim() : null,
                guardian_phone: isMinor ? formData.guardian_phone.trim() : null,
                guardian_relationship: isMinor ? formData.guardian_relationship : null,
            };
            const result = await apiService.createPatient(payload);
            setSuccessData(result);
            setTimeout(() => {
                onSubmit(result);
            }, 2500);
        } catch (error) {
            console.error("Registration failed:", error);
            const errorMsg = error.response?.data?.message || "Registration failed. Please try again.";
            alert(errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    const captureFace = () => {
        if (webcamRef.current) {
            const image = webcamRef.current.getScreenshot();
            setFormData({ ...formData, face_image: image });
            setShowCamera(false);
        }
    };

    if (successData) {
        return (
            <div className="flex flex-col items-center justify-center py-10 text-center animate-in zoom-in duration-500">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-green-600 text-5xl">check_circle</span>
                </div>
                <h3 className="text-2xl font-black text-primary mb-2">Registration Successful!</h3>
                <p className="text-slate-500 font-bold mb-6">Welcome to MediAssist AI Facility.</p>
                <div className="bg-slate-50 px-8 py-4 rounded-2xl border border-slate-100 mb-6">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Your Patient ID</p>
                    <p className="text-3xl font-black text-primary">{successData.formatted_id || `PAT-${successData.id}`}</p>
                </div>
                <p className="text-xs text-slate-400 font-medium animate-pulse">Continuing to confirmation...</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2 col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-outline ml-1">Full Name</label>
                    <input
                        required
                        className="w-full bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white px-5 py-3.5 rounded-2xl outline-none transition-all font-medium"
                        value={formData.full_name}
                        onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-outline ml-1">Phone Number</label>
                    <input
                        required
                        className="w-full bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white px-5 py-3.5 rounded-2xl outline-none transition-all font-medium"
                        value={formData.phone_number}
                        onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-outline ml-1">Date of Birth</label>
                    <input
                        required
                        type="date"
                        className="w-full bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white px-5 py-3.5 rounded-2xl outline-none transition-all font-medium"
                        value={formData.dob}
                        onChange={e => setFormData({ ...formData, dob: e.target.value })}
                    />
                </div>

                {!isMinor && (
                    <div className="space-y-2 col-span-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-outline ml-1">NIC Number</label>
                        <input
                            required
                            className="w-full bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white px-5 py-3.5 rounded-2xl outline-none transition-all font-medium"
                            placeholder="Enter Patient NIC"
                            value={formData.nic}
                            onChange={e => setFormData({ ...formData, nic: e.target.value })}
                        />
                    </div>
                )}

                {isMinor && (
                    <div className="col-span-2 bg-primary/5 p-6 rounded-3xl border border-primary/10 space-y-6">
                        <h4 className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">family_restroom</span>
                            Guardian Information (Required)
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-1">Guardian Name</label>
                                <input
                                    required
                                    className="w-full bg-white border-2 border-transparent focus:border-primary/20 px-5 py-3.5 rounded-2xl outline-none transition-all font-medium"
                                    value={formData.guardian_name}
                                    onChange={e => setFormData({ ...formData, guardian_name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-1">Guardian NIC</label>
                                <input
                                    required
                                    className="w-full bg-white border-2 border-transparent focus:border-primary/20 px-5 py-3.5 rounded-2xl outline-none transition-all font-medium"
                                    value={formData.guardian_nic}
                                    onChange={e => setFormData({ ...formData, guardian_nic: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-1">Guardian Phone</label>
                                <input
                                    required
                                    className="w-full bg-white border-2 border-transparent focus:border-primary/20 px-5 py-3.5 rounded-2xl outline-none transition-all font-medium"
                                    value={formData.guardian_phone}
                                    onChange={e => setFormData({ ...formData, guardian_phone: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-1">Relationship</label>
                                <select
                                    className="w-full bg-white border-2 border-transparent focus:border-primary/20 px-5 py-3.5 rounded-2xl outline-none transition-all font-medium"
                                    value={formData.guardian_relationship}
                                    onChange={e => setFormData({ ...formData, guardian_relationship: e.target.value })}
                                >
                                    <option>Father</option>
                                    <option>Mother</option>
                                    <option>Guardian</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-outline ml-1">Gender</label>
                    <div className="grid grid-cols-3 gap-2">
                        {['Male', 'Female', 'Other'].map(g => (
                            <button
                                key={g}
                                type="button"
                                onClick={() => setFormData({...formData, gender: g})}
                                className={`py-2 rounded-xl text-[10px] font-bold transition-all ${formData.gender === g ? 'bg-primary text-white' : 'bg-slate-50 text-slate-400'}`}
                            >
                                {g}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-outline ml-1">Blood Type</label>
                    <select
                        className="w-full bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white px-5 py-3 rounded-2xl outline-none transition-all font-medium text-sm"
                        value={formData.blood_type}
                        onChange={e => setFormData({...formData, blood_type: e.target.value})}
                    >
                        {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', "Don't Know"].map(type => (
                            <option key={type}>{type}</option>
                        ))}
                    </select>
                </div>

                <div className="col-span-2 space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-outline ml-1">Biometric Login (Optional)</label>
                    
                    {!formData.face_image ? (
                        <div className="flex flex-col gap-3">
                            {!showCamera ? (
                                <button 
                                    type="button"
                                    onClick={() => setShowCamera(true)}
                                    className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold hover:border-primary/40 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined">add_a_photo</span>
                                    Add Face Recognition
                                </button>
                            ) : (
                                <div className="space-y-4">
                                    <div className="relative rounded-2xl overflow-hidden bg-slate-100 aspect-video border-2 border-slate-200">
                                        <Webcam
                                            audio={false}
                                            ref={webcamRef}
                                            screenshotFormat="image/jpeg"
                                            className="w-full h-full object-cover"
                                            videoConstraints={{ facingMode: 'user' }}
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="w-32 h-40 border-2 border-white/50 rounded-[2rem] border-dashed" />
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => setShowCamera(false)} className="flex-1 py-2 text-xs font-bold text-slate-400">Cancel</button>
                                        <button type="button" onClick={captureFace} className="flex-[2] py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/20">Capture Face</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="relative group rounded-2xl overflow-hidden border-2 border-green-200">
                            <img src={formData.face_image} className="w-full h-32 object-cover blur-[2px] group-hover:blur-0 transition-all" />
                            <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                                <div className="bg-white rounded-full p-2 text-green-500 shadow-lg">
                                    <span className="material-symbols-outlined font-bold">check</span>
                                </div>
                            </div>
                            <button 
                                type="button" 
                                onClick={() => setFormData({...formData, face_image: null})}
                                className="absolute top-2 right-2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex gap-4 pt-4">
                <button type="button" onClick={onBack} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all">
                    Back
                </button>
                <button
                    type="submit"
                    disabled={!isValid() || submitting}
                    className={`flex-[2] py-4 rounded-2xl font-bold text-white shadow-lg transition-all ${isValid() && !submitting ? 'bg-primary shadow-primary/20 hover:scale-[1.02]' : 'bg-slate-300 cursor-not-allowed'}`}
                >
                    {submitting ? 'Registering...' : 'Register & Continue'}
                </button>
            </div>
        </form>
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

const slotIcon = { morning: 'light_mode', afternoon: 'partly_cloudy_day', evening: 'dark_mode' };
const slotColor = { morning: 'text-orange-400', afternoon: 'text-blue-400', evening: 'text-indigo-400' };
const slotLabel = { morning: 'Morning Sessions', afternoon: 'Afternoon Sessions', evening: 'Evening Sessions' };

const SessionPanel = ({ doctor, selectedDate, onDateSelect, selectedSlot, onSlotSelect }) => {
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [showIdentityModal, setShowIdentityModal] = useState(false);

    // Filter sessions by selected date's day of week
    const dateObj = new Date(selectedDate);
    const dayOfWeek = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(dateObj);

    const availableSessions = (doctor.sessions || []).filter(s => {
        if (s.session_date) {
            return s.session_date === selectedDate;
        }
        return s.day_of_week === dayOfWeek;
    });

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

        const savedPatient = localStorage.getItem('activePatient');
        if (!savedPatient) {
            setShowIdentityModal(true);
            return;
        }

        const patient = JSON.parse(savedPatient);
        await performBooking(patient);
    };

    const performBooking = async (patient) => {
        setSubmitting(true);
        try {
            const response = await apiService.bookAppointment({
                full_name: patient.full_name || patient.name,
                phone_number: patient.phone_number,
                patient_id: patient.id,
                specialist_id: doctor.id,
                symptom: "General consultation",
                appointment_date: selectedDate,
                doctor_session_id: selectedSlot.id
            });

            if (response) {
                const appointmentData = {
                    ...response,
                    appointment_date: selectedDate,
                    doctor_session_id: selectedSlot?.id || selectedSlot?.start_time
                };
                localStorage.setItem('last_appointment', JSON.stringify(appointmentData));
                navigate('/payment', { state: { appointment: appointmentData, doctor: doctor } });
            }
        } catch (err) {
            console.error('Failed to book appointment:', err);
            alert('Failed to book appointment. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleIdentified = (patient) => {
        localStorage.setItem('activePatient', JSON.stringify(patient));
        setShowIdentityModal(false);
        performBooking(patient);
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
                            const hasSessions = (doctor.sessions || []).some(s => {
                                if (s.session_date) {
                                    return s.session_date === d.iso;
                                }
                                return s.day_of_week === dNameFull;
                            });

                            return (
                                <button
                                    key={d.iso}
                                    onClick={() => onDateSelect(d.iso)}
                                    className={`date-card relative flex flex-col items-center py-4 px-5 rounded-2xl border transition-all min-w-[80px] ${isSelected
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
                                            const isFull = (sess.current_bookings || 0) >= sess.max_patients;
                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => !isFull && onSlotSelect(sess)}
                                                    disabled={isFull}
                                                    className={`time-slot group glass-panel p-4 rounded-[1.5rem] border text-left transition-all ${isSelected
                                                            ? 'selected border-primary bg-primary/5 shadow-lg shadow-primary/5'
                                                            : isFull
                                                                ? 'border-red-100 bg-red-50/30 cursor-not-allowed opacity-75'
                                                                : 'border-slate-100 hover:border-primary/30 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    <div className="flex justify-between items-start mb-3">
                                                        <span className={`text-base font-black ${isSelected ? 'text-primary' : isFull ? 'text-red-500' : 'text-on-surface'}`}>
                                                            {sess.start_time}
                                                        </span>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isSelected ? 'bg-primary/10 text-primary' : isFull ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                                                            {isFull ? 'FULL' : (sess.session_number ? `Session ${sess.session_number} • ` : '') + sess.room_number}
                                                        </span>
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tight text-slate-400">
                                                            <span>Patients</span>
                                                            <span className={isSelected ? 'text-primary' : ''}>
                                                                {sess.current_bookings || 0}/{sess.max_patients}
                                                            </span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full transition-all duration-1000 ${isSelected ? 'bg-primary' : 'bg-slate-300'}`}
                                                                style={{ width: `${Math.min(100, ((sess.current_bookings || 0) / sess.max_patients) * 100)}%` }}
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
                    <div className="text-right flex flex-col gap-1">
                        <div className="flex justify-end items-center gap-2">
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Consultation</p>
                            <p className="text-xs font-bold text-on-surface">Rs. {doctor.consultation_fee || '4,500'}</p>
                        </div>
                        <div className="flex justify-end items-center gap-2">
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Hospital Fee</p>
                            <p className="text-xs font-bold text-on-surface">Rs. 500</p>
                        </div>
                        <div className="mt-1 pt-1 border-t border-slate-200">
                            <p className="text-xl font-black text-primary">Rs. {(parseInt(doctor.consultation_fee || 4500) + 500).toLocaleString()}</p>
                        </div>
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
                        className={`flex-[2] py-3.5 px-6 rounded-full font-bold text-sm transition-all ${selectedSlot && !submitting
                                ? 'bg-gradient-to-br from-primary to-primary-container text-white shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]'
                                : 'bg-surface-container-highest text-outline cursor-not-allowed'
                            }`}
                    >
                        {submitting ? 'Processing...' : 'Confirm Appointment'}
                    </button>
                </div>
            </div>

            <IdentityModal
                isOpen={showIdentityModal}
                onClose={() => setShowIdentityModal(false)}
                onIdentified={handleIdentified}
            />
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
    const [doctor, setDoctor] = useState(location.state?.doctor);
    const [selectedDate, setSelectedDate] = useState(DATES[0].iso);
    const [selectedSlot, setSelectedSlot] = useState(null);

    const refreshDoctor = useCallback(async () => {
        if (!doctor?.id) return;
        try {
            const specs = await apiService.getSpecialists();
            const updated = specs.find(s => s.id === doctor.id);
            if (updated) {
                setDoctor({
                    ...updated,
                    name: updated.title ? `${updated.title} ${updated.name}` : `Dr. ${updated.name}`,
                    specialty: updated.specialization || updated.department,
                    rating: updated.rating || 4.8,
                    sessions: updated.sessions
                });
            }
        } catch (err) {
            console.error("Failed to refresh doctor sessions:", err);
        }
    }, [doctor?.id]);

    useEffect(() => {
        if (!doctor?.id) return;

        socketService.on('appointment_booked', (data) => {
            if (data.doctor_session_id) refreshDoctor();
        });

        socketService.on('appointment_rescheduled', (data) => {
            if (data.doctor_session_id) refreshDoctor();
        });

        socketService.on('appointment_booked', () => refreshDoctor());
        socketService.on('appointment_rescheduled', () => refreshDoctor());
        socketService.on('specialist_updated', (data) => {
            if (data.specialist_id === doctor?.id) {
                refreshDoctor();
            }
        });

        return () => {
            socketService.off('appointment_booked');
            socketService.off('appointment_rescheduled');
            socketService.off('specialist_updated');
        };
    }, [doctor?.id, refreshDoctor]);

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
