import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../../components/common/Logo';
import { apiService } from '../../services/apiService';

const DoctorLogin = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('doctor');
    const [password, setPassword] = useState('doctor123');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const response = await apiService.login(username, password);
            if (response.user?.role !== 'doctor') {
                throw new Error('This account does not have doctor access.');
            }

            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_user');
            localStorage.setItem('doctor_token', response.user.token);
            localStorage.setItem('doctor_user', JSON.stringify(response.user));
            navigate('/doctor');
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Unable to sign in. Please verify your credentials.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-body text-slate-800 relative overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[55vw] h-[55vw] bg-gradient-to-tr from-primary/10 to-blue-300/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-15%] right-[-10%] w-[45vw] h-[45vw] bg-gradient-to-br from-emerald-300/10 to-cyan-300/5 rounded-full blur-[140px] pointer-events-none" />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 relative z-10">
                <div className="flex items-center justify-between gap-4 mb-12">
                    <div className="cursor-pointer" onClick={() => navigate('/staff/access')}>
                        <Logo size="sm" showSubtitle={false} />
                    </div>
                    <button
                        onClick={() => navigate('/staff/access')}
                        className="px-5 py-2.5 border border-slate-200 bg-white text-slate-700 rounded-full text-sm font-extrabold hover:border-primary hover:text-primary transition-all"
                    >
                        Back to Staff Access
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                    <div className="text-left max-w-xl">
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 border border-slate-200 text-primary text-xs font-black uppercase tracking-[0.24em]">
                            Doctor Workspace
                        </span>
                        <h1 className="mt-6 text-4xl sm:text-5xl font-black font-headline tracking-tight text-slate-900 leading-tight">
                            Sign in to manage your clinic sessions and patient care.
                        </h1>
                        <p className="mt-5 text-lg text-slate-500 font-medium leading-relaxed">
                            Review upcoming visits, confirm your arrival, request session changes from admin, and record prescriptions or vitals in one place.
                        </p>
                        <div className="mt-8 rounded-[2rem] border border-emerald-100 bg-emerald-50/80 p-6">
                            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-700">Demo Credentials</p>
                            <p className="mt-3 text-sm font-bold text-slate-700">Username: <span className="text-emerald-700">doctor</span></p>
                            <p className="mt-1 text-sm font-bold text-slate-700">Password: <span className="text-emerald-700">doctor123</span></p>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/60 p-8 sm:p-10">
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2 text-left">
                                <label className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400 ml-1">Username</label>
                                <div className="flex items-center gap-3 px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus-within:border-primary focus-within:bg-white transition-all">
                                    <span className="material-symbols-outlined text-slate-400">person</span>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="flex-1 bg-transparent outline-none font-bold text-slate-700"
                                        placeholder="Enter username"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 text-left">
                                <label className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400 ml-1">Password</label>
                                <div className="flex items-center gap-3 px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus-within:border-primary focus-within:bg-white transition-all">
                                    <span className="material-symbols-outlined text-slate-400">lock</span>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="flex-1 bg-transparent outline-none font-bold text-slate-700"
                                        placeholder="Enter password"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 text-left">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-primary-container text-white font-black text-sm shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {submitting ? 'Signing In...' : 'Open Doctor Dashboard'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DoctorLogin;
