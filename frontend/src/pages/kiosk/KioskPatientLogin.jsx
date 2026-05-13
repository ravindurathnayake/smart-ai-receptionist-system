import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../../components/common/Logo';
import { apiService } from '../../services/apiService';
import Webcam from 'react-webcam';
import './KioskCheckInOut.css'; 
import './KioskHome.css';

const KioskPatientLogin = () => {
    const navigate = useNavigate();
    const [nic, setNic] = useState('');
    const [loginMode, setLoginMode] = useState('nic'); // 'nic' or 'face'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [scanStatus, setScanStatus] = useState('Initializing Scanner...');
    const [profiles, setProfiles] = useState([]); // For multiple family profiles
    const [showProfileSelector, setShowProfileSelector] = useState(false);
    const webcamRef = useRef(null);
    const scanIntervalRef = useRef(null);

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
                    // Only one profile - standard login
                    localStorage.setItem('activePatient', JSON.stringify(foundProfiles[0]));
                    navigate('/patient-dashboard');
                } else {
                    // Multiple family profiles - show selector
                    setProfiles(foundProfiles);
                    setShowProfileSelector(true);
                }
            } else {
                setError('No patient record found with this NIC.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'No patient record found with this NIC.');
        } finally {
            setLoading(false);
        }
    };

    const handleProfileSelect = (patient) => {
        localStorage.setItem('activePatient', JSON.stringify(patient));
        navigate('/patient-dashboard');
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
                                navigate('/patient-dashboard');
                            }
                        } catch (e) {
                            // Fallback to recognized patient if family fetch fails
                            localStorage.setItem('activePatient', JSON.stringify(recognizedPatient));
                            navigate('/patient-dashboard');
                        }
                    } else {
                        // No NIC (unlikely for adults), just login
                        localStorage.setItem('activePatient', JSON.stringify(recognizedPatient));
                        navigate('/patient-dashboard');
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
        <div className="bg-background font-body text-on-surface h-full flex flex-col overflow-hidden w-screen h-screen text-left relative">
            {/* Background Ambient Elements */}
            <div className="absolute inset-0 ai-pulse-bg -z-10"></div>
            <div className="cyber-grid"></div>

            {/* Top Navigation Shell - Matching KioskHome */}
            <header className="bg-transparent w-full top-0 px-8 py-4 z-40 border-b border-outline-variant/10 shrink-0">
                <div className="flex justify-between items-center w-full max-w-[1920px] mx-auto">
                    <div className="flex items-center gap-6">
                        <Logo onClick={() => navigate('/')} className="cursor-pointer" />
                        <div className="h-8 w-px bg-outline-variant/30 mx-4"></div>
                        <h1 className="text-xl font-extrabold tracking-tight text-primary font-headline uppercase">Patient Portal</h1>
                    </div>
                    
                    <button 
                        onClick={() => {
                            if (showProfileSelector) {
                                setShowProfileSelector(false);
                            } else {
                                navigate('/');
                            }
                        }}
                        className="flex items-center gap-3 bg-white/60 backdrop-blur-md px-6 py-2.5 rounded-full font-bold text-on-surface-variant hover:bg-white hover:text-primary transition-all shadow-lg border border-outline-variant/20"
                    >
                        <span className="material-symbols-outlined text-xl">{showProfileSelector ? 'arrow_back' : 'close'}</span>
                        <span className="text-sm uppercase tracking-widest">{showProfileSelector ? 'Back' : 'Exit'}</span>
                    </button>
                </div>
            </header>

            <main className="flex-grow flex flex-col items-center justify-center relative px-8 py-12 overflow-hidden h-full">
                <div className="w-full max-w-6xl animate-fade-in flex flex-col items-center">
                    {!showProfileSelector ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
                            {/* Left Side: Information */}
                            <div className="text-left space-y-8 pr-12">
                                <div className="w-24 h-24 bg-primary text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-primary/30">
                                    <span className="material-symbols-outlined text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>account_circle</span>
                                </div>
                                <div className="space-y-4">
                                    <h1 className="text-6xl font-black text-on-surface tracking-tight font-headline leading-[1.1]">
                                        Welcome to your <span className="text-primary">Medical Portal</span>
                                    </h1>
                                    <p className="text-on-surface-variant text-xl font-medium leading-relaxed">
                                        Access your complete medical history, lab reports, and upcoming appointments in one secure location.
                                    </p>
                                </div>
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center gap-4 text-on-surface-variant">
                                        <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                                            <span className="material-symbols-outlined">verified</span>
                                        </div>
                                        <span className="font-bold">Secure Biometric Authentication</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-on-surface-variant">
                                        <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                                            <span className="material-symbols-outlined">clinical_notes</span>
                                        </div>
                                        <span className="font-bold">Instant Access to Medical Records</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Login Card */}
                            <div className="glass-panel rounded-[3.5rem] p-12 border border-white/50 shadow-2xl w-full max-w-2xl mx-auto backdrop-blur-2xl">
                                {/* Mode Toggle */}
                                <div className="flex bg-surface-container-high p-2 rounded-[2rem] mb-10 border border-outline-variant/10">
                                    <button 
                                        onClick={() => setLoginMode('nic')}
                                        className={`flex-1 py-4 rounded-[1.5rem] font-black text-sm uppercase tracking-widest transition-all ${loginMode === 'nic' ? 'bg-white shadow-xl text-primary' : 'text-on-surface-variant/60 hover:text-primary'}`}
                                    >
                                        NIC Login
                                    </button>
                                    <button 
                                        onClick={() => setLoginMode('face')}
                                        className={`flex-1 py-4 rounded-[1.5rem] font-black text-sm uppercase tracking-widest transition-all ${loginMode === 'face' ? 'bg-white shadow-xl text-primary' : 'text-on-surface-variant/60 hover:text-primary'}`}
                                    >
                                        Face Recognition
                                    </button>
                                </div>

                                {loginMode === 'nic' ? (
                                    <form onSubmit={handleLogin} className="space-y-8 animate-fade-in">
                                        <div className="space-y-4">
                                            <label className="text-xs font-black text-primary uppercase tracking-[0.3em] ml-4">Identification Number</label>
                                            <div className="relative group">
                                                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-[2.5rem] blur opacity-25 group-focus-within:opacity-100 transition duration-500"></div>
                                                <div className="relative flex items-center">
                                                    <span className="material-symbols-outlined absolute left-8 text-primary text-3xl">fingerprint</span>
                                                    <input 
                                                        type="text" 
                                                        className="w-full pl-20 pr-8 py-8 bg-white/50 border border-outline-variant/20 rounded-[2.5rem] text-2xl font-black placeholder:text-on-surface-variant/30 focus:outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all"
                                                        placeholder="Enter NIC Number"
                                                        value={nic}
                                                        onChange={(e) => setNic(e.target.value)}
                                                        autoFocus
                                                    />
                                                </div>
                                            </div>
                                            {error && <div className="bg-error/10 text-error p-4 rounded-2xl flex items-center gap-3 border border-error/20 animate-in slide-in-from-bottom-2">
                                                <span className="material-symbols-outlined">error</span>
                                                <span className="text-sm font-bold">{error}</span>
                                            </div>}
                                        </div>

                                        <button 
                                            type="submit"
                                            disabled={loading || !nic.trim()}
                                            className={`w-full py-8 rounded-[2.5rem] text-xl font-black flex items-center justify-center gap-4 shadow-2xl transition-all ${
                                                nic.trim() && !loading 
                                                ? 'bg-primary text-white hover:scale-[1.02] active:scale-95 shadow-primary/30' 
                                                : 'bg-surface-container-highest text-on-surface-variant/30 cursor-not-allowed'
                                            }`}
                                        >
                                            {loading ? (
                                                <div className="flex items-center gap-3">
                                                    <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                    <span>Verifying...</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <span>Access Profile</span>
                                                    <span className="material-symbols-outlined font-black">arrow_forward</span>
                                                </>
                                            )}
                                        </button>
                                    </form>
                                ) : (
                                    <div className="flex flex-col items-center space-y-10 animate-fade-in py-4">
                                        <div className="relative w-72 h-72 rounded-full overflow-hidden border-8 border-white shadow-2xl bg-black ring-4 ring-primary/10">
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
                                            {/* Biometric Scanning Overlay */}
                                            <div className="absolute inset-0 border-[4px] border-primary/40 rounded-full animate-pulse pointer-events-none"></div>
                                            <div className="absolute top-0 left-0 w-full h-1 bg-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.8)] animate-scan z-10"></div>
                                            <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent pointer-events-none"></div>
                                        </div>
                                        
                                        <div className="text-center space-y-4">
                                            <div className="flex items-center justify-center gap-3">
                                                <div className="w-3 h-3 bg-secondary rounded-full animate-ping"></div>
                                                <span className="text-primary font-black uppercase tracking-[0.3em] text-sm">{scanStatus}</span>
                                            </div>
                                            <p className="text-on-surface-variant font-bold max-w-xs mx-auto">Please position your face within the frame for biometric identification.</p>
                                        </div>
                                    </div>
                                )}

                                <div className="text-center pt-10 border-t border-outline-variant/10 mt-10">
                                    <p className="text-on-surface-variant/60 font-bold text-sm mb-4">First time visiting our hospital?</p>
                                    <button 
                                        type="button"
                                        onClick={() => navigate('/register/step1')}
                                        className="bg-primary/5 text-primary px-8 py-3 rounded-full font-black text-sm uppercase tracking-widest hover:bg-primary hover:text-white transition-all border border-primary/20"
                                    >
                                        Register Now
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center w-full animate-fade-in">
                            <div className="text-center mb-16">
                                <h1 className="text-6xl font-black text-on-surface tracking-tight mb-6 font-headline">Select Profile</h1>
                                <p className="text-on-surface-variant text-2xl font-medium">Multiple profiles found for NIC: <span className="text-primary font-black tracking-widest">{nic}</span></p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 w-full max-w-7xl">
                                {profiles.map((profile) => (
                                    <div 
                                        key={profile.id}
                                        onClick={() => handleProfileSelect(profile)}
                                        className="glass-panel bg-white/40 rounded-[3.5rem] p-10 border border-white/50 shadow-xl hover:shadow-primary/20 hover:scale-[1.05] transition-all cursor-pointer group relative overflow-hidden backdrop-blur-xl"
                                    >
                                        <div className="absolute -top-12 -right-12 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors"></div>
                                        
                                        <div className="relative z-10 flex flex-col items-center text-center">
                                            <div className="w-32 h-32 rounded-full bg-white shadow-inner flex items-center justify-center mb-8 ring-8 ring-white/50 group-hover:ring-primary/20 transition-all overflow-hidden relative">
                                                {profile.face_embedding ? (
                                                    <span className="material-symbols-outlined text-5xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                                                ) : (
                                                    <span className="material-symbols-outlined text-5xl text-on-surface-variant/40">person</span>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-primary/5"></div>
                                            </div>
                                            
                                            <div className="mb-6">
                                                <h3 className="text-2xl font-black text-on-surface leading-tight font-headline group-hover:text-primary transition-colors">{profile.full_name || profile.name}</h3>
                                                <p className="text-xs font-black text-on-surface-variant/40 uppercase tracking-[0.2em] mt-2">
                                                    {profile.nic === nic ? 'Primary Holder' : `Family Member • ${profile.age} Yrs`}
                                                </p>
                                            </div>
                                            
                                            <div className="flex gap-3 mb-8">
                                                <div className="px-4 py-1.5 bg-white/60 rounded-full text-[10px] font-black text-on-surface-variant/60 border border-white shadow-sm uppercase tracking-widest">
                                                    ID: {profile.formatted_id}
                                                </div>
                                                <div className="px-4 py-1.5 bg-red-50/60 rounded-full text-[10px] font-black text-red-500 border border-red-100/50 shadow-sm uppercase tracking-widest">
                                                    {profile.blood_type || 'N/A'}
                                                </div>
                                            </div>
                                            
                                            <button className="w-full py-5 bg-primary/5 text-primary rounded-[1.5rem] font-black text-sm uppercase tracking-widest group-hover:bg-primary group-hover:text-white transition-all shadow-sm border border-primary/10 group-hover:shadow-lg group-hover:shadow-primary/30">
                                                Access Dashboard
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="mt-20 text-center">
                                <p className="text-on-surface-variant/40 font-bold mb-6 text-lg">Profile missing from this list?</p>
                                <button 
                                    onClick={() => navigate('/register/step1')}
                                    className="px-10 py-4 bg-white/60 backdrop-blur-md rounded-full text-primary font-black text-sm uppercase tracking-widest border border-primary/20 shadow-lg hover:shadow-xl hover:bg-white transition-all"
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

export default KioskPatientLogin;
