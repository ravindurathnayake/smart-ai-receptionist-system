import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Logo from '../../components/common/Logo';
import { apiService } from '../../services/apiService';
import './KioskPayment.css';

const KioskPayment = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    let navState = location.state;
    if (!navState || Object.keys(navState).length === 0) {
        try {
            const savedState = localStorage.getItem('paymentState');
            if (savedState) {
                navState = JSON.parse(savedState);
            } else {
                const lastAppt = localStorage.getItem('last_appointment');
                if (lastAppt) {
                    const parsedAppt = JSON.parse(lastAppt);
                    navState = { appointment: parsedAppt, doctor: parsedAppt.doctor || {} };
                }
            }
        } catch (e) {
            console.error("Failed to parse payment state from localStorage", e);
        }
    }
    
    const { appointment: initialAppointment, doctor: initialDoctor } = navState || { appointment: {}, doctor: {} };

    const [resolvedAppointment, setResolvedAppointment] = useState(initialAppointment || {});
    const [resolvedDoctor, setResolvedDoctor] = useState(initialDoctor || {});

    useEffect(() => {
        const healState = async () => {
            const apptId = resolvedAppointment?.appointment_id || resolvedAppointment?.id;
            if (apptId && (!resolvedDoctor?.name || resolvedDoctor?.name === '')) {
                try {
                    console.log("Self-healing state for appointment ID:", apptId);
                    const appointments = await apiService.getAllAppointments();
                    const apptIdNum = parseInt(apptId) || apptId;
                    
                    const matchingApt = appointments.find(a => 
                        a.raw_id === apptIdNum || 
                        a.id === apptId || 
                        a.id === `#APT-${String(apptIdNum).padStart(4, '0')}`
                    );
                    
                    if (matchingApt) {
                        console.log("Found matching appointment for self-healing:", matchingApt);
                        
                        let doctorDetails = null;
                        try {
                            if (matchingApt.specialist_id) {
                                doctorDetails = await apiService.getSpecialistDetails(matchingApt.specialist_id);
                            }
                        } catch (docErr) {
                            console.error("Failed to fetch doctor details during self-healing:", docErr);
                        }
                        
                        setResolvedDoctor({
                            id: matchingApt.specialist_id,
                            name: doctorDetails?.name 
                                ? (doctorDetails.name.startsWith('Dr.') ? doctorDetails.name : `Dr. ${doctorDetails.name}`) 
                                : (matchingApt.dr.startsWith('Dr.') ? matchingApt.dr : `Dr. ${matchingApt.dr}`),
                            specialty: doctorDetails?.specialization || matchingApt.department || 'General Practice',
                            consultation_fee: doctorDetails?.consultation_fee || 4500
                        });
                        
                        setResolvedAppointment(prev => ({
                            ...prev,
                            appointment_date: matchingApt.date,
                            session_time: matchingApt.time,
                            session_id: matchingApt.session,
                            patient_name: matchingApt.patient
                        }));
                    }
                } catch (err) {
                    console.error("Failed to self-heal payment state:", err);
                }
            }
        };

        healState();
    }, [resolvedAppointment?.appointment_id, resolvedAppointment?.id, resolvedDoctor?.name]);

    const getAppointmentDateTime = () => {
        const rawDate = resolvedAppointment?.appointment_date || resolvedAppointment?.date || '';
        const rawTime = resolvedAppointment?.session_time || resolvedAppointment?.time || '';
        
        let dateStr = String(rawDate).trim();
        let timeStr = String(rawTime).trim() || 'Scheduled';
        
        if (dateStr.includes(' ')) {
            const parts = dateStr.split(' ');
            dateStr = parts[0];
            const potentialTime = parts.slice(1).join(' ');
            if (potentialTime && potentialTime !== '00:00:00') {
                timeStr = potentialTime;
            }
        }
        
        try {
            if (dateStr) {
                const dateObj = new Date(dateStr);
                if (!isNaN(dateObj.getTime())) {
                    dateStr = dateObj.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    });
                }
            }
        } catch (e) {
            console.error("Failed to format date:", e);
        }
        
        if (timeStr && /^\d{2}:\d{2}(:\d{2})?$/.test(timeStr)) {
            try {
                const [hh, mm] = timeStr.split(':');
                const hour = parseInt(hh, 10);
                const ampm = hour >= 12 ? 'PM' : 'AM';
                const formattedHour = hour % 12 || 12;
                timeStr = `${String(formattedHour).padStart(2, '0')}:${mm} ${ampm}`;
            } catch (e) {
                console.error("Failed to format time:", e);
            }
        }
        
        return { date: dateStr || 'TBD', time: timeStr || 'Scheduled' };
    };
    
    const { date: displayDate, time: displayTime } = getAppointmentDateTime();

    const [paymentMethod, setPaymentMethod] = useState('payhere'); // PayHere is default premium online method now
    const [step, setStep] = useState('method'); // method, details, processing, success
    
    const consultationFee = parseInt(resolvedDoctor?.consultation_fee) || 4500;
    const hospitalFee = 500;
    const totalAmount = consultationFee + hospitalFee;
    const [transactionId, setTransactionId] = useState('');
    const [notificationStatus, setNotificationStatus] = useState({ email: 'skipped', whatsapp: 'skipped' });
    const [notificationWarnings, setNotificationWarnings] = useState([]);
    
    const isCounterPayment = paymentMethod === 'counter';
    const isPayHerePayment = paymentMethod === 'payhere';
    
    const receiptTitle = isCounterPayment ? 'Counter Payment Ticket' : isPayHerePayment ? 'PayHere Gateway Receipt' : 'Official Receipt';
    const receiptBadge = isCounterPayment ? 'Payment Pending' : 'Payment Successful!';
    const receiptStamp = isCounterPayment ? 'UNPAID' : 'PAID';
    const referenceLabel = isCounterPayment ? 'Ticket Reference' : 'Transaction ID';
    const totalLabel = isCounterPayment ? 'Amount Due' : 'Total Paid';
    const notificationLabel = isCounterPayment ? 'Ticket Sent' : 'Email Sent';
    const whatsappLabel = isCounterPayment ? 'Counter Notice' : 'WhatsApp';
    
    useEffect(() => {
        if (!resolvedAppointment || !resolvedDoctor) {
            // navigate('/doctors');
        }
    }, [resolvedAppointment, resolvedDoctor, navigate]);

    const handlePayHerePayment = async () => {
        const appointmentId = resolvedAppointment.appointment_id || resolvedAppointment.id;
        if (!appointmentId) {
            alert(`No appointment information found. Please try booking again.`);
            setStep('method');
            return;
        }

        if (!window.payhere) {
            alert("PayHere Secure payment library is loading. Please wait a moment or verify your internet connection.");
            return;
        }

        setStep('processing');

        try {
            // 1. Fetch secure PayHere hash from the backend
            const response = await apiService.getPayHereHash(appointmentId, totalAmount);
            if (!response) {
                throw new Error("Invalid checkout response from server.");
            }
            
            const checkoutConfig = response.data || response;
            
            // 2. Set the redirect return/cancel/notify URLs dynamically based on kiosk browser with solid fallbacks
            checkoutConfig.return_url = checkoutConfig.return_url || (window.location.origin + "/patient-dashboard");
            checkoutConfig.cancel_url = checkoutConfig.cancel_url || window.location.href;
            checkoutConfig.notify_url = checkoutConfig.notify_url || "http://localhost:5000/api/payment/payhere-notify";
            
            // 3. Configure PayHere callback handlers
            window.payhere.onCompleted = async function onCompleted(orderId) {
                console.log("PayHere payment completed securely. Order ID/Payment ID:", orderId);
                setStep('processing');
                
                try {
                    // Update our backend DB immediately to secure local/demo flow
                    const confirmRes = await apiService.confirmPayment({
                        appointment_id: appointmentId,
                        amount: totalAmount,
                        payment_method: 'Online (PayHere Sandbox)',
                        transaction_id: orderId || `PH-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
                    });
                    
                    if (confirmRes) {
                        setTransactionId(orderId || confirmRes.data?.transaction_id || `PH-${Math.random().toString(36).substr(2, 9).toUpperCase()}`);
                        setNotificationStatus(confirmRes.data?.notifications || { email: 'sent', whatsapp: 'sent' });
                        setNotificationWarnings(confirmRes.data?.warnings || []);
                        localStorage.removeItem('paymentState');
                        setStep('success');
                    }
                } catch (confirmErr) {
                    console.error("Local payment confirmation after PayHere success failed:", confirmErr);
                    alert("Payment succeeded, but receipt generation failed on the server. Please contact clinic reception.");
                    setStep('method');
                }
            };
            
            window.payhere.onDismissed = function onDismissed() {
                console.log("PayHere payment dismissed by user.");
                setStep('method');
            };
            
            window.payhere.onError = function onError(error) {
                console.error("PayHere gateway error details:", error);
                alert(`PayHere Gateway failed to load. Details: "${error}". Please try again or choose another payment method.`);
                setStep('method');
            };
            
            // 4. Start PayHere Payment Modal!
            window.payhere.startPayment(checkoutConfig);
            
        } catch (err) {
            console.error("Initiating PayHere payment failed:", err);
            alert(err.message || "Failed to load PayHere secure payment portal. Please try again.");
            setStep('method');
        }
    };

    const handlePayment = async () => {
        setStep('processing');

        const txnId = `TKT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        setTransactionId(txnId);

        if (!resolvedAppointment?.appointment_id && !resolvedAppointment?.id) {
            alert(`No appointment information found. Please try booking again.`);
            setStep('method');
            return;
        }

        try {
            // Call the real confirmation API which also triggers the email
            const response = await apiService.confirmPayment({
                appointment_id: resolvedAppointment.appointment_id || resolvedAppointment.id,
                amount: totalAmount,
                payment_method: 'Cash at Counter',
                transaction_id: txnId
            });

            if (response) {
                setNotificationStatus(response.data?.notifications || { email: 'skipped', whatsapp: 'skipped' });
                setNotificationWarnings(response.data?.warnings || []);
                localStorage.removeItem('paymentState');
                setStep('success');
            }
        } catch (error) {
            console.error("Payment confirmation failed", error);
            setStep('method');
            alert("Failed to process payment. Please contact assistance.");
        }
    };

    const handleBack = () => {
        if (step === 'details') setStep('method');
        else navigate(-1);
    };

    const patient = JSON.parse(localStorage.getItem('activePatient') || '{}');
    const patientName = resolvedAppointment?.patient_name || resolvedAppointment?.patient || patient.full_name || patient.name || 'Patient';
    const emailBadgeLabel = notificationStatus.email === 'sent' ? notificationLabel : notificationStatus.email === 'failed' ? 'Email Failed' : 'Email Pending';
    const whatsappBadgeLabel = notificationStatus.whatsapp === 'sent' ? `${whatsappLabel} Sent` : notificationStatus.whatsapp === 'failed' ? `${whatsappLabel} Failed` : `${whatsappLabel} Pending`;
    const emailBadgeTone = notificationStatus.email === 'failed' ? 'bg-rose-50 border-rose-100 text-rose-700' : notificationStatus.email === 'sent' ? `${isCounterPayment ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-green-50 border-green-100 text-green-700'}` : 'bg-slate-50 border-slate-100 text-slate-600';
    const whatsappBadgeTone = notificationStatus.whatsapp === 'failed' ? 'bg-rose-50 border-rose-100 text-rose-700' : notificationStatus.whatsapp === 'sent' ? `${isCounterPayment ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-green-50 border-green-100 text-green-700'}` : 'bg-slate-50 border-slate-100 text-slate-600';

    if (step === 'success') {
        return (
            <div className="w-screen h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center payment-container overflow-y-auto">
                <div className="ambient-blob blob-1" />
                <div className="ambient-blob blob-2" />
                
                <div className="payment-card p-6 md:p-8 rounded-[2.5rem] max-w-md w-full relative z-10 animate-fade-in my-auto">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 payment-success-check ${isCounterPayment ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                        <span className="material-symbols-outlined text-4xl font-bold">{isCounterPayment ? 'receipt_long' : 'check'}</span>
                    </div>
                    <h2 className="text-2xl font-black text-on-surface font-headline mb-2">{receiptBadge}</h2>
                    
                    {/* Notification Status Badges */}
                    <div className="flex justify-center gap-3 mb-4">
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${emailBadgeTone}`}>
                            <span className="material-symbols-outlined text-xs">mail</span>
                            <span className="text-[9px] font-black uppercase tracking-widest">{emailBadgeLabel}</span>
                        </div>
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${whatsappBadgeTone}`}>
                            <span className="material-symbols-outlined text-xs">chat</span>
                            <span className="text-[9px] font-black uppercase tracking-widest">{whatsappBadgeLabel}</span>
                        </div>
                    </div>

                    <p className="text-slate-500 font-semibold text-xs mb-4 max-w-sm mx-auto">
                        Your appointment with <span className="font-bold text-primary">{resolvedDoctor?.name || 'the selected doctor'}</span> is confirmed.
                        {isCounterPayment ? ' Show this provisional ticket at the billing counter to complete payment.' : ' Digital receipts sent.'}
                    </p>

                    {notificationWarnings.length > 0 && (
                        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-[11px] font-bold leading-relaxed text-amber-800">
                            {notificationWarnings.map((warning, index) => (
                                <p key={`${warning}-${index}`}>{warning}</p>
                            ))}
                        </div>
                    )}
                    
                    <div className="bg-slate-50 rounded-2xl p-5 mb-5 text-left border border-slate-100 relative overflow-hidden">
                        {/* Receipt Header */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-primary/20"></div>
                        
                        {/* Paid / Unpaid Stamp */}
                        {paymentMethod === 'counter' ? (
                            <div className="absolute -right-4 -top-4 w-24 h-24 border-4 border-dashed border-rose-500/30 rounded-full flex items-center justify-center rotate-[15deg] pointer-events-none select-none">
                                <span className="text-rose-500/30 font-black text-xs tracking-widest uppercase">{receiptStamp}</span>
                            </div>
                        ) : (
                            <div className="absolute -right-4 -top-4 w-24 h-24 border-4 border-dashed border-emerald-500/30 rounded-full flex items-center justify-center rotate-[15deg] pointer-events-none select-none">
                                <span className="text-emerald-500/30 font-black text-xs tracking-widest uppercase">{receiptStamp}</span>
                            </div>
                        )}
                        
                        <div className="text-center mb-4 border-b border-slate-200 pb-2">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-0.5">{receiptTitle}</h3>
                            <p className="text-[10px] text-slate-400">MediAssist Healthcare</p>
                        </div>
                        
                        <div className="space-y-2.5 mb-4">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-500">Patient</span>
                                <span className="text-xs font-black text-on-surface">{patientName}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-500">Specialist</span>
                                <div className="text-right">
                                    <span className="text-xs font-black text-on-surface">{resolvedDoctor?.name || "General"}</span>
                                    {resolvedDoctor?.specialty && (
                                        <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{resolvedDoctor.specialty}</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-500">Date</span>
                                <span className="text-xs font-black text-on-surface">{displayDate}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-500">Session Time</span>
                                <span className="text-xs font-black text-on-surface">{displayTime}</span>
                            </div>
                        </div>

                        <div className="border-t border-dashed border-slate-300 pt-3 mb-3 space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Consultation Fee</span>
                                <span className="text-xs font-bold text-on-surface">Rs. {(parseInt(resolvedDoctor?.consultation_fee) || 4500).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hospital Fee</span>
                                <span className="text-xs font-bold text-on-surface">Rs. 500</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Payment Method</span>
                                <span className="text-xs font-bold text-on-surface">{isCounterPayment ? 'Cash at Counter' : 'Online (PayHere)'}</span>
                            </div>
                        </div>

                        {isCounterPayment && (
                            <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] font-bold leading-relaxed text-amber-800">
                                This ticket reserves your appointment. Please pay at the reception or billing counter before the consultation starts.
                            </div>
                        )}

                        <div className="border-t border-slate-200 pt-3 flex justify-between items-end">
                            <div>
                                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{referenceLabel}</span>
                                <span className="text-[10px] font-mono font-bold text-slate-500">{transactionId}</span>
                            </div>
                            <div className="text-right">
                                <span className={`block text-[9px] font-bold uppercase tracking-widest mb-0.5 ${isCounterPayment ? 'text-amber-600' : 'text-primary'}`}>{totalLabel}</span>
                                <span className={`text-lg font-black ${isCounterPayment ? 'text-amber-600' : 'text-primary'}`}>Rs. {totalAmount.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={() => {
                            if (patient && patient.id) {
                                navigate('/patient-dashboard');
                            } else {
                                navigate('/');
                            }
                        }}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-base shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all"
                    >
                        Done
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-screen h-screen overflow-hidden flex font-body bg-slate-50 text-on-surface payment-container">
            <div className="ambient-blob blob-1" />
            <div className="ambient-blob blob-2" />

            {/* Sidebar (Optional, maybe just a clean back button) */}
            <aside className="hidden md:flex flex-col w-72 h-screen bg-white/80 backdrop-blur-xl border-r border-outline-variant/30 z-20 shrink-0">
                <div className="p-8">
                    <Logo size="sm" />
                </div>
                <div className="px-8 mt-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Order Summary</h3>
                    
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                <span className="material-symbols-outlined">medical_information</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Specialist</p>
                                <p className="text-xs font-black text-on-surface leading-tight">{resolvedDoctor?.name}</p>
                                <p className="text-[10px] font-bold text-slate-500 mt-1">{resolvedDoctor?.specialty}</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                                <span className="material-symbols-outlined">calendar_today</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Appointment Date</p>
                                <p className="text-xs font-black text-on-surface leading-tight">{displayDate}</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                                <span className="material-symbols-outlined">schedule</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Session Time</p>
                                <p className="text-xs font-black text-on-surface leading-tight">{displayTime}</p>
                                {resolvedAppointment?.session_id && (
                                    <p className="text-[10px] font-bold text-slate-500 mt-1">Session ID: {resolvedAppointment.session_id}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 pt-8 border-t border-slate-100">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-slate-500">Consultation Fee</span>
                            <span className="text-xs font-bold text-on-surface">Rs. {consultationFee.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-xs font-bold text-slate-500">Hospital Fee</span>
                            <span className="text-xs font-bold text-on-surface">Rs. {hospitalFee.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-black text-on-surface">Total</span>
                            <span className="text-xl font-black text-primary">Rs. {totalAmount.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-auto p-8">
                    <button 
                        onClick={handleBack}
                        className="w-full py-4 bg-slate-50 text-slate-500 rounded-2xl font-bold text-sm border border-slate-100 hover:bg-white transition-all flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">arrow_back</span>
                        Go Back
                    </button>
                </div>
            </aside>

            <main className="flex-1 flex flex-col relative z-10 overflow-y-auto">
                <header className="px-12 h-24 flex items-center justify-between shrink-0">
                    <div>
                        <h1 className="text-2xl font-black text-on-surface font-headline">Secure Checkout</h1>
                        <p className="text-sm text-slate-500 font-medium">Choose your preferred payment method</p>
                    </div>
                    
                    <div className="flex items-center gap-4 bg-white/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-white shadow-sm">
                        <div className="text-right">
                            <p className="text-xs font-bold text-on-surface leading-none">{patientName}</p>
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-1">Secure Session</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                            {patientName.charAt(0)}
                        </div>
                    </div>
                </header>

                <div className="px-12 py-8 max-w-3xl">
                    {step === 'method' && (
                        <div className="space-y-8 animate-fade-in">
                            {/* Premium Mobile/Tablet Order Summary Banner */}
                            <div className="md:hidden bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Appointment Details</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Specialist</p>
                                        <p className="text-xs font-black text-on-surface leading-tight">{resolvedDoctor?.name || "General"}</p>
                                        <p className="text-[10px] font-bold text-slate-500 mt-1">{resolvedDoctor?.specialty}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Schedule</p>
                                        <p className="text-xs font-black text-on-surface leading-tight">{displayDate}</p>
                                        <p className="text-[10px] font-bold text-slate-500 mt-1">{displayTime}</p>
                                    </div>
                                </div>
                                <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-xs">
                                    <span className="font-bold text-slate-400 uppercase tracking-widest">Total Amount</span>
                                    <span className="font-black text-primary text-sm">Rs. {totalAmount.toLocaleString()}</span>
                                </div>
                            </div>

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                 <button 
                                     onClick={() => setPaymentMethod('payhere')}
                                     className={`method-option p-6 rounded-[2rem] bg-white text-left flex flex-col justify-between min-h-[13.5rem] transition-all duration-300 relative overflow-hidden ${
                                         paymentMethod === 'payhere' 
                                             ? 'border-emerald-500 ring-4 ring-emerald-500/10 shadow-md shadow-emerald-500/5' 
                                             : 'border-slate-100 hover:border-slate-300'
                                     } border-2`}
                                 >
                                     <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-50/50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                                     
                                     <div>
                                         <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 ${
                                             paymentMethod === 'payhere' ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-600'
                                         }`}>
                                             <span className="material-symbols-outlined text-2xl">payments</span>
                                         </div>
                                         <h4 className="text-base font-black text-slate-800 mb-1.5 font-headline">Secure Online Checkout</h4>
                                         <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                                             Activate your booking instantly by paying securely online using credit/debit cards or mobile wallets.
                                         </p>
                                     </div>
                                     
                                     <div className="flex gap-2.5 items-center mt-4">
                                         <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded border border-emerald-100 text-[9px] font-black uppercase tracking-wider">
                                             <span className="material-symbols-outlined text-[11px]">credit_card</span>
                                             Card
                                         </div>
                                         <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded border border-emerald-100 text-[9px] font-black uppercase tracking-wider">
                                             <span className="material-symbols-outlined text-[11px]">account_balance_wallet</span>
                                             Wallet
                                         </div>
                                         <span className="text-[8px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 uppercase tracking-widest">PayHere Portal</span>
                                     </div>
                                 </button>

                                 <button 
                                     onClick={() => setPaymentMethod('counter')}
                                     className={`method-option p-6 rounded-[2rem] bg-white text-left flex flex-col justify-between min-h-[13.5rem] transition-all duration-300 relative overflow-hidden ${
                                         paymentMethod === 'counter' 
                                             ? 'border-amber-500 ring-4 ring-amber-500/10 shadow-md shadow-amber-500/5' 
                                             : 'border-slate-100 hover:border-slate-300'
                                     } border-2`}
                                 >
                                     <div className="absolute top-0 right-0 w-28 h-28 bg-amber-50/50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                                     
                                     <div>
                                         <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 ${
                                             paymentMethod === 'counter' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-600'
                                         }`}>
                                             <span className="material-symbols-outlined text-2xl">point_of_sale</span>
                                         </div>
                                         <h4 className="text-base font-black text-slate-800 mb-1.5 font-headline">Pay at Hospital Counter</h4>
                                         <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                                             Confirm your appointment immediately and settle the consultation fees in cash or card at the reception counter.
                                         </p>
                                     </div>
                                     
                                     <div className="flex items-center gap-1.5 mt-4">
                                         <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                         <span className="text-[8px] font-black text-amber-700 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded border border-amber-100">Provisional Ticket Issued</span>
                                     </div>
                                 </button>
                             </div>
 
                             <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm relative overflow-hidden">
                                 <div className="absolute top-0 left-0 w-full h-1 bg-slate-100" />
                                 <h3 className="text-xs font-black text-on-surface mb-4 uppercase tracking-wider text-slate-400">Payment Summary & Details</h3>
                                 
                                 {paymentMethod === 'payhere' && (
                                     <div className="py-2 text-center animate-fade-in">
                                         <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-2.5">
                                             <span className="material-symbols-outlined text-2xl text-emerald-600">verified_user</span>
                                         </div>
                                         <h4 className="text-sm font-extrabold text-emerald-950 mb-1">Secure Sandbox Gateway</h4>
                                         <p className="text-[11px] font-semibold text-slate-500 max-w-sm mx-auto leading-relaxed">
                                             Click the button below to launch the official PayHere secure portal popup. Sandbox allows you to simulate successful online payments.
                                         </p>
                                         <div className="mt-4 flex justify-center gap-3">
                                             <span className="text-[8px] font-black text-emerald-600 bg-emerald-50/50 px-3 py-1 rounded-full border border-emerald-100 uppercase tracking-wider">Sandbox Mode Active</span>
                                             <span className="text-[8px] font-black text-emerald-600 bg-emerald-50/50 px-3 py-1 rounded-full border border-emerald-100 uppercase tracking-wider">Currency: LKR</span>
                                         </div>
                                     </div>
                                 )}

                                 {paymentMethod === 'counter' && (
                                     <div className="py-2 text-center animate-fade-in">
                                         <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-2.5">
                                             <span className="material-symbols-outlined text-2xl text-amber-600">storefront</span>
                                         </div>
                                         <h4 className="text-sm font-extrabold text-amber-950 mb-1">Physical Counter Checkout</h4>
                                         <p className="text-[11px] font-semibold text-slate-500 max-w-sm mx-auto leading-relaxed">
                                             You will be issued a provisional ticket. Please proceed to the main reception counter to complete your payment and activate your session.
                                         </p>
                                         <div className="mt-4 flex justify-center gap-3">
                                             <span className="text-[8px] font-black text-amber-600 bg-amber-50/50 px-3 py-1 rounded-full border border-amber-100 uppercase tracking-wider">Pay at Desk</span>
                                             <span className="text-[8px] font-black text-amber-600 bg-amber-50/50 px-3 py-1 rounded-full border border-amber-100 uppercase tracking-wider">Supports Cash/Card</span>
                                         </div>
                                     </div>
                                 )}
                             </div>
 
                             <button 
                                 onClick={paymentMethod === 'payhere' ? handlePayHerePayment : handlePayment}
                                 className={`w-full py-5 text-white rounded-[1.5rem] font-black text-lg shadow-2xl transition-all duration-300 flex items-center justify-center gap-3 ${
                                     paymentMethod === 'payhere' 
                                         ? 'bg-emerald-600 shadow-emerald-600/20 hover:bg-emerald-700 hover:scale-[1.01] active:scale-[0.99]' 
                                         : 'bg-amber-600 shadow-amber-600/20 hover:bg-amber-700 hover:scale-[1.01] active:scale-[0.99]'
                                 }`}
                             >
                                 <span className="material-symbols-outlined text-xl font-bold">
                                     {paymentMethod === 'payhere' ? 'lock' : 'receipt_long'}
                                 </span>
                                 {paymentMethod === 'payhere' ? 'Pay Now Securely' : 'Confirm & Generate Ticket'}
                             </button>
                        </div>
                    )}

                    {step === 'processing' && (
                        <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
                            <div className="relative w-32 h-32 mb-10">
                                <div className="absolute inset-0 border-8 border-primary/10 rounded-full" />
                                <div className="absolute inset-0 border-8 border-primary rounded-full border-t-transparent animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-4xl text-primary animate-pulse">security</span>
                                </div>
                            </div>
                            <h2 className="text-3xl font-black text-on-surface font-headline mb-3">Securely Processing</h2>
                            <p className="text-slate-500 font-medium">Please do not refresh or close this window.</p>
                            
                            <div className="mt-12 w-64 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-primary processing-shimmer" style={{ width: '100%' }} />
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default KioskPayment;
