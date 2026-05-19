import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../../components/common/Logo';
import PatientHeader from '../../components/common/PatientHeader';
import { apiService } from '../../services/apiService';
import { socketService } from '../../services/socketService';

// Import kiosk styles for premium visual fidelity
import '../kiosk/KioskSearchDoctors.css';
import '../kiosk/KioskSessions.css';

// ─── Specialties Filter Data ──────────────────────────────────────────────────
const SPECIALTIES = [
    { label: 'All', icon: 'grid_view' },
    { label: 'Cardiologist', icon: 'favorite' },
    { label: 'Neurologist', icon: 'neurology' },
    { label: 'Pediatrician', icon: 'child_care' },
    { label: 'Endocrinologist', icon: 'water_drop' },
    { label: 'Orthopedist', icon: 'orthopedics' },
    { label: 'Ophthalmologist', icon: 'visibility' },
];

// ─── Date Generation Helper (14-day booking window) ──────────────────────────
const generateDates = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const today = new Date();
    return Array.from({ length: 14 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        return {
            dayName: days[d.getDay()],
            date: d.getDate(),
            month: months[d.getMonth()],
            iso: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
            isWeekend: d.getDay() === 0 || d.getDay() === 6,
            isToday: i === 0,
        };
    });
};

const DATES = generateDates();

const BookingPage = () => {
    const navigate = useNavigate();
    const [patient, setPatient] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [step, setStep] = useState(1); // 1: Search Doctor, 2: Slot & Symptoms, 3: Secure Checkout, 4: Success Ticket
    
    // Step 1: Doctor Directory Filter States
    const [doctors, setDoctors] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSpecialty, setSpecialty] = useState('All');
    const [dateFilter, setDateFilter] = useState('');
    const [loadingDoctors, setLoadingDoctors] = useState(true);

    // Step 2: Slot Picker States
    const [selectedSpecialist, setSelectedSpecialist] = useState(null);
    const [bookingDate, setBookingDate] = useState(DATES[0].iso);
    const [selectedSession, setSelectedSession] = useState(null);
    const [symptom, setSymptom] = useState('General consultation');
    const [sessions, setSessions] = useState([]);
    const [loadingSessions, setLoadingSessions] = useState(false);
    const [bookingError, setBookingError] = useState('');

    // Step 3: Payment States
    const [paymentMethod, setPaymentMethod] = useState('payhere'); // 'payhere' | 'counter'
    const [processingPayment, setProcessingPayment] = useState(false);
    const [createdAppointment, setCreatedAppointment] = useState(null);
    const [transactionId, setTransactionId] = useState('');
    const [warnings, setWarnings] = useState([]);

    // ─── Fetch Doctors & Departments ──────────────────────────────────────────
    const fetchDoctorsAndDepts = useCallback(async () => {
        try {
            const [specData, deptData] = await Promise.all([
                apiService.getSpecialists(),
                apiService.getDepartments()
            ]);

            if (specData) {
                const mapped = specData.map(d => ({
                    id: d.id,
                    name: d.name ? (d.title ? `${d.title} ${d.name}` : `Dr. ${d.name}`) : 'Unknown Doctor',
                    specialty: d.specialization || d.department || 'General Practice',
                    rating: d.rating || 4.8,
                    reviews: Math.floor(Math.random() * 20) + 30, // 30-50 mock reviews for visual look
                    nextSlot: d.sessions && d.sessions.length > 0 ? `${d.sessions[0].day_of_week || 'Session'} ${d.sessions[0].start_time}` : 'Not Available',
                    featured: d.rating >= 4.8,
                    photo: d.profile_image || null,
                    bio: d.bio || 'Expert specialist providing comprehensive medical care and diagnostics with a focus on patient well-being.',
                    languages: d.languages || 'English, Sinhala',
                    consultation_fee: d.consultation_fee || 4000,
                    sessions: d.sessions || []
                }));
                setDoctors(mapped);
            }
            if (deptData) {
                setDepartments(deptData);
            }
        } catch (err) {
            console.error("Failed to load doctor database:", err);
        } finally {
            setLoadingDoctors(false);
        }
    }, []);

    // ─── Initial Security & Real-Time Socket Binding ────────────────────────
    useEffect(() => {
        const savedPatient = localStorage.getItem('activePatient');
        if (savedPatient) {
            setPatient(JSON.parse(savedPatient));
        }

        fetchDoctorsAndDepts();

        socketService.connect();
        const handleRealtimeUpdate = () => {
            fetchDoctorsAndDepts();
        };

        socketService.on('specialist_updated', handleRealtimeUpdate);
        socketService.on('appointment_booked', handleRealtimeUpdate);
        socketService.on('appointment_rescheduled', handleRealtimeUpdate);
        socketService.on('queue_updated', handleRealtimeUpdate);

        return () => {
            socketService.off('specialist_updated', handleRealtimeUpdate);
            socketService.off('appointment_booked', handleRealtimeUpdate);
            socketService.off('appointment_rescheduled', handleRealtimeUpdate);
            socketService.off('queue_updated', handleRealtimeUpdate);
        };
    }, [fetchDoctorsAndDepts]);

    // ─── Specialist Slot Fetcher (Step 2) ─────────────────────────────────────
    const fetchAvailableSessions = useCallback(async (specId, dateVal) => {
        setLoadingSessions(true);
        setSelectedSession(null);
        try {
            const list = await apiService.getSpecialistAvailability(specId, dateVal);
            setSessions(list || []);
        } catch (err) {
            console.error("Failed to fetch slots for date:", err);
            setSessions([]);
        } finally {
            setLoadingSessions(false);
        }
    }, []);

    useEffect(() => {
        if (selectedSpecialist && bookingDate) {
            fetchAvailableSessions(selectedSpecialist.id, bookingDate);
        }
    }, [bookingDate, selectedSpecialist, fetchAvailableSessions]);

    // Reset selected slot when changing date
    useEffect(() => {
        setSelectedSession(null);
    }, [bookingDate]);

    // ─── Actions & Booking Creation ───────────────────────────────────────────
    const selectSpecialist = (doc) => {
        const savedPatient = localStorage.getItem('activePatient');
        if (!savedPatient && !patient) {
            navigate('/patient/login', { state: { redirectTo: '/patient/book' } });
            return;
        }
        setSelectedSpecialist(doc);
        setBookingDate(DATES[0].iso);
        setSymptom('General consultation');
        setStep(2);
    };

    const handleCreateBooking = async (e) => {
        e.preventDefault();
        if (!selectedSpecialist || !bookingDate || !selectedSession || !symptom.trim()) {
            setBookingError("Please select a session slot and describe symptoms/concern.");
            return;
        }

        setBookingError('');
        setProcessingPayment(true);
        
        try {
            // Parse start_time to ISO DateTime
            let appointmentDateStr = bookingDate;
            if (selectedSession.start_time) {
                const [time, ampm] = selectedSession.start_time.split(' ');
                let [hours, minutes] = time.split(':');
                hours = parseInt(hours);
                if (ampm?.toLowerCase() === 'pm' && hours < 12) hours += 12;
                if (ampm?.toLowerCase() === 'am' && hours === 12) hours = 0;
                
                appointmentDateStr = `${bookingDate}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
            } else {
                appointmentDateStr = `${bookingDate}T09:00:00`;
            }

            const payload = {
                full_name: patient.full_name || patient.name,
                phone_number: patient.phone_number || patient.phone,
                specialist_id: selectedSpecialist.id,
                symptom: symptom,
                appointment_date: appointmentDateStr,
                doctor_session_id: selectedSession.id,
                patient_id: patient.id
            };

            const result = await apiService.bookAppointment(payload);
            if (result) {
                setCreatedAppointment(result);
                setStep(3); // Proceed to secure payment checkout
            } else {
                setBookingError("Failed to issue provisional clinic token.");
            }
        } catch (err) {
            setBookingError(err.response?.data?.message || err.message || "Failed to create appointment booking.");
        } finally {
            setProcessingPayment(false);
        }
    };

    // Online Sandbox PayHere Payment Gateway Checkout
    const handlePayHerePayment = async () => {
        if (!createdAppointment) return;
        const apptId = createdAppointment.appointment_id || createdAppointment.id;
        const specFee = parseInt(selectedSpecialist.consultation_fee) || 4000;
        const totalAmount = specFee + 500;

        if (!window.payhere) {
            alert("PayHere checkout scripts are currently loading. Verify connection or try again.");
            return;
        }

        setProcessingPayment(true);
        try {
            // 1. Fetch Flask secured PayHere hash configuration
            const response = await apiService.getPayHereHash(apptId, totalAmount);
            const checkoutConfig = response.data || response;

            // 2. Set completion routing redirects
            checkoutConfig.return_url = window.location.origin + "/patient/dashboard";
            checkoutConfig.cancel_url = window.location.href;
            checkoutConfig.notify_url = "http://localhost:5000/api/payment/payhere-notify";

            // 3. Mount secure iframe transaction observers
            window.payhere.onCompleted = async function onCompleted(orderId) {
                setProcessingPayment(true);
                try {
                    const confirmRes = await apiService.confirmPayment({
                        appointment_id: apptId,
                        amount: totalAmount,
                        payment_method: 'Online (PayHere Sandbox)',
                        transaction_id: orderId || `PH-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
                    });
                    
                    if (confirmRes) {
                        setTransactionId(orderId || confirmRes.data?.transaction_id || `PH-${Math.random().toString(36).substr(2, 9).toUpperCase()}`);
                        setWarnings(confirmRes.data?.warnings || []);
                        setStep(4); // Advance to ticket success screen
                    }
                } catch (confirmErr) {
                    alert("Online payment cleared, but ticket confirmation encountered an issue. Contact front desk.");
                    setStep(3);
                } finally {
                    setProcessingPayment(false);
                }
            };

            window.payhere.onDismissed = function onDismissed() {
                setProcessingPayment(false);
            };

            window.payhere.onError = function onError(error) {
                alert(`PayHere secure payment failed: ${error}`);
                setProcessingPayment(false);
            };

            // 4. Render standard PayHere checkout popup
            window.payhere.startPayment(checkoutConfig);
            
        } catch (err) {
            alert(err.message || "Failed to initialize PayHere secure gateway.");
            setProcessingPayment(false);
        }
    };

    // Cash at Counter checkout confirmation
    const handleCounterPayment = async () => {
        if (!createdAppointment) return;
        const apptId = createdAppointment.appointment_id || createdAppointment.id;
        const specFee = parseInt(selectedSpecialist.consultation_fee) || 4000;
        const totalAmount = specFee + 500;

        setProcessingPayment(true);
        const randomTxn = `TKT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        setTransactionId(randomTxn);

        try {
            const response = await apiService.confirmPayment({
                appointment_id: apptId,
                amount: totalAmount,
                payment_method: 'Cash at Counter',
                transaction_id: randomTxn
            });
            if (response) {
                setWarnings(response.data?.warnings || []);
                setStep(4);
            }
        } catch (err) {
            alert("Failed to confirm provisional counter reservation.");
        } finally {
            setProcessingPayment(false);
        }
    };

    // ─── Filter Logic for Step 1 ──────────────────────────────────────────────
    const filteredDoctors = doctors.filter((d) => {
        const nameStr = d.name || '';
        const specStr = d.specialty || '';
        
        const matchName = nameStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          specStr.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchSpec = activeSpecialty === 'All' || 
                         specStr.toLowerCase().includes(activeSpecialty.toLowerCase().replace('ist', '')) ||
                         activeSpecialty.toLowerCase().includes(specStr.toLowerCase().replace('ology', ''));
        
        let matchDate = true;
        if (dateFilter) {
            try {
                const searchDate = new Date(dateFilter);
                if (!isNaN(searchDate.getTime())) {
                    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    const searchDay = days[searchDate.getDay()];
                    matchDate = d.sessions && d.sessions.some(sess => sess.day_of_week === searchDay);
                }
            } catch (e) {
                console.error("Invalid search date filter:", e);
            }
        }

        return matchName && matchSpec && matchDate;
    });

    const consultationFee = selectedSpecialist ? parseInt(selectedSpecialist.consultation_fee) || 4000 : 4000;
    const hospitalFee = 500;
    const totalCost = consultationFee + hospitalFee;

    // Filter sessions by selected date's day of week
    const dateObj = new Date(bookingDate);
    const dayOfWeek = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(dateObj);

    // Group active sessions for the slots layout
    const groupedSessions = {
        morning: sessions.filter(s => parseInt(s.start_time.split(':')[0]) < 12),
        afternoon: sessions.filter(s => {
            const h = parseInt(s.start_time.split(':')[0]);
            return h >= 12 && h < 17;
        }),
        evening: sessions.filter(s => parseInt(s.start_time.split(':')[0]) >= 17)
    };

    const slotIcon = { morning: 'light_mode', afternoon: 'partly_cloudy_day', evening: 'dark_mode' };
    const slotColor = { morning: 'text-orange-400', afternoon: 'text-blue-400', evening: 'text-indigo-400' };
    const slotLabel = { morning: 'Morning Sessions', afternoon: 'Afternoon Sessions', evening: 'Evening Sessions' };

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-body text-slate-800 flex flex-col relative selection:bg-primary selection:text-white overflow-x-hidden">
            <PatientHeader />

            <main className="z-10 flex flex-col flex-grow">
                <div className="max-w-6xl mx-auto w-full px-4 py-10 sm:px-6 lg:px-8 space-y-8 animate-fade-in">
                    
                    {/* ─── Premium Step Wizard Stepper ─── */}
                    <div className="max-w-xl mx-auto mb-8">
                        <div className="flex justify-between items-center relative">
                            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
                            <div 
                                className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 z-0 transition-all duration-300" 
                                style={{ width: `${((step - 1) / 3) * 100}%` }}
                            />
                            
                            {[
                                { num: 1, label: 'Search Doctor' },
                                { num: 2, label: 'Pick Session' },
                                { num: 3, label: 'Checkout' },
                                { num: 4, label: 'Success Ticket' }
                            ].map((s) => (
                                <div key={s.num} className="flex flex-col items-center gap-2 relative z-10">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs border transition-all ${
                                        step >= s.num 
                                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105' 
                                        : 'bg-white text-slate-400 border-slate-200'
                                    }`}>
                                        {s.num}
                                    </div>
                                    <span className={`text-[9px] font-black uppercase tracking-wider ${step >= s.num ? 'text-primary' : 'text-slate-400'}`}>{s.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ─── STEP 1: DOCTORS DIRECTORY (Same UI as KioskSearchDoctors) ─── */}
                    {step === 1 && (
                        <div className="space-y-6 animate-fade-in text-left">
                            <div className="mb-4">
                                <h1 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight leading-none">Find your specialist</h1>
                                <p className="text-slate-500 font-bold text-sm mt-1.5">Browse professional specialist clinic rosters, ratings, and book sessions instantly.</p>
                            </div>

                            {/* Search and Filters Strip */}
                            <div className="bg-white p-5 rounded-[2rem] shadow-[0_8px_30px_rgba(0,71,141,0.05)] border border-slate-100 mb-6">
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                    <div className="md:col-span-4 space-y-1">
                                        <label className="text-[10px] font-bold text-outline uppercase tracking-wider px-1">Doctor Name / Keyword</label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
                                            <input 
                                                className="search-input w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-sm font-bold placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all" 
                                                placeholder="Search by name or keyword…" 
                                                value={searchQuery} 
                                                onChange={(e) => setSearchQuery(e.target.value)} 
                                                type="text" 
                                            />
                                        </div>
                                    </div>
                                    <div className="md:col-span-3 space-y-1">
                                        <label className="text-[10px] font-bold text-outline uppercase tracking-wider px-1">Specialization</label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px] pointer-events-none">medical_information</span>
                                            <select 
                                                className="search-input w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-sm font-bold appearance-none cursor-pointer focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all" 
                                                value={activeSpecialty} 
                                                onChange={(e) => setSpecialty(e.target.value)}
                                            >
                                                {SPECIALTIES.map((s) => (<option key={s.label}>{s.label}</option>))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="md:col-span-3 space-y-1">
                                        <label className="text-[10px] font-bold text-outline uppercase tracking-wider px-1">Clinic Date</label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px] pointer-events-none">calendar_today</span>
                                            <input 
                                                className="search-input w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all" 
                                                type="date" 
                                                value={dateFilter} 
                                                onChange={(e) => setDateFilter(e.target.value)} 
                                                min={new Date().toISOString().split('T')[0]} 
                                            />
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <button 
                                            onClick={() => { setSearchQuery(''); setSpecialty('All'); setDateFilter(''); }}
                                            className="w-full py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">close</span>
                                            Reset
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Specialties Pills Row */}
                            <div className="flex items-center gap-2.5 mb-6 overflow-x-auto no-scrollbar shrink-0 pb-1">
                                {SPECIALTIES.map((s) => (
                                    <button 
                                        key={s.label} 
                                        onClick={() => setSpecialty(s.label)} 
                                        className={`spec-chip shrink-0 ${activeSpecialty === s.label ? 'active' : ''}`}
                                    >
                                        <span className="material-symbols-outlined text-[16px]" style={activeSpecialty === s.label ? { fontVariationSettings: "'FILL' 1" } : {}}>{s.icon}</span>
                                        {s.label}
                                    </button>
                                ))}
                            </div>

                            {/* Grid of Doctor Cards */}
                            {loadingDoctors ? (
                                <div className="py-20 text-center flex flex-col items-center justify-center">
                                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Loading specialists database...</p>
                                </div>
                            ) : filteredDoctors.length === 0 ? (
                                <div className="bg-white rounded-[2.5rem] p-16 border border-slate-100 text-center space-y-4 shadow-sm">
                                    <span className="material-symbols-outlined text-slate-300 text-6xl">search_off</span>
                                    <p className="text-slate-400 font-bold text-sm">No specialists matching your criteria were found on-duty.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pb-6">
                                    {filteredDoctors.map((doc) => {
                                        const { id, name, specialty, rating, reviews, photo, featured, consultation_fee } = doc;
                                        return (
                                            <div 
                                                key={id}
                                                onClick={() => selectSpecialist(doc)}
                                                className={`doctor-card bg-white rounded-[2rem] p-6 border transition-all cursor-pointer flex flex-col justify-between hover:scale-[1.01] hover:shadow-xl ${
                                                    featured ? 'border-primary/20 shadow-[0_8px_30px_rgba(0,93,182,0.02)]' : 'border-slate-100'
                                                }`}
                                            >
                                                <div className="space-y-4">
                                                    {/* Doctor Avatar / Details Row */}
                                                    <div className="flex gap-4.5 items-start">
                                                        <div className="shrink-0 relative">
                                                            {photo ? (
                                                                <img
                                                                    alt={name}
                                                                    src={photo}
                                                                    className="doctor-photo w-16 h-16 rounded-2xl object-cover border border-slate-100"
                                                                />
                                                            ) : (
                                                                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/5 text-primary">
                                                                    <span className="material-symbols-outlined text-3xl">medical_information</span>
                                                                </div>
                                                            )}
                                                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center" title="Verified Specialist">
                                                                <span className="material-symbols-outlined text-[10px] text-white font-bold">check</span>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-col justify-center min-w-0 text-left">
                                                            <span className="text-[8px] font-black uppercase tracking-widest text-primary bg-primary/5 border border-primary/10 px-2 py-0.5 rounded-md w-fit mb-1">
                                                                {specialty}
                                                            </span>
                                                            <h3 className="text-base font-black text-slate-800 font-headline leading-tight truncate">{name}</h3>
                                                            <div className="flex items-center gap-1 mt-1">
                                                                <span className="material-symbols-outlined text-amber-400 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                                                <span className="text-xs font-black text-slate-700">{rating}</span>
                                                                <span className="text-[10px] text-slate-400 font-bold">({reviews} reviews)</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Availability Preview */}
                                                    <div className="bg-slate-50 border border-slate-100/50 rounded-2xl p-3 space-y-1.5 text-left">
                                                        <p className="text-[9px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-[14px]">calendar_clock</span>
                                                            Clinic Schedule
                                                        </p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {doc.sessions && doc.sessions.length > 0 ? (
                                                                doc.sessions.slice(0, 3).map((sess, idx) => (
                                                                    <div key={idx} className="bg-white px-2 py-1 rounded-lg border border-slate-200/40 text-[9px] font-bold text-slate-700">
                                                                        {(sess.day_of_week || 'N/A').slice(0,3)} • {sess.start_time}
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <span className="text-[9px] font-bold text-slate-400 italic px-1">No sessions scheduled</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="pt-4.5 border-t border-slate-100 mt-5 flex justify-between items-center text-left">
                                                    <div>
                                                        <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Consultation Fee</span>
                                                        <span className="text-sm font-black text-primary">Rs. {(parseInt(consultation_fee) || 4000).toLocaleString()}</span>
                                                    </div>
                                                    <button className="px-4 py-2.5 bg-primary text-white hover:bg-primary-container rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-sm">
                                                        Book Clinic
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ─── STEP 2: DATES, TIME SLOTS, SYMPTOMS (KioskSessions Integrated Flow) ─── */}
                    {step === 2 && selectedSpecialist && (
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12 text-left animate-fade-in mb-6">
                            
                            {/* Left Column: Doctor Demographics Panel */}
                            <div className="md:col-span-4 bg-gradient-to-b from-primary to-blue-800 p-8 text-white flex flex-col justify-between relative overflow-hidden">
                                <div className="doctor-photo-glow" />
                                
                                <div className="space-y-6 relative z-10">
                                    <button 
                                        onClick={() => setStep(1)}
                                        className="px-4 py-2 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all flex items-center gap-1 text-white border border-white/10 leading-none"
                                    >
                                        <span className="material-symbols-outlined text-xs">arrow_back</span>
                                        Specialist Directory
                                    </button>

                                    <div className="space-y-4">
                                        <div className="relative w-20 h-20">
                                            {selectedSpecialist.photo ? (
                                                <img
                                                    alt={selectedSpecialist.name}
                                                    src={selectedSpecialist.photo}
                                                    className="w-20 h-20 rounded-[1.5rem] object-cover border-2 border-white/20 shadow-md"
                                                />
                                            ) : (
                                                <div className="w-20 h-20 rounded-[1.5rem] bg-white/15 border-2 border-white/10 flex items-center justify-center text-white shadow-md">
                                                    <span className="material-symbols-outlined text-4xl">medical_information</span>
                                                </div>
                                            )}
                                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center shadow">
                                                <span className="material-symbols-outlined text-[12px] text-white font-black">check</span>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <span className="px-2.5 py-0.5 bg-white/20 border border-white/10 rounded text-[9px] font-black uppercase tracking-widest leading-none text-white w-fit block">
                                                {selectedSpecialist.specialty}
                                            </span>
                                            <h3 className="text-xl font-black font-headline tracking-tight">Dr. {selectedSpecialist.name}</h3>
                                            <div className="flex items-center gap-1 text-white/80 text-xs">
                                                <span className="material-symbols-outlined text-amber-300 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                                <span className="font-extrabold">{selectedSpecialist.rating}</span>
                                                <span className="text-[10px] text-white/50 font-bold">({selectedSpecialist.reviews} Verified Reviews)</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* About / Languages */}
                                    <div className="space-y-4 border-t border-white/10 pt-5 text-white/90">
                                        <div>
                                            <h4 className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1.5">Specialist Profile</h4>
                                            <p className="text-xs leading-relaxed text-white/70 line-clamp-4">{selectedSpecialist.bio}</p>
                                        </div>
                                        <div>
                                            <h4 className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1.5">Languages Spoken</h4>
                                            <div className="flex flex-wrap gap-1">
                                                {(selectedSpecialist.languages ? selectedSpecialist.languages.split(',') : ['English', 'Sinhala']).map((lang) => (
                                                    <span key={lang} className="px-2 py-0.5 bg-white/10 border border-white/5 rounded-md text-[9px] font-bold text-white uppercase tracking-wider">
                                                        {lang.trim()}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-[10px] font-bold text-white/50 leading-relaxed space-y-1 mt-6 relative z-10">
                                    <h4 className="font-extrabold text-white text-xs uppercase tracking-wider">Room Allocation: {selectedSpecialist.room_number || 'OPD Consulting 3'}</h4>
                                    <p>Your clinic entry pass is generated immediately upon secure transaction settlement.</p>
                                </div>
                            </div>

                            {/* Right Column: Sessions / Slot Selection Panel */}
                            <form onSubmit={handleCreateBooking} className="md:col-span-8 p-8 sm:p-10 flex flex-col justify-between min-h-[500px]">
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-800 font-headline leading-none">Choose Your Session</h2>
                                        <p className="text-slate-400 font-bold text-xs mt-1">Select an available clinic roster slot for Dr. {selectedSpecialist.name}</p>
                                    </div>

                                    {/* Horizontal Date Picker Scrolling track (14 Days) */}
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Available Dates</p>
                                        <div className="date-scroll-track pb-2">
                                            {DATES.map((d) => {
                                                const isSelected = bookingDate === d.iso;
                                                const dObj = new Date(d.iso);
                                                const dNameFull = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(dObj);
                                                const hasSessions = (selectedSpecialist.sessions || []).some(s => {
                                                    if (s.session_date) {
                                                        return s.session_date === d.iso;
                                                    }
                                                    return s.day_of_week === dNameFull;
                                                });

                                                return (
                                                    <button
                                                        key={d.iso}
                                                        type="button"
                                                        onClick={() => setBookingDate(d.iso)}
                                                        className={`date-card relative flex flex-col items-center py-3 px-4.5 rounded-2xl border transition-all min-w-[70px] ${
                                                            isSelected
                                                            ? 'bg-primary text-white shadow-xl shadow-primary/20 border-transparent scale-105 z-10 font-black'
                                                            : hasSessions
                                                                ? 'bg-primary/5 border-primary/20 hover:bg-primary/10 cursor-pointer text-slate-700 font-bold'
                                                                : 'border-slate-100 hover:bg-slate-50 cursor-pointer opacity-60 text-slate-400'
                                                        }`}
                                                    >
                                                        {hasSessions && !isSelected && (
                                                            <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                                                        )}
                                                        <span className={`text-[9px] font-black uppercase mb-1 tracking-wider ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                                                            {d.dayName}
                                                        </span>
                                                        <span className="text-lg font-black leading-none">{d.date}</span>
                                                        {d.isToday && (
                                                            <div className={`mt-1.5 px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase tracking-tighter ${isSelected ? 'bg-white/20 text-white' : 'bg-primary/15 text-primary'}`}>
                                                                Today
                                                            </div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Grouped Time Sessions (Morning, Afternoon, Evening) */}
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Available Roster Slots</p>
                                        
                                        {loadingSessions ? (
                                            <div className="py-10 text-center animate-pulse flex flex-col items-center justify-center">
                                                <div className="w-10 h-10 border-4 border-slate-100 border-t-primary rounded-full animate-spin mb-2" />
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Checking real-time bookings...</p>
                                            </div>
                                        ) : sessions.length === 0 ? (
                                            <div className="py-8 text-center bg-slate-50 border-2 border-dashed border-slate-200/50 rounded-2xl flex flex-col items-center justify-center">
                                                <span className="material-symbols-outlined text-3xl text-slate-300 mb-1">event_busy</span>
                                                <p className="text-xs font-black text-slate-500 uppercase tracking-widest">No active sessions on this day</p>
                                                <p className="text-[10px] text-slate-400 mt-0.5">Please pick another highlighted date from the calendar timeline.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar text-left">
                                                {['morning', 'afternoon', 'evening'].map((period) => (
                                                    groupedSessions[period].length > 0 && (
                                                        <div key={period} className="space-y-2">
                                                            <div className="flex items-center gap-1.5 px-1">
                                                                <span className={`material-symbols-outlined text-sm ${slotColor[period]}`}>{slotIcon[period]}</span>
                                                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{slotLabel[period]}</h4>
                                                            </div>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                {groupedSessions[period].map((sess, idx) => {
                                                                    const slotId = sess.id;
                                                                    const isSelected = selectedSession && selectedSession.id === slotId;
                                                                    const isFull = (sess.current_bookings || 0) >= sess.max_patients;
                                                                    return (
                                                                        <button
                                                                            key={idx}
                                                                            type="button"
                                                                            onClick={() => !isFull && setSelectedSession(sess)}
                                                                            disabled={isFull}
                                                                            className={`time-slot p-4 rounded-2xl border text-left transition-all ${
                                                                                isSelected
                                                                                ? 'border-primary bg-primary/5 shadow-md shadow-primary/5'
                                                                                : isFull
                                                                                    ? 'border-red-100 bg-red-50/10 cursor-not-allowed opacity-50'
                                                                                    : 'border-slate-100 bg-slate-50 hover:border-primary/20 hover:bg-white'
                                                                            }`}
                                                                        >
                                                                            <div className="flex justify-between items-start mb-2.5">
                                                                                <span className={`text-sm font-black ${isSelected ? 'text-primary' : isFull ? 'text-red-500' : 'text-slate-700'}`}>
                                                                                    {sess.start_time}
                                                                                </span>
                                                                                <span className={`text-[8px] font-black px-2 py-0.5 rounded ${
                                                                                    isSelected ? 'bg-primary/10 text-primary' : isFull ? 'bg-red-100 text-red-600' : 'bg-white border border-slate-200/50 text-slate-500'
                                                                                }`}>
                                                                                    {isFull ? 'FULL' : (sess.session_number ? `Sess ${sess.session_number} • ` : '') + (sess.room_number || sess.room || 'Room 3')}
                                                                                </span>
                                                                            </div>

                                                                            <div className="space-y-1">
                                                                                <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-tight text-slate-400">
                                                                                    <span>Session Load</span>
                                                                                    <span className={isSelected ? 'text-primary' : ''}>
                                                                                        {sess.current_bookings || 0} / {sess.max_patients}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="h-1 w-full bg-slate-200/70 rounded-full overflow-hidden">
                                                                                    <div
                                                                                        className={`h-full transition-all duration-1000 ${isSelected ? 'bg-primary' : 'bg-slate-400'}`}
                                                                                        style={{ width: `${Math.min(100, ((sess.current_bookings || 0) / sess.max_patients) * 100)}%` }}
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Patient Symptom Notes description */}
                                    <div className="space-y-1.5 text-left">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Symptom Notes / Clinical Description</label>
                                        <textarea 
                                            rows="2.5"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-primary rounded-xl text-xs font-bold focus:outline-none focus:bg-white transition-all resize-none placeholder:text-slate-400"
                                            placeholder="Write brief description of patient symptoms, durations, or clinic consulting focus..."
                                            value={symptom}
                                            onChange={(e) => setSymptom(e.target.value)}
                                            required
                                        />
                                    </div>

                                    {bookingError && (
                                        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-start gap-2.5 border border-red-100/50">
                                            <span className="material-symbols-outlined text-lg font-bold shrink-0 mt-0.5">error</span>
                                            <span className="text-xs font-bold leading-relaxed">{bookingError}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Summary Breakdowns & Footer */}
                                <div className="border-t border-slate-100 pt-6 mt-6">
                                    <div className="flex items-center justify-between bg-slate-50 rounded-2xl p-4 mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-slate-100 shadow-sm">
                                                <span className="material-symbols-outlined text-primary text-[20px]">event_available</span>
                                            </div>
                                            <div>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Clinic Schedule Slot</p>
                                                <p className="text-xs font-black text-slate-800">
                                                    {selectedSession
                                                        ? `${dayOfWeek}, ${new Date(bookingDate).getDate()} ${new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(bookingDate))} • ${selectedSession.start_time}`
                                                        : 'Please select a session slot'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col gap-0.5">
                                            <div className="flex justify-end items-center gap-2">
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Clinic Fee</p>
                                                <p className="text-xs font-black text-slate-600">Rs. {consultationFee.toLocaleString()}</p>
                                            </div>
                                            <div className="flex justify-end items-center gap-2">
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Hospital Charge</p>
                                                <p className="text-xs font-black text-slate-600">Rs. {hospitalFee.toLocaleString()}</p>
                                            </div>
                                            <div className="mt-1 pt-1 border-t border-slate-200 text-right">
                                                <p className="text-lg font-black text-primary leading-none">Rs. {totalCost.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <button 
                                            type="button" 
                                            onClick={() => setStep(1)} 
                                            className="flex-1 py-3.5 px-6 bg-slate-100 hover:bg-slate-200 text-slate-500 font-black rounded-xl text-xs uppercase tracking-widest transition-all"
                                        >
                                            Back
                                        </button>
                                        <button 
                                            type="submit" 
                                            disabled={processingPayment || !bookingDate || !selectedSession || !symptom.trim()}
                                            className={`flex-[2] py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-1.5 ${
                                                bookingDate && selectedSession && symptom.trim() && !processingPayment
                                                ? 'bg-gradient-to-br from-primary to-primary-container text-white hover:scale-[1.01]'
                                                : 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none'
                                            }`}
                                        >
                                            {processingPayment ? "Securing clinic slots..." : "Confirm & Proceed to checkout"}
                                            <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* ─── STEP 3: SECURE CHECKOUT (Online PayHere SDK vs Cash Counter) ─── */}
                    {step === 3 && selectedSpecialist && createdAppointment && (
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12 text-left animate-fade-in mb-6">
                            {/* Order Summary sidebar */}
                            <div className="md:col-span-4 bg-gradient-to-b from-primary to-blue-800 p-8 text-white flex flex-col justify-between relative overflow-hidden">
                                <div className="doctor-photo-glow" />
                                <div className="space-y-6 relative z-10">
                                    <h3 className="text-lg font-black font-headline tracking-tight">Order Summary</h3>
                                    <div className="space-y-4 text-xs font-bold text-white/90">
                                        <div className="flex gap-3">
                                            <span className="material-symbols-outlined text-xl text-white/50">person</span>
                                            <div>
                                                <p className="text-[9px] text-white/40 uppercase tracking-wider">Specialist</p>
                                                <p className="font-headline font-black text-sm">Dr. {selectedSpecialist.name}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <span className="material-symbols-outlined text-xl text-white/50">calendar_today</span>
                                            <div>
                                                <p className="text-[9px] text-white/40 uppercase tracking-wider">Clinic Date</p>
                                                <p className="text-sm font-black">{bookingDate}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <span className="material-symbols-outlined text-xl text-white/50">schedule</span>
                                            <div>
                                                <p className="text-[9px] text-white/40 uppercase tracking-wider">Session Time</p>
                                                <p className="text-sm font-black">{selectedSession?.start_time} - {selectedSession?.end_time}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 border-t border-white/10 pt-6 relative z-10">
                                    <div className="flex justify-between items-center mb-2 text-xs font-bold text-white/60">
                                        <span>Consultation Fee</span>
                                        <span>Rs. {consultationFee.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-5 text-xs font-bold text-white/60">
                                        <span>Hospital Services Fee</span>
                                        <span>Rs. {hospitalFee.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-t border-dashed border-white/20 pt-4">
                                        <span className="text-xs font-black uppercase tracking-wider">Total Charge</span>
                                        <span className="text-2xl font-black font-headline text-[#86AE3A]">Rs. {totalCost.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Payment selections */}
                            <div className="md:col-span-8 p-8 sm:p-10 flex flex-col justify-between min-h-[500px]">
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-xl font-black text-slate-800 font-headline leading-none">Select Payment Method</h2>
                                        <p className="text-slate-400 font-bold text-xs mt-1">Settle dues securely online or confirm provisional appointment counter ticket.</p>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                                        <button 
                                            type="button"
                                            onClick={() => setPaymentMethod('payhere')}
                                            className={`p-5 rounded-2xl border-2 text-left flex flex-col justify-between min-h-[10.5rem] transition-all cursor-pointer relative overflow-hidden ${
                                                paymentMethod === 'payhere' 
                                                ? 'border-emerald-500 bg-emerald-50/5 ring-4 ring-emerald-500/5 shadow-sm' 
                                                : 'border-slate-100 hover:border-slate-300'
                                            }`}
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                                                <span className="material-symbols-outlined text-xl">credit_card</span>
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-black text-slate-800 font-headline">Online Sandbox Checkout</h3>
                                                <p className="text-[10px] text-slate-400 font-bold leading-relaxed mt-1">Pay instantly online using credit/debit cards or digital wallets. Simulates transactions securely.</p>
                                            </div>
                                        </button>

                                        <button 
                                            type="button"
                                            onClick={() => setPaymentMethod('counter')}
                                            className={`p-5 rounded-2xl border-2 text-left flex flex-col justify-between min-h-[10.5rem] transition-all cursor-pointer relative overflow-hidden ${
                                                paymentMethod === 'counter' 
                                                ? 'border-amber-500 bg-amber-50/5 ring-4 ring-amber-500/5 shadow-sm' 
                                                : 'border-slate-100 hover:border-slate-300'
                                            }`}
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                                                <span className="material-symbols-outlined text-xl">storefront</span>
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-black text-slate-800 font-headline">Pay at Hospital Counter</h3>
                                                <p className="text-[10px] text-slate-400 font-bold leading-relaxed mt-1">Issue a provisional booking ticket slot. Pay physically at billing front desk counter upon arrival.</p>
                                            </div>
                                        </button>
                                    </div>

                                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/50 flex items-start gap-3 text-left">
                                        <span className="material-symbols-outlined text-primary font-bold text-lg shrink-0 mt-0.5">verified_user</span>
                                        <div className="text-xs leading-relaxed text-slate-500 font-medium">
                                            {paymentMethod === 'payhere' ? (
                                                <p>Secure web portal billing is powered by PayHere Sandbox checkout config. Clicking payment CTA will open a sandbox transaction widget safely.</p>
                                            ) : (
                                                <p>Provisional pass is validated and kept reserved. Dues must be settled at hospital counter at least 15 minutes prior to session onset.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-6 border-t border-slate-100 mt-8">
                                    <button 
                                        type="button" 
                                        onClick={paymentMethod === 'payhere' ? handlePayHerePayment : handleCounterPayment}
                                        disabled={processingPayment}
                                        className={`w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-1.5 ${
                                            paymentMethod === 'payhere' 
                                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/10' 
                                            : 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/10'
                                        }`}
                                    >
                                        {processingPayment ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                <span>Processing Secure payment...</span>
                                            </div>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined text-sm font-bold">lock</span>
                                                <span>{paymentMethod === 'payhere' ? 'Pay Securely Online' : 'Generate Counter Ticket'}</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─── STEP 4: SUCCESS BARCODE CLINIC TICKET PASS ─── */}
                    {step === 4 && selectedSpecialist && createdAppointment && (
                        <div className="max-w-xl mx-auto space-y-8 animate-fade-in text-center mb-6">
                            <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xl shadow-emerald-500/20 mx-auto">
                                <span className="material-symbols-outlined text-3xl font-black">check</span>
                            </div>

                            <div className="space-y-1">
                                <h2 className="text-3xl font-black text-slate-800 font-headline leading-none">Appointment Confirmed!</h2>
                                <p className="text-slate-500 font-bold text-sm">Your specialist clinic token is issued successfully.</p>
                            </div>

                            {/* Secure Barcoded Clinical Ticket */}
                            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl relative overflow-hidden text-left p-6 sm:p-8">
                                <div className="absolute top-0 left-0 w-full h-2.5 bg-primary"></div>
                                
                                {/* Transaction Paid Stamp Overlay */}
                                <div className={`absolute -right-4 -top-4 w-28 h-28 border-4 border-dashed rounded-full flex items-center justify-center rotate-[15deg] pointer-events-none select-none ${
                                    paymentMethod === 'counter' ? 'border-rose-500/15 text-rose-500/15' : 'border-emerald-500/15 text-emerald-500/15'
                                }`}>
                                    <span className="font-black text-sm tracking-widest uppercase">{paymentMethod === 'counter' ? 'UNPAID' : 'PAID'}</span>
                                </div>

                                <div className="text-center border-b border-dashed border-slate-200 pb-5 mb-5 space-y-0.5">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Colombo Central Medical Center</h3>
                                    <p className="text-[10px] text-slate-400 font-bold">Provisional Patient Clinic Entry Pass</p>
                                </div>

                                <div className="flex gap-5 items-center border-b border-slate-100 pb-5 mb-5 text-left">
                                    <div className="w-20 h-20 bg-primary/10 text-primary rounded-2xl flex flex-col items-center justify-center shrink-0 border border-primary/5">
                                        <p className="text-[9px] font-black uppercase tracking-widest leading-none">Token</p>
                                        <p className="text-3xl font-black mt-1 leading-none">{createdAppointment.token_number || createdAppointment.queue_number || '08'}</p>
                                    </div>
                                    <div className="space-y-1 min-w-0">
                                        <span className="px-2 py-0.5 bg-slate-100 border border-slate-200/50 rounded text-[8px] font-black text-slate-500 uppercase tracking-widest w-fit block">
                                            {selectedSpecialist.specialty}
                                        </span>
                                        <h3 className="text-base font-black text-slate-800 font-headline leading-tight truncate">Dr. {selectedSpecialist.name}</h3>
                                        <p className="text-[10px] text-slate-400 font-bold leading-none">Roster Consulting Room: {selectedSpecialist.room_number || 'Clinic Room 03'}</p>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-5 text-xs font-bold text-slate-500 text-left">
                                    <div className="flex justify-between"><span>Patient Name</span> <span className="text-slate-800">{patient.full_name || patient.name}</span></div>
                                    <div className="flex justify-between"><span>Clinic Date</span> <span className="text-slate-800">{bookingDate}</span></div>
                                    <div className="flex justify-between"><span>Session Window</span> <span className="text-slate-800">{selectedSession?.start_time} - {selectedSession?.end_time}</span></div>
                                    <div className="flex justify-between"><span>Payment Mode</span> <span className="text-slate-800 capitalize">{paymentMethod === 'payhere' ? 'Online Checkout Gateway' : 'Pay Cash at Reception'}</span></div>
                                    <div className="flex justify-between"><span>Total Dues</span> <span className="text-slate-800">Rs. {totalCost.toLocaleString()}</span></div>
                                </div>

                                {warnings.length > 0 && (
                                    <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-800 text-left">
                                        {warnings.map((w, i) => <p key={i}>{w}</p>)}
                                    </div>
                                )}

                                {/* Barcode Graphics */}
                                <div className="border-t border-slate-100 pt-5 text-center space-y-2">
                                    <div className="flex justify-center items-center py-2.5 bg-slate-50 border border-slate-200/50 rounded-2xl max-w-xs mx-auto">
                                        <div className="space-y-1">
                                            <div className="flex gap-[2px] justify-center h-10 opacity-70">
                                                {[1,2,4,1,3,1,2,1,4,2,3,1,2,1,4,1,2,4,3,1,2,1,2,1].map((w, i) => (
                                                    <div key={i} className="bg-slate-900" style={{ width: `${w}px` }}></div>
                                                ))}
                                            </div>
                                            <p className="text-[9px] font-mono text-slate-400 tracking-wider">PH-{transactionId?.slice(0, 10) || createdAppointment.appointment_id || 'TICKET'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button 
                                    onClick={() => {
                                        const printW = window.open('', '_blank');
                                        printW.document.write(`
                                            <html>
                                            <head>
                                                <title>Clinic Ticket Token #${createdAppointment.token_number || '08'}</title>
                                                <style>
                                                    body { font-family: sans-serif; text-align: center; padding: 40px; color: #333; }
                                                    .card { border: 2px solid #333; padding: 30px; border-radius: 20px; max-w: 400px; margin: 0 auto; }
                                                    .token { font-size: 40px; font-weight: bold; margin: 20px 0; }
                                                    .details { text-align: left; margin: 20px 0; line-height: 1.8; }
                                                </style>
                                            </head>
                                            <body>
                                                <div class="card">
                                                    <h2>Colombo Central Medical Center</h2>
                                                    <p>Clinic Pass Ticket</p>
                                                    <div class="token">Token: ${createdAppointment.token_number || '08'}</div>
                                                    <div class="details">
                                                        <p><strong>Patient Name:</strong> ${patient.full_name || patient.name}</p>
                                                        <p><strong>Specialist:</strong> Dr. ${selectedSpecialist.name}</p>
                                                        <p><strong>Specialty:</strong> ${selectedSpecialist.specialty}</p>
                                                        <p><strong>Date:</strong> ${bookingDate}</p>
                                                        <p><strong>Room:</strong> ${selectedSpecialist.room_number || 'OPD Room 3'}</p>
                                                        <p><strong>Reference ID:</strong> ${transactionId || 'Counter'}</p>
                                                    </div>
                                                </div>
                                            </body>
                                            </html>
                                        `);
                                        printW.document.close();
                                        printW.print();
                                    }}
                                    className="flex-1 py-4 border border-slate-200 hover:border-slate-300 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest transition-all bg-white shadow-sm"
                                >
                                    Print Ticket
                                </button>
                                <button 
                                    onClick={() => navigate('/patient')}
                                    className="flex-[2] py-4 bg-primary hover:bg-primary-container text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/10 transition-all"
                                >
                                    Done & Go Home
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
};

export default BookingPage;
