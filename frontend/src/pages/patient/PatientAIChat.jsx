import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PatientHeader from '../../components/common/PatientHeader';
import { apiService } from '../../services/apiService';

const PatientAIChat = () => {
    const navigate = useNavigate();
    const messageListRef = useRef(null);
    const [patient, setPatient] = useState(null);
    const [messages, setMessages] = useState([
        {
            sender: 'ai',
            text: "Hello! I am your MediAssist Digital Triage Assistant. You can describe symptoms to check clinic referrals, request indoor directions, or ask about general clinic schedules. How may I assist you today?"
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const savedPatient = localStorage.getItem('activePatient');
        if (savedPatient) {
            setPatient(JSON.parse(savedPatient));
        }
    }, []);

    useEffect(() => {
        const messageList = messageListRef.current;
        if (!messageList) return;

        messageList.scrollTo({
            top: messageList.scrollHeight,
            behavior: 'smooth'
        });
    }, [messages, loading]);

    const handleSendMessage = async (textVal) => {
        const msg = textVal || inputText;
        if (!msg.trim()) return;

        // Add user message
        setMessages(prev => [...prev, { sender: 'user', text: msg }]);
        if (!textVal) setInputText('');
        setLoading(true);

        try {
            // Determine if it is a specialist recommendation request or general triage chat
            const isRec = msg.toLowerCase().includes('recommend') || msg.toLowerCase().includes('specialist') || msg.toLowerCase().includes('doctor for');
            
            let response;
            if (isRec) {
                response = await apiService.recommendSpecialist(msg);
            } else {
                response = await apiService.chatAI(msg, patient?.id || null);
            }

            const aiText = response.data || response.response || response.message || "I have compiled your details, but the response could not be parsed. Please consult booking directly.";
            
            setMessages(prev => [...prev, { sender: 'ai', text: aiText }]);
        } catch (err) {
            console.error("AI receptionist error:", err);
            setMessages(prev => [...prev, { sender: 'ai', text: "Apologies, I am experiencing temporary sync issues with the clinic triage servers. Please proceed to booking directly." }]);
        } finally {
            setLoading(false);
        }
    };

    const handleQuickTag = (tagText) => {
        handleSendMessage(tagText);
    };

    const handleClearChat = async () => {
        const initialMessages = [
            {
                sender: 'ai',
                text: "Hello! I am your MediAssist Digital Triage Assistant. You can describe symptoms to check clinic referrals, request indoor directions, or ask about general clinic schedules. How may I assist you today?"
            }
        ];
        setMessages(initialMessages);
        try {
            await apiService.clearChatAI(patient?.id || null);
        } catch (err) {
            console.error("Failed to clear chat on backend:", err);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-body text-slate-800 flex flex-col relative selection:bg-primary selection:text-white overflow-x-hidden">
            <PatientHeader />

            <main className="flex-1 min-h-0 flex flex-col relative overflow-hidden bg-white z-10">
                <div className="ambient-blob-top animate-pulse" />
                <div className="ambient-blob-bottom animate-pulse" />

                {/* Chat Body Container */}
                <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden w-full relative z-10 p-4 sm:p-6 lg:p-8 gap-4 lg:gap-8">
                
                {/* Left panel: Info & Referrals (Hidden on mobile) */}
                <aside className="hidden lg:flex flex-col w-72 bg-white rounded-[2.5rem] border border-slate-100 p-6 shrink-0 justify-between shadow-sm">
                    <div className="space-y-6">
                        <div className="space-y-2 text-left">
                            <h3 className="text-base font-black text-slate-900 font-headline">AI Reception Triage</h3>
                            <p className="text-slate-400 font-semibold text-[11px] leading-relaxed">
                                Get instant assessment directions, indoor maps assistance, and specialist recommendations.
                            </p>
                        </div>

                        <div className="border-t border-slate-100 pt-5 space-y-4 text-left">
                            <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider">Example Triage Queries</h4>
                            <div className="flex flex-col gap-2">
                                {[
                                    "Check Cardiology clinic room location",
                                    "I have chest pain and shortness of breath",
                                    "Recommend doctor for child vaccination",
                                    "General consulting hours of OPD"
                                ].map((q, idx) => (
                                    <button 
                                        key={idx}
                                        onClick={() => handleQuickTag(q)}
                                        className="text-left p-3 bg-slate-50 border border-slate-100 hover:border-primary hover:bg-primary/5 rounded-2xl text-[10px] font-bold text-slate-600 transition-all leading-normal cursor-pointer"
                                    >
                                        "{q}"
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/50 text-[10px] font-medium text-slate-400 text-left leading-relaxed">
                        <span className="font-extrabold text-slate-700 block mb-1">Disclaimer:</span>
                        AI Triage is for general informational routing only. In case of acute chest distress or serious injuries, contact emergency services directly.
                    </div>
                </aside>

                {/* Right panel: Chat canvas */}
                <div className="flex-1 min-h-0 flex flex-col bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm relative">
                    
                    {/* Chat Area Header */}
                    <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0 bg-white/80 backdrop-blur-md">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center shadow-md shadow-primary/20">
                                <span className="material-symbols-outlined text-xl">smart_toy</span>
                            </div>
                            <div className="text-left leading-none">
                                <h3 className="text-sm font-black text-slate-800 font-headline">Digital Clinic Guide</h3>
                                <span className="text-[10px] text-emerald-500 font-black uppercase tracking-wider mt-1 block flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                    Online
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-2 self-start sm:self-auto">
                            <button 
                                onClick={handleClearChat}
                                className="px-4 py-2 border border-slate-200 hover:border-red-500 hover:text-red-500 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-sm font-bold">delete_sweep</span>
                                Clear Chat
                            </button>
                            <button 
                                onClick={() => navigate('/patient/book')}
                                className="px-4 py-2 border border-slate-200 hover:border-primary hover:text-primary rounded-xl font-black text-[10px] uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-sm font-bold">calendar_month</span>
                                Book Doctor
                            </button>
                        </div>
                    </div>

                    {/* Messages Scroll Panel */}
                    <div ref={messageListRef} className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 no-scrollbar bg-slate-50/20">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                                <div className={`max-w-[88%] sm:max-w-[75%] rounded-3xl p-4.5 text-xs font-semibold leading-relaxed text-left ${
                                    m.sender === 'user'
                                    ? 'bg-primary text-white shadow-md shadow-primary/10 rounded-tr-none'
                                    : 'bg-white text-slate-700 border border-slate-100 shadow-sm rounded-tl-none space-y-2'
                                }`}>
                                    <p className="whitespace-pre-line">{m.text}</p>
                                    
                                    {m.sender === 'ai' && (m.text.toLowerCase().includes('recommend') || m.text.toLowerCase().includes('refer')) && (
                                        <div className="pt-2 border-t border-slate-100 mt-2">
                                            <button 
                                                onClick={() => navigate('/patient/book')}
                                                className="px-3.5 py-1.5 bg-primary/5 hover:bg-primary hover:text-white border border-primary/10 text-primary rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                                            >
                                                Book This Doctor Now
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex justify-start animate-pulse">
                                <div className="bg-white text-slate-400 border border-slate-100 rounded-3xl rounded-tl-none p-4 text-xs font-bold shadow-sm flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></div>
                                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></div>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">Analyzing symptoms...</span>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Chat input form */}
                    <form 
                        onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                        className="p-4 border-t border-slate-100 bg-white shrink-0"
                    >
                        <div className="flex gap-3 bg-slate-50 border border-slate-200 focus-within:border-primary rounded-2xl p-2 transition-colors">
                            <input 
                                type="text"
                                className="flex-1 px-3 bg-transparent text-sm font-bold focus:outline-none placeholder:text-slate-400"
                                placeholder="Describe symptoms or request directions..."
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                disabled={loading}
                            />
                            <button 
                                type="submit"
                                disabled={loading || !inputText.trim()}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                    inputText.trim() && !loading
                                    ? 'bg-primary text-white shadow-md shadow-primary/10'
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                }`}
                            >
                                <span className="material-symbols-outlined text-lg font-bold">send</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            </main>
        </div>
    );
};

export default PatientAIChat;
