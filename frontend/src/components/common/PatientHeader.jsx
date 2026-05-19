import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Logo from './Logo';

const PatientHeader = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [patient, setPatient] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const savedPatient = localStorage.getItem('activePatient');
        if (savedPatient) {
            setPatient(JSON.parse(savedPatient));
        } else {
            setPatient(null);
        }
    }, [location.pathname]); // Update state on navigation in case of sign out/in

    const handleSignOut = () => {
        localStorage.removeItem('activePatient');
        setPatient(null);
        setMobileMenuOpen(false);
        navigate('/patient');
    };

    const isActive = (path) => {
        return location.pathname === path;
    };

    const navItems = [
        { name: 'Home', path: '/patient', icon: 'home' },
        { name: 'AI Assistant', path: '/patient/chat', icon: 'smart_toy' },
        { name: 'Queue Status', path: '/patient/queue', icon: 'hourglass_empty' },
        { name: 'Find Doctors', path: '/patient/book', icon: 'calendar_month' },
        { name: 'Hospital Map', path: '/patient/map', icon: 'map' }
    ];
    const staffSignInPath = '/staff/access';

    const handleNavClick = (path) => {
        setMobileMenuOpen(false);
        navigate(path);
    };

    return (
        <header className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 z-50 transition-all duration-300 shadow-sm shadow-slate-100/40 w-full shrink-0">
            <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 h-20 lg:h-22 flex items-center justify-between gap-4">
                {/* Logo */}
                <div 
                    className="flex items-center gap-3 cursor-pointer hover:opacity-90 active:scale-98 transition-all shrink-0" 
                    onClick={() => handleNavClick('/patient')}
                >
                    <Logo size="sm" showSubtitle={false} />
                    <div className="hidden xl:flex flex-col border-l border-slate-200 pl-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Smart Portal</span>
                        <span className="text-xs font-extrabold text-primary leading-tight mt-0.5">MediAssist Patient</span>
                    </div>
                </div>

                {/* Desktop Navigation Links */}
                <nav className="hidden lg:flex items-center rounded-[1.75rem] border border-slate-200/80 bg-white/85 px-1.5 py-1.5 shadow-sm shadow-slate-100/60 backdrop-blur-md">
                    {navItems.map((item) => {
                        const active = isActive(item.path);
                        return (
                            <button
                                type="button"
                                key={item.path}
                                onClick={() => handleNavClick(item.path)}
                                className={`relative cursor-pointer px-3.5 xl:px-4 py-3 rounded-2xl transition-all duration-200 text-[13px] xl:text-sm font-extrabold flex items-center gap-2 ${
                                    active
                                        ? 'bg-primary/7 text-primary shadow-[inset_0_0_0_1px_rgba(0,71,141,0.10)]'
                                        : 'text-slate-600 hover:text-primary hover:bg-slate-50'
                                }`}
                            >
                                <span className={`material-symbols-outlined text-[18px] ${active ? 'text-primary' : 'text-slate-400'}`}>
                                    {item.icon}
                                </span>
                                {item.name}
                                {active && (
                                    <span className="absolute bottom-1.5 left-10 right-4 h-0.5 bg-primary rounded-full animate-fade-in" />
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Session Actions (Desktop) */}
                <div className="hidden lg:flex items-center gap-3 shrink-0">
                    <button 
                        onClick={() => handleNavClick(staffSignInPath)}
                        aria-label="Admin / Doctor Sign In"
                        title="Admin / Doctor Sign In"
                        className="group w-12 h-12 border border-slate-200 hover:border-primary/30 bg-white/90 text-slate-700 rounded-2xl transition-all duration-200 cursor-pointer flex items-center justify-center shadow-sm shadow-slate-100/60 hover:bg-primary/5"
                    >
                        <span className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-600 group-hover:text-primary group-hover:border-primary/20 group-hover:bg-primary/10 flex items-center justify-center transition-all">
                            <span className="material-symbols-outlined text-[18px] font-bold">admin_panel_settings</span>
                        </span>
                    </button>
                    {patient ? (
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span className="text-xs font-bold text-slate-700 max-w-[120px] truncate">{patient.full_name}</span>
                            </div>
                            <button 
                                onClick={handleSignOut}
                                className="px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-full transition-all cursor-pointer flex items-center gap-2 active:scale-98"
                            >
                                <span className="material-symbols-outlined text-sm font-bold">logout</span>
                                Sign Out
                            </button>
                        </div>
                    ) : (
                        <>
                            <button 
                                onClick={() => handleNavClick('/patient/login')}
                                className="px-4 py-2.5 font-extrabold text-sm text-slate-700 hover:text-primary transition-colors duration-200 cursor-pointer"
                            >
                                Login
                            </button>
                            <button 
                                onClick={() => handleNavClick('/patient/register')}
                                className="px-6 py-2.5 bg-primary hover:bg-primary-container text-white font-extrabold text-sm rounded-full transition-all duration-250 shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 active:scale-98 cursor-pointer"
                            >
                                Register Now
                            </button>
                        </>
                    )}
                </div>

                {/* Hamburger Button (Mobile) */}
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="lg:hidden p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                >
                    <span className="material-symbols-outlined text-2.5xl">
                        {mobileMenuOpen ? 'close' : 'menu'}
                    </span>
                </button>
            </div>

            {/* Mobile Menu Panel */}
            {mobileMenuOpen && (
                <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-6 space-y-5 animate-in slide-in-from-top-4 duration-300 shadow-xl relative z-50">
                    <div className="flex flex-col gap-2 font-extrabold text-sm">
                        {navItems.map((item) => {
                            const active = isActive(item.path);
                            return (
                                <button
                                    type="button"
                                    key={item.path}
                                    onClick={() => handleNavClick(item.path)}
                                    className={`py-3 px-4 rounded-xl cursor-pointer transition-all text-left ${
                                        active ? 'bg-primary/5 text-primary' : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    <span className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                                        <span>{item.name}</span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                    
                    <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                        <button 
                            onClick={() => handleNavClick(staffSignInPath)}
                            className="w-full py-3.5 border border-slate-200 text-slate-700 font-bold rounded-2xl text-sm hover:bg-slate-50 transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-base">admin_panel_settings</span>
                            Staff Sign In
                        </button>
                        {patient ? (
                            <>
                                <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 mb-1">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    <span className="text-sm font-bold text-slate-700">{patient.full_name}</span>
                                </div>
                                <button 
                                    onClick={handleSignOut}
                                    className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-base">logout</span>
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <>
                                <button 
                                    onClick={() => handleNavClick('/patient/login')}
                                    className="w-full py-3 border border-slate-200 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-50 transition-all cursor-pointer"
                                >
                                    Login
                                </button>
                                <button 
                                    onClick={() => handleNavClick('/patient/register')}
                                    className="w-full py-3 bg-primary text-white font-bold rounded-xl text-sm shadow-md hover:bg-primary/95 transition-all cursor-pointer"
                                >
                                    Register Now
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
};

export default PatientHeader;
