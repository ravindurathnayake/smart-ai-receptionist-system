import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './KioskManualCheckIn.css';

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
                <span className="text-slate-500 font-medium text-sm">Manual Check-In</span>
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

// ─── Form field component ─────────────────────────────────────────────────────

const FormField = ({ id, label, icon, type = 'text', placeholder, value, onChange }) => (
    <div className="space-y-2">
        <label htmlFor={id} className="block font-headline font-bold text-on-surface text-sm ml-1">
            {label}
        </label>
        <div className="relative">
            <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-primary text-[22px]">
                {icon}
            </span>
            <input
                id={id}
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className="form-input w-full pl-14 pr-6 py-4 bg-surface-container-low border-none rounded-2xl text-base font-medium transition-all placeholder:text-slate-400 focus:bg-white"
            />
        </div>
    </div>
);

// ─── Step indicator ───────────────────────────────────────────────────────────

const StepIndicator = ({ current = 0, total = 3 }) => (
    <div className="flex items-center gap-2 justify-center">
        {Array.from({ length: total }).map((_, i) => (
            <div key={i} className={`step-dot ${i === current ? 'active' : ''}`} />
        ))}
    </div>
);

// ─── QR FAB ──────────────────────────────────────────────────────────────────

const QRFab = () => (
    <button className="qr-fab" aria-label="Scan QR Code">
        <span className="material-symbols-outlined text-4xl">qr_code_scanner</span>
        <span className="text-[10px] font-bold uppercase tracking-widest">Scan QR</span>
    </button>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

/**
 * KioskManualCheckIn
 * Full-screen kiosk page (1280×1024) — no scroll, no overflow.
 * Layout: [SideNav (KioskAIAssistant style) | TopBar + form card + assistance banner + footer]
 */
const KioskManualCheckIn = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', phone: '', nic: '' });
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (field) => (e) =>
        setForm((prev) => ({ ...prev, [field]: e.target.value }));

    const isValid = form.name.trim() && (form.phone.trim() || form.nic.trim());

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isValid) setSubmitted(true);
    };

    return (
        <div className="w-screen h-screen overflow-hidden flex font-body bg-surface text-on-surface">
            {/* Left Sidebar */}
            <SideNav />

            {/* Main Canvas */}
            <main className="flex-1 flex flex-col overflow-hidden relative bg-surface">
                {/* AI ambient blobs */}
                <div className="ai-pulse-blob" style={{ top: '10%', right: '5%' }} />
                <div className="ai-pulse-blob" style={{ bottom: '20%', left: '10%', opacity: 0.5 }} />

                {/* Top Bar */}
                <TopBar />

                {/* Content — flex-col, no overflow */}
                <div className="flex-1 overflow-hidden flex flex-col px-10 py-5 z-10">

                    {/* ── Page heading + step dots ── */}
                    <div className="text-center mb-5 shrink-0">
                        <h2 className="font-headline text-3xl font-black text-on-surface tracking-tight mb-1">
                            Manual Check-In
                        </h2>
                        <p className="text-on-surface-variant text-sm mb-3">
                            Please enter your details to verify your appointment.
                        </p>
                        <StepIndicator current={0} total={3} />
                    </div>

                    {/* ── Form card ── */}
                    <div className="flex-1 flex flex-col min-h-0 max-w-3xl w-full mx-auto">

                        {submitted ? (
                            /* ── Success state ── */
                            <div className="glass-card flex-1 rounded-3xl p-8 border border-white/40 shadow-xl flex flex-col items-center justify-center text-center gap-4">
                                <div className="w-20 h-20 rounded-full bg-secondary-container flex items-center justify-center">
                                    <span className="material-symbols-outlined text-4xl text-secondary"
                                        style={{ fontVariationSettings: "'FILL' 1" }}>
                                        check_circle
                                    </span>
                                </div>
                                <h3 className="font-headline text-2xl font-extrabold text-on-surface">Verified Successfully!</h3>
                                <p className="text-on-surface-variant text-base max-w-sm">
                                    Welcome, <strong>{form.name}</strong>. Your appointment has been confirmed.
                                    Please proceed to the waiting area.
                                </p>
                                <div className="flex items-center gap-3 bg-surface-container-low px-6 py-3 rounded-2xl mt-2">
                                    <span className="material-symbols-outlined text-primary">confirmation_number</span>
                                    <span className="font-bold text-on-surface text-sm">Token #B-042 • Counter 3</span>
                                </div>
                                <div className="flex gap-4 mt-4">
                                    <button
                                        onClick={() => { setSubmitted(false); setForm({ name: '', phone: '', nic: '' }); }}
                                        className="text-primary text-sm font-semibold hover:underline"
                                    >
                                        Start over
                                    </button>
                                    <button
                                        onClick={() => navigate('/queue')}
                                        className="bg-primary text-white px-6 py-2 rounded-full text-sm font-bold shadow-md"
                                    >
                                        View Queue Status
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* ── Input form ── */
                            <form onSubmit={handleSubmit} className="glass-card flex-1 rounded-3xl p-8 border border-white/40 shadow-[0_20px_50px_rgba(0,71,141,0.04)] flex flex-col gap-5">

                                {/* Full Name */}
                                <FormField
                                    id="full_name"
                                    label="Full Name"
                                    icon="person"
                                    placeholder="As it appears on your ID"
                                    value={form.name}
                                    onChange={handleChange('name')}
                                />

                                {/* Phone + NIC grid */}
                                <div className="grid grid-cols-2 gap-5">
                                    <FormField
                                        id="phone"
                                        label="Phone Number"
                                        icon="phone"
                                        type="tel"
                                        placeholder="07x xxx xxxx"
                                        value={form.phone}
                                        onChange={handleChange('phone')}
                                    />
                                    <FormField
                                        id="nic"
                                        label="National Identity Card (NIC)"
                                        icon="badge"
                                        placeholder="e.g. 199012345678"
                                        value={form.nic}
                                        onChange={handleChange('nic')}
                                    />
                                </div>

                                {/* Info note */}
                                <div className="flex items-start gap-3 p-4 bg-surface-container rounded-2xl shrink-0">
                                    <span className="material-symbols-outlined text-primary text-xl mt-0.5">info</span>
                                    <p className="text-xs text-on-surface-variant leading-relaxed">
                                        By clicking continue, you agree that the information provided will be used solely
                                        for identification and clinic management purposes during your visit today.
                                    </p>
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={!isValid}
                                    className={`submit-btn w-full py-4 rounded-full text-xl font-bold flex items-center justify-center gap-3 shadow-xl shrink-0 ${
                                        isValid
                                            ? 'bg-gradient-to-r from-primary to-primary-container text-white'
                                            : 'bg-surface-container-highest text-outline cursor-not-allowed'
                                    }`}
                                >
                                    <span>Continue to Verification</span>
                                    <span className="material-symbols-outlined text-2xl">arrow_forward</span>
                                </button>
                            </form>
                        )}

                        {/* ── Assistance banner ── */}
                        {!submitted && (
                            <div className="shrink-0 flex items-center justify-between p-5 mt-4 bg-surface-container-lowest rounded-2xl shadow-sm border border-slate-100">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-on-secondary-container text-2xl">
                                            support_agent
                                        </span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-on-surface">Need help with the form?</h4>
                                        <p className="text-on-surface-variant text-xs">Tap for instant AI assistance or speak to a receptionist.</p>
                                    </div>
                                </div>
                                <button className="assist-btn px-6 py-3 border-2 border-primary/20 text-primary font-bold rounded-full text-sm" onClick={() => navigate('/assistant')}>
                                    Get Assistance
                                </button>
                            </div>
                        )}
                    </div>

                    {/* ── Footer ── */}
                    <div className="shrink-0 flex justify-between items-center pt-3 mt-2 border-t border-slate-100">
                        <p className="text-xs text-slate-400">© 2024 MediAssist AI. All rights reserved.</p>
                        <div className="flex gap-5">
                            <a href="#" className="text-xs text-slate-500 hover:text-primary font-medium transition-colors">Privacy Policy</a>
                            <a href="#" className="text-xs text-slate-500 hover:text-primary font-medium transition-colors">Terms of Use</a>
                        </div>
                    </div>
                </div>
            </main>

            {/* ── QR Code FAB ── */}
            <QRFab />
        </div>
    );
};


export default KioskManualCheckIn;
