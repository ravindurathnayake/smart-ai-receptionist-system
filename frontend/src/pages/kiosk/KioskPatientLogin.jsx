import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../../components/common/Logo';
import { apiService } from '../../services/apiService';
import './KioskCheckInOut.css'; // Reuse existing kiosk styles

const KioskPatientLogin = () => {
    const navigate = useNavigate();
    const [nic, setNic] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!nic.trim()) return;

        setLoading(true);
        setError('');
        try {
            // Check if patient exists by NIC
            const patients = await apiService.getPatients();
            const patient = Array.isArray(patients) ? patients.find(p => p.nic === nic.trim()) : null;

            if (patient) {
                // Store patient info in session/local storage
                localStorage.setItem('activePatient', JSON.stringify(patient));
                navigate('/patient-dashboard');
            } else {
                setError('No patient record found with this NIC. Please register as a new patient.');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('System error. Please try again or ask for assistance.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-screen h-screen overflow-hidden flex flex-col font-body bg-surface text-on-surface">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md w-full px-12 py-6 border-b border-outline-variant/10 z-50 flex justify-between items-center">
                <Logo onClick={() => navigate('/')} className="cursor-pointer" />
                <button 
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-slate-500 font-bold hover:text-primary transition-colors"
                >
                    <span className="material-symbols-outlined">close</span>
                    Exit
                </button>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center relative p-8">
                <div className="ai-pulse-bg -z-10 opacity-30"></div>
                
                <div className="w-full max-w-2xl animate-fade-in">
                    <div className="text-center mb-10">
                        <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mx-auto mb-6 shadow-inner">
                            <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>account_circle</span>
                        </div>
                        <h1 className="text-4xl font-black text-on-surface tracking-tight mb-3 font-headline">Patient Portal Access</h1>
                        <p className="text-slate-500 text-lg font-medium">Please verify your identity to access your medical records.</p>
                    </div>

                    <form onSubmit={handleLogin} className="glass-card rounded-[3rem] p-12 border border-white shadow-2xl space-y-8">
                        <div className="space-y-3">
                            <label className="text-xs font-black text-primary uppercase tracking-[0.2em] ml-2">National Identity Card (NIC)</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-primary text-2xl">fingerprint</span>
                                <input 
                                    type="text" 
                                    className="w-full pl-16 pr-8 py-6 bg-slate-50 border-none rounded-3xl text-xl font-bold placeholder:text-slate-300 focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all"
                                    placeholder="Enter your NIC number"
                                    value={nic}
                                    onChange={(e) => setNic(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            {error && <p className="text-red-500 text-sm font-bold ml-2">{error}</p>}
                        </div>

                        <div className="pt-4">
                            <button 
                                type="submit"
                                disabled={loading || !nic.trim()}
                                className={`w-full py-6 rounded-[2rem] text-xl font-black flex items-center justify-center gap-4 shadow-xl transition-all ${
                                    nic.trim() && !loading 
                                    ? 'bg-gradient-to-br from-primary to-primary-container text-white hover:scale-[1.02] active:scale-95' 
                                    : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                }`}
                            >
                                {loading ? 'Verifying Identity...' : 'Access Dashboard'}
                                <span className="material-symbols-outlined font-black">login</span>
                            </button>
                        </div>

                        <div className="text-center pt-4 border-t border-slate-50 mt-8">
                            <p className="text-slate-400 font-bold text-sm">Don't have an account?</p>
                            <button 
                                type="button"
                                onClick={() => navigate('/register/step1')}
                                className="text-primary font-black mt-2 hover:underline underline-offset-8"
                            >
                                Register as a New Patient
                            </button>
                        </div>
                    </form>
                </div>
            </main>

            <footer className="p-8 text-center text-slate-300 font-bold text-xs uppercase tracking-[0.3em]">
                Secure Medical Access Port • Colombo General Medical Center
            </footer>
        </div>
    );
};

export default KioskPatientLogin;
