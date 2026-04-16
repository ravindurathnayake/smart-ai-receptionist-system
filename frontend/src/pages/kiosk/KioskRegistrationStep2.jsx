import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './KioskRegistrationStep2.css';

// ─── Shared Components ──────────────────────────────────────────────────────

const SideNav = ({ activeStep = 1 }) => {
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
                    <p className="text-xs font-bold text-primary mb-3">Questions about symptoms?</p>
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

const TopBar = ({ step = 2, totalSteps = 4, title = "Symptoms Assessment" }) => {
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

const KioskRegistrationStep2 = () => {
    const navigate = useNavigate();
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [details, setDetails] = useState('');

    const categories = [
        { id: 'checkup', icon: 'stethoscope', title: 'General Checkup', desc: 'Routine physical or screening', color: 'bg-primary-fixed' },
        { id: 'consultation', icon: 'chat', title: 'Consultation', desc: 'Discussing health concerns', color: 'bg-primary-fixed' },
        { id: 'laboratory', icon: 'biotech', title: 'Laboratory', desc: 'Blood tests, X-rays, or imaging', color: 'bg-primary-fixed' },
        { id: 'emergency', icon: 'e911_emergency', title: 'Emergency', desc: 'Urgent care or acute injury', color: 'bg-error-container/50', isEmergency: true },
        { id: 'pharmacy', icon: 'medication', title: 'Pharmacy', desc: 'Prescription refills/pickups', color: 'bg-primary-fixed' },
        { id: 'followup', icon: 'event_repeat', title: 'Follow-up', desc: 'Scheduled post-visit check', color: 'bg-primary-fixed' },
    ];

    return (
        <div className="w-screen h-screen overflow-hidden flex font-body bg-surface text-on-surface">
            {/* Sidebar */}
            <SideNav activeStep={1} />

            {/* Main Area */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                <div className="ai-pulse-bg top-1/4 left-1/4"></div>
                <div className="ai-pulse-bg bottom-1/4 right-1/4"></div>

                <TopBar step={2} totalSteps={4} title="Symptoms Assessment" />

                <div className="flex-1 flex flex-col items-center p-10 overflow-hidden">
                    <div className="max-w-5xl w-full flex flex-col h-full z-10">
                        {/* Header */}
                        <div className="mb-8 p-2">
                            <h2 className="text-4xl font-extrabold text-on-surface tracking-tight mb-2">How are you feeling?</h2>
                            <p className="text-lg text-on-surface-variant font-medium">Please select the category that best describes your visit today.</p>
                        </div>

                        {/* Bento Grid */}
                        <div className="grid grid-cols-3 gap-6 mb-8 shrink-0">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`symptom-card p-6 rounded-[2rem] flex flex-col items-center text-center gap-4 ${selectedCategory === cat.id ? 'symptom-card-active' : ''
                                        } ${cat.isEmergency ? 'emergency-card' : ''}`}
                                >
                                    <div className={`w-14 h-14 rounded-full ${cat.color} flex items-center justify-center text-primary group-hover:bg-on-secondary`}>
                                        <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: cat.isEmergency && selectedCategory === cat.id ? "'FILL' 1" : "" }}>
                                            {cat.icon}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg font-headline mb-1">{cat.title}</h3>
                                        <p className="text-xs text-on-surface-variant font-medium">{cat.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Textarea Area */}
                        <div className="flex-1 flex flex-col gap-3 min-h-0 mb-8">
                            <label className="text-sm font-bold font-headline text-on-surface ml-2 uppercase tracking-widest">Additional details (Optional)</label>
                            <textarea
                                className="symptom-textarea flex-1 p-6 text-lg font-medium"
                                placeholder="Please describe any other symptoms or specific notes you have for the doctor..."
                                value={details}
                                onChange={(e) => setDetails(e.target.value)}
                            />
                        </div>

                        {/* Footer Buttons */}
                        <div className="flex justify-between items-center bg-white/40 backdrop-blur-md p-6 rounded-[2rem] border border-white/50 shadow-sm shrink-0">
                            <button
                                onClick={() => navigate('/register/step1')}
                                className="btn-kiosk-action flex items-center gap-2 bg-slate-100 text-slate-700 rounded-full px-10 py-4 font-bold text-lg hover:bg-slate-200 transition-all"
                            >
                                <span className="material-symbols-outlined">arrow_back</span>
                                Back
                            </button>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => navigate('/register/step3')}
                                    className="font-bold text-slate-500 hover:text-primary px-6 py-4 transition-colors"
                                >
                                    Skip for Now
                                </button>
                                <button
                                    onClick={() => navigate('/register/step3')}
                                    className="btn-kiosk-action flex items-center gap-2 bg-primary text-white rounded-full px-12 py-4 shadow-xl shadow-primary/20 font-bold text-lg hover:scale-105 active:scale-95 transition-all"
                                >
                                    Next Step
                                    <span className="material-symbols-outlined font-bold">arrow_forward</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Decoration */}
                <div className="fixed bottom-0 right-0 p-8 opacity-5 pointer-events-none select-none z-0">
                    <span className="material-symbols-outlined text-[150px]" style={{ fontVariationSettings: "'wght' 100" }}>clinical_notes</span>
                </div>
            </main>
        </div>
    );
};

export default KioskRegistrationStep2;
