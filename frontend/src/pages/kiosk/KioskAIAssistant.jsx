import React, { useState } from 'react';
import './KioskAIAssistant.css';

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Left sidebar navigation panel */
const SideNav = () => {
    const navItems = [
        { icon: 'home',             label: 'Home',                 active: false },
        { icon: 'smart_toy',        label: 'AI Assistant',         active: true  },
        { icon: 'hourglass_empty',  label: 'Queue Status',         active: false },
        { icon: 'calendar_month',   label: 'Book Appointment',     active: false },
        { icon: 'how_to_reg',       label: 'Check-In / Check-Out', active: false },
        { icon: 'map',              label: 'Hospital Map',         active: false },
    ];

    return (
        <aside className="hidden md:flex flex-col w-64 h-screen bg-white border-r border-outline-variant/30 z-20 shrink-0">
            {/* Logo */}
            <div className="p-6 pb-4">
                <img
                    alt="MediAssist AI Logo"
                    className="h-auto w-full object-contain"
                    src="https://lh3.googleusercontent.com/aida/ADBb0ujXwF6C1p4tSb8vEq_Vmwl_53J0InGaheovhXLH7KGxUAskWVzcmzRsAs4hNU6BDpnzzgqIddtDEE2uKDp7voQktbfUaXQqNCZbJy-zXfZepWAjM1L0U9AF10_W9r1H4ZajR8yZC60FtPSzwt4s6LU5DYKM4PuwSNmLqlHjnd1GpTrYwyE43IkdQkjzasfMPYu577RrcaQ7m44ZjDXHlFvqJh3bkIFwJbJEfn-rtsmpCtyZlecRtVcsOJwJGz1hb3L15Gl0yN9F_Q"
                />
            </div>

            {/* Nav links */}
            <nav className="flex-1 flex flex-col px-3 mt-4 gap-1">
                {navItems.map(({ icon, label, active }) => (
                    <a
                        key={label}
                        href="#"
                        className={`flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all font-semibold text-sm ${
                            active
                                ? 'nav-item-active'
                                : 'text-primary hover:bg-slate-50'
                        }`}
                    >
                        <span
                            className="material-symbols-outlined text-[22px]"
                            style={active ? { fontVariationSettings: "'FILL' 1" } : {}}
                        >
                            {icon}
                        </span>
                        <span>{label}</span>
                    </a>
                ))}
            </nav>

            {/* Bottom panel */}
            <div className="px-4 pb-5 mt-auto">
                <div className="p-5 bg-slate-50 rounded-xl border border-dashed border-outline-variant/40 text-center mb-4">
                    <span className="material-symbols-outlined text-primary text-2xl mb-2 block">support_agent</span>
                    <p className="text-xs font-bold text-primary mb-3">Need Assistance?</p>
                    <button className="w-full py-2.5 bg-primary text-white rounded-lg font-bold text-xs shadow-sm hover:opacity-90 transition-opacity">
                        Call for Help
                    </button>
                </div>
                <button className="flex items-center gap-4 px-5 py-3.5 w-full text-red-600 hover:bg-red-50 rounded-xl transition-all border-t border-slate-100 pt-4">
                    <span className="material-symbols-outlined">logout</span>
                    <span className="font-bold text-sm">Sign Out</span>
                </button>
            </div>
        </aside>
    );
};

/** Top header bar inside the main canvas */
const TopBar = () => (
    <header className="flex justify-between items-center w-full px-10 h-16 bg-white border-b border-outline-variant/20 z-30 shrink-0">
        <div className="flex items-center gap-3">
            <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 transition-colors">
                <span className="material-symbols-outlined text-slate-600">arrow_back</span>
            </button>
            <h1 className="text-xl font-extrabold tracking-tight text-primary font-headline">
                MediAssist AI
            </h1>
        </div>
        <div className="flex items-center gap-6">
            <div className="flex gap-3">
                <span className="material-symbols-outlined text-slate-400 hover:text-primary cursor-pointer transition-colors">
                    notifications
                </span>
                <span className="material-symbols-outlined text-slate-400 hover:text-primary cursor-pointer transition-colors">
                    help
                </span>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                <div className="text-right">
                    <p className="text-sm font-bold text-on-surface leading-none">Anura Perera</p>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Patient</p>
                </div>
                <img
                    alt="User profile photo"
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-white shadow-sm"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBht8v8MUCoalsCJKH_f177xanYgg1TmGV36SAVTRwabFw5fo8NfAwbNNXkZ-Mmo7Jn6eHWvlFVmsd8T9-FsJNR6ziPDbMF6GPVO954kIMIxX4MYklrUV0IPpfcfs4EFmWtou_-wjzEwT7BKIGNz0at73I4ilP-6BSIJ1lV8aFAriHreEzO4O-O4sWp_bjI2KvTyGQIx0fVPu_20gnSTy0H98j7V4Dxz38Ksq6fZDZmc2oOxRB8RUKmpo-a9aE5T_kZwNLVn0gm7Eg"
                />
            </div>
        </div>
    </header>
);

/** AI response / chat bubble panel */
const AIChatPanel = ({ inputValue, setInputValue }) => {
    const suggestions = [
        '"Where is the Cardiology wing?"',
        '"Show my prescription history"',
        '"What is my next appointment?"',
        '"Check me in for today"',
    ];

    return (
        <div className="w-full glass-card rounded-[1.75rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.04)] relative overflow-hidden flex flex-col border border-white">
            {/* Ambient glow */}
            <div className="absolute top-8 left-8 w-32 h-32 bg-primary/10 blur-[60px] rounded-full pointer-events-none" />

            {/* AI identity row */}
            <div className="relative z-10 flex items-center gap-5 mb-7">
                <div className="relative">
                    <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg ai-pulse-glow">
                        <span
                            className="material-symbols-outlined text-white text-3xl"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                            smart_toy
                        </span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                </div>
                <div>
                    <h3 className="text-xl font-extrabold text-on-surface font-headline">MediAssist AI</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                        </span>
                        <p className="text-green-600 text-xs font-bold tracking-wide uppercase">Listening…</p>
                    </div>
                </div>
            </div>

            {/* AI message bubble */}
            <div className="relative z-10 space-y-5">
                <div className="bg-white/60 rounded-2xl px-7 py-5 text-lg leading-relaxed text-on-surface font-medium border border-slate-100/50">
                    "I've recognized you, Anura. I've retrieved your profile. How can I help you today?"
                </div>

                {/* Quick suggestion chips */}
                <div className="flex flex-wrap gap-2.5">
                    {suggestions.map((s) => (
                        <button
                            key={s}
                            onClick={() => setInputValue(s.replace(/"/g, ''))}
                            className="suggestion-btn px-5 py-3 bg-white border border-slate-100 text-slate-600 font-semibold rounded-xl text-sm shadow-sm"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Input area */}
            <div className="mt-7 relative z-10">
                <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-100 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                    <div className="w-11 h-11 flex items-center justify-center text-primary flex-shrink-0">
                        <span className="material-symbols-outlined text-3xl">mic</span>
                    </div>
                    <input
                        className="bg-transparent border-none focus:outline-none text-lg w-full font-medium placeholder:text-slate-400"
                        placeholder="Speak or type your request…"
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                    />
                    <button className="bg-primary text-white w-11 h-11 flex items-center justify-center rounded-xl shadow-md hover:opacity-90 transition-opacity flex-shrink-0">
                        <span className="material-symbols-outlined">send</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Main Page Component ──────────────────────────────────────────────────────

/**
 * KioskAIAssistant
 * Full-screen kiosk page (1280×1024) — no scroll, no overflow.
 * Layout: [SideNav | (TopBar + AIChatPanel + footer hint)]
 */
const KioskAIAssistant = () => {
    const [inputValue, setInputValue] = useState('');

    return (
        <div className="w-screen h-screen overflow-hidden flex font-body bg-surface text-on-surface">
            {/* ── Left Sidebar ── */}
            <SideNav />

            {/* ── Main Canvas ── */}
            <main className="flex-1 flex flex-col relative overflow-hidden bg-white">
                {/* Ambient blobs */}
                <div className="ambient-blob-top" />
                <div className="ambient-blob-bottom" />

                {/* Top Bar */}
                <TopBar />

                {/* Scrollable interaction zone (hidden scrollbar) */}
                <div className="flex-1 overflow-hidden flex flex-col items-center justify-center px-10 py-6 z-10 no-scrollbar relative">
                    {/* Greeting */}
                    <div className="w-full max-w-4xl text-center space-y-2 mb-7">
                        <h2 className="text-[2.6rem] font-extrabold tracking-tight text-on-surface leading-tight font-headline">
                            Welcome back,{' '}
                            <span className="text-primary">Anura Perera</span>!
                        </h2>
                        <p className="text-base text-slate-500 font-medium">
                            We're glad to see you at The Ethereal Clinic today.
                        </p>
                    </div>

                    {/* AI Chat Panel */}
                    <div className="w-full max-w-4xl">
                        <AIChatPanel inputValue={inputValue} setInputValue={setInputValue} />
                    </div>

                    {/* Footer note */}
                    <p className="mt-5 text-slate-400 text-xs font-semibold tracking-wide text-center">
                        Hospital Kiosk #42 • Colombo General Medical Center
                    </p>
                </div>
            </main>
        </div>
    );
};

export default KioskAIAssistant;
