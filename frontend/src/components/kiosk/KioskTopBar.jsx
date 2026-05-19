import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/apiService';

const KioskTopBar = ({ title, patientName, showHelp = true, showNotifications = true }) => {
    const navigate = useNavigate();
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [patientId, setPatientId] = useState(null);

    useEffect(() => {
        const savedPatient = localStorage.getItem('activePatient');
        if (savedPatient) {
            const parsed = JSON.parse(savedPatient);
            setPatientId(parsed.id);
            fetchNotifications(parsed.id);
        }
    }, []);

    const fetchNotifications = async (pId) => {
        try {
            const data = await apiService.getNotifications(pId);
            setNotifications(data || []);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        }
    };

    const markAsRead = async (id) => {
        try {
            await apiService.markNotificationAsRead(id);
            setNotifications(notifications.map(n => n.id === id ? { ...n, status: 'Read' } : n));
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
        }
    };

    const unreadCount = notifications.filter(n => n.status !== 'Read').length;
    const displayName = patientName || 'Patient';

    return (
        <header className="flex justify-between items-center w-full px-10 h-16 bg-white border-b border-outline-variant/20 z-30 shrink-0">
            <div className="flex items-center gap-3">
                <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 transition-colors" onClick={() => navigate(-1)}>
                    <span className="material-symbols-outlined text-slate-600">arrow_back</span>
                </button>
                <h1 className="text-xl font-extrabold tracking-tight text-primary font-headline">
                    MediAssist AI
                </h1>
                <div className="h-4 w-px bg-outline-variant mx-1" />
                <span className="text-slate-500 font-medium text-sm">{title}</span>
            </div>
            <div className="flex items-center gap-6 relative">
                <div className="flex gap-4 items-center">
                    {showNotifications && (
                        <div className="relative">
                            <span
                                className={`material-symbols-outlined cursor-pointer transition-colors ${isNotificationsOpen ? 'text-primary' : 'text-slate-400 hover:text-primary'}`}
                                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                            >
                                notifications
                            </span>
                            {unreadCount > 0 && (
                                <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></div>
                            )}

                            {isNotificationsOpen && (
                                <div className="absolute top-10 right-0 w-80 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-outline-variant/20 overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
                                    <div className="p-4 border-b border-outline-variant/10 flex justify-between items-center bg-slate-50/50">
                                        <h3 className="font-extrabold text-slate-800 text-sm">Notifications</h3>
                                        {unreadCount > 0 && <span className="text-[10px] font-bold text-white bg-primary px-2 py-0.5 rounded-full">{unreadCount} New</span>}
                                    </div>
                                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                                        {notifications.length > 0 ? notifications.map(n => (
                                            <div key={n.id} onClick={() => n.status !== 'Read' && markAsRead(n.id)} className={`p-4 border-b border-outline-variant/5 hover:bg-slate-50 transition-colors cursor-pointer ${n.status !== 'Read' ? 'bg-primary/5' : ''}`}>
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className={`font-bold text-sm ${n.status !== 'Read' ? 'text-primary' : 'text-slate-700'}`}>{n.type || 'Notification'}</h4>
                                                    <span className="text-[10px] font-bold text-slate-400">{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <p className="text-xs text-slate-600 font-medium leading-relaxed">{n.message}</p>
                                            </div>
                                        )) : (
                                            <div className="p-6 text-center text-slate-400 text-sm font-medium">No notifications</div>
                                        )}
                                    </div>
                                    <div className="p-3 text-center border-t border-outline-variant/10 bg-slate-50/50 hover:bg-slate-100 transition-colors cursor-pointer" onClick={() => setIsNotificationsOpen(false)}>
                                        <span className="text-xs font-bold text-primary">Close</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {showHelp && (
                        <span className="material-symbols-outlined text-slate-400 hover:text-primary cursor-pointer transition-colors" onClick={() => navigate('/assistant')}>help</span>
                    )}
                </div>
                <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-full border border-slate-100 font-headline">
                    <div className="text-right">
                        <p className="text-sm font-bold text-on-surface leading-none">{displayName}</p>
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Patient</p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-white">
                        {displayName.charAt(0).toUpperCase()}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default KioskTopBar;
