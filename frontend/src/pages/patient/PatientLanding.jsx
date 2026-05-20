import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Logo from '../../components/common/Logo';
import PatientHeader from '../../components/common/PatientHeader';
import { apiService } from '../../services/apiService';

const PatientLanding = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [patient, setPatient] = useState(() => {
        const savedPatient = localStorage.getItem('activePatient');
        return savedPatient ? JSON.parse(savedPatient) : null;
    });
    const [stats, setStats] = useState({ activeDoctors: 14, waitTime: 12, servedToday: 185 });
    const [reviews, setReviews] = useState([]);
    const [greeting, setGreeting] = useState('Welcome');
    const [queue, setQueue] = useState(null);
    const mainRef = useRef(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            window.scrollTo(0, 0);
            if (mainRef.current) {
                mainRef.current.scrollTop = 0;
            }
        }, 50);
        return () => clearTimeout(timer);
    }, [location.pathname, patient]);

    useEffect(() => {
        const savedPatient = localStorage.getItem('activePatient');
        setPatient(savedPatient ? JSON.parse(savedPatient) : null);
    }, [location.pathname]);

    useEffect(() => {
        const hr = new Date().getHours();
        if (hr < 12) setGreeting('Good Morning');
        else if (hr < 17) setGreeting('Good Afternoon');
        else setGreeting('Good Evening');
    }, []);

    useEffect(() => {
        if (!patient?.id) {
            setQueue(null);
            return;
        }
        const fetchQueueStatus = async () => {
            try {
                const queueData = await apiService.getPatientQueueStatus(patient.id);
                setQueue(queueData);
            } catch (err) {
                console.error("Error fetching queue status:", err);
            }
        };
        fetchQueueStatus();
    }, [patient]);

    useEffect(() => {
        const fetchHospitalData = async () => {
            try {
                const analytics = await apiService.getHospitalAnalytics();
                if (analytics) {
                    setStats({
                        activeDoctors: analytics.active_doctors ?? 12,
                        waitTime: analytics.average_wait_time ?? 15,
                        servedToday: analytics.patients_served ?? 0
                    });
                }
            } catch (err) {
                console.error("Failed to fetch hospital analytics:", err);
            }
        };

        const fetchReviews = async () => {
            try {
                const reviewResponse = await apiService.getAllReviews();
                if (reviewResponse && reviewResponse.data) {
                    const filtered = reviewResponse.data
                        .filter(r => r.rating >= 4)
                        .slice(0, 3);
                    setReviews(filtered);
                }
            } catch (err) {
                console.error("Failed to fetch reviews:", err);
            }
        };

        fetchHospitalData();
        fetchReviews();

        // Real-time update: poll analytics every 5 seconds
        const interval = setInterval(fetchHospitalData, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleQuickAction = (path) => {
        if (!patient && path !== '/patient/queue') {
            navigate('/patient/login', { state: { redirectTo: path } });
        } else {
            navigate(path);
        }
    };

    const departments = [
        {
            name: "General Medicine",
            icon: "stethoscope",
            desc: "Routine health checks, common ailment treatment, and general wellness consultation.",
            highlight: "Primary Care",
            iconWrap: "bg-primary/10 text-primary border-primary/10",
            panelGlow: "from-primary/12 via-primary/5 to-transparent"
        },
        {
            name: "Cardiology",
            icon: "cardiology",
            desc: "Advanced heart care, diagnostics, ECG/ECO, and cardiac rehabilitation.",
            highlight: "Heart Center",
            iconWrap: "bg-rose-50 text-rose-600 border-rose-100",
            panelGlow: "from-rose-100/80 via-rose-50/40 to-transparent"
        },
        {
            name: "Pediatrics",
            icon: "child_care",
            desc: "Specialized care for infants, children, adolescents, and immunizations.",
            highlight: "Child Wellness",
            iconWrap: "bg-sky-50 text-sky-600 border-sky-100",
            panelGlow: "from-sky-100/80 via-sky-50/40 to-transparent"
        },
        {
            name: "Orthopedics",
            icon: "accessibility_new",
            desc: "Bone, joint, spine disorders, trauma surgery, and physical therapy.",
            highlight: "Mobility Care",
            iconWrap: "bg-amber-50 text-amber-600 border-amber-100",
            panelGlow: "from-amber-100/80 via-amber-50/40 to-transparent"
        },
        {
            name: "Dermatology",
            icon: "spa",
            desc: "Skin, hair, nail diagnosis, allergies, and cosmetic procedures.",
            highlight: "Skin Clinic",
            iconWrap: "bg-violet-50 text-violet-600 border-violet-100",
            panelGlow: "from-violet-100/80 via-violet-50/40 to-transparent"
        },
        {
            name: "OPD Services",
            icon: "local_hospital",
            desc: "Outpatient diagnostics, emergency care, and immediate consultation.",
            highlight: "Fast Access",
            iconWrap: "bg-emerald-50 text-emerald-600 border-emerald-100",
            panelGlow: "from-emerald-100/80 via-emerald-50/40 to-transparent"
        }
    ];

    const footerQuickLinks = [
        { label: 'Find & Book Doctor', path: '/patient/book', icon: 'calendar_month' },
        { label: 'Track Live Queue', path: '/patient/queue', icon: 'hourglass_empty' },
        { label: 'Ask AI Assistant', path: '/patient/chat', icon: 'smart_toy' },
        { label: 'Open Patient Dashboard', path: '/patient/dashboard', icon: 'dashboard' }
    ];

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-body text-slate-800 flex flex-col relative selection:bg-primary selection:text-white overflow-x-hidden">
            {/* Ambient Background Glowing Blurs */}
            <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-gradient-to-tr from-primary/10 to-blue-400/5 rounded-full blur-[120px] pointer-events-none z-0" />
            <div className="absolute top-[35%] right-[-10%] w-[50vw] h-[50vw] bg-gradient-to-br from-[#86AE3A]/10 to-emerald-400/5 rounded-full blur-[140px] pointer-events-none z-0" />
            <div className="absolute bottom-[5%] left-[-5%] w-[55vw] h-[55vw] bg-gradient-to-tr from-[#87AFB7]/10 to-cyan-400/5 rounded-full blur-[160px] pointer-events-none z-0" />

            {/* UNIFIED HEADER & DYNAMIC NAVIGATION */}
            <PatientHeader />

            {/* MAIN CONTENT WRAPPER - STABILIZES SCROLLING FLOW AND DOCKS FOOTER AT THE BOTTOM */}
            <main ref={mainRef} className="z-10 flex flex-col flex-grow">
                {patient ? (
                    /* PERSONALIZED PATIENT HOME CONSOLE */
                    <section className="relative pt-12 pb-16 bg-gradient-to-b from-primary/5 via-transparent to-transparent">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            {/* Greeting & Header */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 text-left">
                                <div>
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/5 border border-primary/10 rounded-full text-primary font-bold text-xs uppercase tracking-wider mb-3">
                                        Active Portal Session
                                    </div>
                                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 font-headline leading-tight">
                                        {greeting}, <span className="bg-gradient-to-r from-primary to-blue-700 bg-clip-text text-transparent">{patient.full_name}</span>
                                    </h1>
                                    <p className="text-sm font-semibold text-slate-500 mt-1">Patient ID: <span className="text-slate-700 font-bold">PAT-{patient.id ? patient.id.toString().padStart(4, '0') : '0030'}</span></p>
                                </div>
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => navigate('/patient/book')}
                                        className="px-6 py-3 bg-primary hover:bg-primary-container text-white font-extrabold text-sm rounded-2xl transition-all shadow-md shadow-primary/10 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-base">calendar_month</span>
                                        Book a Doctor
                                    </button>
                                    <button 
                                        onClick={() => navigate('/patient/chat')}
                                        className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-extrabold text-sm rounded-2xl transition-all shadow-sm hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-base">smart_toy</span>
                                        Ask AI Assistant
                                    </button>
                                </div>
                            </div>

                            {/* Dashboard Core Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
                                {/* Left Side: Live Queue Ticket Status Card */}
                                <div className="lg:col-span-7 flex flex-col">
                                    <div 
                                        onClick={() => navigate('/patient/queue')}
                                        className={`rounded-3xl p-8 shadow-xl transition-all cursor-pointer group flex flex-col justify-between h-full min-h-[220px] ${
                                            (queue && queue.status) 
                                                ? 'bg-gradient-to-br from-primary via-blue-700 to-indigo-850 text-white shadow-primary/20 hover:scale-[1.01]' 
                                                : 'bg-white border border-slate-100 hover:border-primary/20 text-slate-800 shadow-sm hover:scale-[1.01]'
                                        }`}
                                    >
                                        <div>
                                            <div className="flex justify-between items-start mb-6">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${ (queue && queue.status) ? 'bg-white/20 backdrop-blur-md' : 'bg-primary/5 text-primary'}`}>
                                                    <span className="material-symbols-outlined text-3xl font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>
                                                        {(queue && queue.status) ? 'hourglass_empty' : 'clinical_notes'}
                                                    </span>
                                                </div>
                                                <span className={`material-symbols-outlined text-lg ${ (queue && queue.status) ? 'text-white/80' : 'text-primary'} group-hover:translate-x-1 transition-transform`}>arrow_forward</span>
                                            </div>
                                            <p className={`text-[10px] font-black uppercase tracking-widest mb-1.5 ${ (queue && queue.status) ? 'text-white/70' : 'text-primary'}`}>
                                                {(queue && queue.status) ? queue.status : 'Queue Status'}
                                            </p>
                                            <h3 className="text-2.5xl sm:text-3xl font-black font-headline leading-tight">
                                                {(queue && queue.status) ? (
                                                    queue.status === 'In Queue' ? `${queue.room} • Token #${queue.token}` : 'Upcoming Session Active'
                                                ) : 'No Active Session'}
                                            </h3>
                                        </div>
                                        <div className="mt-8 flex items-center gap-4 border-t pt-5 border-slate-200/10">
                                            {(queue && queue.status) ? (
                                                queue.status === 'In Queue' ? (
                                                    <>
                                                        <div className="px-4 py-1.5 bg-white/20 rounded-xl font-black text-lg">Position: {parseInt(queue.people_ahead) + 1}</div>
                                                        <p className="text-xs font-bold text-white/80">~ {queue.estimated_wait} mins wait time remaining</p>
                                                    </>
                                                ) : (
                                                    <div className="px-3 py-1 bg-white/20 rounded-lg font-black text-xs uppercase tracking-wider">{queue.date}</div>
                                                )
                                            ) : (
                                                <p className="text-xs font-semibold text-slate-500">You are currently not checked in to any live queue sessions. Click to check in or track queues.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Dynamic Quick Shortcuts Grid */}
                                <div className="lg:col-span-5 grid grid-cols-2 gap-4">
                                    <div 
                                        onClick={() => navigate('/patient/chat')}
                                        className="p-6 bg-white hover:bg-slate-50 border border-slate-100 hover:border-primary/20 rounded-3xl shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                                    >
                                        <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                                            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                                        </div>
                                        <div className="mt-4">
                                            <h4 className="font-extrabold text-slate-800 text-sm group-hover:text-primary transition-colors">AI Health Assistant</h4>
                                            <p className="text-[10px] font-bold text-slate-400 mt-1">24/7 symptom checker & reception help</p>
                                        </div>
                                    </div>

                                    <div 
                                        onClick={() => navigate('/patient/book')}
                                        className="p-6 bg-white hover:bg-slate-50 border border-slate-100 hover:border-primary/20 rounded-3xl shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                                    >
                                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                                            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>person_search</span>
                                        </div>
                                        <div className="mt-4">
                                            <h4 className="font-extrabold text-slate-800 text-sm group-hover:text-emerald-600 transition-colors">Find Doctors</h4>
                                            <p className="text-[10px] font-bold text-slate-400 mt-1">Book consultations with top specialists</p>
                                        </div>
                                    </div>

                                    <div 
                                        onClick={() => navigate('/patient/queue')}
                                        className="p-6 bg-white hover:bg-slate-50 border border-slate-100 hover:border-primary/20 rounded-3xl shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                                    >
                                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                                            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>clinical_notes</span>
                                        </div>
                                        <div className="mt-4">
                                            <h4 className="font-extrabold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">Queue Status</h4>
                                            <p className="text-[10px] font-bold text-slate-400 mt-1">Check real-time OPD token lists</p>
                                        </div>
                                    </div>

                                    <div 
                                        onClick={() => navigate('/patient/map')}
                                        className="p-6 bg-white hover:bg-slate-50 border border-slate-100 hover:border-primary/20 rounded-3xl shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                                    >
                                        <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                                            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>map</span>
                                        </div>
                                        <div className="mt-4">
                                            <h4 className="font-extrabold text-slate-800 text-sm group-hover:text-rose-600 transition-colors">Hospital Map</h4>
                                            <p className="text-[10px] font-bold text-slate-400 mt-1">Interactive inside facility finder</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                ) : (
                    /* HERO SECTION */
                    <section className="relative pt-12 pb-20 md:py-32">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
                                {/* Hero Text */}
                                <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
                                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-900 font-headline leading-[1.15] sm:leading-[1.1]">
                                        Hospital services <br />
                                        <span className="bg-gradient-to-r from-primary via-blue-700 to-emerald-600 bg-clip-text text-transparent">reimagined for anywhere.</span>
                                    </h1>
                                    <p className="text-slate-600 text-lg md:text-xl font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0">
                                        MediAssist allows you to search doctors, book appointments, track active queue numbers in real-time, consult our AI triage system, and review prescription files securely from home or on the move.
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                        <button
                                            onClick={() => handleQuickAction('/patient/book')}
                                            className="px-8 py-4.5 bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary text-white font-extrabold rounded-2xl transition-all duration-300 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-98 flex items-center justify-center gap-2 group cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined font-black group-hover:rotate-6 transition-transform">calendar_today</span>
                                            Book Appointment Online
                                        </button>
                                        <button
                                            onClick={() => handleQuickAction('/patient/chat')}
                                            className="px-8 py-4.5 bg-gradient-to-r from-[#86AE3A] to-emerald-600 hover:from-emerald-600 hover:to-[#86AE3A] text-white font-extrabold rounded-2xl transition-all duration-300 shadow-lg shadow-[#86AE3A]/20 hover:scale-[1.02] active:scale-98 flex items-center justify-center gap-2 group cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined font-black group-hover:animate-bounce transition-all">smart_toy</span>
                                            Consult AI Assistant
                                        </button>
                                    </div>
                                </div>

                                {/* Interactive Hospital Overview Card */}
                                <div className="lg:col-span-5 relative w-full max-w-md mx-auto">
                                    <div className="absolute -inset-3 bg-gradient-to-r from-primary/30 to-emerald-500/20 rounded-[2.5rem] blur-2xl opacity-70 animate-pulse pointer-events-none" />
                                    <div className="relative rounded-[2.5rem] p-8 shadow-2xl bg-white border border-slate-100 flex flex-col space-y-6">
                                        <h3 className="text-xl font-black text-slate-800 font-headline flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-primary font-black animate-pulse">insights</span>
                                                Live Hospital Pulse
                                            </div>
                                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-full">
                                                <span className="flex h-2 w-2 relative">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                                </span>
                                                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Live</span>
                                            </div>
                                        </h3>

                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="bg-slate-50/60 hover:bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center transition-all duration-200">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">On-Duty</p>
                                                <p className="text-2xl font-black text-primary mt-1">{stats.activeDoctors}</p>
                                                <p className="text-[9px] font-bold text-slate-500 mt-0.5">Specialists</p>
                                            </div>
                                            <div className="bg-slate-50/60 hover:bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center transition-all duration-200">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Wait Time</p>
                                                <p className="text-2xl font-black text-emerald-600 mt-1">~{stats.waitTime}m</p>
                                                <p className="text-[9px] font-bold text-slate-500 mt-0.5">Avg Queue</p>
                                            </div>
                                            <div className="bg-slate-50/60 hover:bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center transition-all duration-200">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Served</p>
                                                <p className="text-2xl font-black text-indigo-600 mt-1">{stats.servedToday}</p>
                                                <p className="text-[9px] font-bold text-slate-500 mt-0.5">Patients Today</p>
                                            </div>
                                        </div>

                                        <div className="border-t border-slate-100 pt-5 space-y-4">
                                            <h4 className="font-black text-slate-800 text-sm">Quick Status Checker</h4>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleQuickAction('/patient/queue')}
                                                    className="flex-1 py-3 bg-slate-50 hover:bg-primary/5 hover:text-primary text-slate-600 font-black rounded-xl text-xs border border-slate-200/60 hover:border-primary/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                                >
                                                    <span className="material-symbols-outlined text-sm font-bold">hourglass_empty</span>
                                                    Live Queue Status
                                                </button>
                                                <button
                                                    onClick={() => handleQuickAction('/patient/chat')}
                                                    className="flex-1 py-3 bg-slate-50 hover:bg-[#86AE3A]/5 hover:text-[#86AE3A] text-slate-600 font-black rounded-xl text-xs border border-slate-200/60 hover:border-[#86AE3A]/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                                >
                                                    <span className="material-symbols-outlined text-sm font-bold">clinical_notes</span>
                                                    Symptom Triage
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* QUICK ACTIONS GRID */}
                <section className="py-20 bg-white border-y border-slate-200/60 relative">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                            <h2 className="text-3xl font-black text-slate-900 font-headline tracking-tight">Access Hospital Utilities Online</h2>
                            <p className="text-slate-500 font-medium text-base">Select one of our specialized tools to start using the system remotely. Everything synchronizes directly with the hospital's central system in real-time.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {/* Card 1: Book Appointment */}
                            <div
                                onClick={() => handleQuickAction('/patient/book')}
                                className="bg-slate-50/50 hover:bg-white border border-slate-100 hover:border-primary/20 rounded-[2rem] p-8 shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <span className="material-symbols-outlined text-2xl font-bold">calendar_month</span>
                                </div>
                                <h3 className="text-lg font-black text-slate-800 font-headline group-hover:text-primary transition-colors">Book Specialists</h3>
                                <p className="text-slate-500 text-xs font-bold leading-relaxed mt-2.5">
                                    Search for on-duty specialists across departments, browse their session dates/availabilities, choose a timeslot, and book easily.
                                </p>
                                <div className="mt-6 flex items-center gap-1.5 text-primary text-xs font-extrabold group-hover:translate-x-1.5 transition-transform">
                                    Book Now
                                    <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
                                </div>
                            </div>

                            {/* Card 2: Live Queue Tracker */}
                            <div
                                onClick={() => handleQuickAction('/patient/queue')}
                                className="bg-slate-50/50 hover:bg-white border border-slate-100 hover:border-emerald-500/20 rounded-[2rem] p-8 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <span className="material-symbols-outlined text-2xl font-bold">hourglass_empty</span>
                                </div>
                                <h3 className="text-lg font-black text-slate-800 font-headline group-hover:text-emerald-600 transition-colors">Live Queue Status</h3>
                                <p className="text-slate-500 text-xs font-bold leading-relaxed mt-2.5">
                                    Check active session token counts, approximate delays, and track your specific position in line in real-time. No need to stand in crowded halls!
                                </p>
                                <div className="mt-6 flex items-center gap-1.5 text-emerald-600 text-xs font-extrabold group-hover:translate-x-1.5 transition-transform">
                                    Track Live
                                    <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
                                </div>
                            </div>

                            {/* Card 3: AI Assistant */}
                            <div
                                onClick={() => handleQuickAction('/patient/chat')}
                                className="bg-slate-50/50 hover:bg-white border border-slate-100 hover:border-amber-500/20 rounded-[2rem] p-8 shadow-sm hover:shadow-xl hover:shadow-amber-500/5 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <span className="material-symbols-outlined text-2xl font-bold">smart_toy</span>
                                </div>
                                <h3 className="text-lg font-black text-slate-800 font-headline group-hover:text-amber-600 transition-colors">AI Health Chatbot</h3>
                                <p className="text-slate-500 text-xs font-bold leading-relaxed mt-2.5">
                                    Describe symptoms to obtain general triage advice and recommendations, get indoor hospital directions, and check clinic hours instantly.
                                </p>
                                <div className="mt-6 flex items-center gap-1.5 text-amber-600 text-xs font-extrabold group-hover:translate-x-1.5 transition-transform">
                                    Consult AI
                                    <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
                                </div>
                            </div>

                            {/* Card 4: Digital Health Dashboard */}
                            <div
                                onClick={() => handleQuickAction('/patient/dashboard')}
                                className="bg-slate-50/50 hover:bg-white border border-slate-100 hover:border-indigo-500/20 rounded-[2rem] p-8 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <span className="material-symbols-outlined text-2xl font-bold">clinical_notes</span>
                                </div>
                                <h3 className="text-lg font-black text-slate-800 font-headline group-hover:text-indigo-600 transition-colors">Medical Records</h3>
                                <p className="text-slate-500 text-xs font-bold leading-relaxed mt-2.5">
                                    Access your doctor prescriptions, view uploaded laboratory and imaging reports, reschedule upcoming visits, or submit patient reviews.
                                </p>
                                <div className="mt-6 flex items-center gap-1.5 text-indigo-600 text-xs font-extrabold group-hover:translate-x-1.5 transition-transform">
                                    View Records
                                    <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* SERVICES / DEPARTMENTS SECTION */}
                <section id="services" className="py-20 md:py-28 relative">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
                            <span className="text-primary font-black text-xs uppercase tracking-widest bg-primary/5 px-4.5 py-2 rounded-full">Medical Specializations</span>
                            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 font-headline tracking-tight mt-3">Our Core Departments</h2>
                            <p className="text-slate-500 font-medium text-base">We provide fully integrated clinical care across major medical disciplines. Find highly experienced on-duty doctors right now.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                            {departments.map((dept, idx) => (
                                <div
                                    key={idx}
                                    className="bg-white rounded-[2rem] p-7 sm:p-8 border border-slate-100 hover:border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                                >
                                    <div className={`absolute inset-x-0 top-0 h-28 bg-gradient-to-br ${dept.panelGlow} pointer-events-none`} />
                                    <div className="space-y-5 relative z-10">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-300 group-hover:scale-105 ${dept.iconWrap}`}>
                                                <span className="material-symbols-outlined text-[30px]" style={{ fontVariationSettings: "'FILL' 1" }}>{dept.icon}</span>
                                            </div>
                                            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 backdrop-blur-sm">
                                                {dept.highlight}
                                            </span>
                                        </div>
                                        <div className="space-y-2.5">
                                            <h3 className="text-xl font-black text-slate-800 font-headline tracking-tight">{dept.name}</h3>
                                            <p className="text-slate-500 text-sm font-semibold leading-relaxed">{dept.desc}</p>
                                        </div>
                                    </div>
                                    <div className="pt-7 mt-7 border-t border-slate-100 flex items-center justify-between gap-4 relative z-10">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Best for</p>
                                            <p className="text-sm font-extrabold text-slate-700 mt-1">{dept.highlight}</p>
                                        </div>
                                        <button
                                            onClick={() => handleQuickAction('/patient/book')}
                                            className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-4 py-2 text-xs font-extrabold text-primary transition-all hover:bg-primary hover:text-white"
                                        >
                                            Find Doctors
                                            <span className="material-symbols-outlined text-sm font-bold group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* TESTIMONIALS SECTION */}
                {reviews.length > 0 && (
                    <section className="py-20 bg-white border-t border-slate-200/60 relative">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                                <span className="text-[#86AE3A] font-black text-xs uppercase tracking-widest bg-[#86AE3A]/5 px-4.5 py-2 rounded-full">Patient Stories</span>
                                <h2 className="text-3xl font-black text-slate-900 font-headline tracking-tight mt-3">What Our Patients Say</h2>
                                <p className="text-slate-500 font-medium text-base">Read authentic feedback submitted by verified patients who have used Colombo General's MediAssist platform.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {reviews.map((r, idx) => (
                                    <div key={idx} className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100 relative flex flex-col justify-between hover:shadow-md transition-all duration-300">
                                        <span className="material-symbols-outlined text-6xl text-primary/10 absolute top-4 right-4 pointer-events-none select-none font-bold">format_quote</span>
                                        <div className="space-y-4">
                                            <div className="flex gap-1 text-amber-500">
                                                {[...Array(r.rating || 5)].map((_, i) => (
                                                    <span key={i} className="material-symbols-outlined text-sm font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                                ))}
                                            </div>
                                            <p className="text-slate-600 text-xs font-bold leading-relaxed italic relative z-10">
                                                "{r.review_text || r.comment || "Extremely helpful and modern receptionist system. Saved a lot of my time!"}"
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3 pt-6 mt-6 border-t border-slate-200/50">
                                            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                                {(r.patient_name || 'P').charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-extrabold text-slate-800 text-xs">{r.patient_name || "Verified Patient"}</h4>
                                                <p className="text-[9px] font-bold text-slate-400">{r.date || "Patient"}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}
            </main>

            {/* FOOTER */}
            <footer className="bg-slate-950 text-white pt-12 sm:pt-16 pb-12 z-20 border-t border-slate-900 relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,_rgba(0,93,182,0.22),_transparent_60%)] pointer-events-none" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="mb-10 rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-sm px-5 py-5 sm:px-7 sm:py-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div className="max-w-2xl text-left">
                            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-primary/90 mb-2">Need Help Fast?</p>
                            <h3 className="text-2xl sm:text-3xl font-black font-headline tracking-tight text-white">Everything a patient usually needs is one tap away.</h3>
                            <p className="text-sm text-slate-300 font-medium mt-2 leading-relaxed">
                                Use the quick links below to book care, check queue movement, or reach the digital assistant without hunting through the page.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full lg:max-w-xl">
                            {footerQuickLinks.map((link) => (
                                <button
                                    key={link.path}
                                    onClick={() => handleQuickAction(link.path)}
                                    className="group flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-left transition-all hover:border-primary/40 hover:bg-slate-900"
                                >
                                    <span className="flex items-center gap-3 min-w-0">
                                        <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{link.icon}</span>
                                        </span>
                                        <span className="text-sm font-extrabold text-white truncate">{link.label}</span>
                                    </span>
                                    <span className="material-symbols-outlined text-base text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all">arrow_forward</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-10 border-b border-slate-900 pb-14">
                    {/* Column 1: Info */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <Logo size="sm" showSubtitle={false} dark={true} />
                        </div>
                        <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-sm">
                            MediAssist is Colombo General Hospital&apos;s unified digital receptionist and patient service platform, built to reduce waiting, confusion, and unnecessary travel.
                        </p>
                    </div>

                    {/* Column 2: Quick Links */}
                    <div className="space-y-6">
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-300">Patient Services</h4>
                        <ul className="space-y-3.5 text-sm font-bold text-slate-400">
                            {footerQuickLinks.map((link) => (
                                <li key={link.path}>
                                    <button
                                        onClick={() => handleQuickAction(link.path)}
                                        className="group flex items-center gap-2 text-left hover:text-white transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-base text-slate-600 group-hover:text-primary transition-colors">{link.icon}</span>
                                        <span>{link.label}</span>
                                    </button>
                                </li>
                            ))}
                            <li>
                                <button
                                    onClick={() => navigate('/patient/map')}
                                    className="group flex items-center gap-2 text-left hover:text-white transition-colors"
                                >
                                    <span className="material-symbols-outlined text-base text-slate-600 group-hover:text-primary transition-colors">map</span>
                                    <span>View Hospital Map</span>
                                </button>
                            </li>
                        </ul>
                    </div>

                    {/* Column 3: Hours */}
                    <div className="space-y-6">
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-300">OPD & Clinic Hours</h4>
                        <ul className="space-y-3 text-sm font-bold text-slate-400 leading-relaxed">
                            <li className="flex justify-between gap-4 border-b border-slate-900 pb-2"><span>OPD General</span> <span className="text-slate-200 text-right">24 Hours / 7 Days</span></li>
                            <li className="flex justify-between gap-4 border-b border-slate-900 pb-2"><span>Specialist Clinics</span> <span className="text-slate-200 text-right">08:00 AM - 08:00 PM</span></li>
                            <li className="flex justify-between gap-4 border-b border-slate-900 pb-2"><span>Laboratory Center</span> <span className="text-slate-200 text-right">06:00 AM - 10:00 PM</span></li>
                            <li className="flex justify-between gap-4"><span>AI Assistance</span> <span className="text-[#86AE3A] text-right">24 Hours Online</span></li>
                        </ul>
                    </div>

                    {/* Column 4: Location */}
                    <div className="space-y-6">
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-300">Hospital Central</h4>
                        <p className="text-slate-400 text-sm font-medium leading-relaxed">
                            Colombo Central General Hospital,<br />
                            42, Health Avenue, Colombo 03,<br />
                            Sri Lanka.
                        </p>
                        <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-900 shadow-inner space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-2xl text-primary font-bold animate-pulse">emergency</span>
                                <div>
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Emergency Hotline</p>
                                    <p className="text-base font-black text-red-500 mt-0.5">+94 (11) 244 4242</p>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate('/patient/map')}
                                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-extrabold text-slate-200 hover:bg-white/10 transition-colors flex items-center justify-between"
                            >
                                Open Hospital Map
                                <span className="material-symbols-outlined text-base">north_east</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-slate-600 font-bold text-[10px] uppercase tracking-wider">
                    <p>© 2026 Colombo Central General Hospital. All rights reserved.</p>
                    <div className="flex gap-6">
                        <a href="#privacy" className="hover:text-slate-400 transition-colors">Privacy Policy</a>
                        <a href="#terms" className="hover:text-slate-400 transition-colors">Terms of Service</a>
                    </div>
                </div>
                </div>
            </footer>
        </div>
    );
};

export default PatientLanding;
