import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../../components/common/Logo';
import { apiService } from '../../services/apiService';
import queueService from '../../services/queueService';
import './KioskCheckInOut.css';

// ─── Biometric Scanner ────────────────────────────────────────────────────────

const BiometricScanner = ({ scanning }) => (
    <div className="relative flex items-center justify-center">
        <div className={`scanner-ring-ping ${scanning ? '' : 'opacity-0'}`} />
        <div className="relative w-72 h-72 rounded-full p-3 glass-panel border border-white/40 scanner-glow flex items-center justify-center">
            {scanning && <div className="scanner-spin-border" />}
            <div className="w-full h-full rounded-full overflow-hidden relative border-4 border-white shadow-inner">
                <img
                    alt="Biometric scanner HUD"
                    className="w-full h-full object-cover opacity-80"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAWpttEUDapyh0DaaioJHUNfxNr78vLYfMve1R2IejjvC38ZjnGVxHJg1zx3-4I6FjLhW3huRHMEpswg54fxmXUsFl_1bMuZRdsESJ0P8g2fPMt0Cn6MlkNV6D5ypk7mMlfVxi4qAHEF-uB97O1VjDoj6L3nF-PSDKAvAY42MgCRHmFo0aaTXWkEvUqsW2jgiA30FplTNJbWDHavpRRS4sz8E7rMVSImUEJEfYM3mvfSMjtfG3IOekZ80DBrwLaX7mHrb3sFeqdZ5A"
                />
                {scanning && <div className="scan-line" />}
                <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent flex items-end justify-center pb-5">
                    <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary" />
                        </span>
                        <span className="text-xs font-bold text-primary">
                            {scanning ? 'System: Scanning…' : 'Ready'}
                        </span>
                    </div>
                </div>
            </div>
            <div className="corner-tl" />
            <div className="corner-tr" />
            <div className="corner-bl" />
            <div className="corner-br" />
        </div>
    </div>
);

// ─── Action Cards ─────────────────────────────────────────────────────────────

const ActionCard = ({ icon, title, subtitle, accentClass, arrowClass, onClick }) => (
    <button
        onClick={onClick}
        className={`action-card flex items-center justify-between p-6 bg-surface-container-lowest rounded-[1.75rem] shadow-[0_12px_40px_rgba(0,71,141,0.06)] text-left w-full group border border-transparent hover:border-outline-variant/20`}
    >
        <div className="flex items-center gap-5">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${accentClass}`}>
                <span className="material-symbols-outlined text-3xl">{icon}</span>
            </div>
            <div>
                <h3 className="text-base font-bold font-headline text-on-surface">{title}</h3>
                <p className="text-on-surface-variant text-sm mt-0.5">{subtitle}</p>
            </div>
        </div>
        <span className={`material-symbols-outlined text-xl transition-colors ${arrowClass}`}>arrow_forward_ios</span>
    </button>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const KioskCheckInOut = () => {
    const navigate = useNavigate();
    const [patient, setPatient] = useState(null);
    const [scanning, setScanning]   = useState(true);
    const [language, setLanguage]   = useState('en');

    useEffect(() => {
        const savedPatient = localStorage.getItem('activePatient');
        let currentPatientId = null;

        if (savedPatient) {
            const parsed = JSON.parse(savedPatient);
            setPatient(parsed);
            currentPatientId = parsed.id;
        } else {
            // Mock patient for demo if none logged in (using ID 23 which exists in DB)
            currentPatientId = 23; 
        }

        // Simulate express check-in if scanning is active
        if (scanning && currentPatientId) {
            const timer = setTimeout(() => {
                handleExpressCheckIn(currentPatientId);
            }, 5000); // 5 seconds scan simulation for better UX
            return () => clearTimeout(timer);
        }
    }, [scanning]);

    const handleExpressCheckIn = async (patientId) => {
        try {
            const result = await queueService.checkIn(patientId);
            if (result.success) {
                // Success message or notification could be added here
                console.log('Express Check-In Successful:', result);
                // Optionally navigate to queue or show persistent success state
                // For now, we keep it simple as per instructions (don't change UI)
                if (result.message !== "Already checked in.") {
                    alert(`Check-In Successful!\nQueue Number: A-${result.queue_number.toString().padStart(2, '0')}\nEst. Wait: ${result.estimated_wait_time} mins`);
                }
                setScanning(false);
            }
        } catch (err) {
            console.error('Express Check-In Failed:', err);
            // alert(err.error || 'Express check-in failed.');
        }
    };

    const langs = [
        { code: 'si', label: 'සිංහල' },
        { code: 'ta', label: 'தமிழ்' },
        { code: 'en', label: 'English' },
    ];

    const patientName = patient ? (patient.full_name || patient.name || 'Patient') : 'Guest Visitor';

    return (
        <div className="w-screen h-screen overflow-hidden flex font-body bg-surface text-on-surface">
            {/* ── Left Sidebar ── */}
            <aside className="hidden md:flex flex-col w-64 h-screen bg-white border-r border-outline-variant/30 z-20 shrink-0">
                <div className="p-6 pb-4 cursor-pointer" onClick={() => navigate('/')}>
                    <Logo size="sm" className="w-full" />
                </div>
                <nav className="flex-1 flex flex-col px-3 mt-4 gap-1">
                    {[
                        { icon: 'account_circle',   label: 'Personal Dashboard',   path: '/patient-dashboard' },
                        { icon: 'smart_toy',        label: 'AI Assistant',         path: '/assistant' },
                        { icon: 'hourglass_empty',  label: 'Queue Status',         path: '/queue' },
                        { icon: 'calendar_month',   label: 'Find Doctors',         path: '/doctors' },
                        { icon: 'how_to_reg',       label: 'Check-In / Check-Out', path: '/checkin-out', active: true  },
                        { icon: 'map',              label: 'Hospital Map',         path: '#' },
                    ].map(({ icon, label, path, active }) => (
                        <div
                            key={label}
                            onClick={() => path !== '#' && navigate(path)}
                            className={`flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all font-semibold text-sm cursor-pointer ${
                                active ? 'nav-item-active' : 'text-primary hover:bg-slate-50'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[22px]" style={active ? { fontVariationSettings: "'FILL' 1" } : {}}>{icon}</span>
                            <span>{label}</span>
                        </div>
                    ))}
                </nav>
                <div className="px-4 pb-5 mt-auto">
                    <div className="p-5 bg-slate-50 rounded-xl border border-dashed border-outline-variant/40 text-center mb-4">
                        <span className="material-symbols-outlined text-primary text-2xl mb-2 block">support_agent</span>
                        <p className="text-xs font-bold text-primary mb-3">Need Assistance?</p>
                        <button className="w-full py-2.5 bg-primary text-white rounded-lg font-bold text-xs shadow-sm hover:opacity-90 transition-opacity" onClick={() => navigate('/assistant')}>Call for Help</button>
                    </div>
                    <button 
                        onClick={() => { localStorage.removeItem('activePatient'); navigate('/'); }}
                        className="flex items-center gap-4 px-5 py-3.5 w-full text-red-600 hover:bg-red-50 rounded-xl transition-all border-t border-slate-100 pt-4"
                    >
                        <span className="material-symbols-outlined">logout</span>
                        <span className="font-bold text-sm">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* ── Main Canvas ── */}
            <main className="flex-1 flex flex-col relative overflow-hidden bg-surface-container-low">
                <div className="ambient-blob-top" />
                <div className="ambient-blob-bottom" />

                <header className="flex justify-between items-center w-full px-10 h-16 bg-white border-b border-outline-variant/20 z-30 shrink-0">
                    <div className="flex items-center gap-3">
                        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 transition-colors" onClick={() => navigate(-1)}>
                            <span className="material-symbols-outlined text-slate-600">arrow_back</span>
                        </button>
                        <h1 className="text-xl font-extrabold tracking-tight text-primary font-headline">MediAssist AI</h1>
                        <div className="h-4 w-px bg-outline-variant mx-1" />
                        <span className="text-slate-500 font-medium text-sm">Check-In / Check-Out</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex gap-3">
                            <span className="material-symbols-outlined text-slate-400 hover:text-primary cursor-pointer transition-colors" onClick={() => navigate('/assistant')}>notifications</span>
                            <span className="material-symbols-outlined text-slate-400 hover:text-primary cursor-pointer transition-colors" onClick={() => navigate('/assistant')}>help</span>
                        </div>
                        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-full border border-slate-100 font-headline">
                            <div className="text-right">
                                <p className="text-sm font-bold text-on-surface leading-none">{patientName}</p>
                                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">{patient ? 'Patient' : 'Visitor'}</p>
                            </div>
                            <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-white">
                                {patientName.charAt(0)}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-hidden flex flex-col items-center justify-center px-8 py-4 z-10 gap-6">
                    <div className="text-center space-y-1">
                        <h2 className="text-4xl font-extrabold font-headline text-on-surface tracking-tight">Express Check-In</h2>
                        <p className="text-on-surface-variant text-base font-light max-w-lg mx-auto">Stand within the highlighted zone for biometric authentication. Our AI will recognise you instantly.</p>
                    </div>

                    <BiometricScanner scanning={scanning} />

                    <button onClick={() => setScanning((s) => !s)} className="text-xs text-outline hover:text-primary transition-colors font-semibold tracking-wide">
                        {scanning ? '⏸ Pause scan preview' : '▶ Resume scan preview'}
                    </button>

                    <div className="grid grid-cols-2 gap-5 w-full max-w-3xl">
                        <ActionCard onClick={() => navigate('/manual-checkin')} icon="fingerprint" title="Manual Check-In" subtitle="Use NIC or Phone Number" accentClass="bg-blue-100 text-primary group-hover:bg-primary group-hover:text-white" arrowClass="text-slate-300 group-hover:text-primary" />
                        <ActionCard onClick={() => navigate('/checkout')} icon="logout" title="Check-Out" subtitle="End session & collect receipt" accentClass="bg-secondary-container text-secondary group-hover:bg-secondary group-hover:text-white" arrowClass="text-slate-300 group-hover:text-secondary" />
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-slate-400">Preferred language?</span>
                        <div className="flex gap-2">
                            {langs.map((l) => (
                                <button key={l.code} onClick={() => setLanguage(l.code)} className={`lang-btn px-4 py-1.5 rounded-full border text-sm font-semibold transition-all ${language === l.code ? 'active' : 'border-slate-200 text-on-surface'}`}>{l.label}</button>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            <div className="ai-bubble-float">
                <div className="ai-speech-bubble"><p className="text-sm font-medium text-primary">"I'm here if you need help finding your appointment details."</p></div>
                <div className="ai-circle" onClick={() => navigate('/assistant')}><span className="material-symbols-outlined text-3xl z-10 relative" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span></div>
            </div>
        </div>
    );
};

export default KioskCheckInOut;
