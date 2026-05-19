import React from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../../components/common/Logo';

const accessCards = [
    {
        title: 'Admin Console',
        description: 'Operational controls, analytics, queues, and patient management.',
        path: '/admin/login',
        icon: 'admin_panel_settings',
        accent: 'from-primary to-primary-container'
    },
    {
        title: 'Doctor Workspace',
        description: 'Review sessions, track patients, add prescriptions, and send requests to admin.',
        path: '/doctor/login',
        icon: 'stethoscope',
        accent: 'from-emerald-500 to-lime-500'
    }
];

const StaffAccess = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-body text-slate-800 relative overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[55vw] h-[55vw] bg-gradient-to-tr from-primary/10 to-blue-300/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-15%] right-[-10%] w-[45vw] h-[45vw] bg-gradient-to-br from-emerald-300/10 to-cyan-300/5 rounded-full blur-[140px] pointer-events-none" />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 relative z-10">
                <div className="flex items-center justify-between gap-4 mb-12">
                    <div className="cursor-pointer" onClick={() => navigate('/patient')}>
                        <Logo size="sm" showSubtitle={false} />
                    </div>
                    <button
                        onClick={() => navigate('/patient')}
                        className="px-5 py-2.5 border border-slate-200 bg-white text-slate-700 rounded-full text-sm font-extrabold hover:border-primary hover:text-primary transition-all"
                    >
                        Back to Patient Portal
                    </button>
                </div>

                <div className="max-w-3xl text-center mx-auto space-y-5 mb-14">
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 border border-slate-200 text-primary text-xs font-black uppercase tracking-[0.24em]">
                        Staff Access
                    </span>
                    <h1 className="text-4xl sm:text-5xl font-black font-headline tracking-tight text-slate-900">
                        Choose the workspace you need.
                    </h1>
                    <p className="text-base sm:text-lg text-slate-500 font-medium leading-relaxed">
                        MediAssist keeps administrative operations and doctor workflow separated so each team can move faster with the right tools.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {accessCards.map((card) => (
                        <button
                            key={card.path}
                            onClick={() => navigate(card.path)}
                            className="group text-left rounded-[2.25rem] bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-8 sm:p-10 relative overflow-hidden"
                        >
                            <div className={`absolute inset-x-0 top-0 h-36 bg-gradient-to-br ${card.accent} opacity-10 group-hover:opacity-15 transition-opacity`} />
                            <div className="relative z-10">
                                <div className={`w-16 h-16 rounded-[1.5rem] bg-gradient-to-br ${card.accent} text-white flex items-center justify-center shadow-lg mb-8`}>
                                    <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                                        {card.icon}
                                    </span>
                                </div>
                                <h2 className="text-2xl sm:text-3xl font-black font-headline text-slate-900 tracking-tight">
                                    {card.title}
                                </h2>
                                <p className="mt-4 text-slate-500 font-medium leading-relaxed text-base max-w-xl">
                                    {card.description}
                                </p>
                                <div className="mt-10 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-extrabold text-slate-700 group-hover:border-primary/20 group-hover:bg-primary/5 group-hover:text-primary transition-all">
                                    Open Workspace
                                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default StaffAccess;
