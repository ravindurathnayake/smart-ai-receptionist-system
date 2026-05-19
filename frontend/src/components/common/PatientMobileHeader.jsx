import React from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';

const PatientMobileHeader = ({ setMobileMenuOpen }) => {
    const navigate = useNavigate();

    return (
        <header className="md:hidden sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 h-16 flex items-center justify-between px-4 z-40 shrink-0 shadow-sm">
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity" onClick={() => navigate('/patient')}>
                <Logo size="sm" showSubtitle={false} />
            </div>

            <button 
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 rounded-xl text-slate-600 hover:bg-slate-50 border border-slate-100 flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
                <span className="material-symbols-outlined text-xl">menu</span>
            </button>
        </header>
    );
};

export default PatientMobileHeader;
