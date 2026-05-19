import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import Logo from '../../components/common/Logo';
import { apiService } from '../../services/apiService';

const PatientRegister = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // Steps 1 to 4
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [registeredPatient, setRegisteredPatient] = useState(null);

    // Webcam Ref
    const webcamRef = useRef(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [scanStatus, setScanStatus] = useState('Ready');
    const [isSearchingGuardian, setIsSearchingGuardian] = useState(false);

    // Form States
    const [formData, setFormData] = useState({
        is_minor: false,
        full_name: '',
        phone_number: '',
        email: '',
        dob: '',
        gender: 'Male',
        nic: '',
        address: '',
        blood_type: 'Unknown',
        
        // Step 2: Symptoms
        symptomCategory: 'checkup',
        symptomDetails: '',
        
        // Guardian Details (If minor)
        guardian_name: '',
        guardian_nic: '',
        guardian_phone: '',
        guardian_email: '',
        guardian_relationship: 'Father',
        guardian_id: null,
        
        // Emergency Details (If primary)
        emergency_contact_name: '',
        emergency_contact_phone: ''
    });

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Trigger auto search guardian if NIC entered
        if (name === 'guardian_nic' && value.length >= 10) {
            debounceSearchGuardian(value);
        }
    };

    // Guardian search timeout
    const searchTimeoutRef = useRef(null);
    const debounceSearchGuardian = (nic) => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        setIsSearchingGuardian(true);
        searchTimeoutRef.current = setTimeout(async () => {
            try {
                const response = await apiService.findPatientByNic(nic);
                if (response.success && response.data) {
                    setFormData(prev => ({
                        ...prev,
                        guardian_name: response.data.name,
                        guardian_phone: response.data.phone,
                        guardian_email: response.data.email || '',
                        guardian_id: response.data.id
                    }));
                } else {
                    setFormData(prev => ({ ...prev, guardian_id: null }));
                }
            } catch (err) {
                setFormData(prev => ({ ...prev, guardian_id: null }));
            } finally {
                setIsSearchingGuardian(false);
            }
        }, 800);
    };

    const calculateAge = (dobString) => {
        if (!dobString) return 0;
        const birthDate = new Date(dobString);
        const today = new Date();
        let calculatedAge = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            calculatedAge--;
        }
        return calculatedAge;
    };

    const handleNext = () => {
        setError('');
        
        if (step === 1) {
            if (!formData.full_name.trim()) return setError('Please enter your full name.');
            if (!formData.dob) return setError('Please enter your date of birth.');
            
            const calculatedAge = calculateAge(formData.dob);
            const isMinor = calculatedAge > 0 && calculatedAge < 18;

            if (isMinor) {
                if (!formData.is_minor) {
                    return setError('Date of birth indicates the patient is a minor. Please check the minor registration checkbox above.');
                }
                if (!formData.guardian_name.trim()) return setError('Guardian full name is required for minors.');
                if (!formData.guardian_nic.trim()) return setError('Guardian NIC is required for minors.');
                if (!formData.guardian_phone.trim()) return setError('Guardian phone number is required.');
            } else {
                if (formData.is_minor) {
                    return setError('Date of birth indicates the patient is an adult. Please uncheck the minor checkbox.');
                }
                if (!formData.phone_number.trim()) return setError('Please enter your contact phone number.');
                if (!formData.nic.trim()) return setError('NIC number is required for primary accounts.');
            }

            if (!formData.address.trim()) return setError('Residential address is required.');
            
            setStep(2);
        } else if (step === 2) {
            setStep(3);
        } else if (step === 3) {
            setStep(4);
        }
    };

    const handlePrev = () => {
        setStep(prev => Math.max(1, prev - 1));
    };

    // Camera Capture Handler
    const handleCapture = () => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            setCapturedImage(imageSrc);
            setScanStatus('Analyzing...');
            
            setTimeout(() => {
                setScanStatus('Face Captured');
            }, 800);
        }
    };

    const handleResetCapture = () => {
        setCapturedImage(null);
        setScanStatus('Ready');
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError('');
        try {
            const calculatedAge = calculateAge(formData.dob);
            const isMinor = calculatedAge > 0 && calculatedAge < 18;

            const payload = {
                full_name: formData.full_name,
                phone_number: isMinor ? formData.guardian_phone : formData.phone_number,
                email: isMinor ? formData.guardian_email : formData.email,
                age: calculatedAge,
                gender: formData.gender,
                dob: formData.dob,
                nic: isMinor ? null : formData.nic,
                address: formData.address,
                blood_type: formData.blood_type,
                medical_history: formData.symptomDetails 
                    ? `Category: ${formData.symptomCategory}. Details: ${formData.symptomDetails}` 
                    : `Category: ${formData.symptomCategory}`,
                face_image: capturedImage,
                
                // Guardian Details
                guardian_name: isMinor ? formData.guardian_name : null,
                guardian_nic: isMinor ? formData.guardian_nic : null,
                guardian_phone: isMinor ? formData.guardian_phone : null,
                guardian_email: isMinor ? formData.guardian_email : null,
                guardian_relationship: isMinor ? formData.guardian_relationship : null,
                guardian_id: isMinor ? formData.guardian_id : null
            };

            const response = await apiService.createPatient(payload);
            
            if (response && response.id) {
                const patientData = {
                    id: response.id,
                    formatted_id: response.formatted_id || `PAT-${response.id.toString().padStart(4, '0')}`,
                    name: response.name || formData.full_name,
                    full_name: response.name || formData.full_name,
                    phone: isMinor ? formData.guardian_phone : formData.phone_number,
                    email: isMinor ? formData.guardian_email : formData.email,
                    nic: isMinor ? '' : formData.nic,
                    age: calculatedAge,
                    dob: formData.dob,
                    gender: formData.gender,
                    blood_type: formData.blood_type,
                    address: formData.address
                };
                
                setRegisteredPatient(patientData);
                setSuccess(true);
            } else {
                setError('Registration failed. Please check inputs.');
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Verification / registration failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleSuccessRedirect = () => {
        localStorage.setItem('activePatient', JSON.stringify(registeredPatient));
        navigate('/patient');
    };

    const categories = [
        { id: 'checkup', icon: 'stethoscope', title: 'General Checkup', desc: 'Routine screening or physical', color: 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100/40' },
        { id: 'consultation', icon: 'chat', title: 'Consultation', desc: 'Discussion of health concerns', color: 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100/40' },
        { id: 'laboratory', icon: 'biotech', title: 'Laboratory Work', desc: 'Diagnostic testing or imaging', color: 'bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100/40' },
        { id: 'emergency', icon: 'e911_emergency', title: 'Emergency Care', desc: 'Urgent acute attention', color: 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100/40', isEmergency: true },
        { id: 'pharmacy', icon: 'medication', title: 'Pharmacy Refill', desc: 'Prescription pickup or refill', color: 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100/40' },
        { id: 'followup', icon: 'event_repeat', title: 'Follow-up Consult', desc: 'Scheduled follow-up physical', color: 'bg-sky-50 text-sky-600 border-sky-100 hover:bg-sky-100/40' }
    ];

    const age = calculateAge(formData.dob);
    const isMinor = age > 0 && age < 18;

    return (
        <div className="min-h-screen bg-[#f8fafc] font-body text-slate-800 flex flex-col relative overflow-x-hidden">
            {/* Ambient Lighting Background */}
            <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-15%] right-[-10%] w-[45vw] h-[45vw] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

            {/* Top Navigation */}
            <header className="w-full sticky top-0 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 px-6 sm:px-12 py-5 z-40 flex justify-between items-center shrink-0 shadow-sm shadow-slate-100/40">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/patient')}>
                    <Logo size="sm" showSubtitle={false} />
                    <div className="hidden sm:flex flex-col border-l border-slate-200 pl-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Smart Portal</span>
                        <span className="text-xs font-extrabold text-primary leading-tight mt-0.5">MediAssist Registration</span>
                    </div>
                </div>
                <button 
                    onClick={() => navigate('/patient')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-full font-bold text-xs text-slate-500 hover:text-slate-800 transition-all shadow-sm active:scale-98"
                >
                    <span className="material-symbols-outlined text-sm font-bold">arrow_back</span>
                    Cancel & Back
                </button>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 z-10">
                <div className="w-full max-w-6xl animate-fade-in flex flex-col items-center">
                    
                    {success ? (
                        /* SUCCESS SCREEN / ASSIGNED CARD TICKET */
                        <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-2xl w-full max-w-xl text-center space-y-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-2xl -mr-8 -mt-8" />
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -ml-8 -mb-8" />
                            
                            <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/25 mx-auto">
                                <span className="material-symbols-outlined text-4xl font-black">check_circle</span>
                            </div>

                            <div className="space-y-4">
                                <h2 className="text-3xl font-black text-slate-900 font-headline leading-tight">Registration Complete!</h2>
                                <p className="text-slate-500 font-bold text-sm">Welcome to CCGH Healthcare Services</p>
                                
                                <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-[2rem] p-8 border border-primary/10 mt-6 space-y-5 max-w-md mx-auto relative shadow-sm">
                                    <div className="flex justify-between items-center border-b border-primary/10 pb-4">
                                        <div className="text-left">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Facility Name</p>
                                            <p className="text-xs font-black text-primary uppercase mt-1">CCGH MEDIASSIST</p>
                                        </div>
                                        <span className="material-symbols-outlined text-primary text-2xl">local_hospital</span>
                                    </div>

                                    <div className="text-left space-y-1">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Registered Patient</p>
                                        <p className="text-lg font-extrabold text-slate-800">{registeredPatient?.full_name}</p>
                                    </div>

                                    <div className="bg-white rounded-2xl p-5 border border-primary/5 text-center shadow-inner space-y-2">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Digital Health Card ID</p>
                                        <p className="text-3xl font-black text-primary tracking-wider font-headline">{registeredPatient?.formatted_id}</p>
                                    </div>
                                    
                                    <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">Present this Digital ID at check-in kiosks or when booking appointments in person.</p>
                                </div>
                            </div>

                            <button 
                                onClick={handleSuccessRedirect}
                                className="w-full py-4 bg-primary hover:bg-primary-container text-white font-black rounded-2xl text-sm shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                            >
                                Enter Patient Portal Dashboard
                            </button>
                        </div>
                    ) : (
                        /* MULTI-STEP REGISTRATION CONTAINER */
                        <div className="bg-white rounded-[2.5rem] border border-slate-200/50 shadow-2xl w-full overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[680px]">
                            
                            {/* Left Panel Steps Index (Desktop Only) */}
                            <div className="hidden lg:flex lg:col-span-4 bg-gradient-to-b from-primary to-blue-900 p-10 flex-col justify-between text-white relative">
                                <div className="absolute inset-0 bg-cover bg-center opacity-5 pointer-events-none" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=2070')` }} />
                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/5 pointer-events-none" />
                                
                                <div className="space-y-12 relative z-10">
                                    <div className="space-y-2">
                                        <h3 className="font-black text-xl font-headline tracking-tight">MediAssist Intake</h3>
                                        <p className="text-xs text-white/60 font-semibold">CCGH Digital Care Registration Portal</p>
                                    </div>
                                    
                                    <div className="space-y-8">
                                        {[
                                            { num: 1, title: 'Personal Info', desc: 'Identify card & profile details', icon: 'person' },
                                            { num: 2, title: 'Symptom Triage', desc: 'Reason for visit & checkup needs', icon: 'medical_services' },
                                            { num: 3, title: 'Biometric Capture', desc: 'Security webcam face scan', icon: 'face' },
                                            { num: 4, title: 'Review & Submit', desc: 'Confirm records & register', icon: 'task_alt' }
                                        ].map((s) => (
                                            <div key={s.num} className="flex gap-4 items-center">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm transition-all border ${
                                                    step === s.num 
                                                    ? 'bg-white text-primary border-white shadow-lg' 
                                                    : step > s.num 
                                                        ? 'bg-primary-container border-primary text-white' 
                                                        : 'border-white/10 text-white/40'
                                                }`}>
                                                    {step > s.num ? (
                                                        <span className="material-symbols-outlined text-sm font-bold">check</span>
                                                    ) : (
                                                        <span className="material-symbols-outlined text-base font-bold">{s.icon}</span>
                                                    )}
                                                </div>
                                                <div className="text-left">
                                                    <h4 className={`font-extrabold text-sm leading-tight ${step === s.num ? 'text-white' : 'text-white/60'}`}>{s.title}</h4>
                                                    <p className="text-[10px] font-semibold text-white/40 mt-0.5">{s.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="text-left relative z-10 border-t border-white/10 pt-6 space-y-2">
                                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Intake Support Helpline</p>
                                    <p className="text-xs font-bold text-white/80">Questions about registering?</p>
                                    <p className="text-sm font-black text-white">+94 (11) 244 4242</p>
                                </div>
                            </div>

                            {/* Right Form panel */}
                            <div className="col-span-12 lg:col-span-8 p-6 sm:p-10 flex flex-col justify-between min-h-[600px]">
                                
                                {/* Progress Indicator (Mobile Only) */}
                                <div className="lg:hidden flex items-center justify-between bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200/50 mb-6">
                                    <span className="text-slate-700 font-extrabold text-xs uppercase tracking-wider">Registration Form</span>
                                    <span className="text-primary font-black text-xs bg-primary/10 px-3 py-1 rounded-full">Step {step} of 4</span>
                                </div>

                                <div className="flex-1 flex flex-col min-h-0">
                                    
                                    {/* STEP 1: PERSONAL INFORMATION */}
                                    {step === 1 && (
                                        <div className="space-y-6 animate-fade-in text-left flex-1">
                                            <div>
                                                <h2 className="text-2xl font-black text-slate-900 font-headline leading-tight">Patient Personal Profile</h2>
                                                <p className="text-sm text-slate-500 font-bold mt-1">Please supply your valid identification details for registration.</p>
                                            </div>

                                            {/* Minor checkbox */}
                                            <div className="flex items-center gap-3.5 p-4 bg-primary/5 rounded-2xl border border-primary/10 hover:bg-primary/8 transition-colors">
                                                <input 
                                                    type="checkbox"
                                                    id="is_minor"
                                                    name="is_minor"
                                                    checked={formData.is_minor}
                                                    onChange={handleInputChange}
                                                    className="w-5 h-5 rounded-lg border-slate-300 text-primary focus:ring-primary cursor-pointer transition-all"
                                                />
                                                <label htmlFor="is_minor" className="text-[11px] font-black text-primary cursor-pointer uppercase tracking-wider select-none leading-none">
                                                    Registering for a child / family minor account?
                                                </label>
                                            </div>

                                            {/* Core details */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Full Legal Name</label>
                                                    <input 
                                                        type="text" 
                                                        name="full_name"
                                                        value={formData.full_name}
                                                        onChange={handleInputChange}
                                                        className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200/80 focus:border-primary focus:bg-white rounded-xl text-sm font-bold placeholder:text-slate-400 focus:outline-none transition-all shadow-sm focus:ring-1 focus:ring-primary/20"
                                                        placeholder="Enter legal name"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Date of Birth</label>
                                                    <input 
                                                        type="date" 
                                                        name="dob"
                                                        value={formData.dob}
                                                        onChange={handleInputChange}
                                                        className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200/80 focus:border-primary focus:bg-white rounded-xl text-sm font-bold focus:outline-none transition-all shadow-sm focus:ring-1 focus:ring-primary/20"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Gender</label>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {['Male', 'Female', 'Other'].map((g) => (
                                                            <button
                                                                key={g}
                                                                type="button"
                                                                onClick={() => setFormData(prev => ({ ...prev, gender: g }))}
                                                                className={`py-3 rounded-xl font-bold text-xs transition-all border ${
                                                                    formData.gender === g 
                                                                    ? 'bg-primary border-primary text-white shadow-md' 
                                                                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-500'
                                                                }`}
                                                            >
                                                                {g}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Blood Group</label>
                                                    <select 
                                                        name="blood_type"
                                                        value={formData.blood_type}
                                                        onChange={handleInputChange}
                                                        className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200/80 focus:border-primary focus:bg-white rounded-xl text-sm font-bold focus:outline-none transition-all shadow-sm cursor-pointer focus:ring-1 focus:ring-primary/20"
                                                    >
                                                        <option value="Unknown">Unknown</option>
                                                        <option value="A+">A+</option>
                                                        <option value="A-">A-</option>
                                                        <option value="B+">B+</option>
                                                        <option value="B-">B-</option>
                                                        <option value="O+">O+</option>
                                                        <option value="O-">O-</option>
                                                        <option value="AB+">AB+</option>
                                                        <option value="AB-">AB-</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Guardian Section if Minor */}
                                            {formData.is_minor ? (
                                                <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/10 space-y-4 animate-in slide-in-from-top-2 duration-300">
                                                    <h3 className="text-xs font-black text-primary uppercase tracking-wider flex items-center gap-2 border-b border-primary/10 pb-2">
                                                        <span className="material-symbols-outlined text-base">family_restroom</span>
                                                        Parent / Guardian Details
                                                    </h3>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div className="space-y-1.5">
                                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider ml-1">Guardian NIC / ID</label>
                                                            <input 
                                                                type="text" 
                                                                name="guardian_nic"
                                                                value={formData.guardian_nic}
                                                                onChange={handleInputChange}
                                                                placeholder="Enter ID card number"
                                                                className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-primary rounded-xl text-xs font-bold focus:outline-none transition-all shadow-sm"
                                                            />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                                                                Guardian Full Name
                                                                {isSearchingGuardian && <div className="w-2.5 h-2.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>}
                                                            </label>
                                                            <input 
                                                                type="text" 
                                                                name="guardian_name"
                                                                value={formData.guardian_name}
                                                                onChange={handleInputChange}
                                                                placeholder="Enter primary guardian"
                                                                className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-primary rounded-xl text-xs font-bold focus:outline-none transition-all shadow-sm"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div className="space-y-1.5">
                                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider ml-1">Guardian Phone</label>
                                                            <input 
                                                                type="tel" 
                                                                name="guardian_phone"
                                                                value={formData.guardian_phone}
                                                                onChange={handleInputChange}
                                                                placeholder="e.g. 0771234567"
                                                                className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-primary rounded-xl text-xs font-bold focus:outline-none transition-all shadow-sm"
                                                            />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider ml-1">Relationship</label>
                                                            <select 
                                                                name="guardian_relationship"
                                                                value={formData.guardian_relationship}
                                                                onChange={handleInputChange}
                                                                className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-primary rounded-xl text-xs font-bold focus:outline-none transition-all shadow-sm cursor-pointer"
                                                            >
                                                                <option value="Father">Father</option>
                                                                <option value="Mother">Mother</option>
                                                                <option value="Guardian">Legal Guardian</option>
                                                                <option value="Other">Other Family Member</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider ml-1">Guardian Email</label>
                                                        <input 
                                                            type="email" 
                                                            name="guardian_email"
                                                            value={formData.guardian_email}
                                                            onChange={handleInputChange}
                                                            placeholder="guardian@example.com (optional)"
                                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-primary rounded-xl text-xs font-bold focus:outline-none transition-all shadow-sm"
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                /* Standard inputs if adult */
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 animate-in fade-in duration-300">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">NIC (National Identity Card)</label>
                                                        <input 
                                                            type="text" 
                                                            name="nic"
                                                            value={formData.nic}
                                                            onChange={handleInputChange}
                                                            className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200/80 focus:border-primary focus:bg-white rounded-xl text-sm font-bold placeholder:text-slate-400 focus:outline-none transition-all shadow-sm focus:ring-1 focus:ring-primary/20"
                                                            placeholder="Enter NIC Number"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Phone Number</label>
                                                        <input 
                                                            type="tel" 
                                                            name="phone_number"
                                                            value={formData.phone_number}
                                                            onChange={handleInputChange}
                                                            className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200/80 focus:border-primary focus:bg-white rounded-xl text-sm font-bold placeholder:text-slate-400 focus:outline-none transition-all shadow-sm focus:ring-1 focus:ring-primary/20"
                                                            placeholder="e.g. 0771234567"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {!formData.is_minor && (
                                                <div className="space-y-1.5 animate-in fade-in duration-300">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
                                                    <input 
                                                        type="email" 
                                                        name="email"
                                                        value={formData.email}
                                                        onChange={handleInputChange}
                                                        className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200/80 focus:border-primary focus:bg-white rounded-xl text-sm font-bold placeholder:text-slate-400 focus:outline-none transition-all shadow-sm focus:ring-1 focus:ring-primary/20"
                                                        placeholder="Enter email address (optional)"
                                                    />
                                                </div>
                                            )}

                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Residential Address</label>
                                                <textarea 
                                                    name="address"
                                                    value={formData.address}
                                                    onChange={handleInputChange}
                                                    rows="2"
                                                    className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200/80 focus:border-primary focus:bg-white rounded-xl text-sm font-bold placeholder:text-slate-400 focus:outline-none transition-all resize-none shadow-sm focus:ring-1 focus:ring-primary/20"
                                                    placeholder="Enter street name, city, postal code"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* STEP 2: SYMPTOMS ASSESSMENT */}
                                    {step === 2 && (
                                        <div className="space-y-6 animate-fade-in text-left flex-1">
                                            <div>
                                                <h2 className="text-2xl font-black text-slate-900 font-headline leading-tight">Reason for Visit</h2>
                                                <p className="text-sm text-slate-500 font-bold mt-1">Please select the service category that matches your checkup needs.</p>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                {categories.map((cat) => (
                                                    <button
                                                        key={cat.id}
                                                        type="button"
                                                        onClick={() => setFormData(prev => ({ ...prev, symptomCategory: cat.id }))}
                                                        className={`p-5 rounded-[2rem] border text-center flex flex-col items-center gap-3 transition-all relative cursor-pointer active:scale-98 ${
                                                            formData.symptomCategory === cat.id 
                                                            ? 'border-primary bg-primary/5 text-primary shadow-md shadow-primary/5 ring-1 ring-primary' 
                                                            : 'bg-white border-slate-200/80 hover:border-slate-300 text-slate-600'
                                                        }`}
                                                    >
                                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all ${
                                                            formData.symptomCategory === cat.id ? 'bg-primary text-white border-primary' : 'bg-slate-50 text-slate-500 border-slate-100'
                                                        }`}>
                                                            <span className="material-symbols-outlined text-2xl">{cat.icon}</span>
                                                        </div>
                                                        <div>
                                                            <h4 className="font-extrabold text-sm leading-tight mb-0.5">{cat.title}</h4>
                                                            <p className="text-[10px] text-slate-400 font-semibold leading-normal hidden sm:block">{cat.desc}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="space-y-1.5 pt-4">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Additional Symptoms / Notes (Optional)</label>
                                                <textarea 
                                                    name="symptomDetails"
                                                    value={formData.symptomDetails}
                                                    onChange={handleInputChange}
                                                    rows="4"
                                                    className="w-full px-5 py-4 bg-slate-50/70 border border-slate-200/80 focus:border-primary focus:bg-white rounded-xl text-sm font-bold placeholder:text-slate-400 focus:outline-none transition-all resize-none shadow-sm focus:ring-1 focus:ring-primary/20"
                                                    placeholder="e.g. Asthma history, Diabetes medication, high fever for 2 days, etc."
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* STEP 3: BIOMETRIC FACE CAPTURE */}
                                    {step === 3 && (
                                        <div className="space-y-6 animate-fade-in text-left flex-1 flex flex-col">
                                            <div>
                                                <h2 className="text-2xl font-black text-slate-900 font-headline leading-tight">Biometric Face Enrollment</h2>
                                                <p className="text-sm text-slate-500 font-bold mt-1">Enroll your face to enable secure biometric check-in at physical clinics.</p>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center flex-1">
                                                
                                                {/* Left: Camera Viewport */}
                                                <div className="md:col-span-7 aspect-[4/3] rounded-[2rem] bg-slate-950 relative overflow-hidden border border-slate-900 shadow-xl flex items-center justify-center">
                                                    {capturedImage ? (
                                                        <img 
                                                            src={capturedImage} 
                                                            alt="Captured face snapshot" 
                                                            className="absolute inset-0 w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <Webcam
                                                            audio={false}
                                                            ref={webcamRef}
                                                            screenshotFormat="image/jpeg"
                                                            videoConstraints={{
                                                                width: 1280,
                                                                height: 720,
                                                                facingMode: "user"
                                                            }}
                                                            className="absolute inset-0 w-full h-full object-cover"
                                                        />
                                                    )}

                                                    {/* HUD overlays */}
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <div 
                                                            className="w-56 h-[18rem] border border-white/30 border-dashed rounded-[50%_50%_45%_45%] relative flex items-center justify-center"
                                                        >
                                                            {/* HUD Corner Brackets */}
                                                            <div className="w-6 h-6 border-t-2 border-l-2 border-primary absolute top-0 left-0 rounded-tl-xl" />
                                                            <div className="w-6 h-6 border-t-2 border-r-2 border-primary absolute top-0 right-0 rounded-tr-xl" />
                                                            <div className="w-6 h-6 border-b-2 border-l-2 border-primary absolute bottom-0 left-0 rounded-bl-xl" />
                                                            <div className="w-6 h-6 border-b-2 border-r-2 border-primary absolute bottom-0 right-0 rounded-br-xl" />

                                                            {/* Scanning animation bar */}
                                                            {!capturedImage && (
                                                                <div 
                                                                    className="absolute left-0 w-full h-0.5 bg-emerald-500/80 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse" 
                                                                    style={{
                                                                        animation: 'scanLineAnimation 2.5s linear infinite',
                                                                        animationName: 'scanLineAnimation'
                                                                    }}
                                                                />
                                                            )}

                                                            {capturedImage && (
                                                                <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-bounce">
                                                                    <span className="material-symbols-outlined text-white text-3xl font-black">check</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Status bar */}
                                                        <div className="absolute bottom-5 px-4 py-2 bg-slate-900/80 backdrop-blur-md rounded-full border border-slate-800 flex items-center gap-2.5">
                                                            <span className={`w-2 h-2 rounded-full ${capturedImage ? 'bg-emerald-500' : 'bg-primary animate-pulse'}`} />
                                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">STATUS: {scanStatus}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right: Camera Guidance */}
                                                <div className="md:col-span-5 space-y-4">
                                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/50 flex gap-4 items-center">
                                                        <span className="material-symbols-outlined text-slate-500 text-2xl">light_mode</span>
                                                        <div>
                                                            <h5 className="font-extrabold text-xs text-slate-800">Clear Lighting</h5>
                                                            <p className="text-[10px] text-slate-400 font-bold leading-normal">Position your camera in front of well-lit environments.</p>
                                                        </div>
                                                    </div>
                                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/50 flex gap-4 items-center">
                                                        <span className="material-symbols-outlined text-slate-500 text-2xl">visibility</span>
                                                        <div>
                                                            <h5 className="font-extrabold text-xs text-slate-800">Direct Look</h5>
                                                            <p className="text-[10px] text-slate-400 font-bold leading-normal">Keep a neutral face and align within the guide brackets.</p>
                                                        </div>
                                                    </div>

                                                    <div className="pt-2 flex flex-col gap-3">
                                                        {capturedImage ? (
                                                            <button
                                                                type="button"
                                                                onClick={handleResetCapture}
                                                                className="w-full py-3 border border-red-200 hover:bg-red-50 text-red-500 font-black rounded-xl text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                                            >
                                                                <span className="material-symbols-outlined text-base">refresh</span>
                                                                Retake Photo
                                                            </button>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={handleCapture}
                                                                className="w-full py-3 bg-gradient-to-r from-primary to-primary-container text-white font-black rounded-xl text-xs uppercase tracking-widest transition-all cursor-pointer shadow-md hover:shadow-lg shadow-primary/10 flex items-center justify-center gap-1.5 hover:-translate-y-0.5 active:translate-y-0"
                                                            >
                                                                <span className="material-symbols-outlined text-base">photo_camera</span>
                                                                Capture Snapshot
                                                            </button>
                                                        )}
                                                        
                                                        {!capturedImage && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setCapturedImage(null);
                                                                    setStep(4);
                                                                }}
                                                                className="w-full py-3 text-slate-400 hover:text-primary transition-colors font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-1.5"
                                                            >
                                                                <span className="material-symbols-outlined text-base">no_photography</span>
                                                                Skip Face Scan
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* STEP 4: REVIEW & SUBMIT */}
                                    {step === 4 && (
                                        <div className="space-y-6 animate-fade-in text-left flex-1">
                                            <div>
                                                <h2 className="text-2xl font-black text-slate-900 font-headline leading-tight">Verify Your Profile</h2>
                                                <p className="text-sm text-slate-500 font-bold mt-1">Review the details below prior to submitting your registration.</p>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                                                
                                                {/* Profile Details Sheet */}
                                                <div className="md:col-span-8 bg-slate-50 rounded-[2rem] p-6 border border-slate-200/50 space-y-5">
                                                    <h3 className="text-xs font-black text-primary uppercase tracking-wider flex items-center gap-2 border-b border-slate-200/50 pb-2">
                                                        <span className="material-symbols-outlined text-base">badge</span>
                                                        Personal Account Details
                                                    </h3>
                                                    <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-xs">
                                                        <div>
                                                            <p className="font-extrabold text-[9px] text-slate-400 uppercase tracking-wider">Legal Name</p>
                                                            <p className="font-black text-slate-800 mt-0.5">{formData.full_name}</p>
                                                        </div>
                                                        <div>
                                                            <p className="font-extrabold text-[9px] text-slate-400 uppercase tracking-wider">Date of Birth</p>
                                                            <p className="font-black text-slate-800 mt-0.5">{formData.dob}</p>
                                                        </div>
                                                        <div>
                                                            <p className="font-extrabold text-[9px] text-slate-400 uppercase tracking-wider">Gender / Blood Group</p>
                                                            <p className="font-black text-slate-800 mt-0.5">{formData.gender} • <span className="text-red-500 font-black">{formData.blood_type}</span></p>
                                                        </div>
                                                        {isMinor ? (
                                                            <div>
                                                                <p className="font-extrabold text-[9px] text-slate-400 uppercase tracking-wider">Guardian Details</p>
                                                                <p className="font-black text-slate-800 mt-0.5">{formData.guardian_name} ({formData.guardian_relationship})</p>
                                                            </div>
                                                        ) : (
                                                            <div>
                                                                <p className="font-extrabold text-[9px] text-slate-400 uppercase tracking-wider">NIC Number</p>
                                                                <p className="font-black text-slate-800 mt-0.5">{formData.nic}</p>
                                                            </div>
                                                        )}
                                                        <div className="col-span-2">
                                                            <p className="font-extrabold text-[9px] text-slate-400 uppercase tracking-wider">Residential Address</p>
                                                            <p className="font-bold text-slate-600 mt-0.5 leading-relaxed">{formData.address}</p>
                                                        </div>
                                                    </div>

                                                    <h3 className="text-xs font-black text-primary uppercase tracking-wider flex items-center gap-2 border-b border-slate-200/50 pb-2 pt-2">
                                                        <span className="material-symbols-outlined text-base">clinical_notes</span>
                                                        Intake Notes & Visit Reason
                                                    </h3>
                                                    <div className="text-xs space-y-2">
                                                        <div className="flex gap-2">
                                                            <span className="px-3 py-1 bg-white border border-slate-200/80 rounded-full font-black text-[9px] text-primary uppercase">
                                                                {formData.symptomCategory}
                                                            </span>
                                                        </div>
                                                        {formData.symptomDetails && (
                                                            <p className="p-3.5 bg-white border border-slate-100 rounded-xl italic font-bold text-slate-500">
                                                                "{formData.symptomDetails}"
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Biometric Scan Review */}
                                                <div className="md:col-span-4 bg-slate-50 rounded-[2rem] p-4 border border-slate-200/50 flex flex-col justify-between items-center text-center">
                                                    <div className="w-full aspect-[4/3] rounded-2xl bg-slate-200 border border-slate-300/60 overflow-hidden relative shadow-sm">
                                                        {capturedImage ? (
                                                            <img 
                                                                src={capturedImage} 
                                                                alt="Enrollment facial token" 
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center text-slate-400 gap-2">
                                                                <span className="material-symbols-outlined text-4xl">person_off</span>
                                                                <span className="text-[9px] font-black uppercase tracking-widest">No Photo Provided</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="py-2 space-y-1">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Security Biometrics</p>
                                                        <p className="text-xs font-black text-slate-700">{capturedImage ? 'Face Token Captured' : 'Face Capture Skipped'}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Consent Checkbox */}
                                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/40 text-xs font-medium text-slate-500 leading-relaxed">
                                                <p className="font-extrabold text-slate-800 text-xs uppercase tracking-wider mb-1">Authorisation & Registration Statement</p>
                                                By submitting this registration, you authorize Colombo Central General Hospital to generate a patient health card database file. You acknowledge that all details declared are accurate.
                                            </div>
                                        </div>
                                    )}

                                    {/* Error Display */}
                                    {error && (
                                        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-start gap-2.5 border border-red-100 mt-6 animate-in slide-in-from-bottom-1 text-left">
                                            <span className="material-symbols-outlined text-lg font-bold shrink-0 mt-0.5">error</span>
                                            <span className="text-xs font-bold leading-relaxed">{error}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Form control buttons */}
                                <div className="flex gap-4 pt-6 border-t border-slate-100 mt-8">
                                    {step > 1 && (
                                        <button 
                                            type="button" 
                                            onClick={handlePrev} 
                                            className="px-6 py-3.5 bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-500 font-extrabold rounded-xl text-xs uppercase tracking-widest transition-all active:scale-98 cursor-pointer"
                                        >
                                            Back
                                        </button>
                                    )}
                                    
                                    {step < 4 ? (
                                        <button 
                                            type="button" 
                                            onClick={handleNext} 
                                            className="flex-1 py-3.5 bg-primary hover:bg-primary-container text-white font-black rounded-xl text-xs uppercase tracking-widest transition-all shadow-md shadow-primary/10 flex items-center justify-center gap-1.5 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                                        >
                                            <span>Continue</span>
                                            <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
                                        </button>
                                    ) : (
                                        <button 
                                            type="button" 
                                            onClick={handleSubmit}
                                            disabled={loading}
                                            className="flex-1 py-3.5 bg-primary hover:bg-primary-container text-white font-black rounded-xl text-xs uppercase tracking-widest transition-all shadow-md shadow-primary/15 flex items-center justify-center gap-1.5 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {loading ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                    <span>Registering Account...</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <span>Submit Registration</span>
                                                    <span className="material-symbols-outlined text-sm font-bold">check</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* In-page Scan Line Keyframes injection */}
            <style>{`
                @keyframes scanLineAnimation {
                    0%   { transform: translateY(-135px); opacity: 0; }
                    10%  { opacity: 1; }
                    90%  { opacity: 1; }
                    100% { transform: translateY(135px); opacity: 0; }
                }
            `}</style>
        </div>
    );
};

export default PatientRegister;
