import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../../components/common/Logo';
import { apiService } from '../../services/apiService';
import { socketService } from '../../services/socketService';
import KioskTopBar from '../../components/kiosk/KioskTopBar';
import ConfirmModal from '../../components/common/ConfirmModal';
import './PatientDashboard.css';

// ─── Sub-components ──────────────────────────────────────────────────────────

/** SideNav — EXACT match to KioskSearchDoctors style */
const SideNav = ({ onCheckInOutClick }) => {
    const navigate = useNavigate();
    const navItems = [
        { icon: 'account_circle',   label: 'Personal Dashboard',   path: '/patient-dashboard', active: true },
        { icon: 'smart_toy',        label: 'AI Assistant',         path: '/assistant' },
        { icon: 'hourglass_empty',  label: 'Queue Status',         path: '/queue' },
        { icon: 'calendar_month',   label: 'Find Doctors',         path: '/doctors' },
        { icon: 'how_to_reg',       label: 'Check-In / Check-Out', path: '#' },
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
                        onClick={() => {
                            if (label === 'Check-In / Check-Out') {
                                if (onCheckInOutClick) onCheckInOutClick();
                            } else if (path !== '#') {
                                navigate(path);
                            }
                        }}
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
        blood_type: '',
        emergency_contact_name: '',
        emergency_contact_phone: ''
    });
    const [showPresModal, setShowPresModal] = useState(false);
    const [showLabModal, setShowLabModal] = useState(false);
    const [prescriptions, setPrescriptions] = useState([]);
    const [labReports, setLabReports] = useState([]);

    const [medicalSummary, setMedicalSummary] = useState({ prescriptions_count: 0, lab_reports_count: 0 });
    const [aiInsight, setAiInsight] = useState("Your AI Assistant is ready to summarize your medical history or answer health queries.");

    // Reschedule & Cancel States
    const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [selectedRescheduleAppt, setSelectedRescheduleAppt] = useState(null);
    const [apptToCancel, setApptToCancel] = useState(null);
    const [newDate, setNewDate] = useState('');
    const [selectedNewSessionId, setSelectedNewSessionId] = useState(null);
    const [availableSessions, setAvailableSessions] = useState([]);
    const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
    const [toast, setToast] = useState(null);

    // Check-In / Check-Out Selection Modal States
    const [showCheckInOutModal, setShowCheckInOutModal] = useState(false);
    const [checkInOutAction, setCheckInOutAction] = useState('select'); // 'select' | 'checkin' | 'checkout' | 'no_appointments' | 'success_checkin' | 'success_checkout'
    const [checkInOutError, setCheckInOutError] = useState(null);
    const [checkInOutLoading, setCheckInOutLoading] = useState(false);
    const [checkInOutResult, setCheckInOutResult] = useState(null);

    const handleCheckInOutClick = () => {
        setCheckInOutError(null);
        setCheckInOutResult(null);

        const isToday = (dateStr) => {
            const today = new Date();
            const apptDate = new Date(dateStr);
            return today.getFullYear() === apptDate.getFullYear() &&
                   today.getMonth() === apptDate.getMonth() &&
                   today.getDate() === apptDate.getDate();
        };

        const todayAppts = history.filter(appt => isToday(appt.date));
        
        if (todayAppts.length === 0) {
            setCheckInOutAction('no_appointments');
            setShowCheckInOutModal(true);
            return;
        }

        const checkedInAppts = todayAppts.filter(appt => 
            appt.queue_status !== null && appt.queue_status !== undefined
        );

        const checkInReadyAppts = todayAppts.filter(appt => 
            !appt.queue_status && ['booked', 'scheduled', 'confirmed'].includes(appt.status?.toLowerCase())
        );

        if (checkedInAppts.length > 0 && checkInReadyAppts.length > 0) {
            setCheckInOutAction('select');
        } else if (checkedInAppts.length > 0 && checkInReadyAppts.length === 0) {
            setCheckInOutAction('checkout');
        } else if (checkInReadyAppts.length > 0) {
            setCheckInOutAction('checkin');
        } else {
            setCheckInOutAction('no_appointments');
        }
        
        setShowCheckInOutModal(true);
    };

    const handleSelectCheckIn = async (apptId) => {
        setCheckInOutLoading(true);
        setCheckInOutError(null);
        try {
            const response = await apiService.faceCheckIn(null, patient.id, apptId);
            if (response.success) {
                setCheckInOutResult(response);
                setCheckInOutAction('success_checkin');
                fetchData();
                showToast("Check-In Successful", "You have successfully checked in.", "success");
            } else {
                setCheckInOutError(response.error || 'Failed to check in.');
            }
        } catch (err) {
            setCheckInOutError(err.error || err.message || 'Check-in failed.');
        } finally {
            setCheckInOutLoading(false);
        }
    };

    const handleSelectCheckOut = async (apptId) => {
        setCheckInOutLoading(true);
        setCheckInOutError(null);
        try {
            const response = await apiService.checkOutPatient(patient.id, apptId);
            if (response.success || !response.error) {
                setCheckInOutResult(response);
                setCheckInOutAction('success_checkout');
                fetchData();
                showToast("Check-Out Successful", "You have successfully checked out.", "success");
            } else {
                setCheckInOutError(response.error || 'Failed to check out.');
            }
        } catch (err) {
            setCheckInOutError(err.error || err.message || 'Check-out failed.');
        } finally {
            setCheckInOutLoading(false);
        }
    };

    const showToast = (title, message, type = 'success') => {
        setToast({ title, message, type });
        setTimeout(() => setToast(null), 6000);
    };

    const handleCancelAppointment = (apptId) => {
        setApptToCancel(apptId);
        setShowCancelConfirm(true);
    };

    const handleConfirmCancel = async () => {
        if (!apptToCancel) return;
        try {
            await apiService.cancelAppointment(apptToCancel);
            showToast(
                "Appointment Cancelled",
                "Your appointment has been successfully cancelled.",
                "success"
            );

            try {
                await apiService.createNotification({
                    patient_id: patient.id,
                    type: "Cancelled",
                    message: "Your appointment has been cancelled successfully."
                });
            } catch (nErr) {
                console.error("Failed to create database notification:", nErr);
            }

            setShowCancelConfirm(false);
            setApptToCancel(null);
            fetchData();
        } catch (err) {
            console.error("Cancel failed:", err);
            showToast("Cancel Failed", "Unable to cancel your appointment. Please try again.", "error");
        }
    };

    const handleReschedule = (appt) => {
        setSelectedRescheduleAppt(appt);
        setNewDate(appt.date || new Date().toISOString().split('T')[0]);
        setSelectedNewSessionId(null);
        setAvailableSessions([]);
        setShowRescheduleModal(true);
    };

    const checkAvailability = async (date) => {
        if (!selectedRescheduleAppt) return;
        setIsCheckingAvailability(true);
        try {
            const specialistId = selectedRescheduleAppt?.specialist_id;
            if (!specialistId) {
                const specialists = await apiService.getSpecialists();
                const spec = specialists.find(s => s.name === selectedRescheduleAppt.doctor || s.name === selectedRescheduleAppt.specialist);
                if (spec) {
                    const sessions = await apiService.getSpecialistAvailability(spec.id, date);
                    setAvailableSessions(sessions);
                }
            } else {
                const sessions = await apiService.getSpecialistAvailability(specialistId, date);
                setAvailableSessions(sessions);
            }
        } catch (err) {
            console.error("Failed to check availability:", err);
        } finally {
            setIsCheckingAvailability(false);
        }
    };

    useEffect(() => {
        if (showRescheduleModal && newDate) {
            checkAvailability(newDate);
        }
    }, [newDate, showRescheduleModal]);

    const submitReschedule = async () => {
        if (!selectedNewSessionId) {
            showToast("Selection Required", "Please select a session to proceed.", "error");
            return;
        }
        try {
            await apiService.rescheduleAppointment(selectedRescheduleAppt.appointment_id || selectedRescheduleAppt.id, newDate, selectedNewSessionId);
            
            showToast(
                "Appointment Rescheduled",
                `Successfully rescheduled appointment with ${selectedRescheduleAppt.doctor || selectedRescheduleAppt.specialist || 'your specialist'} to ${newDate}.`,
                "success"
            );
            
            try {
                await apiService.createNotification({
                    patient_id: patient.id,
                    type: "Rescheduled",
                    message: `Appointment with ${selectedRescheduleAppt.doctor || selectedRescheduleAppt.specialist || 'specialist'} has been rescheduled to ${newDate}.`
                });
            } catch (nErr) {
                console.error("Failed to create database notification:", nErr);
            }
            
            setShowRescheduleModal(false);
            fetchData();
        } catch (err) {
            console.error("Reschedule failed:", err);
            showToast("Reschedule Failed", "Unable to reschedule your appointment. Please try again.", "error");
        }
    };

    const fetchData = async () => {
        const savedPatient = localStorage.getItem('activePatient');
        if (!savedPatient) return;
        const parsedPatient = JSON.parse(savedPatient);
        if (!parsedPatient.id) {
            console.error("Patient ID is missing in session");
            navigate('/patient-login');
            return;
        }

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
        if (!parsedPatient.id) {
            console.error("Invalid session data");
            localStorage.removeItem('activePatient');
            navigate('/patient-login');
            return;
        }
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
            showToast("Review Failed", "You may have already submitted a review or feedback for this session.", "error");
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

    const isMinor = patient 
        ? (patient.age ? Number(patient.age) < 18 : calculateAge(patient.dob || patient.date_of_birth) < 18) 
        : false;

    const handleEditProfile = () => {
        setEditData({ 
            name: patient?.full_name || patient?.name || '', 
            phone: patient?.phone_number || patient?.phone || '',
            email: patient?.email || '',
            dob: patient?.dob || '',
            address: patient?.address || '',
            blood_type: patient?.blood_type || '',
            emergency_contact_name: patient?.emergency_contact_name || '',
            emergency_contact_phone: patient?.emergency_contact_phone || ''
        });
        setIsEditModalOpen(true);
    };

    const handleSaveProfile = async () => {
        try {
            const calculatedAge = editData.dob ? calculateAge(editData.dob) : patient.age;
            await apiService.updatePatient(patient.id, {
                full_name: editData.name,
                phone_number: editData.phone,
                email: editData.email,
                dob: editData.dob,
                age: calculatedAge,
                address: editData.address,
                blood_type: editData.blood_type,
                emergency_contact_name: editData.emergency_contact_name,
                emergency_contact_phone: editData.emergency_contact_phone
            });
            
            const updatedPatient = { 
                ...patient, 
                full_name: editData.name, 
                name: editData.name,
                phone_number: editData.phone,
                phone: editData.phone,
                email: editData.email,
                dob: editData.dob,
                age: calculatedAge,
                address: editData.address,
                blood_type: editData.blood_type,
                emergency_contact_name: editData.emergency_contact_name,
                emergency_contact_phone: editData.emergency_contact_phone
            };
            
            localStorage.setItem('activePatient', JSON.stringify(updatedPatient));
            setPatient(updatedPatient);
            setIsEditModalOpen(false);
            showToast("Profile Updated", "Your personal details have been updated successfully.", "success");
        } catch (err) {
            console.error("Failed to update profile:", err);
            showToast("Update Failed", "We were unable to save your profile changes. Please try again.", "error");
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
            showToast("Document Error", "Unable to open attachment. The file might be corrupted or incomplete.", "error");
        }
    };

    if (loading) return null;

    return (
        <div className="w-screen h-screen overflow-hidden flex font-body bg-slate-50 text-on-surface dashboard-container">
            <SideNav onCheckInOutClick={handleCheckInOutClick} />

            <main className="flex-1 flex flex-col relative overflow-hidden bg-white">
                <KioskTopBar title="Personal Dashboard" patientName={patient?.full_name} />

                <div className="ambient-blob-top" />
                <div className="ambient-blob-bottom" />

                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar z-10 relative">
                    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
                        
                        <div className="grid grid-cols-12 gap-6">
                            <div className="col-span-8 glass-card rounded-[2.5rem] p-8 shadow-lg relative overflow-hidden border border-white">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 blur-[60px] rounded-full -mr-16 -mt-16"></div>
                                
                                <div className="relative z-10 flex items-start gap-8">
                                    <div className="w-24 h-24 rounded-3xl profile-gradient flex items-center justify-center text-white text-4xl font-black shadow-xl border-4 border-white">
                                        {(patient?.full_name || 'P').charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h2 className="text-3xl font-black text-on-surface font-headline tracking-tight">{patient?.full_name || 'Patient'}</h2>
                                                <p className="text-slate-500 font-bold mt-1">Patient ID: <span className="text-primary">PAT-{patient?.id ? patient.id.toString().padStart(4, '0') : '----'}</span></p>
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
                                        {!isMinor && (
                                            <div className="mt-8 p-6 bg-red-50/50 rounded-[2rem] border border-red-100 flex items-center gap-8 animate-in fade-in slide-in-from-top-2 duration-500">
                                                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-red-600 shadow-sm border border-red-100">
                                                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>emergency</span>
                                                </div>
                                                <div className="grid grid-cols-3 flex-1 gap-6">
                                                    <div className="space-y-0.5 text-left">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Emergency Contact</p>
                                                        <p className="text-sm font-bold text-on-surface">{patient.emergency_contact_name || 'N/A'}</p>
                                                    </div>
                                                    <div className="space-y-0.5 text-left">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Relationship</p>
                                                        <p className="text-sm font-bold text-red-600">Contact</p>
                                                    </div>
                                                    <div className="space-y-0.5 text-left">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Emergency Phone</p>
                                                        <p className="text-sm font-bold text-on-surface">{patient.emergency_contact_phone || 'N/A'}</p>
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
                                        <div 
                                            key={idx} 
                                            onClick={() => setSelectedHistoryItem(appt)}
                                            className="history-item p-5 rounded-2xl bg-slate-50/50 flex items-center justify-between group cursor-pointer hover:bg-slate-100/70 transition-all hover:scale-[1.01]"
                                        >
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
                            
                            <div className="border-t border-slate-100 pt-4 mt-2">
                                <p className="text-[10px] font-black text-red-600 uppercase tracking-widest px-1 mb-3 flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-xs">emergency</span>
                                    Emergency Contact Details
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Contact Name</label>
                                        <input 
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20 transition-all font-bold text-xs"
                                            placeholder="e.g. John Doe"
                                            value={editData.emergency_contact_name}
                                            onChange={(e) => setEditData({...editData, emergency_contact_name: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Emergency Phone</label>
                                        <input 
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20 transition-all font-bold text-xs"
                                            placeholder="e.g. +94771234567"
                                            value={editData.emergency_contact_phone}
                                            onChange={(e) => setEditData({...editData, emergency_contact_phone: e.target.value})}
                                        />
                                    </div>
                                </div>
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

            {/* History Details Modal */}
            {selectedHistoryItem && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 no-print">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in duration-300">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-primary/5">
                            <div>
                                <h3 className="text-2xl font-bold text-on-surface font-headline">Appointment Details</h3>
                                <p className="text-sm text-on-surface-variant font-medium">Record for {selectedHistoryItem.date}</p>
                            </div>
                            <button onClick={() => setSelectedHistoryItem(null)} className="w-10 h-10 rounded-full hover:bg-slate-200 flex items-center justify-center transition-all">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        
                        <div className="p-8 space-y-6 text-left">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-outline">Specialist</label>
                                    <p className="font-bold text-on-surface text-lg">{selectedHistoryItem.specialist}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-outline">Department</label>
                                    <p className="font-bold text-on-surface text-lg">{selectedHistoryItem.department}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-outline">Time & Room</label>
                                    <p className="font-bold text-on-surface">{selectedHistoryItem.time || 'N/A'} • {selectedHistoryItem.room || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-outline">Session</label>
                                    <p className="font-bold text-on-surface">{selectedHistoryItem.session_name || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-outline">Status</label>
                                    <div className="flex">
                                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${
                                            selectedHistoryItem.status === 'Completed' ? 'bg-green-100 text-green-700' : 
                                            selectedHistoryItem.status?.toLowerCase()?.includes('cancel') ? 'bg-red-100 text-red-700' : 'bg-primary/10 text-primary'
                                        }`}>
                                            {selectedHistoryItem.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-outline">Reference ID</label>
                                    <p className="font-bold text-on-surface">#APT-{selectedHistoryItem.id.toString().padStart(4, '0')}</p>
                                </div>
                            </div>

                            <div className="space-y-2 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                <label className="text-[10px] font-black uppercase tracking-widest text-outline">Symptoms / Reason</label>
                                <p className="text-sm font-medium text-on-surface-variant leading-relaxed">
                                    {selectedHistoryItem.symptom || "No specific symptoms recorded."}
                                </p>
                            </div>

                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setSelectedHistoryItem(null)}
                                    className="flex-1 py-4 bg-slate-100 rounded-2xl font-bold text-on-surface-variant hover:bg-slate-200 transition-all"
                                >
                                    Close
                                </button>
                                {!selectedHistoryItem.status?.toLowerCase()?.includes('cancel') && selectedHistoryItem.status?.toLowerCase() !== 'completed' && (
                                    <>
                                        <button 
                                            onClick={() => {
                                                setSelectedHistoryItem(null);
                                                handleReschedule({
                                                    appointment_id: selectedHistoryItem.id,
                                                    date: selectedHistoryItem.date,
                                                    doctor: selectedHistoryItem.specialist,
                                                    specialist_id: selectedHistoryItem.specialist_id
                                                });
                                            }}
                                            className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-1.5"
                                        >
                                            <span className="material-symbols-outlined text-sm">event_repeat</span>
                                            Reschedule
                                        </button>
                                        <button 
                                            onClick={() => {
                                                setSelectedHistoryItem(null);
                                                handleCancelAppointment(selectedHistoryItem.id);
                                            }}
                                            className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-bold shadow-lg shadow-red-500/20 hover:scale-[1.02] hover:bg-red-600 transition-all flex items-center justify-center gap-1.5"
                                        >
                                            <span className="material-symbols-outlined text-sm">cancel</span>
                                            Cancel
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reschedule Modal */}
            {showRescheduleModal && selectedRescheduleAppt && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 no-print">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in duration-300">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-primary/5">
                            <div>
                                <h3 className="text-2xl font-bold text-on-surface font-headline">Reschedule Appointment</h3>
                                <p className="text-sm text-on-surface-variant font-medium">Select a new date and session</p>
                            </div>
                            <button onClick={() => setShowRescheduleModal(false)} className="w-10 h-10 rounded-full hover:bg-slate-200 flex items-center justify-center transition-all">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        
                        <div className="p-8 space-y-6 text-left">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-outline ml-1">1. Select Date</label>
                                <input 
                                    type="date"
                                    min={new Date().toISOString().split('T')[0]}
                                    value={newDate}
                                    onChange={(e) => {
                                        setNewDate(e.target.value);
                                        setSelectedNewSessionId(null);
                                    }}
                                    className="w-full bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white px-5 py-4 rounded-2xl outline-none transition-all font-bold text-lg"
                                />
                            </div>

                            <div className="space-y-3 text-left">
                                <label className="text-xs font-black uppercase tracking-widest text-outline ml-1">2. Choose Available Session</label>
                                <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {isCheckingAvailability ? (
                                        <div className="py-10 text-center animate-pulse">
                                            <span className="material-symbols-outlined text-4xl text-primary/30 mb-2">event_repeat</span>
                                            <p className="text-xs font-bold text-outline uppercase tracking-widest">Checking sessions...</p>
                                        </div>
                                    ) : availableSessions.length > 0 ? (
                                        availableSessions.map(sess => (
                                            <div 
                                                key={sess.id}
                                                onClick={() => setSelectedNewSessionId(sess.id)}
                                                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between group ${
                                                    selectedNewSessionId === sess.id 
                                                    ? 'border-primary bg-primary/5 ring-4 ring-primary/5' 
                                                    : 'border-slate-100 bg-slate-50 hover:border-primary/20'
                                                }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                                                        selectedNewSessionId === sess.id ? 'bg-primary text-white' : 'bg-white text-primary border border-slate-100'
                                                    }`}>
                                                        <span className="material-symbols-outlined">alarm</span>
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-on-surface">{sess.start_time} - {sess.end_time}</p>
                                                        <p className="text-xs font-medium text-on-surface-variant uppercase tracking-tight">
                                                            Session {sess.session_number} • Room {sess.room}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase ${
                                                        sess.available_slots > 5 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                                    }`}>
                                                        {sess.available_slots} Slots Left
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                            <span className="material-symbols-outlined text-4xl text-outline/30 mb-2">event_busy</span>
                                            <p className="text-xs font-bold text-outline uppercase tracking-widest">No sessions available on this date</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowRescheduleModal(false)} className="flex-1 py-4 rounded-2xl font-bold text-outline hover:bg-slate-100 transition-all">Cancel</button>
                                <button 
                                    onClick={submitReschedule}
                                    disabled={!selectedNewSessionId}
                                    className={`flex-[2] py-4 rounded-2xl font-bold transition-all shadow-lg ${
                                        selectedNewSessionId 
                                        ? 'bg-primary text-white shadow-primary/20 hover:scale-[1.02]' 
                                        : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                    }`}
                                >
                                    Confirm Reschedule
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal 
                isOpen={showCancelConfirm}
                title="Cancel Appointment?"
                message="Are you sure you want to cancel your appointment? This action cannot be undone."
                confirmText="Yes, Cancel"
                cancelText="No, Keep It"
                onConfirm={handleConfirmCancel}
                onCancel={() => setShowCancelConfirm(false)}
                type="warning"
            />

            {/* Check-In / Check-Out Selection Modal */}
            {showCheckInOutModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in no-print">
                    <div className="absolute inset-0" onClick={() => !checkInOutLoading && setShowCheckInOutModal(false)}></div>
                    <div className="bg-white rounded-[3rem] w-full max-w-xl relative z-10 shadow-2xl overflow-hidden border border-white animate-scale-up flex flex-col max-h-[90vh]">
                        <div className="p-10 pb-6 border-b border-slate-100 flex justify-between items-start">
                            <div>
                                <h2 className="text-3xl font-black text-on-surface font-headline tracking-tight">Check-In / Check-Out</h2>
                                <p className="text-slate-500 font-bold text-sm mt-1">Manage your active appointments for today</p>
                            </div>
                            <button 
                                onClick={() => !checkInOutLoading && setShowCheckInOutModal(false)} 
                                className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-primary transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-10 overflow-y-auto no-scrollbar space-y-6 flex-1 text-left">
                            {checkInOutError && (
                                <div className="p-5 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 animate-fade-in">
                                    <span className="material-symbols-outlined text-red-500 shrink-0">error</span>
                                    <div className="text-left">
                                        <p className="text-sm font-black text-red-800">Action Failed</p>
                                        <p className="text-xs font-bold text-red-600 mt-1 leading-relaxed">{checkInOutError}</p>
                                    </div>
                                </div>
                            )}

                            {checkInOutAction === 'select' && (
                                <div className="grid grid-cols-2 gap-6 py-4">
                                    <button
                                        onClick={() => setCheckInOutAction('checkin')}
                                        className="flex flex-col items-center justify-center p-8 bg-green-50/50 hover:bg-green-50 border border-green-100 hover:border-green-300 rounded-[2.5rem] transition-all hover:scale-[1.02] active:scale-[0.98] group text-center"
                                    >
                                        <div className="w-16 h-16 bg-green-500 text-white rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-green-500/20 group-hover:scale-110 transition-transform">
                                            <span className="material-symbols-outlined text-4xl">how_to_reg</span>
                                        </div>
                                        <h3 className="text-xl font-black text-green-900 font-headline">Check-In</h3>
                                        <p className="text-green-700/80 text-xs font-bold mt-2 leading-relaxed">Check-in to another appointment scheduled for today</p>
                                    </button>

                                    <button
                                        onClick={() => setCheckInOutAction('checkout')}
                                        className="flex flex-col items-center justify-center p-8 bg-blue-50/50 hover:bg-blue-50 border border-blue-100 hover:border-blue-300 rounded-[2.5rem] transition-all hover:scale-[1.02] active:scale-[0.98] group text-center"
                                    >
                                        <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                                            <span className="material-symbols-outlined text-4xl">logout</span>
                                        </div>
                                        <h3 className="text-xl font-black text-primary font-headline">Check-Out</h3>
                                        <p className="text-primary/80 text-xs font-bold mt-2 leading-relaxed">Check-out of your completed consultation session</p>
                                    </button>
                                </div>
                            )}

                            {checkInOutAction === 'checkin' && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2 text-xs font-black uppercase tracking-wider text-slate-400">
                                        <span className="material-symbols-outlined text-sm">schedule</span>
                                        Available Appointments for Check-In
                                    </div>
                                    {history.filter(appt => {
                                        const today = new Date();
                                        const apptDate = new Date(appt.date);
                                        const isToday = today.getFullYear() === apptDate.getFullYear() &&
                                                        today.getMonth() === apptDate.getMonth() &&
                                                        today.getDate() === apptDate.getDate();
                                        return isToday && !appt.queue_status && ['booked', 'scheduled', 'confirmed'].includes(appt.status?.toLowerCase());
                                    }).length === 0 ? (
                                        <div className="text-center py-10 bg-slate-50 rounded-3xl border border-slate-100">
                                            <span className="material-symbols-outlined text-4xl text-slate-300 mb-2 block">event_busy</span>
                                            <p className="text-slate-500 font-bold text-sm">No scheduled appointments left to check-in today.</p>
                                        </div>
                                    ) : (
                                        history.filter(appt => {
                                            const today = new Date();
                                            const apptDate = new Date(appt.date);
                                            const isToday = today.getFullYear() === apptDate.getFullYear() &&
                                                            today.getMonth() === apptDate.getMonth() &&
                                                            today.getDate() === apptDate.getDate();
                                            return isToday && !appt.queue_status && ['booked', 'scheduled', 'confirmed'].includes(appt.status?.toLowerCase());
                                        }).map((appt, idx) => (
                                            <div key={idx} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between hover:bg-white hover:shadow-md transition-all">
                                                <div>
                                                    <h4 className="font-black text-on-surface text-base">{appt.specialist}</h4>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{appt.department} • {appt.time}</p>
                                                </div>
                                                <button
                                                    disabled={checkInOutLoading}
                                                    onClick={() => handleSelectCheckIn(appt.id)}
                                                    className="px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95 shadow-sm disabled:opacity-50 flex items-center gap-1.5 font-bold"
                                                >
                                                    {checkInOutLoading ? (
                                                        'Checking In...'
                                                    ) : (
                                                        <>
                                                            <span className="material-symbols-outlined text-sm">how_to_reg</span>
                                                            Check-In
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {checkInOutAction === 'checkout' && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2 text-xs font-black uppercase tracking-wider text-slate-400">
                                        <span className="material-symbols-outlined text-sm">hourglass_empty</span>
                                        Active Sessions for Check-Out
                                    </div>
                                    {history.filter(appt => {
                                        const today = new Date();
                                        const apptDate = new Date(appt.date);
                                        const isToday = today.getFullYear() === apptDate.getFullYear() &&
                                                        today.getMonth() === apptDate.getMonth() &&
                                                        today.getDate() === apptDate.getDate();
                                        return isToday && appt.queue_status && !appt.check_out_time;
                                    }).length === 0 ? (
                                        <div className="text-center py-10 bg-slate-50 rounded-3xl border border-slate-100">
                                            <span className="material-symbols-outlined text-4xl text-slate-300 mb-2 block">logout</span>
                                            <p className="text-slate-500 font-bold text-sm">No active checked-in appointments to check-out today.</p>
                                        </div>
                                    ) : (
                                        history.filter(appt => {
                                            const today = new Date();
                                            const apptDate = new Date(appt.date);
                                            const isToday = today.getFullYear() === apptDate.getFullYear() &&
                                                            today.getMonth() === apptDate.getMonth() &&
                                                            today.getDate() === apptDate.getDate();
                                            return isToday && appt.queue_status && !appt.check_out_time;
                                        }).map((appt, idx) => (
                                            <div key={idx} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between hover:bg-white hover:shadow-md transition-all">
                                                <div>
                                                    <h4 className="font-black text-on-surface text-base">{appt.specialist}</h4>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{appt.department} • {appt.time}</p>
                                                </div>
                                                <button
                                                    disabled={checkInOutLoading}
                                                    onClick={() => handleSelectCheckOut(appt.id)}
                                                    className="px-5 py-2.5 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95 shadow-sm disabled:opacity-50 flex items-center gap-1.5 font-bold"
                                                >
                                                    {checkInOutLoading ? (
                                                        'Checking Out...'
                                                    ) : (
                                                        <>
                                                            <span className="material-symbols-outlined text-sm">logout</span>
                                                            Check-Out
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {checkInOutAction === 'no_appointments' && (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="material-symbols-outlined text-3xl">calendar_today</span>
                                    </div>
                                    <h3 className="text-lg font-black text-on-surface font-headline">No Appointments Today</h3>
                                    <p className="text-slate-500 text-sm font-bold mt-2 max-w-sm mx-auto leading-relaxed">
                                        You don't have any appointments scheduled for today, or they have already been completed or cancelled.
                                    </p>
                                    <div className="flex gap-4 justify-center mt-8">
                                        <button
                                            onClick={() => { setShowCheckInOutModal(false); navigate('/doctors'); }}
                                            className="px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
                                        >
                                            Book an Appointment
                                        </button>
                                        <button
                                            onClick={() => setShowCheckInOutModal(false)}
                                            className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold transition-all hover:bg-slate-200"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            )}

                            {checkInOutAction === 'success_checkin' && (
                                <div className="text-center py-6">
                                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                                        <span className="material-symbols-outlined text-4xl">check_circle</span>
                                    </div>
                                    <h3 className="text-2xl font-black text-on-surface font-headline">Check-In Successful!</h3>
                                    <p className="text-slate-500 text-sm font-bold mt-2">
                                        You have checked in successfully for your session with {checkInOutResult?.doctor}.
                                    </p>
                                    
                                    {checkInOutResult?.queue_number && (
                                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 my-6 max-w-sm mx-auto">
                                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] block mb-1">Queue Number</span>
                                            <span className="text-5xl font-black text-primary tracking-tighter">
                                                {checkInOutResult.queue_number.toString().padStart(2, '0')}
                                            </span>
                                            <div className="mt-4 flex justify-between items-center text-xs font-bold text-slate-500 pt-4 border-t border-slate-100">
                                                <span>Est. Wait Time:</span>
                                                <span className="text-on-surface font-black">{checkInOutResult.estimated_wait_time} min</span>
                                            </div>
                                            <div className="mt-2 flex justify-between items-center text-xs font-bold text-slate-500">
                                                <span>Room Number:</span>
                                                <span className="text-on-surface font-black">{checkInOutResult.room || 'TBD'}</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-4 justify-center mt-6">
                                        <button
                                            onClick={() => { setShowCheckInOutModal(false); navigate('/queue'); }}
                                            className="px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
                                        >
                                            View Queue Status
                                        </button>
                                        <button
                                            onClick={() => setShowCheckInOutModal(false)}
                                            className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold transition-all hover:bg-slate-200"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            )}

                            {checkInOutAction === 'success_checkout' && (
                                <div className="text-center py-6">
                                    <div className="w-16 h-16 bg-blue-100 text-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                                        <span className="material-symbols-outlined text-4xl">verified</span>
                                    </div>
                                    <h3 className="text-2xl font-black text-on-surface font-headline">Check-Out Successful</h3>
                                    <p className="text-slate-500 text-sm font-bold mt-2">
                                        Your visit has been successfully completed. Thank you for choosing our services!
                                    </p>
                                    
                                    <div className="flex gap-4 justify-center mt-8">
                                        <button
                                            onClick={() => {
                                                setShowCheckInOutModal(false);
                                                navigate('/checkout');
                                            }}
                                            className="px-8 py-3.5 bg-primary text-white rounded-xl text-sm font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95 shadow-md shadow-primary/20"
                                        >
                                            Done
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {(checkInOutAction === 'checkin' || checkInOutAction === 'checkout') && (
                            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-start">
                                <button
                                    onClick={() => setCheckInOutAction('select')}
                                    className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors text-xs font-bold"
                                >
                                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                                    Back to Options
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Premium Toast Overlay */}
            {toast && (
                <div className="fixed top-6 right-6 z-[9999] max-w-sm w-full bg-white/85 backdrop-blur-md rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100/50 overflow-hidden animate-in slide-in-from-top-10 slide-in-from-right-10 duration-300 no-print">
                    <div className="p-4 flex gap-3.5 items-start">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border ${
                            toast.type === 'success' 
                            ? 'bg-green-50 border-green-100 text-green-600' 
                            : 'bg-red-50 border-red-100 text-red-600'
                        }`}>
                            <span className="material-symbols-outlined text-xl">
                                {toast.type === 'success' ? 'check_circle' : 'error'}
                            </span>
                        </div>
                        
                        <div className="flex-1 text-left min-w-0 font-headline">
                            <h4 className="text-sm font-extrabold text-slate-800 leading-tight mb-0.5">
                                {toast.title}
                            </h4>
                            <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                                {toast.message}
                            </p>
                        </div>

                        <button 
                            onClick={() => setToast(null)}
                            className="text-slate-400 hover:text-slate-600 p-0.5 rounded-lg hover:bg-slate-100/50 transition-colors"
                        >
                            <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                    </div>
                    <div className="h-1 w-full bg-slate-100/80">
                        <div 
                            className={`h-full ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'} animate-toast-progress`}
                            style={{ animationDuration: '6000ms', animationTimingFunction: 'linear', animationFillMode: 'forwards' }}
                        />
                    </div>
                </div>
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
