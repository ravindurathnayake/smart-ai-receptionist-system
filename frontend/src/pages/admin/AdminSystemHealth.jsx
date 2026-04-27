import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';

const AdminSystemHealth = () => {
    const [healthData, setHealthData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [isDiagnosticRunning, setIsDiagnosticRunning] = useState(false);

    const fetchHealth = async (isDiagnostic = false) => {
        if (isDiagnostic) setIsDiagnosticRunning(true);
        else setRefreshing(true);
        
        try {
            const data = await apiService.getSystemHealth(isDiagnostic);
            setHealthData(data);
            setLastUpdated(new Date());
        } catch (error) {
            console.error("Error fetching system health:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
            setIsDiagnosticRunning(false);
        }
    };

    useEffect(() => {
        fetchHealth();
        const interval = setInterval(() => fetchHealth(false), 30000); 
        return () => clearInterval(interval);
    }, []);

    const services = [
        { key: 'database', label: 'Database Status', icon: 'database' },
        { key: 'api', label: 'API Status', icon: 'api' },
        { key: 'email', label: 'Email Service', icon: 'mail' },
        { key: 'whatsapp', label: 'WhatsApp Service', icon: 'chat' },
        { key: 'websocket', label: 'WebSocket Connection', icon: 'sync' },
        { key: 'face_recognition', label: 'Face Recognition', icon: 'face' }
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case 'Connected': return 'text-green-600 bg-green-50 border-green-100';
            case 'Degraded': return 'text-yellow-600 bg-yellow-50 border-yellow-100';
            case 'Not Available': return 'text-red-600 bg-red-50 border-red-100';
            default: return 'text-slate-400 bg-slate-50 border-slate-100';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Connected': return 'check_circle';
            case 'Degraded': return 'warning';
            case 'Not Available': return 'cancel';
            default: return 'help';
        }
    };

    const getOverallIndicator = () => {
        const status = healthData?.overall_status || 'Unknown';
        if (status === 'Healthy') return { color: 'text-green-600', bg: 'bg-green-100', text: 'System Healthy', icon: 'check_circle' };
        if (status === 'Degraded') return { color: 'text-yellow-600', bg: 'bg-yellow-100', text: 'System Partially Operational', icon: 'warning' };
        return { color: 'text-red-600', bg: 'bg-red-100', text: 'System Issue Detected', icon: 'error' };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    const overall = getOverallIndicator();

    return (
        <div className="p-8 space-y-8 animate-fade-in max-h-screen overflow-y-auto no-scrollbar">
            {/* Header Section */}
            <div className="flex justify-between items-start">
                <div className="space-y-4">
                    <div>
                        <h1 className="text-3xl font-black text-on-surface font-headline">System Health Dashboard</h1>
                        <p className="text-slate-500 font-bold mt-1">Professional service monitoring & diagnostics</p>
                    </div>
                    
                    {/* Overall System Status Indicator */}
                    <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-2xl ${overall.bg} ${overall.color} border border-white shadow-sm`}>
                        <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                            {overall.icon}
                        </span>
                        <span className="text-base font-black tracking-tight">{overall.text}</span>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                    <div className="flex items-center gap-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Last Checked: {lastUpdated ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Never'}
                        </p>
                        <button 
                            onClick={() => fetchHealth(false)}
                            disabled={refreshing || isDiagnosticRunning}
                            className={`p-2 rounded-lg transition-all ${refreshing ? 'animate-spin text-primary' : 'text-slate-400 hover:text-primary'}`}
                        >
                            <span className="material-symbols-outlined">refresh</span>
                        </button>
                    </div>
                    
                    <div className="flex gap-3">
                        <button 
                            onClick={() => fetchHealth(true)}
                            disabled={isDiagnosticRunning || refreshing}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all shadow-md ${
                                isDiagnosticRunning ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-on-surface text-white hover:scale-105 active:scale-95'
                            }`}
                        >
                            <span className={`material-symbols-outlined text-xl ${isDiagnosticRunning ? 'animate-spin' : ''}`}>
                                {isDiagnosticRunning ? 'sync' : 'clinical_notes'}
                            </span>
                            {isDiagnosticRunning ? 'Running Diagnostic...' : 'Run Full Diagnostic'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Service Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((service) => {
                    const data = healthData ? healthData[service.key] : null;
                    const status = data?.status || 'Unknown';
                    const colorClasses = getStatusColor(status);
                    
                    return (
                        <div key={service.key} className="glass-card rounded-[2.5rem] p-7 shadow-lg border border-white hover:shadow-xl transition-all relative overflow-hidden group">
                            {/* Decorative background element */}
                            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-3xl opacity-10 ${status === 'Connected' ? 'bg-green-500' : status === 'Degraded' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                            
                            <div className="flex justify-between items-start mb-6 relative z-10">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${
                                    status === 'Connected' ? 'bg-green-50 text-green-600' : 
                                    status === 'Degraded' ? 'bg-yellow-50 text-yellow-600' : 
                                    'bg-red-50 text-red-600'
                                }`}>
                                    <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                                        {service.icon}
                                    </span>
                                </div>
                                <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border ${colorClasses}`}>
                                    <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
                                        {getStatusIcon(status)}
                                    </span>
                                    {status}
                                </div>
                            </div>

                            <div className="relative z-10">
                                <div className="flex items-baseline gap-2">
                                    <h3 className="text-xl font-black text-on-surface font-headline">{service.label}</h3>
                                    {data?.response_time > 0 && (
                                        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                                            {data.response_time} ms
                                        </span>
                                    )}
                                </div>
                                
                                <div className="mt-4 space-y-2">
                                    <p className="text-xs text-slate-500 font-bold leading-relaxed">
                                        {status === 'Connected' 
                                            ? `Service is operational and responding within acceptable limits.` 
                                            : status === 'Degraded'
                                            ? `Service is active but performance or configuration is suboptimal.`
                                            : `Critical failure detected. System cannot communicate with this service.`}
                                    </p>
                                    
                                    {data?.reason && (
                                        <div className="mt-4 p-3 bg-red-50/50 rounded-xl border border-red-100/50 flex items-start gap-3">
                                            <span className="material-symbols-outlined text-red-400 text-sm mt-0.5">info</span>
                                            <p className="text-[10px] font-bold text-red-600 italic">
                                                Reason: {data.reason}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between opacity-60">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Diagnostic Protocol</span>
                                <span className="text-[9px] font-black text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
                                    {service.key === 'websocket' ? 'Websocket v2' : service.key === 'api' ? 'REST/JSON' : service.key === 'database' ? 'PostgreSQL 15' : 'Service Layer'}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Bottom Info Card */}
            <div className="glass-card rounded-[2.5rem] p-8 shadow-xl border border-white bg-gradient-to-r from-primary/5 to-transparent flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-primary shadow-sm border border-primary/10">
                        <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
                    </div>
                    <div>
                        <h4 className="text-xl font-black text-on-surface font-headline">Monitoring Transparency</h4>
                        <p className="text-xs text-slate-500 font-bold mt-1 max-w-2xl">
                            The MediAssist AI health engine performs deep connectivity checks across the stack. "Degraded" status indicates missing optional environment variables or non-critical configuration warnings.
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">Service Uptime Goal</p>
                    <p className="text-2xl font-black text-primary">99.99%</p>
                </div>
            </div>
        </div>
    );
};

export default AdminSystemHealth;
