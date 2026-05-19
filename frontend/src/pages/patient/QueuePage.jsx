import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../../components/common/Logo';
import PatientHeader from '../../components/common/PatientHeader';
import { apiService } from '../../services/apiService';

const QueuePage = () => {
    const navigate = useNavigate();
    const [patient, setPatient] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [myQueue, setMyQueue] = useState(null);
    const [allQueues, setAllQueues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('board'); // 'my-ticket' | 'board'

    useEffect(() => {
        const savedPatient = localStorage.getItem('activePatient');
        if (!savedPatient) {
            navigate('/patient/login', { state: { redirectTo: '/patient/queue' } });
            return;
        }
        const parsed = JSON.parse(savedPatient);
        setPatient(parsed);
        setActiveTab('my-ticket'); // Default to my-ticket if logged in
        fetchQueueStatus(parsed.id);
    }, [navigate]);

    const fetchQueueStatus = async (patientId) => {
        setLoading(true);
        try {
            // 1. Fetch general hospital active queues status
            const boardData = await apiService.getQueueStatus();
            if (boardData) setAllQueues(boardData);

            // 2. Fetch personal queue if logged in
            if (patientId) {
                const myData = await apiService.getPatientQueueStatus(patientId);
                if (myData) {
                    setMyQueue(myData);
                } else {
                    setMyQueue(null);
                }
            }
        } catch (err) {
            console.error("Failed to load real-time queue boards:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        fetchQueueStatus(patient?.id || null);
    };

    if (!patient) return null;

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-body text-slate-800 flex flex-col relative selection:bg-primary selection:text-white overflow-x-hidden">
            {/* Ambient Background Glowing Blurs */}
            <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-gradient-to-tr from-primary/10 to-blue-400/5 rounded-full blur-[120px] pointer-events-none z-0" />
            <div className="absolute bottom-[5%] left-[-5%] w-[55vw] h-[55vw] bg-gradient-to-tr from-[#87AFB7]/10 to-cyan-400/5 rounded-full blur-[160px] pointer-events-none z-0" />

            <PatientHeader />

            <main className="z-10 flex flex-col flex-grow">
                <div className="max-w-4xl mx-auto w-full px-4 py-10 sm:px-6 lg:px-8 space-y-8 animate-fade-in text-left">
                
                {/* Header overview */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/60 pb-6">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 font-headline leading-none">Live Queue tracker</h1>
                        <p className="text-slate-400 font-bold text-xs mt-1.5">Track on-duty specialist clinic sessions and waiting statistics remotely.</p>
                    </div>

                    <button 
                        onClick={handleRefresh}
                        className="px-5 py-2.5 bg-white border border-slate-200 hover:border-primary hover:text-primary rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-1.5 shadow-sm shrink-0"
                    >
                        <span className="material-symbols-outlined text-base font-bold animate-spin-slow">sync</span>
                        Refresh Board
                    </button>
                </div>

                {/* TAB SWITCHER */}
                {patient && (
                    <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl max-w-sm">
                        <button
                            onClick={() => setActiveTab('my-ticket')}
                            className={`flex-1 py-3 text-center rounded-xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer ${
                                activeTab === 'my-ticket' 
                                ? 'bg-primary text-white shadow-sm' 
                                : 'text-slate-500 hover:bg-slate-50/50'
                            }`}
                        >
                            My Clinic Ticket
                        </button>
                        <button
                            onClick={() => setActiveTab('board')}
                            className={`flex-1 py-3 text-center rounded-xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer ${
                                activeTab === 'board' 
                                ? 'bg-primary text-white shadow-sm' 
                                : 'text-slate-500 hover:bg-slate-50/50'
                            }`}
                        >
                            All Active Clinics
                        </button>
                    </div>
                )}

                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center space-y-3">
                        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                        <p className="text-slate-400 font-black text-xs uppercase tracking-wider">Syncing hospital mainframes...</p>
                    </div>
                ) : (
                    <div className="animate-fade-in">
                        
                        {/* MY TICKET TAB */}
                        {activeTab === 'my-ticket' && (
                            <div className="space-y-6">
                                {myQueue ? (
                                    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl max-w-2xl mx-auto relative overflow-hidden space-y-8">
                                        <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-2xl -mr-12 -mt-12 pointer-events-none" />

                                        {/* Status Header */}
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-100">
                                            <div>
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100/50 mb-2">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                                    Checked-In & Verified
                                                </div>
                                                <h2 className="text-xl font-black text-slate-900 font-headline leading-tight">Dr. {myQueue.doctor_name || myQueue.specialist_name}</h2>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Room {myQueue.room_number || 'OPD 03'}</p>
                                            </div>

                                            <div className="w-24 h-24 bg-emerald-500 text-white rounded-3xl flex flex-col items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
                                                <p className="text-[10px] font-black uppercase tracking-widest leading-none">Token</p>
                                                <p className="text-4xl font-black mt-1 leading-none">{myQueue.token_number || myQueue.token}</p>
                                            </div>
                                        </div>

                                        {/* Realtime progression visualization */}
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center text-xs font-black text-slate-800">
                                                <span>Queue Progression</span>
                                                <span className="text-emerald-600">~{myQueue.estimated_wait_time || '15'} mins wait remaining</span>
                                            </div>
                                            
                                            {/* Progress steps bar */}
                                            <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-emerald-500 rounded-full animate-pulse" style={{ width: `${Math.max(10, 100 - (parseInt(myQueue.position_in_queue || 3) * 20))}%` }}></div>
                                            </div>

                                            <div className="grid grid-cols-3 text-center text-[10px] font-bold text-slate-400">
                                                <div className="text-left">Checked In</div>
                                                <div>Serving #{myQueue.serving_token_number || (parseInt(myQueue.token_number || 8) - parseInt(myQueue.position_in_queue || 3))}</div>
                                                <div className="text-right">Your Slot (#{myQueue.token_number || '08'})</div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                            <div>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Position in line</span>
                                                <p className="text-lg font-black text-slate-800 mt-1">{myQueue.position_in_queue || '3'} patients ahead</p>
                                            </div>
                                            <div>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Department Clinic</span>
                                                <p className="text-lg font-black text-slate-800 mt-1">{myQueue.department_name || myQueue.specialization || 'Outpatient Department'}</p>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-emerald-50/50 border border-dashed border-emerald-200 text-xs font-bold text-emerald-800 rounded-2xl leading-relaxed flex gap-3">
                                            <span className="material-symbols-outlined text-lg font-bold shrink-0">notifications_active</span>
                                            <p>A WhatsApp / email reminder will be sent to your phone as soon as your token reaches the next 2 positions. Please stay close to the Room.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-[2.5rem] p-16 border border-slate-100 text-center space-y-4 max-w-2xl mx-auto shadow-sm">
                                        <span className="material-symbols-outlined text-slate-300 text-6xl">hourglass_empty</span>
                                        <h3 className="text-lg font-black text-slate-800 font-headline leading-none">No active ticket found today</h3>
                                        <p className="text-slate-400 font-bold text-xs max-w-sm mx-auto leading-relaxed">
                                            If you have a scheduled appointment, please check-in using your dashboard or visit the hospital registration desk.
                                        </p>
                                        <button 
                                            onClick={() => navigate('/patient/dashboard')}
                                            className="px-6 py-2.5 bg-primary/5 hover:bg-primary hover:text-white text-primary border border-primary/10 rounded-full font-black text-xs uppercase tracking-widest transition-all"
                                        >
                                            Check-In at Dashboard
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* active CLINIC BOARD TAB */}
                        {activeTab === 'board' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-black text-slate-900 font-headline leading-none">Central Clinic Board</h2>
                                
                                {allQueues.length === 0 ? (
                                    <div className="bg-white rounded-[2.5rem] p-16 border border-slate-100 text-center space-y-4">
                                        <span className="material-symbols-outlined text-slate-300 text-6xl">clinical_notes</span>
                                        <p className="text-slate-400 font-bold text-sm">No clinic sessions are currently active.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {allQueues.map((q, idx) => (
                                            <div key={idx} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
                                                
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-start">
                                                        <div className="space-y-1 text-left">
                                                            <span className="inline-flex px-2 py-0.5 bg-primary/5 rounded text-[8px] font-black text-primary uppercase tracking-widest">
                                                                {q.department || q.specialization || 'OPD'}
                                                            </span>
                                                            <h3 className="text-base font-black text-slate-800 font-headline leading-tight">Dr. {q.doctor_name || q.specialist_name}</h3>
                                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Room: {q.room_number || '03'}</p>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4.5">
                                                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100/50 text-center">
                                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Now Serving</span>
                                                            <p className="text-2xl font-black text-slate-800 mt-0.5">{q.serving_token_number || q.serving_token || '00'}</p>
                                                        </div>
                                                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100/50 text-center">
                                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Patients Waiting</span>
                                                            <p className="text-2xl font-black text-primary mt-0.5">{q.waiting_count || q.waiting || '0'}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="pt-4 border-t border-slate-100 mt-4 flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
                                                    <span className="text-slate-400">Estimated Delay</span>
                                                    <span className="text-emerald-600 font-black">~{q.estimated_wait_time || (parseInt(q.waiting_count || 0) * 5) || '15'} mins</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                )}
                </div>
            </main>
        </div>
    );
};

export default QueuePage;
