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
        if (initialAppointment && Object.keys(initialAppointment).length > 0) {
            setResolvedAppointment(initialAppointment);
        }
        if (initialDoctor && Object.keys(initialDoctor).length > 0) {
            setResolvedDoctor(initialDoctor);
        }
    }, [initialAppointment, initialDoctor]);

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
                            session_id: matchingApt.session
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

    const [paymentMethod, setPaymentMethod] = useState('card');
    const [step, setStep] = useState('method'); // method, details, processing, success
    const [isProcessing, setIsProcessing] = useState(false);
    
    const consultationFee = parseInt(resolvedDoctor?.consultation_fee) || 4500;
    const hospitalFee = 500;
    const totalAmount = consultationFee + hospitalFee;
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [transactionId, setTransactionId] = useState('');

    useEffect(() => {
        if (!resolvedAppointment || !resolvedDoctor) {
            // navigate('/doctors');
        }
    }, [resolvedAppointment, resolvedDoctor, navigate]);

    const handlePayment = async () => {
        setIsProcessing(true);
        setStep('processing');

        const txnId = `TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        setTransactionId(txnId);

        if (!resolvedAppointment?.appointment_id && !resolvedAppointment?.id) {
            alert(`No appointment information found. Debug: navKeys=${Object.keys(navState || {}).join(',')}. Please try booking again.`);
            setIsProcessing(false);
            setStep('method');
            return;
        }

        try {
            // Call the real confirmation API which also triggers the email
            const response = await apiService.confirmPayment({
                appointment_id: resolvedAppointment.appointment_id || resolvedAppointment.id,
                amount: totalAmount,
                payment_method: paymentMethod === 'card' ? 'Card' : 'Cash at Counter',
                transaction_id: txnId
            });

            if (response) {
                localStorage.removeItem('paymentState');
                setStep('success');
            }
        } catch (error) {
            console.error("Payment confirmation failed", error);
            setStep('method');
            alert("Failed to process payment. Please contact assistance.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleBack = () => {
        if (step === 'details') setStep('method');
        else navigate(-1);
    };

    const patient = JSON.parse(localStorage.getItem('activePatient') || '{}');
    const patientName = patient.full_name || patient.name || 'Patient';

    if (step === 'success') {
        return (
            <div className="w-screen h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center payment-container overflow-y-auto">
                <div className="ambient-blob blob-1" />
                <div className="ambient-blob blob-2" />
                
                <div className="payment-card p-6 md:p-8 rounded-[2.5rem] max-w-md w-full relative z-10 animate-fade-in my-auto">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 payment-success-check">
                        <span className="material-symbols-outlined text-4xl font-bold">check</span>
                    </div>
                    <h2 className="text-2xl font-black text-on-surface font-headline mb-2">Payment Successful!</h2>
                    
                    {/* Notification Status Badges */}
                    <div className="flex justify-center gap-3 mb-4">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 rounded-full border border-green-100">
                            <span className="material-symbols-outlined text-green-600 text-xs">mail</span>
                            <span className="text-[9px] font-black text-green-700 uppercase tracking-widest">Email Sent</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 rounded-full border border-green-100">
                            <span className="material-symbols-outlined text-green-600 text-xs">chat</span>
                            <span className="text-[9px] font-black text-green-700 uppercase tracking-widest">WhatsApp Sent</span>
                        </div>
                    </div>

                    <p className="text-slate-500 font-semibold text-xs mb-4 max-w-sm mx-auto">
                        Your appointment with <span className="font-bold text-primary">{resolvedDoctor?.name}</span> is confirmed. Digital receipts sent.
                    </p>
                    
                    <div className="bg-slate-50 rounded-2xl p-5 mb-5 text-left border border-slate-100 relative overflow-hidden">
                        {/* Receipt Header */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-primary/20"></div>
                        <div className="text-center mb-4 border-b border-slate-200 pb-2">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-0.5">Official Receipt</h3>
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
                        </div>

                        <div className="border-t border-slate-200 pt-3 flex justify-between items-end">
                            <div>
                                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Transaction ID</span>
                                <span className="text-[10px] font-mono font-bold text-slate-500">{transactionId}</span>
                            </div>
                            <div className="text-right">
                                <span className="block text-[9px] font-bold text-primary uppercase tracking-widest mb-0.5">Total Paid</span>
                                <span className="text-lg font-black text-primary">Rs. {totalAmount.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={() => navigate('/')}
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

                            <div className="grid grid-cols-2 gap-6">
                                <button 
                                    onClick={() => setPaymentMethod('card')}
                                    className={`method-option p-8 rounded-[2.5rem] bg-white text-left ${paymentMethod === 'card' ? 'selected ring-4 ring-primary/10' : 'border-slate-100'}`}
                                >
                                    <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6">
                                        <span className="material-symbols-outlined text-3xl">credit_card</span>
                                    </div>
                                    <h4 className="text-lg font-black text-on-surface mb-1">Credit / Debit Card</h4>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed">Pay securely using your Visa, Mastercard or Amex</p>
                                </button>

                                <button 
                                    onClick={() => setPaymentMethod('counter')}
                                    className={`method-option p-8 rounded-[2.5rem] bg-white text-left ${paymentMethod === 'counter' ? 'selected ring-4 ring-primary/10' : 'border-slate-100'}`}
                                >
                                    <div className="w-14 h-14 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center mb-6">
                                        <span className="material-symbols-outlined text-3xl">payments</span>
                                    </div>
                                    <h4 className="text-lg font-black text-on-surface mb-1">Pay at Counter</h4>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed">Confirm appointment and pay in cash at the reception</p>
                                </button>
                            </div>

                            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm">
                                <h3 className="text-lg font-black text-on-surface mb-8">Payment Details</h3>
                                
                                {paymentMethod === 'card' ? (
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Card Number</label>
                                            <div className="relative">
                                                <input 
                                                    type="text" 
                                                    placeholder="0000 0000 0000 0000"
                                                    className="w-full bg-slate-50 border-2 border-transparent focus:border-primary/10 focus:bg-white px-6 py-4 rounded-2xl outline-none transition-all font-bold card-number-input"
                                                    value={cardNumber}
                                                    onChange={(e) => setCardNumber(e.target.value)}
                                                />
                                                <div className="absolute right-6 top-1/2 -translate-y-1/2 flex gap-2">
                                                    <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-4 opacity-50" alt="Visa" />
                                                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-6 opacity-50" alt="Mastercard" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Expiry Date</label>
                                                <input 
                                                    type="text" 
                                                    placeholder="MM / YY"
                                                    className="w-full bg-slate-50 border-2 border-transparent focus:border-primary/10 focus:bg-white px-6 py-4 rounded-2xl outline-none transition-all font-bold"
                                                    value={expiry}
                                                    onChange={(e) => setExpiry(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CVV</label>
                                                <input 
                                                    type="password" 
                                                    placeholder="•••"
                                                    className="w-full bg-slate-50 border-2 border-transparent focus:border-primary/10 focus:bg-white px-6 py-4 rounded-2xl outline-none transition-all font-bold"
                                                    value={cvv}
                                                    onChange={(e) => setCvv(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-6 text-center">
                                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <span className="material-symbols-outlined text-4xl text-slate-300">point_of_sale</span>
                                        </div>
                                        <p className="text-sm font-medium text-slate-500 max-w-sm mx-auto">
                                            You will be issued a provisional ticket. Please proceed to the main reception to complete your payment and activate your session.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <button 
                                onClick={handlePayment}
                                className="w-full py-6 bg-primary text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-primary/30 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3"
                            >
                                <span className="material-symbols-outlined">lock</span>
                                {paymentMethod === 'card' ? `Securely Pay Rs. ${totalAmount.toLocaleString()}` : 'Confirm & Generate Ticket'}
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
