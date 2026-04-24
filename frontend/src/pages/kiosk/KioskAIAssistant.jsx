import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../../components/common/Logo';
import { apiService } from '../../services/apiService';
import './KioskAIAssistant.css';

// ─── Sub-components ──────────────────────────────────────────────────────────

/** AI response / chat bubble panel */
const AIChatPanel = ({ inputValue, setInputValue, chatHistory, onSend, isTyping }) => {
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
                        <p className="text-green-600 text-xs font-bold tracking-wide uppercase">
                            {isTyping ? 'Thinking…' : 'Listening…'}
                        </p>
                    </div>
                </div>
            </div>

            {/* AI message bubble */}
            <div className="relative z-10 space-y-5 max-h-[300px] overflow-y-auto no-scrollbar mb-4">
                {chatHistory.map((chat, idx) => (
                    <div 
                        key={idx} 
                        className={`rounded-2xl px-7 py-5 text-lg leading-relaxed font-medium border border-slate-100/50 ${
                            chat.role === 'user' 
                                ? 'bg-primary/5 ml-auto max-w-[80%] text-on-surface' 
                                : 'bg-white/60 mr-auto max-w-[90%] text-on-surface'
                        }`}
                    >
                        "{chat.text}"
                    </div>
                ))}
                {isTyping && (
                    <div className="bg-white/60 mr-auto max-w-[90%] rounded-2xl px-7 py-5 border border-slate-100/50">
                        <div className="flex gap-1">
                            <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce delay-100" />
                            <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce delay-200" />
                        </div>
                    </div>
                )}
            </div>

            {/* Quick suggestion chips */}
            <div className="flex flex-wrap gap-2.5 mb-7">
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

            {/* Input area */}
            <div className="relative z-10">
                <form 
                    onSubmit={(e) => { e.preventDefault(); onSend(); }}
                    className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-100 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/10 transition-all"
                >
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
                    <button 
                        type="submit"
                        disabled={!inputValue.trim() || isTyping}
                        className="bg-primary text-white w-11 h-11 flex items-center justify-center rounded-xl shadow-md hover:opacity-90 transition-opacity flex-shrink-0 disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined">send</span>
                    </button>
                </form>
            </div>
        </div>
    );
};

// ─── Main Page Component ──────────────────────────────────────────────────────

const KioskAIAssistant = () => {
    const navigate = useNavigate();
    const [inputValue, setInputValue] = useState('');
    const [patient, setPatient] = useState(null);
    const [chatHistory, setChatHistory] = useState([]);
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        const savedPatient = localStorage.getItem('activePatient');
        if (!savedPatient) {
            navigate('/patient-login');
            return;
        }
        const parsed = JSON.parse(savedPatient);
        const patientName = parsed.full_name || parsed.name || 'Patient';
        setPatient(parsed);
        setChatHistory([
            { role: 'bot', text: `I've recognized you, ${patientName.split(' ')[0]}. I've retrieved your medical profile. How can I assist you with your health today?` }
        ]);
    }, [navigate]);

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const userMessage = inputValue.trim();
        setChatHistory(prev => [...prev, { role: 'user', text: userMessage }]);
        setInputValue('');
        setIsTyping(true);

        try {
            const response = await apiService.chatAI(userMessage);
            setChatHistory(prev => [...prev, { role: 'bot', text: response.reply || response.message || "I'm sorry, I couldn't process that." }]);
        } catch (err) {
            console.error('AI Chat Error:', err);
            setChatHistory(prev => [...prev, { role: 'bot', text: "Error connecting to AI service. Please try again." }]);
        } finally {
            setIsTyping(false);
        }
    };

    if (!patient) return null;

    const patientName = patient.full_name || patient.name || 'Patient';

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
                        { icon: 'smart_toy',        label: 'AI Assistant',         path: '/assistant', active: true  },
                        { icon: 'hourglass_empty',  label: 'Queue Status',         path: '/queue' },
                        { icon: 'calendar_month',   label: 'Find Doctors',         path: '/doctors' },
                        { icon: 'how_to_reg',       label: 'Check-In / Check-Out', path: '/checkin-out' },
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
                        <button className="w-full py-2.5 bg-primary text-white rounded-lg font-bold text-xs shadow-sm hover:opacity-90 transition-opacity">Call for Help</button>
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
            <main className="flex-1 flex flex-col relative overflow-hidden bg-white">
                <div className="ambient-blob-top" />
                <div className="ambient-blob-bottom" />

                {/* Top Bar */}
                <header className="flex justify-between items-center w-full px-10 h-16 bg-white border-b border-outline-variant/20 z-30 shrink-0">
                    <div className="flex items-center gap-3">
                        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 transition-colors" onClick={() => navigate(-1)}>
                            <span className="material-symbols-outlined text-slate-600">arrow_back</span>
                        </button>
                        <h1 className="text-xl font-extrabold tracking-tight text-primary font-headline">MediAssist AI</h1>
                        <div className="h-4 w-px bg-outline-variant mx-1" />
                        <span className="text-slate-500 font-medium text-sm">AI Assistant</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex gap-3">
                            <span className="material-symbols-outlined text-slate-400 hover:text-primary cursor-pointer transition-colors">notifications</span>
                            <span className="material-symbols-outlined text-slate-400 hover:text-primary cursor-pointer transition-colors">help</span>
                        </div>
                        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                            <div className="text-right">
                                <p className="text-sm font-bold text-on-surface leading-none">{patientName}</p>
                                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Patient</p>
                            </div>
                            <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-white">
                                {patientName.charAt(0)}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-hidden flex flex-col items-center justify-center px-10 py-6 z-10 no-scrollbar relative">
                    <div className="w-full max-w-4xl text-center space-y-2 mb-7">
                        <h2 className="text-[2.6rem] font-extrabold tracking-tight text-on-surface leading-tight font-headline">
                            Welcome back, <span className="text-primary">{patientName}</span>!
                        </h2>
                        <p className="text-base text-slate-500 font-medium">We're glad to see you at Colombo General Medical Center today.</p>
                    </div>

                    <div className="w-full max-w-4xl">
                        <AIChatPanel 
                            inputValue={inputValue} 
                            setInputValue={setInputValue} 
                            chatHistory={chatHistory}
                            onSend={handleSend}
                            isTyping={isTyping}
                        />
                    </div>
                    <p className="mt-5 text-slate-400 text-xs font-semibold tracking-wide text-center">Hospital Kiosk #42 • Colombo General Medical Center</p>
                </div>
            </main>
        </div>
    );
};

export default KioskAIAssistant;
