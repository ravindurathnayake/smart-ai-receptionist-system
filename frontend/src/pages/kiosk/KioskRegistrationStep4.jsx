import React from 'react';
import './KioskRegistrationStep4.css';

// ─── Shared Components ──────────────────────────────────────────────────────

const SideNav = () => {
    const regSteps = [
        { icon: 'person', label: 'Basic Info', active: false },
        { icon: 'medical_services', label: 'Symptoms', active: false },
        { icon: 'face', label: 'Face Capture', active: false },
        { icon: 'task_alt', label: 'Confirmation', active: true },
    ];

    return (
        <aside className="hidden md:flex flex-col w-64 h-screen bg-white border-r border-outline-variant/30 z-20 shrink-0">
            <div className="p-6 pb-4">
                <div className="flex items-center gap-4 mb-2">
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
                {regSteps.map(({ icon, label, active }) => (
                    <div
                        key={label}
                        className={`flex items-center gap-4 px-5 py-3.5 rounded-xl font-semibold text-sm transition-all ${
                            active ? 'nav-item-active' : 'text-slate-500 opacity-70 cursor-default'
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
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 bg-secondary-container/20 px-4 py-2 rounded-xl border border-secondary/10">
                        <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                        <span className="text-[10px] font-bold text-on-secondary-container uppercase tracking-widest">HIPAA Compliant</span>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                        <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Data Privacy</span>
                    </div>
                </div>
            </div>
        </aside>
    );
};

const TopBar = () => (
    <header className="flex justify-between items-center w-full px-10 h-16 bg-white border-b border-outline-variant/10 shadow-[0_4px_20px_rgba(0,71,141,0.04)] z-30 shrink-0 font-headline">
        <div className="flex items-center gap-3">
            <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 transition-colors">
                <span className="material-symbols-outlined text-slate-600">arrow_back</span>
            </button>
            <div>
                <h1 className="text-xl font-extrabold tracking-tight text-primary leading-tight">Patient Intake</h1>
                <p className="text-xs text-on-surface-variant font-medium font-body leading-none">Step 4 of 4: Final Confirmation</p>
            </div>
        </div>
        <div className="flex items-center gap-5">
            <div className="flex gap-1">
                <button className="p-2 text-slate-400 hover:text-primary rounded-full hover:bg-slate-50 transition-colors">
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

// ─── Main Component ─────────────────────────────────────────────────────────

const KioskRegistrationStep4 = () => {
    return (
        <div className="w-screen h-screen overflow-hidden flex font-body bg-surface text-on-surface">
            {/* Sidebar */}
            <SideNav />

            {/* Main Area */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                {/* Background Ambient Decor */}
                <div className="ai-pulse-bg -top-20 -right-20"></div>

                <TopBar />

                <div className="flex-1 flex flex-col items-center p-12 overflow-hidden">
                    <div className="max-w-4xl w-full flex flex-col h-full z-10">
                        
                        {/* Header Instruction */}
                        <div className="mb-10 shrink-0">
                            <h2 className="text-3xl font-extrabold text-on-surface tracking-tight leading-tight mb-2">Please verify your information</h2>
                            <p className="text-lg text-on-surface-variant font-medium">Review the details below before completing your registration.</p>
                        </div>

                        {/* Bento Details Grid */}
                        <div className="grid grid-cols-12 gap-6 min-h-0 flex-1 overflow-y-auto pr-4 custom-scrollbar pb-10">
                            
                            {/* Personal Details Card */}
                            <div className="col-span-8 bg-white rounded-[2rem] p-8 photo-preview-frame flex flex-col">
                                <div className="flex justify-between items-start mb-10">
                                    <h3 className="text-xl font-extrabold text-primary flex items-center gap-2 font-headline">
                                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>badge</span>
                                        Personal Details
                                    </h3>
                                    <button className="text-primary font-bold text-sm flex items-center gap-1 hover:underline underline-offset-4 decoration-2">
                                        <span className="material-symbols-outlined text-sm">edit</span>
                                        Edit
                                    </button>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-y-10 gap-x-12">
                                    <div className="space-y-1.5">
                                        <p className="detail-label">Full Name</p>
                                        <p className="detail-value">Aruni Perera</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="detail-label">Date of Birth</p>
                                        <p className="detail-value">May 14, 1982</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="detail-label">Gender</p>
                                        <p className="detail-value">Female</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="detail-label">Phone Number</p>
                                        <p className="detail-value">+94 77 123 4567</p>
                                    </div>
                                </div>
                            </div>

                            {/* Biometric Photo Card */}
                            <div className="col-span-4 bg-white rounded-[2rem] p-4 photo-preview-frame flex flex-col">
                                <div className="relative flex-1 rounded-[1.5rem] overflow-hidden group">
                                    <img 
                                        alt="Patient biometric photo"
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCgoYCMeblfAUwvzraPb-OOYfAShsJV1O7I8kZTyY4weH-0Gco9y9UsIa6SEt08n4AmAqkhiCyL8wWA3UqcjVGHhYGe2-nC8T7HwOu9JqlyexuxVyfPgb_8egLbgjKPvG7YYpF9SCxX5uYfpHcN1LWQysFPcv45vlM36ADl__2o4Bimy3YyFAJyufIdWIu7SxRjksRx9BZZPX9FKcTYNQmSPTSwsyRX4Fg1iD8QGzrrP-swpSGZXYVrpa0bBXH-_thzwLEqsAGOQs0"
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
                                    <button className="text-primary font-bold text-sm flex items-center gap-1 hover:underline underline-offset-4 decoration-2">
                                        <span className="material-symbols-outlined text-sm">edit</span>
                                        Edit
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-4">
                                    <div className="symptom-tag px-6 py-3 rounded-full font-bold text-sm shadow-sm flex items-center gap-2">
                                        <span className="material-symbols-outlined text-lg">thermostat</span>
                                        Persistent Fever
                                    </div>
                                    <div className="symptom-tag px-6 py-3 rounded-full font-bold text-sm shadow-sm flex items-center gap-2">
                                        <span className="material-symbols-outlined text-lg">pulmonology</span>
                                        Dry Cough
                                    </div>
                                    <div className="symptom-tag px-6 py-3 rounded-full font-bold text-sm shadow-sm flex items-center gap-2">
                                        <span className="material-symbols-outlined text-lg">sentiment_very_dissatisfied</span>
                                        Body Aches
                                    </div>
                                </div>
                                <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm italic text-slate-600 leading-relaxed font-medium">
                                    "Patient reports onset of high fever (39°C) since yesterday morning. Accompanied by severe fatigue and loss of appetite. No history of travel in the last 14 days."
                                </div>
                            </div>
                        </div>

                        {/* Sticky Footer Actions */}
                        <div className="fixed bottom-0 right-0 left-64 z-40 bg-white/90 backdrop-blur-xl border-t border-slate-100 p-8 px-12 flex justify-between items-center shadow-[0_-12px_40px_rgba(0,71,141,0.06)] shrink-0">
                            <button className="btn-final flex items-center gap-2 bg-slate-100 text-slate-700 rounded-full px-12 py-4 font-bold text-lg hover:bg-slate-200 transition-all">
                                <span className="material-symbols-outlined font-bold">arrow_back</span>
                                Back
                            </button>
                            <div className="flex items-center gap-10">
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Final Check</p>
                                    <p className="text-sm font-bold text-on-surface-variant flex items-center gap-2 justify-end">
                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                        09:42 AM • Room 12 Ready
                                    </p>
                                </div>
                                <button className="btn-final flex items-center gap-3 bg-gradient-to-r from-primary to-primary-container text-white rounded-full px-16 py-5 shadow-2xl shadow-primary/30 font-extrabold text-xl hover:scale-105 transition-all">
                                    Confirm & Register
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
