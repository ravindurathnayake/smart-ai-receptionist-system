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
        { icon: 'map',              label: 'Hospital Map',         path: '/hospital-map' },
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
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [selectedAppt, setSelectedAppt] = useState(null);
    const [rating, setRating] = useState(5);
    const [reviewText, setReviewText] = useState('');
    const [complaintText, setComplaintText] = useState('');
    const [isComplaint, setIsComplaint] = useState(false);
    const [submittingReview, setSubmittingReview] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editData, setEditData] = useState({ 
        name: '', 
        phone: '', 
        email: '', 
        dob: '', 
        address: '', 
        blood_type: '' 
    });
    const [showPresModal, setShowPresModal] = useState(false);
    const [showLabModal, setShowLabModal] = useState(false);
    const [prescriptions, setPrescriptions] = useState([]);
    const [labReports, setLabReports] = useState([]);

    const [medicalSummary, setMedicalSummary] = useState({ prescriptions_count: 0, lab_reports_count: 0 });
    const [aiInsight, setAiInsight] = useState("Your AI Assistant is ready to summarize your medical history or answer health queries.");

    const fetchData = async () => {
        const savedPatient = localStorage.getItem('activePatient');
        if (!savedPatient) return;
        const parsedPatient = JSON.parse(savedPatient);
        try {
            const historyData = await apiService.getPatientHistory(parsedPatient.id);
            setHistory(historyData?.appointments || []);
            
            const queueData = await apiService.getPatientQueueStatus(parsedPatient.id);
            setQueue(queueData);

            const summaryData = await apiService.getMedicalSummary(parsedPatient.id);
            setMedicalSummary(summaryData);

            // Generate a simple AI insight
            const insights = [
                "Stay hydrated! Aim for at least 8 glasses of water today.",
                "Based on your last visit, remember to continue your prescribed medications.",
                "Did you know? Regular walking can improve your cardiovascular health significantly.",
                "Your next routine check-up should be scheduled within the next 3 months.",
                "AI Tip: Balanced nutrition is the foundation of long-term wellness."
            ];
            setAiInsight(insights[Math.floor(Math.random() * insights.length)]);
        } catch (err) {
            console.error("Error fetching data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const savedPatient = localStorage.getItem('activePatient');
        if (!savedPatient) {
            navigate('/patient-login');
            return;
        }
        
        const parsedPatient = JSON.parse(savedPatient);
        parsedPatient.full_name = parsedPatient.full_name || parsedPatient.name;
        setPatient(parsedPatient);

        fetchData();

        socketService.connect();
        socketService.on('queue_updated', fetchData);

        return () => {
            socketService.off('queue_updated', fetchData);
        };
    }, [navigate]);

    const handleSubmitReview = async () => {
        if (!selectedAppt) return;
        setSubmittingReview(true);
        try {
            await apiService.submitReview({
                appointment_id: selectedAppt.id,
                rating,
                review_text: reviewText,
                complaint_text: isComplaint ? complaintText : "",
                is_complaint: isComplaint
            });
            setIsReviewModalOpen(false);
            setRating(5);
            setReviewText('');
            setComplaintText('');
            setIsComplaint(false);
            fetchData();
        } catch (err) {
            console.error("Failed to submit review:", err);
            alert("Failed to submit review. You may have already reviewed this session.");
        } finally {
            setSubmittingReview(false);
        }
    };

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

    const handleEditProfile = () => {
        setEditData({ 
            name: patient?.full_name || patient?.name || '', 
            phone: patient?.phone_number || patient?.phone || '',
            email: patient?.email || '',
            dob: patient?.dob || '',
            address: patient?.address || '',
            blood_type: patient?.blood_type || ''
        });
        setIsEditModalOpen(true);
    };

    const handleSaveProfile = async () => {
        try {
            await apiService.updatePatient(patient.id, {
                full_name: editData.name,
                phone_number: editData.phone,
                email: editData.email,
                dob: editData.dob,
                address: editData.address,
                blood_type: editData.blood_type
            });
            
            const updatedPatient = { 
                ...patient, 
                full_name: editData.name, 
                name: editData.name,
                phone_number: editData.phone,
                phone: editData.phone,
                email: editData.email,
                dob: editData.dob,
                address: editData.address,
                blood_type: editData.blood_type
            };
            
            localStorage.setItem('activePatient', JSON.stringify(updatedPatient));
            setPatient(updatedPatient);
            setIsEditModalOpen(false);
            alert("Profile updated successfully!");
        } catch (err) {
            console.error("Failed to update profile:", err);
            alert("Failed to update profile");
        }
    };

    const handleViewAttachment = (base64Data) => {
        try {
            if (!base64Data) return;
            
            // Check if it's already a URL or needs conversion
            if (base64Data.startsWith('http')) {
                window.open(base64Data, '_blank');
                return;
            }

            const parts = base64Data.split(';base64,');
            if (parts.length !== 2) {
                window.open(base64Data, '_blank');
                return;
            }
            
            const contentType = parts[0].split(':')[1];
            const raw = window.atob(parts[1]);
            const rawLength = raw.length;
            const uInt8Array = new Uint8Array(rawLength);

            for (let i = 0; i < rawLength; ++i) {
                uInt8Array[i] = raw.charCodeAt(i);
            }

            const blob = new Blob([uInt8Array], { type: contentType });
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (err) {
            console.error("Failed to open attachment:", err);
            alert("Failed to open document. The file might be corrupted.");
        }
    };

    if (loading) return null;

    return (
        <div className="w-screen h-screen overflow-hidden flex font-body bg-slate-50 text-on-surface dashboard-container">
            <SideNav />

            <main className="flex-1 flex flex-col relative overflow-hidden bg-white">
                <TopBar 
                    patientName={patient.full_name} 
                    onSignOut={() => { localStorage.removeItem('activePatient'); navigate('/'); }} 
                />

                <div className="ambient-blob-top" />
                <div className="ambient-blob-bottom" />

                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar z-10 relative">
                    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
                        
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
                                            <button 
                                                onClick={handleEditProfile}
                                                className="px-5 py-2 bg-slate-50 text-primary rounded-xl font-bold text-xs border border-slate-100 hover:bg-white transition-all shadow-sm">
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
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="col-span-4 space-y-4">
                                <div 
                                    onClick={() => navigate('/queue')}
                                    className={`rounded-[2rem] p-6 shadow-xl transition-all cursor-pointer group ${
                                        (queue && queue.status) 
                                            ? 'bg-gradient-to-br from-primary to-blue-700 text-white shadow-primary/20' 
                                            : 'bg-slate-50 border-2 border-dashed border-slate-200 text-slate-500'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${ (queue && queue.status) ? 'bg-white/20 backdrop-blur-md' : 'bg-white shadow-sm'}`}>
                                            <span className={`material-symbols-outlined text-3xl ${ (queue && queue.status) ? 'text-white' : 'text-slate-400'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                                                {(queue && queue.status) ? 'hourglass_empty' : 'no_accounts'}
                                            </span>
                                        </div>
                                        <span className={`material-symbols-outlined text-lg ${ (queue && queue.status) ? 'text-white' : 'text-slate-400'} opacity-0 group-hover:opacity-100 transition-opacity`}>arrow_forward</span>
                                    </div>
                                    <p className={`text-[11px] font-black uppercase tracking-widest mb-1 ${ (queue && queue.status) ? 'text-white/80' : 'text-slate-400'}`}>
                                        {(queue && queue.status) ? queue.status : 'NO ACTIVE SESSION'}
                                    </p>
                                    <h3 className="text-2xl font-black font-headline leading-tight">
                                        {(queue && queue.status) ? (
                                            queue.status === 'In Queue' ? `${queue.room} • ${queue.token}` : 'Upcoming Visit'
                                        ) : 'Check-In Required'}
                                    </h3>
                                    <div className="mt-4 flex items-center gap-3">
                                        {(queue && queue.status) ? (
                                            queue.status === 'In Queue' ? (
                                                <>
                                                    <div className="px-3 py-1 bg-white/20 rounded-lg font-black text-base">Pos: {parseInt(queue.people_ahead) + 1}</div>
                                                    <p className="text-[10px] font-bold text-white/80">~ {queue.estimated_wait} mins wait</p>
                                                </>
                                            ) : (
                                                <div className="px-3 py-1 bg-white/20 rounded-lg font-black text-xs uppercase tracking-wider">{queue.date}</div>
                                            )
                                        ) : (
                                            <p className="text-[10px] font-bold">Visit reception to get started</p>
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
                                    <p className="text-[10px] text-slate-500 font-bold mt-1 line-clamp-2">"{aiInsight}"</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-6">
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
                                            <div className="flex items-center gap-3">
                                                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                                    appt.status === 'Completed' ? 'bg-green-100 text-green-700' : 
                                                    appt.status === 'Scheduled' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                                                }`}>
                                                    {appt.status}
                                                </span>
                                                {appt.status === 'Completed' && !appt.has_review && (
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedAppt(appt);
                                                            setIsReviewModalOpen(true);
                                                        }}
                                                        className="px-3 py-1 bg-primary text-white rounded-full text-[8px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-sm"
                                                    >
                                                        Rate & Review
                                                    </button>
                                                )}
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

                            <div className="col-span-5 glass-card rounded-[2.5rem] p-8 shadow-lg border border-white flex flex-col">
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="text-xl font-black text-on-surface font-headline flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
                                        Medical Records
                                    </h3>
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                    <button 
                                        onClick={async () => {
                                            const data = await apiService.getPrescriptions(patient.id);
                                            setPrescriptions(data);
                                            setShowPresModal(true);
                                        }}
                                        className="flex items-center gap-4 p-5 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-md transition-all border border-slate-100 group text-left w-full"
                                    >
                                        <div className="w-11 h-11 rounded-xl bg-white shadow-inner flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                            <span className="material-symbols-outlined text-2xl">prescriptions</span>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-black text-on-surface text-sm">Prescriptions</h4>
                                            <p className="text-[10px] text-slate-500 font-bold mt-0.5">{medicalSummary.prescriptions_count} Records Available</p>
                                        </div>
                                        <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors text-lg">visibility</span>
                                    </button>
 
                                    <button 
                                        onClick={async () => {
                                            const data = await apiService.getLabReports(patient.id);
                                            setLabReports(data);
                                            setShowLabModal(true);
                                        }}
                                        className="flex items-center gap-4 p-5 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-md transition-all border border-slate-100 group text-left w-full"
                                    >
                                        <div className="w-11 h-11 rounded-xl bg-white shadow-inner flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
                                            <span className="material-symbols-outlined text-2xl">lab_research</span>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-black text-on-surface text-sm">Lab Reports</h4>
                                            <p className="text-[10px] text-slate-500 font-bold mt-0.5">{medicalSummary.lab_reports_count} New Results</p>
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

            {/* Review & Complaint Modal */}
            {isReviewModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsReviewModalOpen(false)}></div>
                    <div className="bg-white rounded-[3rem] w-full max-w-xl relative z-10 shadow-2xl overflow-hidden border border-white">
                        <div className="p-10">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h2 className="text-3xl font-black text-on-surface font-headline tracking-tight">Experience Feedback</h2>
                                    <p className="text-slate-500 font-bold text-sm mt-1">Reviewing: {selectedAppt?.specialist}</p>
                                </div>
                                <button onClick={() => setIsReviewModalOpen(false)} className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-primary transition-colors">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            <div className="space-y-8">
                                <div className="text-center bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Overall Rating</p>
                                    <div className="flex justify-center gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button 
                                                key={star} 
                                                onClick={() => setRating(star)}
                                                className={`text-4xl transition-all ${rating >= star ? 'text-yellow-500 scale-110' : 'text-slate-200'}`}
                                            >
                                                <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: rating >= star ? "'FILL' 1" : "" }}>star</span>
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-sm font-black text-primary mt-4">
                                        {rating === 5 ? 'Excellent Experience' : rating === 4 ? 'Very Good' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Poor'}
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-2">Your Feedback</label>
                                    <textarea 
                                        className="w-full p-6 bg-slate-50 border-none rounded-[2rem] text-sm font-bold placeholder:text-slate-300 focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all min-h-[120px]"
                                        placeholder="Tell us about your consultation..."
                                        value={reviewText}
                                        onChange={(e) => setReviewText(e.target.value)}
                                    ></textarea>
                                </div>

                                <div className="flex items-center justify-between p-6 bg-red-50 rounded-[2rem] border border-red-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-red-600 shadow-sm">
                                            <span className="material-symbols-outlined">report_problem</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-red-700">File a Formal Complaint?</p>
                                            <p className="text-[10px] text-red-500 font-bold">This will be flagged for admin review</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setIsComplaint(!isComplaint)}
                                        className={`w-14 h-8 rounded-full relative transition-all ${isComplaint ? 'bg-red-600' : 'bg-slate-200'}`}
                                    >
                                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${isComplaint ? 'left-7' : 'left-1'}`}></div>
                                    </button>
                                </div>

                                {isComplaint && (
                                    <div className="space-y-3 animate-fade-in">
                                        <label className="text-[10px] font-black text-red-600 uppercase tracking-widest ml-2">Complaint Details</label>
                                        <textarea 
                                            className="w-full p-6 bg-red-50/30 border border-red-100 rounded-[2rem] text-sm font-bold placeholder:text-red-300 focus:bg-white focus:ring-4 focus:ring-red-500/5 transition-all min-h-[100px]"
                                            placeholder="What went wrong? Please be specific..."
                                            value={complaintText}
                                            onChange={(e) => setComplaintText(e.target.value)}
                                        ></textarea>
                                    </div>
                                )}

                                <button 
                                    onClick={handleSubmitReview}
                                    disabled={submittingReview}
                                    className={`w-full py-5 rounded-[2rem] font-black text-lg transition-all shadow-xl flex items-center justify-center gap-3 ${
                                        submittingReview ? 'bg-slate-100 text-slate-300' : 'bg-primary text-white hover:scale-[1.02] active:scale-[0.95]'
                                    }`}
                                >
                                    {submittingReview ? 'Submitting...' : 'Submit Feedback'}
                                    {!submittingReview && <span className="material-symbols-outlined">send</span>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Profile Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-on-surface/20 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-2xl border border-white animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black font-headline text-primary">Edit Personal Info</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-red-500">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        
                        <div className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Full Name</label>
                                    <input 
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-xs"
                                        value={editData.name}
                                        onChange={(e) => setEditData({...editData, name: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Contact Number</label>
                                    <input 
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-xs"
                                        value={editData.phone}
                                        onChange={(e) => setEditData({...editData, phone: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Email Address</label>
                                    <input 
                                        type="email"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-xs"
                                        value={editData.email}
                                        onChange={(e) => setEditData({...editData, email: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Date of Birth</label>
                                    <input 
                                        type="date"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-xs"
                                        value={editData.dob}
                                        onChange={(e) => setEditData({...editData, dob: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Residential Address</label>
                                <textarea 
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-xs resize-none"
                                    rows="2"
                                    value={editData.address}
                                    onChange={(e) => setEditData({...editData, address: e.target.value})}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Blood Group</label>
                                <select 
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-xs appearance-none"
                                    value={editData.blood_type}
                                    onChange={(e) => setEditData({...editData, blood_type: e.target.value})}
                                >
                                    <option value="">Select Blood Group</option>
                                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button 
                                onClick={() => setIsEditModalOpen(false)}
                                className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl font-black text-sm hover:bg-slate-100 transition-all">
                                Cancel
                            </button>
                            <button 
                                onClick={handleSaveProfile}
                                className="flex-[2] py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all">
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showPresModal && (
                <ViewPrescriptionsModal 
                    prescriptions={prescriptions} 
                    onClose={() => setShowPresModal(false)} 
                    onViewAttachment={handleViewAttachment}
                />
            )}

            {showLabModal && (
                <ViewLabReportsModal 
                    reports={labReports} 
                    onClose={() => setShowLabModal(false)} 
                    onViewAttachment={handleViewAttachment}
                />
            )}
        </div>
    );
};

const ViewPrescriptionsModal = ({ prescriptions, onClose, onViewAttachment }) => (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-white flex flex-col max-h-[80vh]">
            <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-on-surface font-headline tracking-tight">Your Prescriptions</h2>
                    <p className="text-slate-500 font-bold text-sm mt-1">Access and review your prescribed medications.</p>
                </div>
                <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-400 hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">close</span>
                </button>
            </div>
            <div className="p-10 overflow-y-auto space-y-4">
                {prescriptions.length === 0 ? (
                    <div className="text-center py-20">
                        <span className="material-symbols-outlined text-5xl text-slate-200 mb-4 block">prescriptions</span>
                        <p className="text-slate-400 font-bold">No prescriptions found in your record.</p>
                    </div>
                ) : (
                    prescriptions.map(p => (
                        <div key={p.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                            <div className="flex justify-between items-start mb-4">
                                <span className="px-4 py-1.5 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full">{p.date}</span>
                                <p className="text-xs font-bold text-slate-500">Dr. {p.doctor_name}</p>
                            </div>
                            <h4 className="text-lg font-black text-on-surface mb-2">{p.medications}</h4>
                            {p.instructions && (
                                <div className="mt-3 p-4 bg-white rounded-2xl border border-slate-200 border-l-4 border-l-primary">
                                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Pharmacist Instructions:</p>
                                    <p className="text-sm font-bold text-slate-600">{p.instructions}</p>
                                </div>
                            )}
                            {p.attachment && (
                                <div className="mt-4 pt-4 border-t border-slate-200">
                                    <button 
                                        onClick={() => onViewAttachment(p.attachment)}
                                        className="w-full flex items-center justify-center gap-2 py-3 bg-white text-primary border border-primary/20 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-primary/5 transition-all shadow-sm"
                                    >
                                        <span className="material-symbols-outlined text-lg">visibility</span>
                                        View Attached Document
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    </div>
);

const ViewLabReportsModal = ({ reports, onClose, onViewAttachment }) => (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-white flex flex-col max-h-[80vh]">
            <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-on-surface font-headline tracking-tight">Lab Reports</h2>
                    <p className="text-slate-500 font-bold text-sm mt-1">Review your latest laboratory test results.</p>
                </div>
                <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-400 hover:text-secondary transition-colors">
                    <span className="material-symbols-outlined">close</span>
                </button>
            </div>
            <div className="p-10 overflow-y-auto space-y-4">
                {reports.length === 0 ? (
                    <div className="text-center py-20">
                        <span className="material-symbols-outlined text-5xl text-slate-200 mb-4 block">lab_research</span>
                        <p className="text-slate-400 font-bold">No lab reports found in your record.</p>
                    </div>
                ) : (
                    reports.map(r => (
                        <div key={r.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                            <div className="flex justify-between items-start mb-4">
                                <span className="px-4 py-1.5 bg-secondary/10 text-secondary text-[10px] font-black uppercase tracking-widest rounded-full">{r.date}</span>
                                <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full ${r.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {r.status}
                                </span>
                            </div>
                            <h4 className="text-lg font-black text-on-surface mb-2">{r.test_name}</h4>
                            {r.result_summary && (
                                <div className="mt-3 p-4 bg-white rounded-2xl border border-slate-200 border-l-4 border-l-secondary">
                                    <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-1">Result Summary:</p>
                                    <p className="text-sm font-bold text-slate-600">{r.result_summary}</p>
                                </div>
                            )}
                            {r.attachment && (
                                <div className="mt-4 pt-4 border-t border-slate-200">
                                    <button 
                                        onClick={() => onViewAttachment(r.attachment)}
                                        className="w-full flex items-center justify-center gap-2 py-3 bg-white text-secondary border border-secondary/20 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-secondary/5 transition-all shadow-sm"
                                    >
                                        <span className="material-symbols-outlined text-lg">visibility</span>
                                        View Attached Document
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    </div>
);

export default PatientDashboard;
