import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import './KioskRegistrationStep3.css';

// ─── Shared Components ──────────────────────────────────────────────────────

const SideNav = ({ activeStep = 2 }) => {
    const navigate = useNavigate();
    const regSteps = [
        { icon: 'person', label: 'Basic Info', path: '/register/step1' },
        { icon: 'medical_services', label: 'Symptoms', path: '/register/step2' },
        { icon: 'face', label: 'Face Capture', path: '/register/step3' },
        { icon: 'check_circle', label: 'Confirmation', path: '/register/step4' },
    ];

    return (
        <aside className="hidden md:flex flex-col w-64 h-screen bg-white border-r border-outline-variant/30 z-20 shrink-0">
            <div className="p-6 pb-4">
                <div className="flex items-center gap-4 mb-2 cursor-pointer" onClick={() => navigate('/')}>
                    <div className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center text-white shadow-lg">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>local_hospital</span>
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-primary leading-tight font-headline">Patient Intake</h2>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Registration</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 flex flex-col px-3 mt-4 gap-1">
                <div className="px-5 mb-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Flow Progress</p>
                </div>
                {regSteps.map(({ icon, label, path }, index) => {
                    const active = index === activeStep;
                    const completed = index < activeStep;
                    return (
                        <div
                            key={label}
                            onClick={() => (completed || active) && navigate(path)}
                            className={`flex items-center gap-4 px-5 py-3.5 rounded-xl font-semibold text-sm transition-all ${active ? 'nav-item-active' : completed ? 'text-primary cursor-pointer hover:bg-slate-50' : 'text-slate-500 opacity-70 cursor-default'
                                }`}
                        >
                            <span
                                className="material-symbols-outlined text-[22px]"
                                style={active || completed ? { fontVariationSettings: "'FILL' 1" } : {}}
                            >
                                {completed ? 'check_circle' : icon}
                            </span>
                            <span>{label}</span>
                        </div>
                    );
                })}
            </nav>

            <div className="px-4 pb-5 mt-auto">
                <div className="p-5 bg-slate-50 rounded-xl border border-dashed border-outline-variant/40 text-center mb-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Help Desk</p>
                    <p className="text-xs font-bold text-primary mb-3">Biometrics issue?</p>
                    <button className="w-full py-2.5 bg-primary text-white rounded-lg font-bold text-xs shadow-sm hover:opacity-90 transition-opacity" onClick={() => navigate('/assistant')}>
                        Get Assistance
                    </button>
                </div>
                <div className="border-t border-slate-100 pt-4 px-1">
                    <button className="flex items-center gap-3 w-full text-slate-400 hover:text-red-600 transition-colors" onClick={() => navigate('/')}>
                        <span className="material-symbols-outlined text-xl">cancel</span>
                        <span className="font-bold text-xs uppercase tracking-wider">Cancel Registration</span>
                    </button>
                </div>
            </div>
        </aside>
    );
};

const TopBar = ({ step = 3, totalSteps = 4, title = "Face Capture" }) => {
    const navigate = useNavigate();
    return (
        <header className="flex justify-between items-center w-full px-10 h-16 bg-white border-b border-outline-variant/10 shadow-[0_4px_20px_rgba(0,71,141,0.04)] z-30 shrink-0 font-headline">
            <div className="flex items-center gap-3">
                <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 transition-colors" onClick={() => navigate(-1)}>
                    <span className="material-symbols-outlined text-slate-600">arrow_back</span>
                </button>
                <div>
                    <h1 className="text-xl font-extrabold tracking-tight text-primary leading-tight">Patient Intake</h1>
                    <p className="text-xs text-on-surface-variant font-medium font-body leading-none">Step {step} of {totalSteps}: {title}</p>
                </div>
            </div>
            <div className="flex items-center gap-5">
                <div className="flex gap-1">
                    <button className="p-2 text-slate-400 hover:text-primary rounded-full hover:bg-slate-50 transition-colors" onClick={() => navigate('/assistant')}>
                        <span className="material-symbols-outlined">help</span>
                    </button>
                    <button className="p-2 text-slate-400 hover:text-primary rounded-full hover:bg-slate-50 transition-colors">
                        <span className="material-symbols-outlined text-xl">notifications</span>
                    </button>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                    <div className="text-right">
                        <p className="text-sm font-bold text-primary leading-none font-body">MediAssist AI</p>
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5 font-body">Online Support</p>
                    </div>
                    <img
                        alt="Support icon"
                        className="w-9 h-9 rounded-full object-cover ring-2 ring-white shadow-sm"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAeEgiLlKlT6MB9_xJubPcKrDLUcLwv15DRzvMGUuFYSgmtMIEC4N8zgYGSIyNpt0yZC5ZhhiX42TmFlW-itQBKBbG4kxF-8WURu6P0Y3RJ5sfXpVANYlvQzwYTQ_k9vYB_BnUmPqQNVZ1V2zYkOr50EVfjuFdb3iw_9ACvxi-Zf8Bve1QCVeEsCUo7iua9TZhg5DjkIBofWxzZa8FM3Z-v27vvgmz0d0dQyp3lkTwDoK8us-3QU23FCji577JjadnqaET_RcDJGwc"
                    />
                </div>
            </div>
        </header>
    );
};

// ─── Main Component ─────────────────────────────────────────────────────────

const KioskRegistrationStep3 = () => {
    const navigate = useNavigate();
    const [isCaptured, setIsCaptured] = useState(false);
    const [scanStatus, setScanStatus] = useState('Ready');
    const [capturedImage, setCapturedImage] = useState(null);
    const webcamRef = React.useRef(null);

    useEffect(() => {
        const saved = localStorage.getItem('registrationData');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.faceImage) {
                    setCapturedImage(parsed.faceImage);
                    setIsCaptured(true);
                    setScanStatus('Face Captured');
                }
            } catch (e) {
                console.error("Failed to parse registrationData", e);
            }
        }
    }, []);

    const handleCapture = () => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            setCapturedImage(imageSrc);
            setScanStatus('Analyzing...');
            
            setTimeout(() => {
                setIsCaptured(true);
                setScanStatus('Face Captured');
                
                // Save to localStorage
                const saved = localStorage.getItem('registrationData');
                if (saved) {
                    const data = JSON.parse(saved);
                    data.faceImage = imageSrc;
                    localStorage.setItem('registrationData', JSON.stringify(data));
                }
            }, 1000);
        }
    };

    return (
        <div className="w-screen h-screen overflow-hidden flex font-body bg-surface text-on-surface">
            {/* Sidebar */}
            <SideNav activeStep={2} />

            {/* Main Area */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                {/* Background Ambient Decor */}
                <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-secondary/5 rounded-full blur-[100px] pointer-events-none"></div>

                <TopBar step={3} totalSteps={4} title="Face Capture" />

                <div className="flex-1 flex flex-col items-center justify-center p-10 overflow-hidden">
                    <div className="max-w-6xl w-full flex flex-col h-full z-10">

                        {/* Instruction Section */}
                        <div className="text-center mb-10 shrink-0">
                            <h2 className="text-4xl font-extrabold text-on-surface tracking-tight leading-tight mb-4">Center your face in the frame</h2>
                            <p className="text-lg text-on-surface-variant font-medium max-w-2xl mx-auto leading-relaxed">
                                We use facial recognition to securely link your profile and ensure your medical records remain private and accessible only to you.
                            </p>
                        </div>

                        {/* Camera & Actions Content */}
                        <div className="flex-1 flex gap-12 items-center min-h-0">

                            {/* Left: Camera Preview */}
                            <div className="flex-1 aspect-[4/3] rounded-[2.5rem] camera-container relative overflow-hidden border-4 border-white shadow-2xl bg-black">
                                {isCaptured ? (
                                    <img 
                                        src={capturedImage} 
                                        alt="Captured" 
                                        className="absolute inset-0 w-full h-full object-cover"
                                    />
                                ) : (
                                    <Webcam
                                        audio={false}
                                        ref={webcamRef}
                                        screenshotFormat="image/jpeg"
                                        videoConstraints={{
                                            width: 1280,
                                            height: 720,
                                            facingMode: "user"
                                        }}
                                        className="absolute inset-0 w-full h-full object-cover"
                                    />
                                )}

                                {/* Biometric Scanning Overlay */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-64 h-[22rem] biometric-hud flex items-center justify-center">
                                        {/* HUD Corner Brackets */}
                                        <div className="hud-bracket top-0 left-0 border-t-4 border-l-4 rounded-tl-[2rem]"></div>
                                        <div className="hud-bracket top-0 right-0 border-t-4 border-r-4 rounded-tr-[2rem]"></div>
                                        <div className="hud-bracket bottom-0 left-0 border-b-4 border-l-4 rounded-bl-[2rem]"></div>
                                        <div className="hud-bracket bottom-0 right-0 border-b-4 border-r-4 rounded-br-[2rem]"></div>

                                        {/* Animated Scan Line */}
                                        {!isCaptured && <div className="scan-line"></div>}

                                        {/* Verification Check (Optional Success View) */}
                                        {isCaptured && (
                                            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center shadow-lg animate-bounce">
                                                <span className="material-symbols-outlined text-white text-5xl">check</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* AI Status Badge */}
                                    <div className="absolute bottom-8 px-6 py-3 bg-white/80 backdrop-blur-xl rounded-full border border-white/20 flex items-center gap-3 shadow-lg">
                                        <div className={`w-2.5 h-2.5 rounded-full ${isCaptured ? 'bg-secondary' : 'bg-primary animate-pulse'}`}></div>
                                        <span className="text-xs font-bold text-on-surface uppercase tracking-[0.2em]">AI Analysis: {scanStatus}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Steps & Guidance */}
                            <div className="w-[28rem] flex flex-col gap-6 self-center">
                                {/* Tutorial Card 1 */}
                                <div className="instruction-card p-6 rounded-2xl flex gap-5 items-center">
                                    <div className="w-14 h-14 rounded-xl bg-primary-fixed flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-primary text-3xl">light_mode</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-on-surface text-lg">Good Lighting</h4>
                                        <p className="text-sm text-on-surface-variant font-medium">Ensure your face is evenly lit without harsh shadows for best results.</p>
                                    </div>
                                </div>

                                {/* Tutorial Card 2 */}
                                <div className="instruction-card p-6 rounded-2xl flex gap-5 items-center">
                                    <div className="w-14 h-14 rounded-xl bg-secondary-fixed flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-secondary text-3xl">face_retouching_natural</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-on-surface text-lg">Neutral Expression</h4>
                                        <p className="text-sm text-on-surface-variant font-medium">Keep a natural expression and look directly at the kiosk lens.</p>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="mt-6 flex flex-col gap-4">
                                    <button
                                        onClick={handleCapture}
                                        disabled={isCaptured}
                                        className={`w-full h-16 rounded-full font-bold text-xl flex items-center justify-center gap-3 shadow-xl transition-all ${isCaptured
                                                ? 'bg-slate-100 text-slate-400 cursor-default'
                                                : 'bg-gradient-to-r from-primary to-primary-container text-white hover:scale-105 active:scale-95 shadow-primary/20'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-2xl">{isCaptured ? 'verified' : 'photo_camera'}</span>
                                        {isCaptured ? 'Face Captured' : 'Capture Face'}
                                    </button>

                                    <button
                                        disabled={!isCaptured}
                                        onClick={() => navigate('/register/step4')}
                                        className={`w-full h-16 rounded-full font-bold text-xl flex items-center justify-center gap-3 transition-all ${!isCaptured
                                                ? 'bg-slate-100 text-slate-300 btn-disabled'
                                                : 'bg-primary text-white hover:scale-105 active:scale-95 shadow-lg shadow-primary/10'
                                            }`}
                                    >
                                        Continue
                                        <span className="material-symbols-outlined font-bold">arrow_forward</span>
                                    </button>

                                    {!isCaptured && (
                                        <button
                                            onClick={() => {
                                                const saved = localStorage.getItem('registrationData') || '{}';
                                                const data = JSON.parse(saved);
                                                data.faceImage = null;
                                                localStorage.setItem('registrationData', JSON.stringify(data));
                                                navigate('/register/step4');
                                            }}
                                            className="w-full py-4 text-slate-500 font-bold hover:text-primary transition-colors flex items-center justify-center gap-2 text-sm"
                                        >
                                            <span className="material-symbols-outlined text-lg">no_photography</span>
                                            Skip for Now (I don't prefer face capture)
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer Badges */}
                        <div className="mt-12 flex justify-center items-center gap-12 text-slate-400 shrink-0">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-lg">lock</span>
                                <span className="text-[10px] font-bold uppercase tracking-widest">End-to-End Encryption</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-lg">verified_user</span>
                                <span className="text-[10px] font-bold uppercase tracking-widest">HIPAA Compliant System</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-lg">security</span>
                                <span className="text-[10px] font-bold uppercase tracking-widest">Strict Privacy Policy</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default KioskRegistrationStep3;
