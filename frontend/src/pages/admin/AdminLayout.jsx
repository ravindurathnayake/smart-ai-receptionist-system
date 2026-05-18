import React, { useEffect, useState, useRef } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAdminSearch } from '../../context/AdminSearchContext';
import Logo from '../../components/common/Logo';
import { apiService } from '../../services/apiService';
import { socketService } from '../../services/socketService';
import './AdminLayout.css';

const DEFAULT_ADMIN_ALERTS = [
  {
    id: 1001,
    type: 'Emergency',
    message: 'Emergency button activated at Lobby Kiosk #2. Lobby staff and medical responders dispatched.',
    kiosk_id: 'Kiosk #2',
    status: 'Unread',
    created_at: new Date(Date.now() - 3 * 60 * 1000).toISOString()
  },
  {
    id: 1002,
    type: 'Staff Assistance',
    message: 'Queue kiosk terminal #1 requires physical receipt paper roll replacement. Queue printing paused.',
    kiosk_id: 'Kiosk #1',
    status: 'Unread',
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString()
  },
  {
    id: 1003,
    type: 'Review Alert',
    message: 'Low rating alert (1-Star Review) submitted for Dr. Samarasinghe. Comment: "Long wait time in cardiology lobby."',
    kiosk_id: 'Kiosk #1',
    status: 'Unread',
    created_at: new Date(Date.now() - 42 * 60 * 1000).toISOString()
  },
  {
    id: 1004,
    type: 'System Health',
    message: 'Queue delay warning: Dr. Samarasinghe is running 18 minutes behind schedule for Cardiology consultations.',
    kiosk_id: 'Server',
    status: 'Read',
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
  }
];

const AdminLayout = () => {
  const navigate = useNavigate();
  const { searchQuery, setSearchQuery } = useAdminSearch();
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch notifications initially
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await apiService.getNotifications();
        const serverNotifs = data || [];
        setNotifications(() => {
          const combined = [...serverNotifs];
          DEFAULT_ADMIN_ALERTS.forEach(alert => {
            if (!combined.some(n => n.id === alert.id || n.message === alert.message)) {
              combined.push(alert);
            }
          });
          return combined.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        });
      } catch (err) {
        console.error("Failed to load notifications:", err);
        setNotifications(DEFAULT_ADMIN_ALERTS);
      }
    };

    fetchNotifications();

    // Listen to real-time notification events
    socketService.connect();
    socketService.on('new_notification', (newNotif) => {
      if (newNotif) {
        setNotifications(prev => {
          if (prev.some(n => n.id === newNotif.id)) return prev;
          return [newNotif, ...prev.slice(0, 19)];
        });
      }
    });

    // Close notifications dropdown on click outside
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      socketService.off('new_notification');
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      if (id >= 1000 && id <= 1005) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'Read' } : n));
        return;
      }
      await apiService.markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'Read' } : n));
    } catch (err) {
      console.error("Failed to mark notification read:", err);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'Read' } : n));
    }
  };

  const handleMarkAllAsRead = async () => {
    const unread = notifications.filter(n => n.status === 'Unread');
    try {
      await Promise.all(unread.map(n => {
        if (n.id >= 1000 && n.id <= 1005) return Promise.resolve();
        return apiService.markNotificationAsRead(n.id);
      }));
      setNotifications(prev => prev.map(n => ({ ...n, status: 'Read' })));
    } catch (err) {
      console.error("Failed to mark all as read:", err);
      setNotifications(prev => prev.map(n => ({ ...n, status: 'Read' })));
    }
  };

  const unreadCount = notifications.filter(n => n.status === 'Unread').length;

  const menuGroups = [
    {
      title: 'Management',
      items: [
        { name: 'Dashboard', icon: 'dashboard', path: '/admin' },
        { name: 'Appointments', icon: 'calendar_today', path: '/admin/appointments' },
        { name: 'Doctor Management', icon: 'medical_services', path: '/admin/doctors' },
        { name: 'Patient Records', icon: 'person_search', path: '/admin/patients' },
      ]
    },
    {
      title: 'Operations',
      items: [
        { name: 'Queue Control', icon: 'queue', path: '/admin/queue' },
        { name: 'System Health', icon: 'monitor_heart', path: '/admin/system-health' },
      ]
    },
    {
      title: 'Insights',
      items: [
        { name: 'Analytics', icon: 'analytics', path: '/admin/analytics' },
        { name: 'Reviews & Feedback', icon: 'rate_review', path: '/admin/reviews' },
      ]
    }
  ];

  return (
    <div className="admin-layout-container text-on-surface">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="flex flex-col h-full overflow-hidden">
          {/* Logo Section */}
          <div className="admin-logo-section mb-6">
            <div className="flex items-center gap-3 px-4">
              <Logo size="sm" onClick={() => navigate('/admin')} className="cursor-pointer" />
            </div>
          </div>

          {/* Navigation Section */}
          <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
            {menuGroups.map((group, idx) => (
              <div key={idx} className="mb-8">
                <h3 className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  {group.title}
                </h3>
                <nav className="space-y-1">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === '/admin'}
                      className={({ isActive }) =>
                        `admin-nav-item ${isActive ? 'active' : ''}`
                      }
                    >
                      <span className="material-symbols-rounded">
                        {item.icon}
                      </span>
                      <span className="nav-label">{item.name}</span>
                      <div className="active-indicator"></div>
                    </NavLink>
                  ))}
                </nav>
              </div>
            ))}
          </div>

          {/* Footer Section */}
          <div className="p-4 border-t border-slate-100/80 bg-slate-50/50">
            <button 
              onClick={() => navigate('/')}
              className="w-full flex items-center gap-3 px-5 py-3 rounded-xl text-error/80 hover:text-error hover:bg-error/5 transition-all group"
            >
              <span className="material-symbols-rounded text-[18px] transition-transform group-hover:-translate-x-1">logout</span>
              <span className="font-black text-[10px] uppercase tracking-[0.2em]">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-[288px] flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="admin-header">
          <div className="admin-search-wrapper group">
            <span className="material-symbols-rounded absolute left-5 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">search</span>
            <input 
              type="text" 
              placeholder="Search patients, doctors, or reports..." 
              className="admin-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-6 ml-10 relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className={`relative w-12 h-12 rounded-xl border flex items-center justify-center transition-all ${
                isNotificationsOpen 
                  ? 'border-primary bg-primary/5 text-primary shadow-sm' 
                  : 'border-outline-variant hover:bg-surface-container text-on-surface-variant'
              }`}
            >
              <span className="material-symbols-rounded">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black rounded-full h-5 w-5 flex items-center justify-center ring-4 ring-white animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 top-14 w-80 bg-white border border-slate-100/80 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] z-50 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200">
                {/* Header */}
                <div className="p-4 border-b border-slate-50 bg-slate-50/55 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button 
                      onClick={handleMarkAllAsRead}
                      className="text-[10px] font-black text-primary uppercase tracking-wider hover:underline transition-all"
                    >
                      Mark All Read
                    </button>
                  )}
                </div>

                {/* List */}
                <div className="max-h-[300px] overflow-y-auto no-scrollbar divide-y divide-slate-50">
                  {notifications.length === 0 ? (
                    <div className="py-12 text-center">
                      <span className="material-symbols-rounded text-4xl text-slate-300 mb-2 block">notifications_off</span>
                      <p className="text-xs text-slate-400 font-bold">No notifications yet.</p>
                    </div>
                  ) : (
                    notifications.map((n) => {
                      const isUnread = n.status === 'Unread';
                      
                      let iconName = 'info';
                      let colorClasses = 'bg-slate-50 border-slate-100 text-slate-600';
                      let labelColor = 'text-slate-600';

                      if (n.type === 'Emergency') {
                        iconName = 'emergency';
                        colorClasses = 'bg-rose-50 border-rose-100 text-rose-600';
                        labelColor = 'text-rose-600';
                      } else if (n.type === 'Staff Assistance') {
                        iconName = 'support_agent';
                        colorClasses = 'bg-amber-50 border-amber-100 text-amber-600';
                        labelColor = 'text-amber-600';
                      } else if (n.type === 'Review Alert') {
                        iconName = 'rate_review';
                        colorClasses = 'bg-blue-50 border-blue-100 text-blue-600';
                        labelColor = 'text-blue-600';
                      } else if (n.type === 'System Health') {
                        iconName = 'monitor_heart';
                        colorClasses = 'bg-purple-50 border-purple-100 text-purple-600';
                        labelColor = 'text-purple-600';
                      }
                      
                      return (
                        <div 
                          key={n.id}
                          onClick={() => isUnread && handleMarkAsRead(n.id)}
                          className={`p-4 transition-all text-left flex gap-3 cursor-pointer group ${
                            isUnread ? 'bg-slate-50/70 hover:bg-slate-100/70' : 'hover:bg-slate-50/30'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border ${colorClasses}`}>
                            <span className="material-symbols-rounded text-base" style={{ fontVariationSettings: n.type === 'Emergency' ? "'FILL' 1" : "" }}>
                              {iconName}
                            </span>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-1">
                              <span className={`text-[10px] font-black uppercase tracking-wider ${labelColor}`}>
                                {n.type}
                              </span>
                              <span className="text-[8px] text-slate-400 font-bold shrink-0">
                                {new Date(n.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className={`text-xs mt-0.5 leading-relaxed break-words ${
                              isUnread ? 'font-black text-slate-800' : 'font-medium text-slate-500'
                            }`}>
                              {n.message}
                            </p>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 block">
                              {n.kiosk_id || "Kiosk"}
                            </span>
                          </div>

                          {isUnread && (
                            <div className="w-2 h-2 rounded-full bg-primary shrink-0 self-center"></div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            <div className="h-10 w-[1px] bg-outline-variant/50"></div>

            <div className="admin-profile-pill">
              <div className="text-right">
                <p className="text-[13px] font-bold text-on-surface">Dr. Aruni Perera</p>
                <p className="text-[10px] uppercase tracking-wider font-bold text-outline">Chief Administrator</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-primary-container flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary/10">
                AP
              </div>
            </div>
          </div>
        </header>

        {/* Content Outlet */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-10 bg-surface">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
