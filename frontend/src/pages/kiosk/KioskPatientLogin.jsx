import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../../components/common/Logo';
import { apiService } from '../../services/apiService';
import Webcam from 'react-webcam';
import './KioskCheckInOut.css'; 

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
        <div className="w-screen h-screen overflow-hidden flex flex-col font-body bg-surface text-on-surface">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md w-full px-12 py-6 border-b border-outline-variant/10 z-50 flex justify-between items-center">
                <Logo onClick={() => navigate('/')} className="cursor-pointer" />
                <button 
                    onClick={() => {
                        if (showProfileSelector) {
                            setShowProfileSelector(false);
                        } else {
                            navigate('/');
                        }
                    }}
                    className="flex items-center gap-2 text-slate-500 font-bold hover:text-primary transition-colors"
                >
                    <span className="material-symbols-outlined">{showProfileSelector ? 'arrow_back' : 'close'}</span>
                    {showProfileSelector ? 'Back to Login' : 'Exit'}
                </button>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center relative p-8">
                <div className="ai-pulse-bg -z-10 opacity-30"></div>
                
                <div className="w-full max-w-4xl animate-fade-in">
                    {!showProfileSelector ? (
                        <>
                            <div className="text-center mb-10 max-w-2xl mx-auto">
                                <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mx-auto mb-6 shadow-inner">
                                    <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>account_circle</span>
                                </div>
                                <h1 className="text-4xl font-black text-on-surface tracking-tight mb-3 font-headline">Patient Portal Access</h1>
                                <p className="text-slate-500 text-lg font-medium">Please verify your identity to access your medical records.</p>
                            </div>

                            <div className="glass-card rounded-[3rem] p-12 border border-white shadow-2xl max-w-2xl mx-auto">
                                {/* Mode Toggle */}
                                <div className="flex bg-slate-100 p-2 rounded-2xl mb-8">
                                    <button 
                                        onClick={() => setLoginMode('nic')}
                                        className={`flex-1 py-3 rounded-xl font-bold transition-all ${loginMode === 'nic' ? 'bg-white shadow-md text-primary' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        NIC Verification
                                    </button>
                                    <button 
                                        onClick={() => setLoginMode('face')}
                                        className={`flex-1 py-3 rounded-xl font-bold transition-all ${loginMode === 'face' ? 'bg-white shadow-md text-primary' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        Face Recognition
                                    </button>
                                </div>

                                {loginMode === 'nic' ? (
                                    <form onSubmit={handleLogin} className="space-y-8 animate-fade-in">
                                        <div className="space-y-3">
                                            <label className="text-xs font-black text-primary uppercase tracking-[0.2em] ml-2">National Identity Card (NIC)</label>
                                            <div className="relative">
                                                <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-primary text-2xl">fingerprint</span>
                                                <input 
                                                    type="text" 
                                                    className="w-full pl-16 pr-8 py-6 bg-slate-50 border-none rounded-3xl text-xl font-bold placeholder:text-slate-300 focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all"
                                                    placeholder="Enter your NIC number"
                                                    value={nic}
                                                    onChange={(e) => setNic(e.target.value)}
                                                    autoFocus
                                                />
                                            </div>
                                            {error && <p className="text-red-500 text-sm font-bold ml-2">{error}</p>}
                                        </div>

                                        <div className="pt-4">
                                            <button 
                                                type="submit"
                                                disabled={loading || !nic.trim()}
                                                className={`w-full py-6 rounded-[2rem] text-xl font-black flex items-center justify-center gap-4 shadow-xl transition-all ${
                                                    nic.trim() && !loading 
                                                    ? 'bg-gradient-to-br from-primary to-primary-container text-white hover:scale-[1.02] active:scale-95' 
                                                    : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                                }`}
                                            >
                                                {loading ? 'Verifying Identity...' : 'Access Dashboard'}
                                                <span className="material-symbols-outlined font-black">login</span>
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="flex flex-col items-center space-y-8 animate-fade-in">
                                        <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-primary/20 shadow-2xl bg-black">
                                            <Webcam
                                                audio={false}
                                                ref={webcamRef}
                                                screenshotFormat="image/jpeg"
                                                className="absolute inset-0 w-full h-full object-cover grayscale-[0.3]"
                                                videoConstraints={{
                                                    width: 400,
                                                    height: 400,
                                                    facingMode: "user"
                                                }}
                                            />
                                            <div className="absolute inset-0 border-[3px] border-primary/30 rounded-full animate-pulse pointer-events-none"></div>
                                            
                                            {/* Scan Overlay */}
                                            <div className="absolute top-0 left-0 w-full h-1 bg-primary/40 shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)] animate-scan"></div>
                                        </div>
                                        
                                        <div className="text-center">
                                            <div className="flex items-center justify-center gap-3 mb-2">
                                                <div className="w-2 h-2 bg-primary rounded-full animate-ping"></div>
                                                <span className="text-primary font-black uppercase tracking-widest text-sm">{scanStatus}</span>
                                            </div>
                                            <p className="text-slate-400 font-medium px-8">Stand within the biometric zone for automatic login.</p>
                                        </div>
                                    </div>
                                )}

                                <div className="text-center pt-4 border-t border-slate-50 mt-8">
                                    <p className="text-slate-400 font-bold text-sm">Don't have an account?</p>
                                    <button 
                                        type="button"
                                        onClick={() => navigate('/register/step1')}
                                        className="text-primary font-black mt-2 hover:underline underline-offset-8"
                                    >
                                        Register as a New Patient
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center max-w-4xl mx-auto animate-fade-in">
                            <div className="text-center mb-12">
                                <h1 className="text-5xl font-black text-on-surface tracking-tight mb-4 font-headline">Select Patient Profile</h1>
                                <p className="text-slate-500 text-xl font-medium">Multiple family members are linked to NIC: <span className="text-primary font-black">{nic}</span></p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                                {profiles.map((profile) => (
                                    <div 
                                        key={profile.id}
                                        onClick={() => handleProfileSelect(profile)}
                                        className="glass-card bg-white rounded-[2.5rem] p-8 border border-white shadow-xl hover:shadow-2xl hover:scale-[1.05] transition-all cursor-pointer group relative overflow-hidden"
                                    >
                                        <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors"></div>
                                        
                                        <div className="relative z-10 flex flex-col items-center text-center">
                                            <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mb-6 ring-4 ring-slate-50 group-hover:ring-primary/20 transition-all overflow-hidden bg-gradient-to-br from-slate-50 to-slate-200 shadow-inner">
                                                {profile.face_embedding ? (
                                                    <span className="material-symbols-outlined text-4xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                                                ) : (
                                                    <span className="material-symbols-outlined text-4xl text-slate-400">person</span>
                                                )}
                                            </div>
                                            
                                            <div className="mb-4">
                                                <h3 className="text-xl font-black text-on-surface leading-tight font-headline group-hover:text-primary transition-colors">{profile.full_name || profile.name}</h3>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                                    {profile.nic === nic ? 'Primary Account' : `Family • ${profile.age} Yrs`}
                                                </p>
                                            </div>
                                            
                                            <div className="flex gap-2 mb-6">
                                                <div className="px-3 py-1 bg-slate-50 rounded-lg text-[10px] font-bold text-slate-500 border border-slate-100">
                                                    ID: {profile.formatted_id}
                                                </div>
                                                <div className="px-3 py-1 bg-red-50 rounded-lg text-[10px] font-bold text-red-600 border border-red-100">
                                                    {profile.blood_type || 'N/A'}
                                                </div>
                                            </div>
                                            
                                            <button className="w-full py-3.5 bg-primary/5 text-primary rounded-2xl font-black text-sm group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                                                View Dashboard
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="mt-12 text-center">
                                <p className="text-slate-400 font-bold mb-4">Linked Profile Missing?</p>
                                <button 
                                    onClick={() => navigate('/register/step1')}
                                    className="px-8 py-3 bg-white rounded-full text-primary font-black text-sm border border-primary/20 shadow-sm hover:shadow-md transition-all"
                                >
                                    + Link a New Family Member
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <footer className="p-8 text-center text-slate-300 font-bold text-xs uppercase tracking-[0.3em]">
                Secure Medical Access Port • Colombo General Medical Center
            </footer>
        </div>
    );
};

export default KioskPatientLogin;
