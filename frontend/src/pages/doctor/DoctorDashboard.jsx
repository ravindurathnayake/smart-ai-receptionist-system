import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../../components/common/Logo';
import { apiService } from '../../services/apiService';
import { socketService } from '../../services/socketService';

const requestTypeMeta = {
    NEW_SESSION_REQUEST: {
        title: 'Request New Session',
        accent: 'text-primary',
        icon: 'event_available'
    },
    RESCHEDULE_REQUEST: {
        title: 'Request Session Reschedule',
        accent: 'text-amber-600',
        icon: 'edit_calendar'
    },
    CANCEL_REQUEST: {
        title: 'Request Session Cancellation',
        accent: 'text-rose-600',
        icon: 'event_busy'
    },
    ARRIVAL_CONFIRMATION: {
        title: 'Confirm Arrival',
        accent: 'text-emerald-600',
        icon: 'how_to_reg'
    }
};

const inputBaseClass = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition-all placeholder:text-slate-300 focus:border-primary focus:ring-4 focus:ring-primary/10';

const formatDisplayDate = (value) => {
    if (!value) return 'No date set';
    const dt = new Date(value);
    return Number.isNaN(dt.getTime()) ? value : dt.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

const formatDisplayDateTime = (value) => {
    if (!value) return 'N/A';
    const dt = new Date(value);
    return Number.isNaN(dt.getTime()) ? value : dt.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
};

const getApiMessage = (err, fallback) => err.response?.data?.message || err.response?.data?.error || fallback;

const DoctorDashboard = () => {
    const navigate = useNavigate();
    const [doctorUser, setDoctorUser] = useState(null);
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [requestModal, setRequestModal] = useState(null);
    const [requestForm, setRequestForm] = useState({
        requested_date: '',
        requested_start_time: '',
        requested_end_time: '',
        requested_room_number: '',
        requested_max_patients: '',
        reason: ''
    });
    const [requestSubmitting, setRequestSubmitting] = useState(false);
    const [patientModal, setPatientModal] = useState({ open: false, patientId: null });
    const [patientRecords, setPatientRecords] = useState(null);
    const [patientRecordsLoading, setPatientRecordsLoading] = useState(false);
    const [patientRecordsError, setPatientRecordsError] = useState('');
    const [activePatientTab, setActivePatientTab] = useState('history');
    const [prescriptionForm, setPrescriptionForm] = useState({
        appointment_id: '',
        medications: '',
        instructions: '',
        attachment: ''
    });
    const [vitalsForm, setVitalsForm] = useState({
        appointment_id: '',
        blood_pressure: '',
        blood_sugar: '',
        heart_rate: '',
        temperature: '',
        weight: '',
        oxygen_saturation: '',
        notes: ''
    });
    const [medicalSubmitting, setMedicalSubmitting] = useState(false);
    const [queueSessions, setQueueSessions] = useState([]);
    const [queueLoading, setQueueLoading] = useState(true);
    const [queueSubmitting, setQueueSubmitting] = useState(false);
    const [activeQueueSessionId, setActiveQueueSessionId] = useState(null);

    useEffect(() => {
        const savedUser = localStorage.getItem('doctor_user');
        if (!savedUser) {
            navigate('/doctor/login');
            return;
        }

        try {
            const parsed = JSON.parse(savedUser);
            if (parsed.role !== 'doctor') {
                navigate('/doctor/login');
                return;
            }
            setDoctorUser(parsed);
        } catch {
            localStorage.removeItem('doctor_user');
            localStorage.removeItem('doctor_token');
            navigate('/doctor/login');
        }
    }, [navigate]);

    useEffect(() => {
        if (doctorUser?.specialist_id) {
            refreshDashboard();
            refreshQueue();
        }
    }, [doctorUser]);

    useEffect(() => {
        if (!doctorUser?.specialist_id) return;

        socketService.connect();
        const refresh = () => {
            refreshDashboard();
            refreshQueue();
        };

        socketService.on('queue_updated', refresh);
        socketService.on('session_status_changed', refresh);
        socketService.on('doctor_request_updated', refresh);

        return () => {
            socketService.off('queue_updated', refresh);
            socketService.off('session_status_changed', refresh);
            socketService.off('doctor_request_updated', refresh);
        };
    }, [doctorUser?.specialist_id]);

    const refreshDashboard = async () => {
        if (!doctorUser?.specialist_id) return;

        setLoading(true);
        setError('');

        try {
            const data = await apiService.getDoctorDashboard(doctorUser.specialist_id);
            setDashboard(data);
        } catch (err) {
            console.error(err);
            setError(getApiMessage(err, 'Unable to load the doctor dashboard right now.'));
        } finally {
            setLoading(false);
        }
    };

    const refreshQueue = async () => {
        if (!doctorUser?.specialist_id) return;

        setQueueLoading(true);
        try {
            const data = await apiService.getDoctorQueue(doctorUser.specialist_id);
            setQueueSessions(data || []);
            setActiveQueueSessionId((prev) => {
                if (!data || data.length === 0) return null;
                return data.some((item) => item.session_id === prev) ? prev : data[0].session_id;
            });
        } catch (err) {
            console.error(err);
            setError(getApiMessage(err, 'Unable to load your queue controls.'));
        } finally {
            setQueueLoading(false);
        }
    };

    const openRequestModal = (type, session = null) => {
        setError('');
        setRequestModal({ type, session });
        setRequestForm({
            requested_date: session?.session_date || '',
            requested_start_time: session?.start_time || '',
            requested_end_time: session?.end_time || '',
            requested_room_number: session?.room_number || '',
            requested_max_patients: session?.max_patients?.toString() || '',
            reason: ''
        });
    };

    const closeRequestModal = () => {
        setRequestModal(null);
        setRequestSubmitting(false);
    };

    const submitRequest = async (e) => {
        e.preventDefault();
        if (!doctorUser?.specialist_id || !requestModal) return;

        setRequestSubmitting(true);
        setError('');

        try {
            await apiService.createDoctorSessionRequest(doctorUser.specialist_id, {
                request_type: requestModal.type,
                doctor_session_id: requestModal.session?.id || null,
                ...requestForm,
                requested_max_patients: requestForm.requested_max_patients ? parseInt(requestForm.requested_max_patients, 10) : null
            });
            closeRequestModal();
            await refreshDashboard();
        } catch (err) {
            console.error(err);
            setError(getApiMessage(err, 'Unable to send your request to admin.'));
            setRequestSubmitting(false);
        }
    };

    const confirmArrival = async (session) => {
        if (!doctorUser?.specialist_id) return;

        setError('');

        try {
            await apiService.createDoctorSessionRequest(doctorUser.specialist_id, {
                request_type: 'ARRIVAL_CONFIRMATION',
                doctor_session_id: session.id,
                reason: 'Doctor confirmed arrival for this session.'
            });
            await refreshDashboard();
        } catch (err) {
            console.error(err);
            setError(getApiMessage(err, 'Unable to confirm arrival right now.'));
        }
    };

    const openPatientRecords = async (patientId) => {
        if (!doctorUser?.specialist_id) return;

        setPatientModal({ open: true, patientId });
        setPatientRecords(null);
        setPatientRecordsLoading(true);
        setPatientRecordsError('');
        setActivePatientTab('history');
        setPrescriptionForm({
            appointment_id: '',
            medications: '',
            instructions: '',
            attachment: ''
        });
        setVitalsForm({
            appointment_id: '',
            blood_pressure: '',
            blood_sugar: '',
            heart_rate: '',
            temperature: '',
            weight: '',
            oxygen_saturation: '',
            notes: ''
        });

        try {
            const data = await apiService.getDoctorPatientRecords(patientId, doctorUser.specialist_id);
            setPatientRecords(data);
        } catch (err) {
            console.error(err);
            setPatientRecordsError(getApiMessage(err, 'Unable to load patient records.'));
        } finally {
            setPatientRecordsLoading(false);
        }
    };

    const closePatientModal = () => {
        setPatientModal({ open: false, patientId: null });
        setPatientRecords(null);
        setPatientRecordsError('');
    };

    const refreshPatientRecords = async () => {
        if (!patientModal.patientId || !doctorUser?.specialist_id) return;

        const data = await apiService.getDoctorPatientRecords(patientModal.patientId, doctorUser.specialist_id);
        setPatientRecords(data);
    };

    const submitPrescription = async (e) => {
        e.preventDefault();
        if (!patientModal.patientId || !doctorUser?.specialist_id) return;

        setMedicalSubmitting(true);
        setPatientRecordsError('');

        try {
            await apiService.addDoctorPrescription(patientModal.patientId, doctorUser.specialist_id, {
                ...prescriptionForm,
                appointment_id: prescriptionForm.appointment_id || null
            });
            setPrescriptionForm({
                appointment_id: '',
                medications: '',
                instructions: '',
                attachment: ''
            });
            await refreshPatientRecords();
            await refreshDashboard();
            setActivePatientTab('prescriptions');
        } catch (err) {
            console.error(err);
            setPatientRecordsError(getApiMessage(err, 'Unable to save prescription.'));
        } finally {
            setMedicalSubmitting(false);
        }
    };

    const submitVitals = async (e) => {
        e.preventDefault();
        if (!patientModal.patientId || !doctorUser?.specialist_id) return;

        setMedicalSubmitting(true);
        setPatientRecordsError('');

        try {
            await apiService.addVitalRecord(patientModal.patientId, doctorUser.specialist_id, {
                ...vitalsForm,
                appointment_id: vitalsForm.appointment_id || null
            });
            setVitalsForm({
                appointment_id: '',
                blood_pressure: '',
                blood_sugar: '',
                heart_rate: '',
                temperature: '',
                weight: '',
                oxygen_saturation: '',
                notes: ''
            });
            await refreshPatientRecords();
            await refreshDashboard();
            setActivePatientTab('vitals');
        } catch (err) {
            console.error(err);
            setPatientRecordsError(getApiMessage(err, 'Unable to save vital record.'));
        } finally {
            setMedicalSubmitting(false);
        }
    };

    const handleQueueAction = async (action) => {
        if (!doctorUser?.specialist_id || !activeQueueSessionId) return;

        setQueueSubmitting(true);
        setError('');

        try {
            if (action === 'start') {
                await apiService.startDoctorQueueSession(activeQueueSessionId, doctorUser.specialist_id);
            }
            if (action === 'call-next') {
                await apiService.callNextDoctorPatient(activeQueueSessionId, doctorUser.specialist_id);
            }
            if (action === 'toggle-pause') {
                await apiService.toggleDoctorQueuePause(activeQueueSessionId, doctorUser.specialist_id);
            }
            if (action === 'end') {
                await apiService.endDoctorQueueSession(activeQueueSessionId, doctorUser.specialist_id);
            }
            await refreshQueue();
            await refreshDashboard();
        } catch (err) {
            console.error(err);
            setError(getApiMessage(err, 'Unable to update queue control right now.'));
        } finally {
            setQueueSubmitting(false);
        }
    };

    const handleSkipQueuePatient = async (queueId) => {
        if (!doctorUser?.specialist_id) return;

        setQueueSubmitting(true);
        setError('');

        try {
            await apiService.skipDoctorQueuePatient(queueId, doctorUser.specialist_id);
            await refreshQueue();
            await refreshDashboard();
        } catch (err) {
            console.error(err);
            setError(getApiMessage(err, 'Unable to mark patient as missed right now.'));
        } finally {
            setQueueSubmitting(false);
        }
    };

    const handleSignOut = () => {
        localStorage.removeItem('doctor_user');
        localStorage.removeItem('doctor_token');
        navigate('/doctor/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading doctor workspace...</p>
                </div>
            </div>
        );
    }

    const activeQueueSession = queueSessions.find((item) => item.session_id === activeQueueSessionId) || queueSessions[0] || null;

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-body text-slate-800 relative overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[55vw] h-[55vw] bg-gradient-to-tr from-primary/10 to-blue-300/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-5%] w-[40vw] h-[40vw] bg-gradient-to-br from-emerald-300/10 to-cyan-300/5 rounded-full blur-[140px] pointer-events-none" />

            <div className="max-w-[96rem] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 relative z-10">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-10">
                    <div className="flex items-start gap-4">
                        <div className="cursor-pointer" onClick={() => navigate('/patient')}>
                            <Logo size="sm" showSubtitle={false} />
                        </div>
                        <div className="text-left">
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-primary text-[10px] font-black uppercase tracking-[0.22em]">
                                Doctor Workspace
                            </span>
                            <h1 className="mt-4 text-3xl sm:text-4xl font-black font-headline tracking-tight text-slate-900">
                                {dashboard?.doctor?.display_name || doctorUser?.display_name}
                            </h1>
                            <p className="mt-2 text-slate-500 font-medium">
                                {dashboard?.doctor?.specialization || dashboard?.doctor?.department || 'Clinical Specialist'} | {dashboard?.doctor?.availability_status || 'Available'}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => openRequestModal('NEW_SESSION_REQUEST')}
                            className="px-5 py-3 rounded-2xl border border-primary/10 bg-primary/5 text-primary text-sm font-extrabold hover:bg-primary hover:text-white transition-all"
                        >
                            Request New Session
                        </button>
                        <button
                            onClick={() => navigate('/staff/access')}
                            className="px-5 py-3 rounded-2xl border border-slate-200 bg-white text-slate-700 text-sm font-extrabold hover:border-primary hover:text-primary transition-all"
                        >
                            Staff Access
                        </button>
                        <button
                            onClick={handleSignOut}
                            className="px-5 py-3 rounded-2xl bg-slate-900 text-white text-sm font-extrabold hover:bg-slate-800 transition-all"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-600">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                    <StatCard label="Today's Patients" value={dashboard?.stats?.today_patients} icon="group" accent="from-primary/10 to-blue-100" />
                    <StatCard label="Total Patients" value={dashboard?.stats?.total_patients} icon="medical_information" accent="from-emerald-100 to-lime-100" />
                    <StatCard label="Upcoming Sessions" value={dashboard?.stats?.upcoming_sessions} icon="calendar_month" accent="from-amber-100 to-yellow-100" />
                    <StatCard label="Pending Requests" value={dashboard?.stats?.pending_requests} icon="pending_actions" accent="from-rose-100 to-red-100" />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    <div className="xl:col-span-7 space-y-6">
                        <SectionCard
                            title="Session Command"
                            subtitle="Confirm attendance, request reschedules, or send cancellation notices to admin before clinic flow is affected."
                            actions={(
                                <button
                                    onClick={() => openRequestModal('NEW_SESSION_REQUEST')}
                                    className="px-4 py-2.5 rounded-xl bg-primary/5 text-primary text-xs font-black uppercase tracking-wider hover:bg-primary hover:text-white transition-all"
                                >
                                    New Session Request
                                </button>
                            )}
                        >
                            {(dashboard?.sessions || []).length === 0 ? (
                                <EmptyState message="No clinic sessions are assigned yet. Send a new session request to admin to begin scheduling." />
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {dashboard.sessions.map((session) => (
                                        <div key={session.id} className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                                                        {session.session_date ? formatDisplayDate(session.session_date) : session.day_of_week || 'Session'}
                                                    </p>
                                                    <h3 className="mt-2 text-xl font-black font-headline text-slate-900">
                                                        {session.start_time} - {session.end_time}
                                                    </h3>
                                                    <p className="mt-1 text-sm font-bold text-slate-500">
                                                        Room {session.room_number || 'TBA'} | Session {session.session_number || 'N/A'}
                                                    </p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.22em] ${
                                                    session.arrival_confirmed ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                    {session.arrival_confirmed ? 'Arrival Confirmed' : session.status}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-3 gap-3 mt-5">
                                                <MiniMetric label="Booked" value={session.current_bookings} />
                                                <MiniMetric label="Waiting" value={session.waiting_count} />
                                                <MiniMetric label="Checked-In" value={session.checked_in_count} />
                                            </div>

                                            <div className="flex flex-wrap gap-2 mt-5">
                                                <button
                                                    onClick={() => confirmArrival(session)}
                                                    disabled={session.arrival_confirmed}
                                                    className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-600 text-xs font-black uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-500 hover:text-white transition-all"
                                                >
                                                    {session.arrival_confirmed ? 'Confirmed' : 'Confirm Coming'}
                                                </button>
                                                <button
                                                    onClick={() => openRequestModal('RESCHEDULE_REQUEST', session)}
                                                    className="px-3.5 py-2 rounded-xl bg-amber-50 text-amber-700 text-xs font-black uppercase tracking-wider hover:bg-amber-500 hover:text-white transition-all"
                                                >
                                                    Reschedule
                                                </button>
                                                <button
                                                    onClick={() => openRequestModal('CANCEL_REQUEST', session)}
                                                    className="px-3.5 py-2 rounded-xl bg-rose-50 text-rose-700 text-xs font-black uppercase tracking-wider hover:bg-rose-500 hover:text-white transition-all"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </SectionCard>

                        <SectionCard
                            title="Live Queue Control"
                            subtitle="Start your session, call the next patient, pause the queue, or end the session from your own dashboard."
                        >
                            {queueLoading ? (
                                <EmptyState message="Loading your queue sessions..." />
                            ) : queueSessions.length === 0 ? (
                                <EmptyState message="No queue-enabled sessions are available for you today." />
                            ) : (
                                <div className="space-y-5">
                                    <div className="flex flex-wrap gap-2">
                                        {queueSessions.map((session) => (
                                            <button
                                                key={session.session_id}
                                                onClick={() => setActiveQueueSessionId(session.session_id)}
                                                className={`px-4 py-2.5 rounded-2xl border text-left transition-all ${
                                                    activeQueueSession?.session_id === session.session_id
                                                        ? 'border-primary bg-primary/5 text-primary'
                                                        : 'border-slate-200 bg-white text-slate-600 hover:border-primary/20'
                                                }`}
                                            >
                                                <p className="text-[10px] font-black uppercase tracking-[0.22em]">
                                                    Session {session.session_number}
                                                </p>
                                                <p className="mt-1 text-sm font-bold">
                                                    Room {session.room}
                                                </p>
                                                <p className={`mt-2 text-[10px] font-black uppercase tracking-[0.22em] ${
                                                    session.arrival_confirmed ? 'text-emerald-600' : 'text-slate-400'
                                                }`}>
                                                    {session.arrival_confirmed ? 'Arrival Confirmed' : 'Arrival Pending'}
                                                </p>
                                            </button>
                                        ))}
                                    </div>

                                    {activeQueueSession && (
                                        <div className="rounded-[2rem] border border-slate-100 bg-slate-50/70 p-5">
                                            <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-5">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                                                        Current Queue Session
                                                    </p>
                                                    <h3 className="mt-2 text-xl font-black font-headline text-slate-900">
                                                        {activeQueueSession.department} | Room {activeQueueSession.room}
                                                    </h3>
                                                    <p className="mt-1 text-sm font-bold text-slate-500">
                                                        Status {activeQueueSession.status} | Waiting {activeQueueSession.waiting_count}
                                                    </p>
                                                    <div className={`mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.22em] ${
                                                        activeQueueSession.arrival_confirmed
                                                            ? 'bg-emerald-50 text-emerald-600'
                                                            : 'bg-amber-50 text-amber-700'
                                                    }`}>
                                                        <span className="material-symbols-outlined text-sm">
                                                            {activeQueueSession.arrival_confirmed ? 'verified' : 'pending_actions'}
                                                        </span>
                                                        {activeQueueSession.arrival_confirmed ? 'Arrival Confirmed' : 'Arrival Pending'}
                                                    </div>
                                                    {activeQueueSession.arrival_confirmed_at && (
                                                        <p className="mt-2 text-xs font-bold text-slate-400">
                                                            Confirmed at {formatDisplayDateTime(activeQueueSession.arrival_confirmed_at)}
                                                        </p>
                                                    )}
                                                    <div className="mt-4 rounded-2xl bg-white border border-slate-100 px-4 py-4">
                                                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                                                            Now Serving
                                                        </p>
                                                        <p className="mt-2 text-base font-black text-slate-900">
                                                            {activeQueueSession.current_patient ? `${activeQueueSession.current_patient.name} (${activeQueueSession.current_patient.token})` : 'No active patient'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-2 xl:max-w-[22rem]">
                                                    {activeQueueSession.status?.toUpperCase() === 'NOT_STARTED' ? (
                                                        <button
                                                            onClick={() => handleQueueAction('start')}
                                                            disabled={queueSubmitting}
                                                            className="px-4 py-3 rounded-2xl bg-emerald-600 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 disabled:opacity-60"
                                                        >
                                                            {queueSubmitting ? 'Working...' : 'Start Session'}
                                                        </button>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => handleQueueAction('call-next')}
                                                                disabled={queueSubmitting || (activeQueueSession.waiting_count === 0 && !activeQueueSession.current_patient) || activeQueueSession.status?.toUpperCase() !== 'ACTIVE'}
                                                                className="px-4 py-3 rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 disabled:opacity-60"
                                                            >
                                                                {queueSubmitting ? 'Working...' : 'Call Next'}
                                                            </button>
                                                            <button
                                                                onClick={() => handleQueueAction('toggle-pause')}
                                                                disabled={queueSubmitting || ['ENDED', 'COMPLETED'].includes(activeQueueSession.status?.toUpperCase())}
                                                                className="px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-700 text-xs font-black uppercase tracking-widest disabled:opacity-60"
                                                            >
                                                                {activeQueueSession.status?.toUpperCase() === 'PAUSED' ? 'Resume Queue' : 'Pause Queue'}
                                                            </button>
                                                            <button
                                                                onClick={() => handleQueueAction('end')}
                                                                disabled={queueSubmitting || ['ENDED', 'COMPLETED'].includes(activeQueueSession.status?.toUpperCase())}
                                                                className="px-4 py-3 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-black uppercase tracking-widest disabled:opacity-60"
                                                            >
                                                                End Session
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mt-5 space-y-3">
                                                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                                                    Waiting List
                                                </p>
                                                {activeQueueSession.waiting_list?.length ? (
                                                    activeQueueSession.waiting_list.map((item) => (
                                                        <div key={item.id} className="rounded-2xl bg-white border border-slate-100 px-4 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                                                            <div>
                                                                <h4 className="text-sm font-black text-slate-900">{item.patient}</h4>
                                                                <p className="mt-1 text-xs font-bold text-slate-500">
                                                                    {item.token} | Wait {item.waitTime} | Priority {item.priority || 'Normal'}
                                                                </p>
                                                            </div>
                                                            <button
                                                                onClick={() => handleSkipQueuePatient(item.id)}
                                                                disabled={queueSubmitting}
                                                                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-black uppercase tracking-widest hover:border-rose-200 hover:text-rose-600 transition-all disabled:opacity-60"
                                                            >
                                                                Mark Missed
                                                            </button>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <EmptyState message="No patients are waiting in this queue right now." />
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </SectionCard>

                        <SectionCard
                            title="Upcoming Patient Queue"
                            subtitle="Open any patient to review appointment history, previous prescriptions, lab reports, and vital history like pressure or blood sugar."
                        >
                            <div className="space-y-3">
                                {(dashboard?.upcoming_appointments || []).length === 0 ? (
                                    <EmptyState message="No upcoming appointments assigned right now." />
                                ) : (
                                    dashboard.upcoming_appointments.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => openPatientRecords(item.patient_id)}
                                            className="w-full text-left rounded-[1.5rem] border border-slate-100 bg-white px-5 py-4 hover:border-primary/20 hover:shadow-sm transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                                        >
                                            <div>
                                                <h3 className="text-base font-black text-slate-900">{item.patient_name}</h3>
                                                <p className="mt-1 text-sm font-bold text-slate-500">
                                                    {formatDisplayDateTime(item.appointment_date)} | {item.symptom}
                                                </p>
                                                <p className="mt-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                                                    Blood Type {item.blood_type || 'N/A'} | Priority {item.priority_level || 'Normal'}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-[0.22em]">
                                                    {item.status}
                                                </span>
                                                <span className="material-symbols-outlined text-slate-400">arrow_forward</span>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </SectionCard>
                    </div>

                    <div className="xl:col-span-5 space-y-6">
                        <SectionCard
                            title="Doctor Profile"
                            subtitle="Live profile resolved from the specialist directory used across the MediAssist platform."
                        >
                            <div className="rounded-[2rem] bg-gradient-to-br from-primary to-primary-container text-white p-6 shadow-xl shadow-primary/20">
                                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/70">Assigned Doctor Profile</p>
                                <h3 className="mt-3 text-2xl font-black font-headline">
                                    {dashboard?.doctor?.display_name || doctorUser?.display_name}
                                </h3>
                                <p className="mt-2 text-sm font-semibold text-white/85">
                                    {dashboard?.doctor?.specialization || dashboard?.doctor?.department || 'Clinical Specialist'}
                                </p>
                                <div className="grid grid-cols-2 gap-4 mt-6">
                                    <InfoPill label="Department" value={dashboard?.doctor?.department || 'N/A'} />
                                    <InfoPill label="Email" value={dashboard?.doctor?.email || 'N/A'} />
                                </div>
                            </div>
                        </SectionCard>

                        <SectionCard
                            title="Requests Sent to Admin"
                            subtitle="Track pending and recorded doctor-side requests for sessions and attendance."
                        >
                            <div className="space-y-3">
                                {(dashboard?.session_requests || []).length === 0 ? (
                                    <EmptyState message="No doctor requests have been sent yet." />
                                ) : (
                                    dashboard.session_requests.map((item) => {
                                        const meta = requestTypeMeta[item.request_type] || requestTypeMeta.NEW_SESSION_REQUEST;

                                        return (
                                            <div key={item.id} className="rounded-[1.5rem] border border-slate-100 bg-white p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center">
                                                            <span className="material-symbols-outlined text-xl">{meta.icon}</span>
                                                        </div>
                                                        <div>
                                                            <p className={`text-sm font-black ${meta.accent}`}>{meta.title}</p>
                                                            <p className="text-xs font-bold text-slate-400 mt-1">{formatDisplayDateTime(item.created_at)}</p>
                                                        </div>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.22em] ${
                                                        item.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-700'
                                                    }`}>
                                                        {item.status}
                                                    </span>
                                                </div>

                                                {item.reason && (
                                                    <p className="mt-3 text-sm font-medium text-slate-600 leading-relaxed">
                                                        {item.reason}
                                                    </p>
                                                )}

                                                {item.requested_date && (
                                                    <p className="mt-3 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                                                        Requested {formatDisplayDate(item.requested_date)} {item.requested_start_time ? `| ${item.requested_start_time}` : ''}
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </SectionCard>

                        <SectionCard
                            title="Recent Patients"
                            subtitle="Fast re-entry into patient charts you've recently seen or are expected to see again."
                        >
                            <div className="space-y-3">
                                {(dashboard?.recent_patients || []).length === 0 ? (
                                    <EmptyState message="No patient history is available for this doctor yet." />
                                ) : (
                                    dashboard.recent_patients.map((item) => (
                                        <button
                                            key={item.patient_id}
                                            onClick={() => openPatientRecords(item.patient_id)}
                                            className="w-full text-left rounded-[1.5rem] border border-slate-100 bg-white px-4 py-4 hover:border-primary/20 hover:shadow-sm transition-all flex items-center justify-between gap-3"
                                        >
                                            <div>
                                                <h3 className="text-sm font-black text-slate-900">{item.patient_name}</h3>
                                                <p className="mt-1 text-xs font-bold text-slate-500">
                                                    Last visit {item.latest_visit || 'N/A'} | {item.symptom}
                                                </p>
                                            </div>
                                            <span className="material-symbols-outlined text-slate-400">arrow_forward</span>
                                        </button>
                                    ))
                                )}
                            </div>
                        </SectionCard>
                    </div>
                </div>
            </div>

            {requestModal && (
                <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="absolute inset-0" onClick={closeRequestModal}></div>
                    <div className="relative z-10 w-full max-w-2xl rounded-[2.5rem] bg-white border border-slate-100 shadow-2xl overflow-hidden">
                        <div className="px-8 py-7 border-b border-slate-100">
                            <h3 className="text-2xl font-black font-headline text-slate-900">
                                {requestTypeMeta[requestModal.type]?.title || 'Doctor Request'}
                            </h3>
                            <p className="mt-2 text-sm font-medium text-slate-500">
                                Send a structured request to admin so scheduling changes are visible and traceable.
                            </p>
                        </div>

                        <form onSubmit={submitRequest} className="p-8 space-y-5">
                            {(requestModal.type === 'NEW_SESSION_REQUEST' || requestModal.type === 'RESCHEDULE_REQUEST') && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Field label="Requested Date">
                                        <input
                                            type="date"
                                            value={requestForm.requested_date}
                                            onChange={(e) => setRequestForm({ ...requestForm, requested_date: e.target.value })}
                                            className={inputBaseClass}
                                            required
                                        />
                                    </Field>
                                    <Field label="Requested Room">
                                        <input
                                            type="text"
                                            value={requestForm.requested_room_number}
                                            onChange={(e) => setRequestForm({ ...requestForm, requested_room_number: e.target.value })}
                                            className={inputBaseClass}
                                            placeholder="Room 04"
                                        />
                                    </Field>
                                    <Field label="Start Time">
                                        <input
                                            type="time"
                                            value={requestForm.requested_start_time}
                                            onChange={(e) => setRequestForm({ ...requestForm, requested_start_time: e.target.value })}
                                            className={inputBaseClass}
                                            required
                                        />
                                    </Field>
                                    <Field label="End Time">
                                        <input
                                            type="time"
                                            value={requestForm.requested_end_time}
                                            onChange={(e) => setRequestForm({ ...requestForm, requested_end_time: e.target.value })}
                                            className={inputBaseClass}
                                            required
                                        />
                                    </Field>
                                    <Field label="Max Patients">
                                        <input
                                            type="number"
                                            min="1"
                                            value={requestForm.requested_max_patients}
                                            onChange={(e) => setRequestForm({ ...requestForm, requested_max_patients: e.target.value })}
                                            className={inputBaseClass}
                                            placeholder="20"
                                        />
                                    </Field>
                                </div>
                            )}

                            <Field label="Reason">
                                <textarea
                                    value={requestForm.reason}
                                    onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
                                    className={`${inputBaseClass} min-h-[120px] resize-none`}
                                    placeholder="Explain why this request is needed..."
                                    required={requestModal.type !== 'ARRIVAL_CONFIRMATION'}
                                />
                            </Field>

                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={closeRequestModal} className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-600 font-extrabold">
                                    Cancel
                                </button>
                                <button type="submit" disabled={requestSubmitting} className="px-5 py-3 rounded-2xl bg-primary text-white font-extrabold shadow-md shadow-primary/20 disabled:opacity-60">
                                    {requestSubmitting ? 'Sending...' : 'Send to Admin'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {patientModal.open && (
                <div className="fixed inset-0 z-[130] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="absolute inset-0" onClick={closePatientModal}></div>
                    <div className="relative z-10 w-full max-w-6xl rounded-[2.5rem] bg-white border border-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
                        <div className="px-8 py-7 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-2xl font-black font-headline text-slate-900">
                                    {patientRecords?.patient?.full_name || 'Patient Records'}
                                </h3>
                                <p className="mt-2 text-sm font-medium text-slate-500">
                                    Review history, prescriptions, lab reports, and previous pressure or sugar levels from one workspace.
                                </p>
                            </div>
                            <button onClick={closePatientModal} className="self-start lg:self-auto px-4 py-2 rounded-2xl border border-slate-200 text-slate-600 font-extrabold">
                                Close
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8">
                            {patientRecordsLoading ? (
                                <div className="py-20 text-center">
                                    <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading patient records...</p>
                                </div>
                            ) : patientRecordsError ? (
                                <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-600">
                                    {patientRecordsError}
                                </div>
                            ) : patientRecords && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                                        <SummaryCard label="Blood Type" value={patientRecords.patient.blood_type || 'N/A'} />
                                        <SummaryCard label="Age / Gender" value={`${patientRecords.patient.age || 'N/A'} | ${patientRecords.patient.gender || 'N/A'}`} />
                                        <SummaryCard label="NIC" value={patientRecords.patient.nic || 'N/A'} />
                                        <SummaryCard label="Emergency" value={patientRecords.patient.emergency_contact_phone || 'N/A'} />
                                    </div>

                                    {patientRecords.patient.medical_history && (
                                        <div className="rounded-[1.75rem] border border-amber-100 bg-amber-50/80 px-5 py-4">
                                            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-700">Recorded Medical History</p>
                                            <p className="mt-2 text-sm font-medium text-slate-700 leading-relaxed">
                                                {patientRecords.patient.medical_history}
                                            </p>
                                        </div>
                                    )}

                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            ['history', 'Visit History'],
                                            ['prescriptions', 'Prescriptions'],
                                            ['vitals', 'Vital Levels'],
                                            ['labs', 'Lab Reports'],
                                            ['add', 'Add Records']
                                        ].map(([key, label]) => (
                                            <button
                                                key={key}
                                                onClick={() => setActivePatientTab(key)}
                                                className={`px-4 py-2.5 rounded-full text-xs font-black uppercase tracking-[0.22em] transition-all ${
                                                    activePatientTab === key ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                                }`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>

                                    {activePatientTab === 'history' && (
                                        <RecordList
                                            items={patientRecords.appointments}
                                            emptyMessage="No appointment history is available for this patient."
                                            renderItem={(item) => (
                                                <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50/70 p-4">
                                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                                                        <div>
                                                            <h4 className="text-base font-black text-slate-900">{formatDisplayDateTime(item.appointment_date)}</h4>
                                                            <p className="mt-1 text-sm font-bold text-slate-500">{item.symptom}</p>
                                                            <p className="mt-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                                                                Queue {item.queue_status || 'N/A'} | Room {item.room_number || 'TBA'}
                                                            </p>
                                                        </div>
                                                        <span className="px-3 py-1 rounded-full bg-white text-slate-600 text-[10px] font-black uppercase tracking-[0.22em] border border-slate-200">
                                                            {item.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        />
                                    )}

                                    {activePatientTab === 'prescriptions' && (
                                        <RecordList
                                            items={patientRecords.prescriptions}
                                            emptyMessage="No previous prescriptions are recorded yet."
                                            renderItem={(item) => (
                                                <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50/70 p-4">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <h4 className="text-base font-black text-slate-900">{item.doctor_name}</h4>
                                                            <p className="mt-1 text-sm font-bold text-slate-500">{item.date}</p>
                                                        </div>
                                                    </div>
                                                    <p className="mt-4 text-sm font-semibold text-slate-700 whitespace-pre-line">{item.medications}</p>
                                                    {item.instructions && (
                                                        <p className="mt-3 text-sm text-slate-500 font-medium">Instructions: {item.instructions}</p>
                                                    )}
                                                </div>
                                            )}
                                        />
                                    )}

                                    {activePatientTab === 'vitals' && (
                                        <RecordList
                                            items={patientRecords.vital_records}
                                            emptyMessage="No previous vital records are available yet."
                                            renderItem={(item) => (
                                                <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50/70 p-4">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <h4 className="text-base font-black text-slate-900">{item.doctor_name}</h4>
                                                            <p className="mt-1 text-sm font-bold text-slate-500">{item.date}</p>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                                                        <VitalChip label="Pressure" value={item.blood_pressure} />
                                                        <VitalChip label="Sugar" value={item.blood_sugar} />
                                                        <VitalChip label="Heart Rate" value={item.heart_rate} />
                                                        <VitalChip label="Temperature" value={item.temperature} />
                                                        <VitalChip label="Weight" value={item.weight} />
                                                        <VitalChip label="SpO2" value={item.oxygen_saturation} />
                                                    </div>
                                                    {item.notes && (
                                                        <p className="mt-4 text-sm font-medium text-slate-600">{item.notes}</p>
                                                    )}
                                                </div>
                                            )}
                                        />
                                    )}

                                    {activePatientTab === 'labs' && (
                                        <RecordList
                                            items={patientRecords.lab_reports}
                                            emptyMessage="No lab reports are attached for this patient."
                                            renderItem={(item) => (
                                                <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50/70 p-4">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <h4 className="text-base font-black text-slate-900">{item.test_name}</h4>
                                                            <p className="mt-1 text-sm font-bold text-slate-500">{item.date}</p>
                                                        </div>
                                                        <span className="px-3 py-1 rounded-full bg-white text-slate-600 text-[10px] font-black uppercase tracking-[0.22em] border border-slate-200">
                                                            {item.status}
                                                        </span>
                                                    </div>
                                                    {item.result_summary && (
                                                        <p className="mt-4 text-sm font-medium text-slate-600">{item.result_summary}</p>
                                                    )}
                                                </div>
                                            )}
                                        />
                                    )}

                                    {activePatientTab === 'add' && (
                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                            <form onSubmit={submitPrescription} className="rounded-[2rem] border border-slate-100 bg-slate-50/70 p-6 space-y-4">
                                                <h4 className="text-xl font-black font-headline text-slate-900">Add Prescription</h4>
                                                <Field label="Linked Appointment">
                                                    <select
                                                        value={prescriptionForm.appointment_id}
                                                        onChange={(e) => setPrescriptionForm({ ...prescriptionForm, appointment_id: e.target.value })}
                                                        className={inputBaseClass}
                                                    >
                                                        <option value="">Optional</option>
                                                        {(patientRecords.doctor_visits || []).map((item) => (
                                                            <option key={item.id} value={item.id}>
                                                                {formatDisplayDateTime(item.appointment_date)} | {item.symptom}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </Field>
                                                <Field label="Medications">
                                                    <textarea
                                                        value={prescriptionForm.medications}
                                                        onChange={(e) => setPrescriptionForm({ ...prescriptionForm, medications: e.target.value })}
                                                        className={`${inputBaseClass} min-h-[120px] resize-none`}
                                                        required
                                                    />
                                                </Field>
                                                <Field label="Instructions">
                                                    <textarea
                                                        value={prescriptionForm.instructions}
                                                        onChange={(e) => setPrescriptionForm({ ...prescriptionForm, instructions: e.target.value })}
                                                        className={`${inputBaseClass} min-h-[100px] resize-none`}
                                                    />
                                                </Field>
                                                <button type="submit" disabled={medicalSubmitting} className="w-full py-3.5 rounded-2xl bg-primary text-white font-extrabold shadow-md shadow-primary/20 disabled:opacity-60">
                                                    {medicalSubmitting ? 'Saving...' : 'Save Prescription'}
                                                </button>
                                            </form>

                                            <form onSubmit={submitVitals} className="rounded-[2rem] border border-slate-100 bg-slate-50/70 p-6 space-y-4">
                                                <h4 className="text-xl font-black font-headline text-slate-900">Add Vital Levels</h4>
                                                <Field label="Linked Appointment">
                                                    <select
                                                        value={vitalsForm.appointment_id}
                                                        onChange={(e) => setVitalsForm({ ...vitalsForm, appointment_id: e.target.value })}
                                                        className={inputBaseClass}
                                                    >
                                                        <option value="">Optional</option>
                                                        {(patientRecords.doctor_visits || []).map((item) => (
                                                            <option key={item.id} value={item.id}>
                                                                {formatDisplayDateTime(item.appointment_date)} | {item.symptom}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </Field>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <Field label="Blood Pressure"><input value={vitalsForm.blood_pressure} onChange={(e) => setVitalsForm({ ...vitalsForm, blood_pressure: e.target.value })} className={inputBaseClass} placeholder="120/80" /></Field>
                                                    <Field label="Blood Sugar"><input value={vitalsForm.blood_sugar} onChange={(e) => setVitalsForm({ ...vitalsForm, blood_sugar: e.target.value })} className={inputBaseClass} placeholder="98 mg/dL" /></Field>
                                                    <Field label="Heart Rate"><input value={vitalsForm.heart_rate} onChange={(e) => setVitalsForm({ ...vitalsForm, heart_rate: e.target.value })} className={inputBaseClass} placeholder="72 bpm" /></Field>
                                                    <Field label="Temperature"><input value={vitalsForm.temperature} onChange={(e) => setVitalsForm({ ...vitalsForm, temperature: e.target.value })} className={inputBaseClass} placeholder="98.4 F" /></Field>
                                                    <Field label="Weight"><input value={vitalsForm.weight} onChange={(e) => setVitalsForm({ ...vitalsForm, weight: e.target.value })} className={inputBaseClass} placeholder="70 kg" /></Field>
                                                    <Field label="Oxygen Saturation"><input value={vitalsForm.oxygen_saturation} onChange={(e) => setVitalsForm({ ...vitalsForm, oxygen_saturation: e.target.value })} className={inputBaseClass} placeholder="98%" /></Field>
                                                </div>
                                                <Field label="Clinical Notes">
                                                    <textarea
                                                        value={vitalsForm.notes}
                                                        onChange={(e) => setVitalsForm({ ...vitalsForm, notes: e.target.value })}
                                                        className={`${inputBaseClass} min-h-[100px] resize-none`}
                                                    />
                                                </Field>
                                                <button type="submit" disabled={medicalSubmitting} className="w-full py-3.5 rounded-2xl bg-emerald-600 text-white font-extrabold shadow-md shadow-emerald-200 disabled:opacity-60">
                                                    {medicalSubmitting ? 'Saving...' : 'Save Vital Record'}
                                                </button>
                                            </form>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatCard = ({ label, value, icon, accent }) => (
    <div className={`rounded-[2rem] border border-slate-100 bg-gradient-to-br ${accent} p-[1px] shadow-sm`}>
        <div className="rounded-[calc(2rem-1px)] bg-white/90 backdrop-blur-sm px-5 py-5">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{label}</p>
                    <p className="mt-3 text-3xl font-black font-headline text-slate-900">{value ?? 0}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-slate-50 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl">{icon}</span>
                </div>
            </div>
        </div>
    </div>
);

const SectionCard = ({ title, subtitle, actions, children }) => (
    <section className="rounded-[2.25rem] border border-slate-100 bg-white/90 backdrop-blur-sm shadow-sm p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
            <div className="text-left">
                <h2 className="text-2xl font-black font-headline text-slate-900 tracking-tight">{title}</h2>
                <p className="mt-2 text-sm font-medium text-slate-500 leading-relaxed">{subtitle}</p>
            </div>
            {actions}
        </div>
        {children}
    </section>
);

const MiniMetric = ({ label, value }) => (
    <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{label}</p>
        <p className="mt-2 text-xl font-black text-slate-900">{value ?? 0}</p>
    </div>
);

const InfoPill = ({ label, value }) => (
    <div className="rounded-2xl bg-white/10 border border-white/10 px-4 py-3">
        <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/60">{label}</p>
        <p className="mt-2 text-sm font-extrabold text-white">{value}</p>
    </div>
);

const SummaryCard = ({ label, value }) => (
    <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50/70 px-4 py-4">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{label}</p>
        <p className="mt-3 text-base font-black text-slate-900">{value}</p>
    </div>
);

const Field = ({ label, children }) => (
    <label className="block text-left space-y-2">
        <span className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400 ml-1">{label}</span>
        {children}
    </label>
);

const EmptyState = ({ message }) => (
    <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50/70 px-5 py-8 text-center">
        <p className="text-sm font-bold text-slate-400">{message}</p>
    </div>
);

const RecordList = ({ items, emptyMessage, renderItem }) => (
    <div className="space-y-3">
        {!items || items.length === 0 ? <EmptyState message={emptyMessage} /> : items.map(renderItem)}
    </div>
);

const VitalChip = ({ label, value }) => (
    <div className="rounded-xl bg-white border border-slate-200 px-3 py-3">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
        <p className="mt-2 text-sm font-extrabold text-slate-800">{value || 'N/A'}</p>
    </div>
);

export default DoctorDashboard;
