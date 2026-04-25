import React from 'react';
import { useNavigate } from 'react-router-dom';
import './KioskRegistrationStep4.css';
import { apiService } from '../../services/apiService';

// ─── Shared Components ──────────────────────────────────────────────────────

const SideNav = ({ activeStep = 3 }) => {
    const navigate = useNavigate();
    const regSteps = [
        { icon: 'person', label: 'Basic Info', path: '/register/step1' },
        { icon: 'medical_services', label: 'Symptoms', path: '/register/step2' },
        { icon: 'face', label: 'Face Capture', path: '/register/step3' },
        { icon: 'task_alt', label: 'Confirmation', path: '/register/step4' },
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
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 bg-secondary-container/20 px-4 py-2 rounded-xl border border-secondary/10">
                        <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                        <span className="text-[10px] font-bold text-on-secondary-container uppercase tracking-widest">HIPAA Compliant</span>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 cursor-pointer" onClick={() => navigate('/assistant')}>
                        <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Data Privacy</span>
                    </div>
                </div>
            </div>
        </aside>
    );
};

const TopBar = ({ step = 4, totalSteps = 4, title = "Final Confirmation" }) => {
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

const KioskRegistrationStep4 = () => {
    const navigate = useNavigate();
    const [regData, setRegData] = React.useState(null);
    const [isSaving, setIsSaving] = React.useState(false);

    React.useEffect(() => {
        const saved = localStorage.getItem('registrationData');
        if (saved) {
            try {
                setRegData(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse registrationData", e);
            }
        }
    }, []);

    const handleConfirm = async () => {
        if (!regData) return;
        setIsSaving(true);
        try {
            // Calculate age from DOB
            let age = null;
            if (regData.dob) {
                const birthDate = new Date(regData.dob);
                const today = new Date();
                age = today.getFullYear() - birthDate.getFullYear();
                const m = today.getMonth() - birthDate.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }
            }

            // Map frontend data to backend model
            const patientPayload = {
                full_name: regData.fullName,
                phone_number: regData.phone,
                email: regData.email,
                gender: regData.gender,
                nic: regData.nic,
                blood_type: regData.bloodGroup,
                age: age,
                dob: regData.dob, 
                address: regData.address,
                medical_history: regData.symptomDetails ? `Category: ${regData.symptomCategory}. Details: ${regData.symptomDetails}` : `Category: ${regData.symptomCategory}`,
                face_image: regData.faceImage
            };

            await apiService.createPatient(patientPayload);
            
            localStorage.removeItem('registrationData');
            alert("Registration Successful!");
            navigate('/');
        } catch (error) {
            console.error("Registration error:", error);
            alert(`Error: ${error.response?.data?.message || 'Failed to register. Please try again.'}`);
        } finally {
            setIsSaving(false);
        }
    };

    if (!regData) return <div className="p-10 text-center font-bold text-primary">Loading registration details...</div>;

    return (
        <div className="w-screen h-screen overflow-hidden flex font-body bg-surface text-on-surface">
            <SideNav activeStep={3} />

            <main className="flex-1 flex flex-col overflow-hidden relative">
                <div className="ai-pulse-bg -top-20 -right-20"></div>

                <TopBar step={4} totalSteps={4} title="Final Confirmation" />

                <div className="flex-1 flex flex-col items-center p-12 overflow-hidden">
                    <div className="max-w-4xl w-full flex flex-col h-full z-10">

                        <div className="mb-10 shrink-0">
                            <h2 className="text-3xl font-extrabold text-on-surface tracking-tight leading-tight mb-2">Please verify your information</h2>
                            <p className="text-lg text-on-surface-variant font-medium">Review the details below before completing your registration.</p>
                        </div>

                        <div className="grid grid-cols-12 gap-6 min-h-0 flex-1 overflow-y-auto pr-4 custom-scrollbar pb-10">

                            {/* Personal Details Card */}
                            <div className="col-span-8 bg-white rounded-[2rem] p-8 photo-preview-frame flex flex-col">
                                <div className="flex justify-between items-start mb-10">
                                    <h3 className="text-xl font-extrabold text-primary flex items-center gap-2 font-headline">
                                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>badge</span>
                                        Personal Details
                                    </h3>
                                    <button
                                        onClick={() => navigate('/register/step1')}
                                        className="text-primary font-bold text-sm flex items-center gap-1 hover:underline underline-offset-4 decoration-2"
                                    >
                                        <span className="material-symbols-outlined text-sm">edit</span>
                                        Edit
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-y-10 gap-x-12">
                                    <div className="space-y-1.5">
                                        <p className="detail-label">Full Name</p>
                                        <p className="detail-value">{regData.fullName || 'N/A'}</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="detail-label">Date of Birth</p>
                                        <p className="detail-value">{regData.dob || 'N/A'}</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="detail-label">Gender</p>
                                        <p className="detail-value">{regData.gender || 'N/A'}</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="detail-label">Phone Number</p>
                                        <p className="detail-value">{regData.phone ? `+94 ${regData.phone}` : 'N/A'}</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="detail-label">NIC Number</p>
                                        <p className="detail-value">{regData.nic || 'N/A'}</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="detail-label">Blood Group</p>
                                        <p className="detail-value text-red-600 font-black">{regData.bloodGroup || 'N/A'}</p>
                                    </div>
                                    <div className="col-span-2 space-y-1.5">
                                        <p className="detail-label">Address</p>
                                        <p className="detail-value text-slate-700 leading-relaxed">{regData.address || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Biometric Photo Card */}
                            <div className="col-span-4 bg-white rounded-[2rem] p-4 photo-preview-frame flex flex-col">
                                <div className="relative flex-1 rounded-[1.5rem] overflow-hidden group">
                                    <img
                                        alt="Patient biometric photo"
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        src={regData.faceImage || "https://lh3.googleusercontent.com/aida-public/AB6AXuCgoYCMeblfAUwvzraPb-OOYfAShsJV1O7I8kZTyY4weH-0Gco9y9UsIa6SEt08n4AmAqkhiCyL8wWA3UqcjVGHhYGe2-nC8T7HwOu9JqlyexuxVyfPgb_8egLbgjKPvG7YYpF9SCxX5uYfpHcN1LWQysFPcv45vlM36ADl__2o4Bimy3YyFAJyufIdWIu7SxRjksRx9BZZPX9FKcTYNQmSPTSwsyRX4Fg1iD8QGzrrP-swpSGZXYVrpa0bBXH-_thzwLEqsAGOQs0"}
                                    />
                                    <div className="absolute inset-0 bg-primary/5 group-hover:bg-transparent transition-colors"></div>
                                    <div className="absolute bottom-4 left-4 right-4 glass-card px-4 py-2.5 rounded-xl flex items-center justify-between border border-white/40">
                                        <span className="text-[10px] font-extrabold uppercase text-primary tracking-widest">Verified Photo</span>
                                        <span className="material-symbols-outlined text-secondary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                    </div>
                                </div>
                            </div>

                            {/* Reason for Visit Card */}
                            <div className="col-span-12 bg-slate-50/80 rounded-[2.5rem] p-8 border border-slate-100 flex flex-col gap-6">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-xl font-extrabold text-primary flex items-center gap-2 font-headline">
                                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>clinical_notes</span>
                                        Reason for Visit
                                    </h3>
                                    <button
                                        onClick={() => navigate('/register/step2')}
                                        className="text-primary font-bold text-sm flex items-center gap-1 hover:underline underline-offset-4 decoration-2"
                                    >
                                        <span className="material-symbols-outlined text-sm">edit</span>
                                        Edit
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-4">
                                    <div className="symptom-tag px-6 py-3 rounded-full font-bold text-sm shadow-sm flex items-center gap-2 bg-white text-primary uppercase">
                                        <span className="material-symbols-outlined text-lg">medical_information</span>
                                        {regData.symptomCategory || 'General Visit'}
                                    </div>
                                </div>
                                <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm italic text-slate-600 leading-relaxed font-medium">
                                    "{regData.symptomDetails || 'No additional details provided.'}"
                                </div>
                            </div>
                        </div>

                        {/* Sticky Footer Actions */}
                        <div className="fixed bottom-0 right-0 left-64 z-40 bg-white/90 backdrop-blur-xl border-t border-slate-100 p-8 px-12 flex justify-between items-center shadow-[0_-12px_40px_rgba(0,71,141,0.06)] shrink-0">
                            <button
                                onClick={() => navigate('/register/step3')}
                                className="btn-final flex items-center gap-2 bg-slate-100 text-slate-700 rounded-full px-12 py-4 font-bold text-lg hover:bg-slate-200 transition-all"
                            >
                                <span className="material-symbols-outlined font-bold">arrow_back</span>
                                Back
                            </button>
                            <div className="flex items-center gap-10">
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Final Check</p>
                                    <p className="text-sm font-bold text-on-surface-variant flex items-center gap-2 justify-end">
                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                        System Active • Secure Connection
                                    </p>
                                </div>
                                <button
                                    onClick={handleConfirm}
                                    disabled={isSaving}
                                    className={`btn-final flex items-center gap-3 bg-gradient-to-r from-primary to-primary-container text-white rounded-full px-16 py-5 shadow-2xl shadow-primary/30 font-extrabold text-xl hover:scale-105 transition-all ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {isSaving ? 'Processing...' : 'Confirm & Register'}
                                    <span className="material-symbols-outlined font-black">arrow_forward</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default KioskRegistrationStep4;
