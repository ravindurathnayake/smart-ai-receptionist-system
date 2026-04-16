import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './KioskCheckOut.css';

// ─── Shared Components (identical to KioskAIAssistant) ────────────────────────

const SideNav = () => {
    const navigate = useNavigate();
    const navItems = [
        { icon: 'home',             label: 'Home',                 path: '/' },
        { icon: 'smart_toy',        label: 'AI Assistant',         path: '/assistant' },
        { icon: 'hourglass_empty',  label: 'Queue Status',         path: '/queue' },
        { icon: 'calendar_month',   label: 'Find Doctors',         path: '/doctors' },
        { icon: 'how_to_reg',       label: 'Check-In / Check-Out', path: '/checkin-out', active: true  },
        { icon: 'map',              label: 'Hospital Map',         path: '#' },
    ];

    return (
        <aside className="hidden md:flex flex-col w-64 h-screen bg-white border-r border-outline-variant/30 z-20 shrink-0">
            <div className="p-6 pb-4 cursor-pointer" onClick={() => navigate('/')}>
                <img
                    alt="MediAssist AI Logo"
                    className="h-auto w-full object-contain"
                    src="https://lh3.googleusercontent.com/aida/ADBb0ujXwF6C1p4tSb8vEq_Vmwl_53J0InGaheovhXLH7KGxUAskWVzcmzRsAs4hNU6BDpnzzgqIddtDEE2uKDp7voQktbfUaXQqNCZbJy-zXfZepWAjM1L0U9AF10_W9r1H4ZajR8yZC60FtPSzwt4s6LU5DYKM4PuwSNmLqlHjnd1GpTrYwyE43IkdQkjzasfMPYu577RrcaQ7m44ZjDXHlFvqJh3bkIFwJbJEfn-rtsmpCtyZlecRtVcsOJwJGz1hb3L15Gl0yN9F_Q"
                />
            </div>
            <nav className="flex-1 flex flex-col px-3 mt-4 gap-1">
                {navItems.map(({ icon, label, path, active }) => (
                    <div
                        key={label}
                        onClick={() => path !== '#' && navigate(path)}
                        className={`flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all font-semibold text-sm cursor-pointer ${
                            active ? 'nav-item-active' : 'text-primary hover:bg-slate-50'
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
                    onClick={() => navigate('/')}
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
                <span className="text-slate-500 font-medium text-sm">Check-Out</span>
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
                {/* Patient pill — exact match to KioskAIAssistant */}
                <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-full border border-slate-100 font-headline">
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
};

// ─── Visit Summary card (left 8 cols) ────────────────────────────────────────

const TIMELINE = [
    { icon: 'login',       title: 'Check-in Completed',         detail: '08:45 AM • Main Lobby',   badge: 'Verified'  },
    { icon: 'stethoscope', title: 'Consultation with Dr. Silva', detail: '09:15 AM • Room 302',     badge: 'Closed'    },
    { icon: 'medication',  title: 'Pharmacy Collection',         detail: '10:05 AM • Ground Floor', badge: 'Picked Up' },
];

const VisitSummary = () => (
    <div className="col-span-8 bg-surface-container-lowest rounded-3xl p-7 shadow-sm border border-outline-variant/10 relative overflow-hidden flex flex-col">
        <div className="blob-top-right" />

        {/* Header row */}
        <div className="flex justify-between items-start mb-5 relative z-10">
            <div>
                <h3 className="text-xl font-bold font-headline flex items-center gap-2 text-on-surface">
                    <span className="material-symbols-outlined text-primary">receipt_long</span>
                    Visit Summary
                </h3>
            </div>
            {/* Stat chips */}
            <div className="flex gap-2">
                <span className="bg-secondary-container text-on-secondary-container text-xs font-bold px-3 py-1 rounded-full">
                    Duration: 1h 30m
                </span>
                <span className="bg-primary-fixed text-on-primary-fixed text-xs font-bold px-3 py-1 rounded-full">
                    3 Services
                </span>
            </div>
        </div>

        {/* Patient + Appointment row */}
        <div className="grid grid-cols-2 gap-6 mb-5 relative z-10">
            <div>
                <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">Patient</p>
                <p className="text-lg font-bold text-on-surface">Anura Perera</p>
            </div>
            <div>
                <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-1">Appointment</p>
                <p className="text-lg font-bold text-on-surface">General Wellness Check</p>
            </div>
        </div>

        {/* Timeline */}
        <div className="border-t border-surface-container-low pt-4 relative z-10 flex-1">
            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-3">Activity Timeline</p>
            <div className="space-y-3">
                {TIMELINE.map((item, i) => (
                    <div key={i} className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-surface-container-low rounded-2xl flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-primary text-[20px]">{item.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-on-surface">{item.title}</p>
                            <p className="text-on-surface-variant text-xs">{item.detail}</p>
                        </div>
                        <span className="text-secondary font-bold text-xs shrink-0">{item.badge}</span>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

// ─── Right column cards ───────────────────────────────────────────────────────

const DigitalReceiptCard = () => (
    <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-outline-variant/10 text-center flex flex-col gap-4">
        <div className="w-14 h-14 bg-primary-fixed rounded-2xl flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-primary text-3xl">phone_android</span>
        </div>
        <div>
            <h4 className="text-base font-bold font-headline text-on-surface mb-1">Digital Receipt</h4>
            <p className="text-on-surface-variant text-xs leading-relaxed px-2">
                Send a secure copy of your visit details to your MediAssist mobile app.
            </p>
        </div>
        <button className="receipt-btn w-full py-3 px-4 rounded-full bg-surface-container-highest text-on-primary-fixed-variant font-bold text-sm">
            Collect Digital Receipt
        </button>
    </div>
);

const NextStepsCard = () => (
    <div className="bg-primary/5 rounded-3xl p-6 border border-primary/10 flex flex-col gap-3">
        <h4 className="font-bold font-headline flex items-center gap-2 text-on-surface text-sm">
            <span className="material-symbols-outlined text-primary text-[20px]">info</span>
            Next Steps
        </h4>
        <ul className="space-y-2">
            {[
                'Lab results will be available in 24 hours.',
                'Follow-up appointment scheduled for Aug 12th.',
                'Prescription sent to your registered pharmacy.',
            ].map((step, i) => (
                <li key={i} className="flex gap-2 text-xs text-on-surface-variant">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 shrink-0" />
                    {step}
                </li>
            ))}
        </ul>
    </div>
);

// ─── Health tip banner ────────────────────────────────────────────────────────

const HealthTipBanner = () => (
    <div className="col-span-12 health-tip-banner h-36">
        <img
            alt="Modern hospital corridor with soft daylight"
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuD1W2IQ2nsF7f14iSpBLz3BlnxJ3PM1asJ1baGYox6Subqg2IVAyONRL1pPhm-gSp7dsNsPrHHE4SRrao84Bzw21H18octhNv3v3dwIT8mCbT8HPMpcxGuDeikf03a-GEmmVFbuJgO5HqtCo1ciJylcsKnQMR1uRiG-QdJFZlDYRcGYrEejFpOrV12qbFQnmmSjA7OtV8xi57cmRPvNIUe9tvRzxsRQEKJxRqPeHe0VetTfd3ySE2bjG_IFgnqHzyYrAZivrJv4cLc"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-transparent flex items-center px-10">
            <div className="text-white max-w-md">
                <p className="text-primary-fixed font-bold tracking-widest uppercase text-[10px] mb-1">Health Tip</p>
                <h3 className="text-xl font-bold italic font-headline mb-1">"Wellness is a journey, not a destination."</h3>
                <p className="text-white/80 text-xs">Remember to stay hydrated and take a short walk every hour. See you soon!</p>
            </div>
        </div>
    </div>
);

// ─── Countdown timer ──────────────────────────────────────────────────────────

const TOTAL_SECONDS = 45;

const CountdownTimer = ({ seconds }) => {
    const r  = 22;
    const circ = 2 * Math.PI * r;
    const pct  = seconds / TOTAL_SECONDS;
    const dash = circ * pct;

    return (
        <div className="countdown-ring">
            <svg width="48" height="48" viewBox="0 0 48 48">
                <circle className="track" cx="24" cy="24" r={r} />
                <circle
                    className="fill"
                    cx="24" cy="24" r={r}
                    strokeDasharray={`${dash} ${circ}`}
                />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-primary">{seconds}</span>
        </div>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

/**
 * KioskCheckOut
 * Full-screen kiosk page (1280×1024) — no scroll, no overflow.
 * Layout: [SideNav (KioskAIAssistant style) | TopBar + bento grid + CTA footer]
 */
const KioskCheckOut = () => {
    const [countdown, setCountdown] = useState(TOTAL_SECONDS);
    const [finished,  setFinished]  = useState(false);

    // Auto-close countdown
    useEffect(() => {
        if (finished) return;
        if (countdown <= 0) { setFinished(true); return; }
        const t = setTimeout(() => setCountdown((s) => s - 1), 1000);
        return () => clearTimeout(t);
    }, [countdown, finished]);

    return (
        <div className="w-screen h-screen overflow-hidden flex font-body bg-surface text-on-surface">
            {/* Left Sidebar */}
            <SideNav />

            {/* Main Canvas */}
            <main className="flex-1 flex flex-col overflow-hidden bg-surface">
                {/* Top Bar */}
                <TopBar />

                {/* Content area */}
                <div className="flex-1 overflow-hidden flex flex-col px-8 py-4 min-h-0">

                    {/* ── Hero welcome row ── */}
                    {!finished ? (
                        <>
                            <div className="flex items-center gap-5 mb-4 shrink-0">
                                {/* Icon */}
                                <div className="relative w-16 h-16 rounded-full bg-secondary-container/30 flex items-center justify-center shrink-0">
                                    <div className="absolute inset-0 rounded-full ai-pulse animate-pulse bg-secondary/10" />
                                    <span className="material-symbols-outlined text-secondary text-4xl z-10"
                                        style={{ fontVariationSettings: "'FILL' 1" }}>
                                        task_alt
                                    </span>
                                </div>
                                {/* Text */}
                                <div>
                                    <h2 className="text-3xl font-extrabold font-headline text-on-surface tracking-tight">
                                        Visit Complete
                                    </h2>
                                    <p className="text-on-surface-variant text-sm font-light">
                                        Thank you for choosing MediAssist AI. We hope your experience today was seamless.
                                    </p>
                                </div>
                            </div>

                            {/* ── Bento Grid ── */}
                            <div className="grid grid-cols-12 gap-4 flex-1 min-h-0 overflow-hidden">
                                {/* Visit Summary — 8 cols */}
                                <VisitSummary />

                                {/* Right column — 4 cols */}
                                <div className="col-span-4 flex flex-col gap-4">
                                    <DigitalReceiptCard />
                                    <NextStepsCard />
                                </div>

                                {/* Health Tip banner — 12 cols */}
                                <HealthTipBanner />
                            </div>

                            {/* ── Primary CTA footer ── */}
                            <div className="shrink-0 flex items-center justify-center gap-6 pt-3">
                                <button
                                    onClick={() => setFinished(true)}
                                    className="finish-btn editorial-gradient text-white text-lg font-bold px-12 py-4 rounded-full shadow-2xl shadow-blue-400/30 flex items-center gap-3 font-headline"
                                >
                                    Finish Session
                                    <span className="material-symbols-outlined">arrow_forward</span>
                                </button>
                                <div className="flex items-center gap-3">
                                    <CountdownTimer seconds={countdown} />
                                    <p className="text-on-surface-variant/70 text-xs font-medium">
                                        Auto-close in {countdown}s
                                    </p>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* ── Session ended confirmation ── */
                        <div className="flex-1 flex flex-col items-center justify-center gap-5">
                            <div className="w-24 h-24 rounded-full bg-secondary-container flex items-center justify-center">
                                <span className="material-symbols-outlined text-5xl text-secondary"
                                    style={{ fontVariationSettings: "'FILL' 1" }}>
                                    waving_hand
                                </span>
                            </div>
                            <div className="text-center">
                                <h2 className="font-headline text-3xl font-extrabold text-on-surface mb-2">
                                    Take Care, Anura!
                                </h2>
                                <p className="text-on-surface-variant text-base max-w-sm">
                                    Your session has been closed. This kiosk will reset for the next patient.
                                </p>
                            </div>
                            <div className="flex gap-3 mt-2">
                                <button
                                    onClick={() => { setFinished(false); setCountdown(TOTAL_SECONDS); }}
                                    className="px-8 py-3 border-2 border-primary/20 text-primary font-bold rounded-full text-sm hover:bg-primary hover:text-white transition-all"
                                >
                                    New Session
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default KioskCheckOut;
