import React from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';

const PatientSidebar = ({ 
    activeItem, 
    patient, 
    mobileMenuOpen,
    setMobileMenuOpen 
}) => {
    const navigate = useNavigate();

    const handleSignOut = () => {
        localStorage.removeItem('activePatient');
        navigate('/patient');
        window.location.reload(); // Ensure session is fully cleared
    };

    const navItems = [
        { id: 'dashboard', icon: 'account_circle',   label: 'Personal Dashboard',   path: '/patient/dashboard' },
        { id: 'chat',      icon: 'smart_toy',        label: 'AI Assistant',         path: '/patient/chat' },
        { id: 'queue',     icon: 'hourglass_empty',  label: 'Queue Status',         path: '/patient/queue' },
        { id: 'book',      icon: 'calendar_month',   label: 'Find Doctors',         path: '/patient/book' },
        { id: 'map',       icon: 'map',              label: 'Hospital Map',         path: '/patient/map' },
    ];

    const handleItemClick = (path) => {
        if (setMobileMenuOpen) {
            setMobileMenuOpen(false);
        }
        navigate(path);
    };

    const sidebarContent = (
        <div className="flex flex-col h-full bg-white text-slate-800">
            {/* Header / Logo */}
            <div className="p-6 pb-4 border-b border-slate-100 flex justify-between items-center shrink-0">
                <div className="cursor-pointer hover:opacity-90 transition-opacity w-full" onClick={() => handleItemClick('/patient')}>
                    <Logo size="sm" className="w-full" showSubtitle={true} />
                </div>
            </div>

            {/* Patient Info Snippet */}
            {patient && (
                <div className="p-6 border-b border-slate-100/50 shrink-0 bg-slate-50/40">
                    <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-[#005eb8] text-white flex items-center justify-center font-headline font-black text-lg shadow-md shadow-primary/20 shrink-0">
                            {(patient.full_name || patient.name || 'P').charAt(0)}
                        </div>
                        <div className="text-left leading-none min-w-0">
                            <h4 className="font-headline font-black text-slate-800 text-sm leading-tight truncate">{patient.full_name || patient.name}</h4>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5 block">
                                ID: PAT-{patient.id ? patient.id.toString().padStart(4, '0') : '----'}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation Options */}
            <nav className="flex-1 flex flex-col px-3 mt-4 gap-1 text-left">
                {navItems.map((item) => {
                    const isActive = activeItem === item.id;
                    return (
                        <div
                            key={item.id}
                            onClick={() => handleItemClick(item.path)}
                            className={`flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all font-semibold text-sm cursor-pointer ${
                                isActive 
                                ? 'bg-[#005eb8] text-white shadow-lg shadow-[#005eb8]/30 font-bold' 
                                : 'text-primary hover:bg-slate-50'
                            }`}
                        >
                            <span 
                                className="material-symbols-outlined text-[22px]" 
                                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                            >
                                {item.icon}
                            </span>
                            <span>{item.label}</span>
                            {item.id === 'queue' && (
                                <span className="ml-auto w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* Bottom Support & Sign Out */}
            <div className="p-4 border-t border-slate-100 shrink-0 space-y-4 bg-slate-50/30">
                <div className="p-5 bg-slate-50 rounded-xl border border-dashed border-outline-variant/40 text-center mb-4">
                    <span className="material-symbols-outlined text-[#005eb8] text-2xl mb-2 block">support_agent</span>
                    <p className="text-xs font-bold text-[#005eb8] mb-3">Need Assistance?</p>
                    <button 
                        onClick={() => handleItemClick('/patient/chat')}
                        className="w-full py-2.5 bg-[#005eb8] hover:bg-opacity-95 text-white rounded-lg font-bold text-xs shadow-sm transition-opacity cursor-pointer"
                    >
                        Call for Help
                    </button>
                </div>

                <button 
                    onClick={handleSignOut}
                    className="flex items-center gap-4 px-5 py-3.5 w-full text-red-600 hover:bg-red-50 rounded-xl transition-all border-t border-slate-100 pt-4 font-bold text-sm cursor-pointer"
                >
                    <span className="material-symbols-outlined">logout</span>
                    <span>Sign Out</span>
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar (Left docked) */}
            <aside className="hidden md:flex flex-col w-64 bg-white border-r border-outline-variant/30 shrink-0 h-screen sticky top-0 z-30">
                {sidebarContent}
            </aside>

            {/* Mobile Overlay Sidebar Drawer */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
                        onClick={() => setMobileMenuOpen(false)}
                    />
                    
                    {/* Drawer container */}
                    <div className="relative w-64 max-w-[80vw] h-full bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-300">
                        {sidebarContent}
                        {/* Close button inside drawer */}
                        <button 
                            onClick={() => setMobileMenuOpen(false)}
                            className="absolute top-5 right-[-50px] w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg text-slate-600 focus:outline-none"
                        >
                            <span className="material-symbols-outlined text-xl">close</span>
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default PatientSidebar;
