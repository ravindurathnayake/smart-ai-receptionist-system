import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../../components/common/Logo';
import { apiService } from '../../services/apiService';
import { socketService } from '../../services/socketService';
import './PatientDashboard.css';

// ─── Sub-components ──────────────────────────────────────────────────────────

/** SideNav — EXACT match to KioskSearchDoctors style */
const SideNav = () => {
    const navigate = useNavigate();
    const navItems = [
        { icon: 'account_circle',   label: 'Personal Dashboard',   path: '/patient-dashboard', active: true },
        { icon: 'smart_toy',        label: 'AI Assistant',         path: '/assistant' },
        { icon: 'hourglass_empty',  label: 'Queue Status',         path: '/queue' },
        { icon: 'calendar_month',   label: 'Find Doctors',         path: '/doctors' },
        { icon: 'how_to_reg',       label: 'Check-In / Check-Out', path: '/checkin-out' },
        { icon: 'map',              label: 'Hospital Map',         path: '#' },
    ];

    const handleSignOut = () => {
        localStorage.removeItem('activePatient');
        navigate('/');
    };

    return (
        <aside className="hidden md:flex flex-col w-64 h-screen bg-white border-r border-outline-variant/30 z-20 shrink-0">
            {/* Logo */}
            <div className="p-6 pb-4 cursor-pointer" onClick={() => navigate('/')}>
                <Logo size="sm" className="w-full" />
            </div>

            {/* Nav links */}
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

            {/* Bottom panel */}
            <div className="px-4 pb-5 mt-auto">
                <div className="p-5 bg-slate-50 rounded-xl border border-dashed border-outline-variant/40 text-center mb-4">
                    <span className="material-symbols-outlined text-primary text-2xl mb-2 block">support_agent</span>
                    <p className="text-xs font-bold text-primary mb-3">Need Assistance?</p>
                    <button className="w-full py-2.5 bg-primary text-white rounded-lg font-bold text-xs shadow-sm hover:opacity-90 transition-opacity" onClick={() => navigate('/assistant')}>
                        Call for Help
                    </button>
                </div>
                <button 
                    onClick={handleSignOut}
                    className="flex items-center gap-4 px-5 py-3.5 w-full text-red-600 hover:bg-red-50 rounded-xl transition-all border-t border-slate-100 pt-4"
                >
                    <span className="material-symbols-outlined">logout</span>
                    <span className="font-bold text-sm">Sign Out</span>
                </button>
            </div>
        </aside>
    );
};

/** TopBar — matching other kiosk pages */
const TopBar = ({ patientName, onSignOut }) => {
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
                <span className="text-slate-500 font-medium text-sm">Personal Dashboard</span>
            </div>
            <div className="flex items-center gap-6">
                <div className="flex gap-4">
                    <button onClick={() => window.print()} className="p-2.5 text-slate-400 hover:text-primary rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 font-bold text-xs">
                        <span className="material-symbols-outlined text-xl">print</span>
                        PRINT
                    </button>
                    <button onClick={onSignOut} className="p-2.5 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-all flex items-center gap-2 font-bold text-xs">
                        <span className="material-symbols-outlined text-xl">logout</span>
                        LOG OUT
                    </button>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                    <div className="text-right">
                        <p className="text-sm font-bold text-on-surface leading-none">{patientName || 'Patient'}</p>
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Patient</p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-white">
                        {patientName ? patientName.charAt(0) : 'P'}
                    </div>
                </div>
            </div>
        </header>
    );
};

// ─── Main Component ─────────────────────────────────────────────────────────

const PatientDashboard = () => {
    const navigate = useNavigate();
    const [patient, setPatient] = useState(null);
    const [history, setHistory] = useState([]);
    const [queue, setQueue] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedPatient = localStorage.getItem('activePatient');
        if (!savedPatient) {
            navigate('/patient-login');
            return;
        }
        
        const parsedPatient = JSON.parse(savedPatient);
        // Normalize name field
        parsedPatient.full_name = parsedPatient.full_name || parsedPatient.name;
        setPatient(parsedPatient);

        // Fetch patient history and queue status
        const fetchData = async () => {
            try {
                const historyData = await apiService.getPatientHistory(parsedPatient.id);
                setHistory(historyData?.appointments || []);
                
                const queueData = await apiService.getPatientQueueStatus(parsedPatient.id);
                setQueue(queueData);
            } catch (err) {
                console.error("Error fetching data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();

        // REAL-TIME UPDATES
        socketService.connect();
        socketService.on('queue_updated', fetchData);

        return () => {
            socketService.off('queue_updated', fetchData);
        };
    }, [navigate]);

    const calculateAge = (dobString) => {
        if (!dobString) return 0;
        const today = new Date();
        const birthDate = new Date(dobString);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const isMinor = patient ? calculateAge(patient.dob || patient.date_of_birth) < 18 : false;

    if (!patient) return null;

    return (
        <div className="w-screen h-screen overflow-hidden flex font-body bg-slate-50 text-on-surface dashboard-container">
            <SideNav />

            <main className="flex-1 flex flex-col relative overflow-hidden bg-white">
                <TopBar 
                    patientName={patient.full_name} 
                    onSignOut={() => { localStorage.removeItem('activePatient'); navigate('/'); }} 
                />

                {/* Ambient blobs like other kiosk pages */}
                <div className="ambient-blob-top" />
                <div className="ambient-blob-bottom" />

                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar z-10 relative">
                    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
                        
                        {/* Profile Overview Card */}
                        <div className="grid grid-cols-12 gap-6">
                            <div className="col-span-8 glass-card rounded-[2.5rem] p-8 shadow-lg relative overflow-hidden border border-white">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 blur-[60px] rounded-full -mr-16 -mt-16"></div>
                                
                                <div className="relative z-10 flex items-start gap-8">
                                    <div className="w-24 h-24 rounded-3xl profile-gradient flex items-center justify-center text-white text-4xl font-black shadow-xl border-4 border-white">
                                        {patient.full_name.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h2 className="text-3xl font-black text-on-surface font-headline tracking-tight">{patient.full_name}</h2>
                                                <p className="text-slate-500 font-bold mt-1">Patient ID: <span className="text-primary">PAT-{patient.id.toString().padStart(4, '0')}</span></p>
                                            </div>
                                            <button className="px-5 py-2 bg-slate-50 text-primary rounded-xl font-bold text-xs border border-slate-100 hover:bg-white transition-all shadow-sm">
                                                Edit Profile
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-4 gap-6 mt-8">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Age</p>
                                                <p className="text-lg font-black text-on-surface">{patient.age || '--'} Yrs</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Blood Group</p>
                                                <p className="text-lg font-black text-red-600">{patient.blood_type || 'N/A'}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gender</p>
                                                <p className="text-lg font-black text-on-surface">{patient.gender}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">NIC / ID</p>
                                                <p className="text-lg font-black text-on-surface">{patient.nic || `PAT-${patient.id.toString().padStart(4, '0')}`}</p>
                                            </div>
                                        </div>

                                        {isMinor && (
                                            <div className="mt-8 p-6 bg-primary/5 rounded-[2rem] border border-primary/10 flex items-center gap-8 animate-in fade-in slide-in-from-top-2 duration-500">
                                                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm border border-primary/10">
                                                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>family_restroom</span>
                                                </div>
                                                <div className="grid grid-cols-3 flex-1 gap-6">
                                                    <div className="space-y-0.5">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Guardian</p>
                                                        <p className="text-sm font-bold text-on-surface">{patient.guardian_name || 'N/A'}</p>
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Relationship</p>
                                                        <p className="text-sm font-bold text-primary">{patient.guardian_relationship || 'Guardian'}</p>
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Emergency Contact</p>
                                                        <p className="text-sm font-bold text-on-surface">{patient.guardian_phone || 'N/A'}</p>
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Guardian Email</p>
                                                        <p className="text-sm font-bold text-on-surface lowercase">{patient.guardian_email || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="col-span-4 space-y-4">
                                <div 
                                    onClick={() => navigate('/queue')}
                                    className={`glass-card rounded-[2rem] p-6 shadow-md hover:shadow-lg transition-all cursor-pointer group border-none ${
                                        queue ? 'bg-gradient-to-br from-primary to-primary-container text-white' : 'bg-slate-100 text-slate-400'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${queue ? 'bg-white/20' : 'bg-slate-200'}`}>
                                            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>hourglass_empty</span>
                                        </div>
                                        <span className="material-symbols-outlined text-lg opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                                    </div>
                                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${queue ? 'opacity-80' : 'text-slate-500'}`}>
                                        {queue?.status || 'No Active Session'}
                                    </p>
                                    <h3 className={`text-2xl font-black font-headline leading-tight ${queue ? '' : 'text-slate-400'}`}>
                                        {queue?.status === 'In Queue' ? `Room ${queue.room} • ${queue.token}` : 
                                         queue?.status === 'Scheduled' ? 'Upcoming Visit' : 'Check-In Required'}
                                    </h3>
                                    <div className="mt-3 flex items-center gap-3">
                                        {queue?.status === 'In Queue' ? (
                                            <>
                                                <div className="px-3 py-1 bg-white/20 rounded-lg font-black text-base">Pos: {queue.people_ahead + 1}</div>
                                                <p className="text-[10px] font-bold opacity-80">~ {queue.estimated_wait} mins wait</p>
                                            </>
                                        ) : queue?.status === 'Scheduled' ? (
                                            <div className="px-3 py-1 bg-white/20 rounded-lg font-black text-xs uppercase tracking-wider">{queue.date}</div>
                                        ) : (
                                            <p className="text-[10px] font-bold">Visit reception to check-in</p>
                                        )}
                                    </div>
                                </div>

                                <div 
                                    onClick={() => navigate('/assistant')}
                                    className="glass-card rounded-[2rem] p-6 shadow-md hover:shadow-lg transition-all cursor-pointer group border-primary/20 bg-primary/5"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg">
                                            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                                        </div>
                                        <span className="material-symbols-outlined text-primary opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                                    </div>
                                    <h3 className="text-lg font-black text-primary font-headline">AI Assistant</h3>
                                    <p className="text-xs text-slate-500 font-bold mt-1">Discuss your medical history</p>
                                </div>
                            </div>
                        </div>

                        {/* History and Records Grid */}
                        <div className="grid grid-cols-12 gap-6">
                            {/* Appointment History */}
                            <div className="col-span-7 glass-card rounded-[2.5rem] p-8 shadow-lg border border-white flex flex-col">
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="text-xl font-black text-on-surface font-headline flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_today</span>
                                        Recent Activity
                                    </h3>
                                    <button className="text-primary font-bold text-xs hover:underline underline-offset-4 decoration-2">View All</button>
                                </div>

                                <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar">
                                    {history.length > 0 ? history.map((appt, idx) => (
                                        <div key={idx} className="history-item p-5 rounded-2xl bg-slate-50/50 flex items-center justify-between group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex flex-col items-center justify-center border border-slate-100">
                                                    <p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">{new Date(appt.date).toLocaleString('default', { month: 'short' })}</p>
                                                    <p className="text-lg font-black text-primary leading-none">{new Date(appt.date).getDate()}</p>
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-on-surface text-base leading-tight">{appt.specialist}</h4>
                                                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mt-1">{appt.department}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                                    appt.status === 'Completed' ? 'bg-green-100 text-green-700' : 
                                                    appt.status === 'Scheduled' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                                                }`}>
                                                    {appt.status}
                                                </span>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-8">
                                            <span className="material-symbols-outlined text-4xl text-slate-200 mb-2 block">history_toggle_off</span>
                                            <p className="text-slate-400 font-bold text-sm">No activity records found</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Medical Records / Documents */}
                            <div className="col-span-5 glass-card rounded-[2.5rem] p-8 shadow-lg border border-white flex flex-col">
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="text-xl font-black text-on-surface font-headline flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
                                        Medical Records
                                    </h3>
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                    <button className="flex items-center gap-4 p-5 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-md transition-all border border-slate-100 group text-left">
                                        <div className="w-11 h-11 rounded-xl bg-white shadow-inner flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                            <span className="material-symbols-outlined text-2xl">prescriptions</span>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-black text-on-surface text-sm">Prescriptions</h4>
                                            <p className="text-[10px] text-slate-500 font-bold mt-0.5">3 Available Records</p>
                                        </div>
                                        <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors text-lg">download</span>
                                    </button>

                                    <button className="flex items-center gap-4 p-5 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-md transition-all border border-slate-100 group text-left">
                                        <div className="w-11 h-11 rounded-xl bg-white shadow-inner flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
                                            <span className="material-symbols-outlined text-2xl">lab_research</span>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-black text-on-surface text-sm">Lab Reports</h4>
                                            <p className="text-[10px] text-slate-500 font-bold mt-0.5">1 New Result</p>
                                        </div>
                                        <span className="material-symbols-outlined text-slate-300 group-hover:text-secondary transition-colors text-lg">visibility</span>
                                    </button>
                                </div>

                                <div className="mt-auto pt-6">
                                    <button 
                                        onClick={() => navigate('/doctors')}
                                        className="w-full bg-primary text-white py-4 rounded-2xl font-black text-base shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined">add_circle</span>
                                        Book Appointment
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PatientDashboard;
