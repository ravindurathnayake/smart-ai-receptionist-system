import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Logo from '../../components/common/Logo';
import { apiService } from '../../services/apiService';
import Webcam from 'react-webcam';
import '../kiosk/KioskCheckInOut.css';

const PatientLogin = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [nic, setNic] = useState('');
    const [loginMode, setLoginMode] = useState('nic'); // 'nic' or 'face'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [scanStatus, setScanStatus] = useState('Initializing Scanner...');
    const [profiles, setProfiles] = useState([]);
    const [showProfileSelector, setShowProfileSelector] = useState(false);
    const webcamRef = useRef(null);
    const scanIntervalRef = useRef(null);

    // Redirect target after login
    const redirectTo = location.state?.redirectTo || '/patient';

    const handleLogin = async (e) => {
        if (e) e.preventDefault();
        if (!nic.trim()) return;

        setLoading(true);
        setError('');
        try {
            const response = await apiService.loginByNic(nic.trim());

            if (response.success && response.data) {
                const foundProfiles = response.data;
                if (foundProfiles.length === 1) {
                    // Single profile - standard login
                    localStorage.setItem('activePatient', JSON.stringify(foundProfiles[0]));
                    navigate(redirectTo);
                } else {
                    // Multiple family profiles under one guardian NIC
                    setProfiles(foundProfiles);
                    setShowProfileSelector(true);
                }
            } else {
                setError('No patient profile found with this Identification / NIC number.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'No patient profile found with this Identification / NIC number.');
        } finally {
            setLoading(false);
        }
    };

    const handleProfileSelect = (patient) => {
        localStorage.setItem('activePatient', JSON.stringify(patient));
        navigate(redirectTo);
    };

    const handleFaceLogin = async () => {
        if (!webcamRef.current) return;
        
        try {
            const imageSrc = webcamRef.current.getScreenshot();
            if (!imageSrc) return;

            setScanStatus('Analyzing Face...');
            const response = await apiService.loginPatientWithFace(imageSrc);

            if (response.success && response.data) {
                // Stop scanning
                if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
                
                const data = response.data;

                if (data.profiles) {
                    // Guardian recognized with linked profiles
                    setProfiles(data.profiles);
                    setShowProfileSelector(true);
                } else {
                    // Single patient recognized
                    const recognizedPatient = data;
                    const searchNic = recognizedPatient.nic || recognizedPatient.guardian_nic;

                    if (searchNic) {
                        // Fetch family profiles using the NIC associated with this face
                        try {
                            const familyResponse = await apiService.loginByNic(searchNic);
                            if (familyResponse.success && familyResponse.data.length > 1) {
                                setNic(searchNic);
                                setProfiles(familyResponse.data);
                                setShowProfileSelector(true);
                            } else {
                                // Only one profile or fallback
                                localStorage.setItem('activePatient', JSON.stringify(recognizedPatient));
                                navigate(redirectTo);
                            }
                        } catch (e) {
                            // Fallback to recognized patient if family fetch fails
                            localStorage.setItem('activePatient', JSON.stringify(recognizedPatient));
                            navigate(redirectTo);
                        }
                    } else {
                        // No NIC (unlikely for adults), just login
                        localStorage.setItem('activePatient', JSON.stringify(recognizedPatient));
                        navigate(redirectTo);
                    }
                }
            }
        } catch (err) {
            // Silence errors during interval scanning
            setScanStatus('System Scanning...');
        }
    };

    useEffect(() => {
        if (loginMode === 'face' && !showProfileSelector) {
            setScanStatus('System Scanning...');
            scanIntervalRef.current = setInterval(handleFaceLogin, 3000);
        } else {
            if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
        }

        return () => {
            if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
        };
    }, [loginMode, showProfileSelector]);

    return (
        <div className="min-h-screen bg-slate-50 font-body text-on-surface flex flex-col relative overflow-x-hidden">
            {/* Ambient Background elements */}
            <div className="absolute top-[-10%] left-[-15%] w-[40vw] h-[40vw] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] bg-[#86AE3A]/5 rounded-full blur-[120px] pointer-events-none" />

            {/* Simple Top Navigation */}
            <header className="w-full top-0 px-6 sm:px-12 py-5 z-40 flex justify-between items-center bg-transparent shrink-0">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/patient')}>
                    <Logo size="sm" showSubtitle={false} />
                </div>
                <button 
                    onClick={() => {
                        if (showProfileSelector) {
                            setShowProfileSelector(false);
                        } else {
                            navigate('/patient');
                        }
                    }}
                    className="flex items-center gap-2 px-5 py-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 rounded-full font-bold text-xs text-slate-500 hover:text-slate-800 transition-all shadow-sm"
                >
                    <span className="material-symbols-outlined text-sm font-bold">arrow_back</span>
                    {showProfileSelector ? 'Back' : 'Exit Portal'}
                </button>
            </header>

            <main className="flex-grow flex flex-col items-center justify-center px-4 py-8 z-10">
                <div className="w-full max-w-6xl animate-fade-in flex flex-col items-center">
                    {!showProfileSelector ? (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center w-full max-w-5xl">
                            {/* Left Side text */}
                            <div className="lg:col-span-6 space-y-6 text-center lg:text-left pr-0 lg:pr-8">
                                <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20 mx-auto lg:mx-0">
                                    <span className="material-symbols-outlined text-3xl font-black">fingerprint</span>
                                </div>
                                <div className="space-y-3">
                                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight font-headline leading-tight">
                                        Access your <br className="hidden sm:inline" />
                                        <span className="text-primary">MediAssist Portal</span>
                                    </h1>
                                    <p className="text-slate-500 text-sm sm:text-base font-medium leading-relaxed">
                                        Log in with your National Identity Card (NIC) or biometric face recognition to manage your appointments, review live waiting queue statuses, and access your lab reports instantly.
                                    </p>
                                </div>

                                <div className="hidden sm:flex flex-col gap-3 font-semibold text-xs text-slate-500 pt-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><span className="material-symbols-outlined text-base">verified</span></div>
                                        <span>Fully integrated with Colombo Central General database</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><span className="material-symbols-outlined text-base">clinical_notes</span></div>
                                        <span>256-bit encrypted access to private medical records</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side card */}
                            <div className="lg:col-span-6 w-full max-w-md mx-auto">
                                <div className="bg-white rounded-[2.5rem] p-8 sm:p-10 border border-slate-100 shadow-2xl relative overflow-hidden">
                                    <h2 className="text-2xl font-black text-slate-900 font-headline mb-2">Patient Login</h2>
                                    <p className="text-slate-400 font-bold text-xs mb-6">Choose your preferred login option below.</p>

                                    {/* Mode Toggle */}
                                    <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
                                        <button 
                                            type="button"
                                            onClick={() => setLoginMode('nic')}
                                            className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${loginMode === 'nic' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-primary'}`}
                                        >
                                            NIC Login
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => setLoginMode('face')}
                                            className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${loginMode === 'face' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-primary'}`}
                                        >
                                            Face Recognition
                                        </button>
                                    </div>

                                    {loginMode === 'nic' ? (
                                        <form onSubmit={handleLogin} className="space-y-6">
                                            <div className="space-y-2 text-left">
                                                <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-2">NIC / Identification Number</label>
                                                <div className="relative flex items-center group">
                                                    <span className="material-symbols-outlined absolute left-5 text-primary text-xl font-bold group-focus-within:text-primary-container">badge</span>
                                                    <input 
                                                        type="text" 
                                                        className="w-full pl-14 pr-5 py-4 bg-slate-50 border border-slate-200 focus:border-primary rounded-2xl text-base font-bold placeholder:text-slate-400/70 focus:outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all"
                                                        placeholder="e.g. 199512345678 or 951234567V"
                                                        value={nic}
                                                        onChange={(e) => setNic(e.target.value)}
                                                        autoFocus
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            {error && (
                                                <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-start gap-2.5 border border-red-100/50 animate-in slide-in-from-bottom-1">
                                                    <span className="material-symbols-outlined text-lg font-bold shrink-0 mt-0.5">error</span>
                                                    <span className="text-xs font-bold leading-relaxed">{error}</span>
                                                </div>
                                            )}

                                            <button 
                                                type="submit"
                                                disabled={loading || !nic.trim()}
                                                className={`w-full py-4.5 rounded-2xl text-sm font-black flex items-center justify-center gap-2 shadow-lg transition-all ${
                                                    nic.trim() && !loading 
                                                    ? 'bg-primary text-white hover:scale-[1.01] active:scale-98 shadow-primary/20' 
                                                    : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                                }`}
                                            >
                                                {loading ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                        <span>Verifying credentials...</span>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <span>Enter Dashboard</span>
                                                        <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
                                                    </>
                                                )}
                                            </button>
                                        </form>
                                    ) : (
                                        <div className="flex flex-col items-center space-y-6 animate-fade-in py-2">
                                            <div className="relative w-56 h-56 rounded-full overflow-hidden border-4 border-slate-100 shadow-xl bg-black ring-4 ring-primary/5">
                                                <Webcam
                                                    audio={false}
                                                    ref={webcamRef}
                                                    screenshotFormat="image/jpeg"
                                                    className="absolute inset-0 w-full h-full object-cover"
                                                    videoConstraints={{
                                                        width: 480,
                                                        height: 480,
                                                        facingMode: "user"
                                                    }}
                                                />
                                                <div className="absolute inset-0 border-2 border-primary/30 rounded-full animate-pulse pointer-events-none"></div>
                                                <div className="absolute top-0 left-0 w-full h-1 bg-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.8)] animate-scan z-10"></div>
                                                <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none"></div>
                                            </div>
                                            
                                            <div className="text-center space-y-2">
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                                                    <span className="text-primary font-black uppercase tracking-[0.2em] text-[10px]">{scanStatus}</span>
                                                </div>
                                                <p className="text-slate-400 text-xs font-bold max-w-xs mx-auto">Please position your face within the frame for biometric identification.</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="text-center pt-6 border-t border-slate-100 mt-6 space-y-3">
                                        <p className="text-slate-400 font-bold text-xs">First time visiting our hospital clinics?</p>
                                        <button 
                                            type="button"
                                            onClick={() => navigate('/patient/register')}
                                            className="px-6 py-2.5 bg-primary/5 hover:bg-primary hover:text-white text-primary rounded-full font-black text-xs uppercase tracking-widest border border-primary/10 transition-all"
                                        >
                                            Register Remote Account
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Profile selector for family accounts */
                        <div className="flex flex-col items-center w-full max-w-5xl animate-fade-in">
                            <div className="text-center mb-10 space-y-2">
                                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-headline">Select Profile</h1>
                                <p className="text-slate-500 font-medium text-base">Multiple family member accounts found registered under NIC: <span className="text-primary font-black tracking-widest">{nic}</span></p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl">
                                {profiles.map((profile) => (
                                    <div 
                                        key={profile.id}
                                        onClick={() => handleProfileSelect(profile)}
                                        className="bg-white rounded-3xl p-6.5 border border-slate-100 shadow-md hover:shadow-xl hover:scale-[1.02] hover:border-primary/20 transition-all cursor-pointer group flex flex-col justify-between"
                                    >
                                        <div className="flex flex-col items-center text-center space-y-4">
                                            <div className="w-20 h-20 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:ring-4 group-hover:ring-primary/10 transition-all relative overflow-hidden">
                                                {profile.face_embedding ? (
                                                    <span className="material-symbols-outlined text-4xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                                                ) : (
                                                    <span className="material-symbols-outlined text-4xl text-slate-400 group-hover:text-primary">person</span>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-primary/5"></div>
                                            </div>
                                            
                                            <div className="space-y-1">
                                                <h3 className="text-base font-black text-slate-800 leading-tight font-headline group-hover:text-primary transition-colors">{profile.full_name || profile.name}</h3>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                                    {profile.nic === nic ? 'Primary Holder' : `Family Member • ${profile.age} Yrs`}
                                                </p>
                                            </div>
                                            
                                            <div className="flex gap-2">
                                                <span className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-full text-[9px] font-black text-slate-500 tracking-widest">
                                                    ID: {profile.formatted_id}
                                                </span>
                                                <span className="px-3 py-1 bg-red-50/50 border border-red-100/50 rounded-full text-[9px] font-black text-red-500 tracking-widest">
                                                    {profile.blood_type || 'N/A'}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="pt-6">
                                            <button className="w-full py-3 bg-primary/5 text-primary rounded-xl font-black text-xs uppercase tracking-widest group-hover:bg-primary group-hover:text-white transition-all border border-primary/10">
                                                Access Dashboard
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="mt-12 text-center space-y-4">
                                <p className="text-slate-400 font-bold text-sm">Need to link another linked child profile?</p>
                                <button 
                                    onClick={() => navigate('/patient/register')}
                                    className="px-6 py-3 bg-white border border-slate-200 rounded-full text-slate-600 hover:text-primary hover:border-primary/30 font-black text-xs uppercase tracking-widest shadow-md transition-all"
                                >
                                    + Link New Family Member
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default PatientLogin;
