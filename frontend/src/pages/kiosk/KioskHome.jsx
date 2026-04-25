import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../../components/common/Logo';
import './KioskHome.css';

const KioskHome = () => {
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);

  useEffect(() => {
    // For security, log out the patient whenever they return to the main kiosk home screen
    localStorage.removeItem('activePatient');
    setPatient(null);
  }, []);

  const patientName = patient ? (patient.full_name || patient.name || 'Patient') : null;

  return (
    <div className="bg-background font-body text-on-surface h-full flex flex-col overflow-hidden w-screen h-screen text-left">
      {/* Top Navigation Shell */}
      <header className="bg-transparent backdrop-blur-none w-full top-0 px-8 py-4 z-40 border-b border-outline-variant/10 shrink-0">
        <div className="flex justify-between items-center w-full max-w-[1920px] mx-auto">
          <div className="flex items-center gap-6">
            <Logo 
              className="cursor-pointer" 
              onClick={() => navigate('/')} 
            />
            <div className="h-8 w-px bg-outline-variant/30 mx-4"></div>
            <div className="flex gap-4">
              <button className="px-6 py-2 rounded-full bg-primary text-white font-bold shadow-lg shadow-primary/20">English</button>
              <button className="px-6 py-2 rounded-full bg-white text-on-surface-variant font-medium hover:bg-surface-container-high transition-colors border border-outline-variant/30">සිංහල</button>
              <button className="px-6 py-2 rounded-full bg-white text-on-surface-variant font-medium hover:bg-surface-container-high transition-colors border border-outline-variant/30">தமிழ்</button>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="font-headline font-bold text-lg leading-none">
                {patientName ? `Ayubowan, ${patientName.split(' ')[0]}` : 'Ayubowan, Welcome'}
              </div>
              <div className="text-sm text-on-surface-variant font-medium">Colombo Central General Hospital</div>
            </div>
            {patient && (
              <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-full border border-slate-100 font-headline">
                <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-white">
                  {patientName.charAt(0)}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content: Focused AI Bot Canvas */}
      <main className="flex-grow flex flex-col items-center justify-center relative px-8 gap-4 pt-2 pb-8 overflow-hidden h-full">
        {/* Background Ambient Element */}
        <div className="absolute inset-0 ai-pulse-bg -z-10"></div>

        {/* Emergency Assistance Button - Top Right Positioning */}
        <div className="absolute top-4 right-8 z-20">
          <button 
            onClick={() => navigate('/assistant')}
            className="bg-error-container/90 backdrop-blur-md text-on-error-container py-3 px-8 rounded-full flex items-center justify-center gap-3 shadow-lg hover:bg-error-container transition-all active:scale-95 border border-error/20"
          >
            <span className="material-symbols-outlined text-xl animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>emergency</span>
            <span className="font-headline font-bold text-base tracking-wider uppercase">Emergency Assistance</span>
          </button>
        </div>

        {/* Central AI Chatbot Section */}
        <div className="w-full max-w-4xl flex flex-col items-center text-center gap-6 relative z-10 mt-auto">
          {/* Friendly AI Bot Avatar */}
          <div className="relative group cursor-pointer" onClick={() => navigate('/assistant')}>
            <div className="absolute -inset-8 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-700"></div>
            <div className="floating-bot relative">
              <div className="w-48 h-48 md:w-56 md:h-56 rounded-full bg-white p-2 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] glow-effect flex items-center justify-center">
                <img alt="Friendly AI Robot Avatar" className="w-full h-full object-contain p-4" src="https://lh3.googleusercontent.com/aida-public/ALi89A_mQj6_2XU5PzR_8Vw1m_e_5YhY4G0z9fF6hC1S9E_Wq4Yh6x_L_N0H5M6f2Y7-r4k6l9O9r_z-x4l5_x8X9k0=s512" />
              </div>
              <div className="absolute -bottom-2 right-1/2 translate-x-1/2 glass-panel border border-primary/20 px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
                <div className="w-2.5 h-2.5 bg-secondary rounded-full animate-pulse"></div>
                <span className="text-xs font-bold text-primary tracking-widest uppercase">Smart AI Active</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="font-headline text-4xl md:text-5xl font-extrabold text-on-surface tracking-tight leading-tight">
              {patientName ? `How can I help you today, ${patientName.split(' ')[0]}?` : 'How can I assist you today?'}
            </h2>
            <p className="text-on-surface-variant text-lg max-w-2xl mx-auto font-medium">
              I can help you check-in, find a doctor, or register as a new patient. Just ask!
            </p>
          </div>

          {/* Chat Input Area */}
          <div className="w-full max-w-2xl space-y-3">
            <div className="glass-panel p-2 rounded-[2.5rem] shadow-2xl border border-white/50 flex items-center gap-2">
              <div className="flex-grow relative">
                <input 
                  className="w-full bg-transparent border-none focus:outline-none text-xl py-4 px-8 font-medium placeholder:text-on-surface-variant/40" 
                  placeholder="Type your message..." 
                  type="text" 
                  onKeyPress={(e) => e.key === 'Enter' && navigate('/assistant')}
                />
              </div>
              <button 
                onClick={() => navigate('/assistant')}
                className="bg-primary text-white w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all flex-shrink-0"
              >
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>mic</span>
              </button>
              <button 
                onClick={() => navigate('/assistant')}
                className="bg-primary text-white px-8 py-3 md:py-4 rounded-full font-bold text-lg shadow-xl hover:bg-primary-container transition-all active:scale-95 flex-shrink-0 mr-1"
              >
                Send
              </button>
            </div>
            <div className="flex justify-center gap-3">
              <span className="text-xs font-bold text-on-surface-variant/60 tracking-widest uppercase mb-4">Try: "Where is the pharmacy?" • "Check me in" • "Doctor directory"</span>
            </div>
          </div>
        </div>

        {/* Secondary Action Cards */}
        <div className="w-full max-w-7xl mt-auto mb-4 px-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {/* Personal Dashboard */}
            <button 
              onClick={() => navigate(patient ? '/patient-dashboard' : '/patient-login')}
              className={`group relative p-6 rounded-[2rem] bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl hover:bg-white/80 transition-all text-left flex flex-col gap-4 overflow-hidden ${patient ? 'ring-2 ring-primary/20 bg-primary/5' : ''}`}
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="material-symbols-outlined text-8xl">account_circle</span>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-primary-container flex items-center justify-center text-primary shadow-inner">
                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>account_circle</span>
              </div>
              <div>
                <h3 className="text-lg font-bold font-headline text-on-surface">
                  {patient ? 'View Dashboard' : 'Personal Dashboard'}
                </h3>
                <p className="text-xs text-slate-500 font-body mt-1">Medical history & profile</p>
              </div>
              <div className="flex items-center text-primary font-semibold text-xs mt-auto">
                <span>{patient ? 'View Profile' : 'Access Profile'}</span>
                <span className="material-symbols-outlined ml-2 text-sm">arrow_forward</span>
              </div>
            </button>

            {/* Check-in */}
            <button 
              onClick={() => navigate('/checkin-out')}
              className="group relative p-6 rounded-[2rem] bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl hover:bg-white/80 transition-all text-left flex flex-col gap-4 overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="material-symbols-outlined text-8xl">check_circle</span>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-secondary-container flex items-center justify-center text-on-secondary-container">
                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              </div>
              <div>
                <h3 className="text-lg font-bold font-headline text-on-surface">Quick Check-In</h3>
                <p className="text-xs text-slate-500 font-body mt-1">Scan appointment or NIC</p>
              </div>
              <div className="flex items-center text-secondary font-semibold text-xs mt-auto">
                <span>Check-In Now</span>
                <span className="material-symbols-outlined ml-2 text-sm">arrow_forward</span>
              </div>
            </button>

            {/* New Patient */}
            <button 
              onClick={() => navigate('/register/step1')}
              className="group relative p-6 rounded-[2rem] bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl hover:bg-white/80 transition-all text-left flex flex-col gap-4 overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="material-symbols-outlined text-8xl">person_add</span>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-primary-fixed flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>person_add</span>
              </div>
              <div>
                <h3 className="text-lg font-bold font-headline text-on-surface">New Patient</h3>
                <p className="text-xs text-slate-500 font-body mt-1">Register for first time</p>
              </div>
              <div className="flex items-center text-primary font-semibold text-xs mt-auto">
                <span>Get Started</span>
                <span className="material-symbols-outlined ml-2 text-sm">arrow_forward</span>
              </div>
            </button>

            {/* Find Doctor */}
            <button 
              onClick={() => navigate('/doctors')}
              className="group relative p-6 rounded-[2rem] bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl hover:bg-white/80 transition-all text-left flex flex-col gap-4 overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="material-symbols-outlined text-8xl">medical_information</span>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-tertiary-fixed flex items-center justify-center text-tertiary">
                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>medical_information</span>
              </div>
              <div>
                <h3 className="text-lg font-bold font-headline text-on-surface">Find Doctors</h3>
                <p className="text-xs text-slate-500 font-body mt-1">Specialists availability</p>
              </div>
              <div className="flex items-center text-tertiary font-semibold text-xs mt-auto">
                <span>Search Directory</span>
                <span className="material-symbols-outlined ml-2 text-sm">arrow_forward</span>
              </div>
            </button>

            {/* Hospital Map */}
            <button className="group relative p-6 rounded-[2rem] bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl hover:bg-white/80 transition-all text-left flex flex-col gap-4 overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="material-symbols-outlined text-8xl">map</span>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-surface-container-highest flex items-center justify-center text-on-surface-variant">
                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>map</span>
              </div>
              <div>
                <h3 className="text-lg font-bold font-headline text-on-surface">Hospital Map</h3>
                <p className="text-xs text-slate-500 font-body mt-1">Facilities navigation</p>
              </div>
              <div className="flex items-center text-on-surface-variant font-semibold text-xs mt-auto">
                <span>View Map</span>
                <span className="material-symbols-outlined ml-2 text-sm">arrow_forward</span>
              </div>
            </button>
          </div>
        </div>
      </main>

      {/* Bottom Queue Ticker */}
      <footer className="bg-white/90 backdrop-blur-lg h-16 flex items-center overflow-hidden border-t border-outline-variant/10 relative z-50 shrink-0 cursor-pointer" onClick={() => navigate('/queue')}>
        <div className="px-10 h-full flex items-center bg-primary text-white font-headline font-bold text-lg whitespace-nowrap shadow-[10px_0_30px_rgba(0,0,0,0.1)] relative z-10">
          LIVE QUEUE STATUS
        </div>
        <div className="flex-grow scrolling-ticker h-full flex items-center w-full relative">
          <div className="ticker-content flex items-center gap-12 px-12 animate-scroll">
            <div className="flex items-center gap-4 w-max">
              <span className="text-on-surface-variant font-medium">OPD Room 12:</span>
              <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-lg font-bold">NEXT: PAT-0482</span>
            </div>
            <div className="w-1.5 h-1.5 bg-outline-variant/30 rounded-full flex-shrink-0"></div>

            <div className="flex items-center gap-4 w-max">
              <span className="text-on-surface-variant font-medium">Radiology:</span>
              <span className="bg-primary-fixed text-on-primary-fixed px-3 py-1 rounded-lg font-bold">NEXT: PAT-1109</span>
            </div>
            <div className="w-1.5 h-1.5 bg-outline-variant/30 rounded-full flex-shrink-0"></div>

            <div className="flex items-center gap-4 w-max">
              <span className="text-on-surface-variant font-medium">Cardiology:</span>
              <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-lg font-bold">NEXT: PAT-0994</span>
            </div>
            <div className="w-1.5 h-1.5 bg-outline-variant/30 rounded-full flex-shrink-0"></div>

            <div className="flex items-center gap-4 w-max">
              <span className="text-on-surface-variant font-medium">Pharmacy:</span>
              <span className="bg-primary-fixed text-on-primary-fixed px-3 py-1 rounded-lg font-bold">NOW SERVING: PAT-0420</span>
            </div>

            {/* Duplicate for infinite scroll */}
            <div className="w-1.5 h-1.5 bg-outline-variant/30 rounded-full flex-shrink-0"></div>
            <div className="flex items-center gap-4 w-max">
              <span className="text-on-surface-variant font-medium">OPD Room 12:</span>
              <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-lg font-bold">NEXT: PAT-0482</span>
            </div>
          </div>
        </div>

        <div className="h-full flex items-center px-8 bg-surface-container-low/50 border-l border-outline-variant/10 min-w-max">
          <div className="flex flex-col items-end">
            <span className="text-2xl font-bold font-headline leading-none text-primary">09:42 AM</span>
            <span className="text-xs font-bold text-on-surface-variant tracking-tighter mt-1">OCTOBER 24, 2023</span>
          </div>
        </div>
      </footer>

      {/* Side Navigation Accessibility Hub */}
      <aside className="fixed left-6 top-1/2 -translate-y-1/2 h-auto w-20 flex flex-col gap-6 py-8 z-50">
        <button 
          onClick={() => navigate(patient ? '/patient-dashboard' : '/patient-login')}
          className="w-16 h-16 rounded-[1.25rem] bg-white shadow-2xl flex flex-col items-center justify-center text-primary hover:bg-primary hover:text-white transition-all border border-outline-variant/10 group"
        >
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>account_circle</span>
          <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter">{patient ? 'Profile' : 'Login'}</span>
        </button>
        <button 
          onClick={() => navigate('/checkout')}
          className="w-16 h-16 rounded-[1.25rem] bg-white shadow-2xl flex flex-col items-center justify-center text-primary hover:bg-primary hover:text-white transition-all border border-outline-variant/10 group"
        >
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>logout</span>
          <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter">Check-Out</span>
        </button>
        <button 
          onClick={() => navigate('/admin/login')}
          className="w-16 h-16 rounded-[1.25rem] bg-white shadow-2xl flex flex-col items-center justify-center text-primary hover:bg-primary hover:text-white transition-all border border-outline-variant/10 group"
        >
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>admin_panel_settings</span>
          <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter">Admin</span>
        </button>
        <button 
          onClick={() => navigate('/assistant')}
          className="w-16 h-16 rounded-[1.25rem] bg-white shadow-2xl flex flex-col items-center justify-center text-primary hover:bg-primary hover:text-white transition-all border border-outline-variant/10 group"
        >
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>live_help</span>
          <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter">Help</span>
        </button>
      </aside>
    </div>
  );
};

export default KioskHome;
