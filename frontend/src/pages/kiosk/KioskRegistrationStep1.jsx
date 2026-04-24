import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './KioskRegistrationStep1.css';

// ─── Shared Components (consistent with KioskAIAssistant) ──────────────────────

const SideNav = ({ activeStep = 0 }) => {
  const navigate = useNavigate();
  const regSteps = [
    { icon: 'person', label: 'Basic Info', path: '/register/step1' },
    { icon: 'medical_services', label: 'Symptoms', path: '/register/step2' },
    { icon: 'face', label: 'Face Capture', path: '/register/step3' },
    { icon: 'check_circle', label: 'Confirmation', path: '/register/step4' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen bg-white border-r border-outline-variant/30 z-20 shrink-0">
      <div className="p-6 pb-4">
        <div className="flex items-center gap-4 mb-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center text-white shadow-lg">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>local_hospital</span>
          </div>
          <div>
            <h2 className="text-lg font-black text-primary leading-tight font-headline">Patient Intake</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Registration</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 flex flex-col px-3 mt-4 gap-1">
        <div className="px-5 mb-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Flow Progress</p>
        </div>
        {regSteps.map(({ icon, label, path }, index) => {
          const active = index === activeStep;
          const completed = index < activeStep;
          return (
            <div
              key={label}
              onClick={() => completed && navigate(path)}
              className={`flex items-center gap-4 px-5 py-3.5 rounded-xl font-semibold text-sm transition-all ${active ? 'nav-item-active' : 'text-slate-500 opacity-70 cursor-pointer hover:bg-slate-50'
                }`}
            >
              <span
                className="material-symbols-outlined text-[22px]"
                style={active || completed ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {completed ? 'check_circle' : icon}
              </span>
              <span>{label}</span>
            </div>
          );
        })}
      </nav>

      <div className="px-4 pb-5 mt-auto">
        <div className="p-5 bg-slate-50 rounded-xl border border-dashed border-outline-variant/40 text-center mb-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Help Desk</p>
          <p className="text-xs font-bold text-primary mb-3">Stuck with the form?</p>
          <button className="w-full py-2.5 bg-primary text-white rounded-lg font-bold text-xs shadow-sm hover:opacity-90 transition-opacity" onClick={() => navigate('/assistant')}>
            Get Assistance
          </button>
        </div>
        <div className="border-t border-slate-100 pt-4 px-1">
          <button className="flex items-center gap-3 w-full text-slate-400 hover:text-red-600 transition-colors" onClick={() => navigate('/')}>
            <span className="material-symbols-outlined text-xl">cancel</span>
            <span className="font-bold text-xs uppercase tracking-wider">Cancel Registration</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

const TopBar = ({ step = 1, totalSteps = 4, title = "Basic Information" }) => {
  const navigate = useNavigate();
  return (
    <header className="flex justify-between items-center w-full px-10 h-16 bg-white border-b border-outline-variant/10 shadow-[0_4px_20px_rgba(0,71,141,0.04)] z-30 shrink-0 font-headline">
      <div className="flex items-center gap-3">
        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 transition-colors" onClick={() => navigate(-1)}>
          <span className="material-symbols-outlined text-slate-600">arrow_back</span>
        </button>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-primary leading-tight">Patient Intake</h1>
          <p className="text-xs text-on-surface-variant font-medium font-body leading-none">Step {step} of {totalSteps}: {title}</p>
        </div>
      </div>
      <div className="flex items-center gap-5">
        <div className="flex gap-1">
          <button className="p-2 text-slate-400 hover:text-primary rounded-full hover:bg-slate-50 transition-colors" onClick={() => navigate('/assistant')}>
            <span className="material-symbols-outlined">help</span>
          </button>
          <button className="p-2 text-slate-400 hover:text-primary rounded-full hover:bg-slate-50 transition-colors">
            <span className="material-symbols-outlined text-xl">notifications</span>
          </button>
        </div>
        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
          <div className="text-right">
            <p className="text-sm font-bold text-primary leading-none font-body">MediAssist AI</p>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5 font-body">Online Support</p>
          </div>
          <img
            alt="Support icon"
            className="w-9 h-9 rounded-full object-cover ring-2 ring-white shadow-sm"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAeEgiLlKlT6MB9_xJubPcKrDLUcLwv15DRzvMGUuFYSgmtMIEC4N8zgYGSIyNpt0yZC5ZhhiX42TmFlW-itQBKBbG4kxF-8WURu6P0Y3RJ5sfXpVANYlvQzwYTQ_k9vYB_BnUmPqQNVZ1V2zYkOr50EVfjuFdb3iw_9ACvxi-Zf8Bve1QCVeEsCUo7iua9TZhg5DjkIBofWxzZa8FM3Z-v27vvgmz0d0dQyp3lkTwDoK8us-3QU23FCji577JjadnqaET_RcDJGwc"
          />
        </div>
      </div>
    </header>
  );
};

// ─── Main Content Component ──────────────────────────────────────────────────

const KioskRegistrationStep1 = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    dob: '',
    gender: 'Male',
    phone: '',
    email: '',
    nic: '',
    bloodGroup: '',
    address: ''
  });

  React.useEffect(() => {
    const saved = localStorage.getItem('registrationData');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Failed to parse registrationData", e);
      }
    }
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      localStorage.setItem('registrationData', JSON.stringify(newData));
      return newData;
    });
  };

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  return (
    <div className="w-screen h-screen overflow-hidden flex font-body bg-surface text-on-surface">
      <SideNav activeStep={0} />

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="ai-pulse-bg top-1/4 left-1/4"></div>
        <div className="ai-pulse-bg bottom-1/4 right-1/4"></div>

        <TopBar step={1} totalSteps={4} title="Basic Information" />

        <div className="flex-1 flex flex-col items-center p-8 overflow-hidden">
          <div className="max-w-4xl w-full flex flex-col h-full z-10">

            <div className="text-center mb-8 shrink-0">
              <h1 className="text-4xl font-extrabold text-on-surface tracking-tight mb-3">Welcome to Your Care Journey</h1>
              <p className="text-on-surface-variant text-base max-w-2xl mx-auto leading-relaxed">
                To provide you with the best medical attention, please share your basic identification details below.
              </p>
            </div>

            <div className="glass-card flex-1 rounded-[2.5rem] p-10 border border-outline-variant/10 shadow-[0_12px_40px_rgba(0,71,141,0.06)] relative overflow-hidden flex flex-col justify-between min-h-0">
              <div className="grid grid-cols-2 gap-x-12 gap-y-8 overflow-y-auto pr-4 custom-scrollbar">

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-primary px-1 tracking-wide uppercase flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">badge</span>
                    Full Name
                  </label>
                  <input
                    className="form-input-kiosk"
                    placeholder="Enter your full legal name"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-primary px-1 tracking-wide uppercase flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">calendar_today</span>
                    Date of Birth
                  </label>
                  <input 
                    className="form-input-kiosk" 
                    type="date" 
                    value={formData.dob}
                    onChange={(e) => handleInputChange('dob', e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-primary px-1 tracking-wide uppercase flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">diversity_3</span>
                    Gender
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {['Male', 'Female', 'Other'].map((g) => (
                      <button
                        key={g}
                        onClick={() => handleInputChange('gender', g)}
                        className={`py-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${formData.gender === g ? 'btn-toggle-active' : 'btn-toggle-inactive'
                          }`}
                      >
                        {g === 'Male' && <span className="material-symbols-outlined text-lg">male</span>}
                        {g === 'Female' && <span className="material-symbols-outlined text-lg">female</span>}
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-primary px-1 tracking-wide uppercase flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">bloodtype</span>
                    Blood Group
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {bloodGroups.map((bg) => (
                      <button
                        key={bg}
                        onClick={() => handleInputChange('bloodGroup', bg)}
                        className={`py-2 rounded-xl text-xs font-black transition-all ${formData.bloodGroup === bg ? 'bg-primary text-white shadow-md' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                          }`}
                      >
                        {bg}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-primary px-1 tracking-wide uppercase flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">call</span>
                    Phone Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">+94</span>
                    <input
                      className="form-input-kiosk pl-16 w-full"
                      placeholder="77 123 4567"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-primary px-1 tracking-wide uppercase flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">mail</span>
                    Email Address
                  </label>
                  <input
                    className="form-input-kiosk"
                    placeholder="example@domain.com"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>

                <div className="flex flex-col col-span-2 gap-2">
                  <label className="text-xs font-bold text-primary px-1 tracking-wide uppercase flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">fingerprint</span>
                    NIC Number
                  </label>
                  <input
                    className="form-input-kiosk"
                    placeholder="Enter your NIC number"
                    type="text"
                    value={formData.nic}
                    onChange={(e) => handleInputChange('nic', e.target.value)}
                  />
                </div>

                <div className="flex flex-col col-span-2 gap-2">
                  <label className="text-xs font-bold text-primary px-1 tracking-wide uppercase flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">home</span>
                    Residential Address
                  </label>
                  <textarea
                    className="form-input-kiosk min-h-[80px] resize-none"
                    placeholder="Enter your current residential address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4 bg-slate-50 px-5 py-3 rounded-2xl border border-outline-variant/10">
                  <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center text-white">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-on-surface leading-tight">Data Encryption Active</h4>
                    <p className="text-[10px] text-on-surface-variant leading-tight">Your data is protected by 256-bit medical grade encryption.</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/register/step2')}
                  className="bg-gradient-to-br from-primary to-primary-container text-white px-10 py-4 rounded-full font-bold text-lg shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-transform flex items-center gap-2"
                >
                  Next Step
                  <span className="material-symbols-outlined font-bold">arrow_forward</span>
                </button>
              </div>
            </div>

            <div className="mt-8 flex justify-center items-center gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">
              <span className="flex items-center gap-2 text-primary">
                <span className="w-2 h-2 bg-primary rounded-full"></span>
                Basic Info
              </span>
              <span className="w-6 h-[1px] bg-slate-200"></span>
              <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => navigate('/register/step2')}>Symptoms</span>
              <span className="w-6 h-[1px] bg-slate-200"></span>
              <span className="cursor-not-allowed">Biometrics</span>
              <span className="w-6 h-[1px] bg-slate-200"></span>
              <span className="cursor-not-allowed">Finish</span>
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 right-0 p-8 opacity-5 pointer-events-none select-none z-0">
          <span className="material-symbols-outlined text-[200px]" style={{ fontVariationSettings: "'wght' 100" }}>health_and_safety</span>
        </div>
      </main>
    </div>
  );
};

export default KioskRegistrationStep1;
