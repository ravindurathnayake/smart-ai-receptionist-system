import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import { socketService } from '../../services/socketService';
import './AdminDashboard.css';
const CLINIC_INSIGHTS = [
  {
    id: 1,
    title: 'Resource Allocation',
    description: 'High patient volume predicted for Orthopedics between 2 PM - 4 PM today. Recommend opening an extra consultation room.',
    actionLabel: 'Assign Room 05 to Orthopedics',
    loadingLabel: 'Allocating Room 05...',
    successLabel: 'Room 05 Allocated',
    impact: 'Est. Wait Time: -18 mins',
    color: 'from-blue-600 to-indigo-900',
    successToast: 'Room 05 has been successfully assigned to Orthopedics. Directional maps updated on Kiosks.'
  },
  {
    id: 2,
    title: 'Staff Deployment',
    description: 'Pediatric queue has 8 active patients with only 1 specialist active. Wait times projected to exceed 45 minutes.',
    actionLabel: 'Deploy Backup Specialist',
    loadingLabel: 'Deploying Dr. De Silva...',
    successLabel: 'Dr. De Silva Deployed',
    impact: 'Staff Efficiency: +35%',
    color: 'from-purple-600 to-indigo-800',
    successToast: 'Dr. Sarah de Silva assigned as backup to Pediatrics. Notification sent to clinic staff.'
  },
  {
    id: 3,
    title: 'Queue Bottleneck',
    description: 'General Practice queue is experiencing high inflow. Recommend activating AI Pre-consultation symptom screening.',
    actionLabel: 'Activate AI Pre-Screening',
    loadingLabel: 'Enabling AI Kiosk Check...',
    successLabel: 'AI Pre-Screening Active',
    impact: 'Processing Speed: +40%',
    color: 'from-cyan-700 to-blue-900',
    successToast: 'AI Pre-consultation symptom check-in activated on all Lobby Kiosk terminals.'
  }
];

const formatDoctorRequestType = (value) => {
  if (!value) return 'Doctor Request';
  return value
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState([
    { label: 'Total Patients Today', value: '0', subValue: 'Refreshing...', icon: 'person', color: 'primary' },
    { label: 'Active Queue', value: '0', subValue: 'Refreshing...', icon: 'queue', color: 'secondary' },
    { label: 'Appointments Count', value: '0', subValue: 'Refreshing...', icon: 'calendar_today', color: 'tertiary' },
    { label: 'Completed Visits', value: '0', subValue: 'Refreshing...', icon: 'task_alt', color: 'success' },
  ]);

  const [queueItems, setQueueItems] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [doctorRequests, setDoctorRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming', 'rescheduled', 'cancelled'
  const [selectedItem, setSelectedItem] = useState(null); // For details modal
  
  const [activeInsightIndex, setActiveInsightIndex] = useState(0);
  const [insightsStatus, setInsightsStatus] = useState({ 1: 'pending', 2: 'pending', 3: 'pending' });
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 6000);
  };

  const handleApplyInsight = (insight) => {
    setInsightsStatus(prev => ({ ...prev, [insight.id]: 'loading' }));
    setTimeout(() => {
      setInsightsStatus(prev => ({ ...prev, [insight.id]: 'applied' }));
      showToast(insight.successToast, 'success');
    }, 1800);
  };


  useEffect(() => {

    // NEW NOTIFICATION LISTENER
    socketService.on('new_notification', (data) => {
      console.log("Real-time notification received:", data);
      setNotifications(prev => {
        if (prev.find(n => n.id === data.id)) return prev;
        return [data, ...prev];
      });
    });

    // REFRESH DATA ON EVENTS
    const handleRefresh = () => {
      console.log("Real-time data update event received. Refreshing dashboard...");
      fetchData();
    };

    socketService.on('appointment_created', handleRefresh);
    socketService.on('appointment_booked', handleRefresh);
    socketService.on('appointment_updated', handleRefresh);
    socketService.on('appointment_rescheduled', handleRefresh);
    socketService.on('queue_updated', handleRefresh);
    socketService.on('stats_updated', handleRefresh);
    socketService.on('patient_created', handleRefresh);
    socketService.on('doctor_request_created', handleRefresh);
    socketService.on('doctor_request_updated', handleRefresh);

    return () => {
      socketService.off('new_notification');
      socketService.off('appointment_created', handleRefresh);
      socketService.off('appointment_booked', handleRefresh);
      socketService.off('appointment_updated', handleRefresh);
      socketService.off('appointment_rescheduled', handleRefresh);
      socketService.off('queue_updated', handleRefresh);
      socketService.off('stats_updated', handleRefresh);
      socketService.off('patient_created', handleRefresh);
      socketService.off('doctor_request_created', handleRefresh);
      socketService.off('doctor_request_updated', handleRefresh);
    };
  }, []);

  const fetchData = async () => {
    try {
      const [queueResponse, specialistsResponse, statsResponse, appointmentsResponse, notificationsResponse, doctorRequestsResponse] = await Promise.all([
        apiService.getQueueStatus(),
        apiService.getSpecialists(),
        apiService.getAdminStats(),
        apiService.getAllAppointments(),
        apiService.getNotifications(),
        apiService.getAdminDoctorRequests('Pending')
      ]);

      if (statsResponse) {
        const nextToken = queueResponse?.current_serving ? `#${queueResponse.current_serving.toString().padStart(2, '0')}` : '---';
        setStats([
          { label: 'Total Patients', value: statsResponse.patients.total.toString(), subValue: `+${statsResponse.patients.new_today} today`, icon: 'person', color: 'primary' },
          { label: 'Active Queue', value: statsResponse.queue.active.toString(), subValue: `Next: ${nextToken}`, icon: 'queue', color: 'secondary' },
          { label: 'Appointments', value: statsResponse.appointments.total.toString(), subValue: `${statsResponse.appointments.today} today`, icon: 'calendar_today', color: 'tertiary' },
          { label: 'Revenue Today', value: `Rs. ${statsResponse.revenue.today.toLocaleString()}`, subValue: 'Real-time', icon: 'payments', color: 'success' },
        ]);
      }

      if (queueResponse) {
        setQueueItems(queueResponse.queue.map(item => ({
          id: item.id,
          token: item.token,
          patient: item.patient,
          doctor: `${item.doctor} (${item.room || 'Room 04'})`,
          type: item.status,
          wait: item.waitTime
        })));
      }

      if (appointmentsResponse) {
        setAppointments(appointmentsResponse);
      }

      if (specialistsResponse) {
        setDoctors(specialistsResponse.map(d => ({
          id: d.id,
          name: d.name.startsWith('Dr.') ? d.name : `Dr. ${d.name}`,
          specialty: d.specialization || d.department,
          status: d.availability_status || 'Available',
          room: 'Room 04', 
          fee: d.consultation_fee
        })));
      }

      if (notificationsResponse) {
        setNotifications(notificationsResponse);
      }

      if (doctorRequestsResponse) {
        setDoctorRequests(doctorRequestsResponse);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // 30s refresh
    return () => clearInterval(interval);
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await apiService.markNotificationAsRead(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleReviewDoctorRequest = async (requestId, status) => {
    try {
      await apiService.reviewDoctorRequest(requestId, { status });
      fetchData();
    } catch (err) {
      console.error('Failed to review doctor request:', err);
    }
  };

  return (
    <div className="admin-dashboard-wrapper">
      {/* Page Title */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold font-display text-on-surface tracking-tight">System Command Center</h2>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-sm text-on-surface-variant font-medium">Real-time hospital operations & patient flow.</p>
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md border border-emerald-100">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-black uppercase tracking-widest">Live Dashboard</span>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Alerts Section */}
      {notifications.filter(n => n.status === 'Unread' && (n.type === 'Emergency' || n.type === 'Staff Assistance')).length > 0 && (
        <div className="mt-8 animate-in slide-in-from-top duration-500">
          <div className="bg-error/5 border-2 border-error/20 rounded-[2.5rem] p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="material-symbols-rounded text-error animate-pulse text-3xl">report</span>
                <h3 className="text-2xl font-bold font-display text-error">Active Emergency Alerts</h3>
              </div>
              <span className="bg-error text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest animate-bounce shadow-lg shadow-error/20">Immediate Action Required</span>
            </div>
            <div className="space-y-4">
              {notifications.filter(n => n.status === 'Unread' && (n.type === 'Emergency' || n.type === 'Staff Assistance')).map((n, idx) => (
                <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border-l-8 border-error flex items-center justify-between group hover:shadow-md transition-all">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-error/10 flex items-center justify-center text-error shadow-inner">
                      <span className="material-symbols-rounded text-3xl">{n.type === 'Emergency' ? 'emergency' : 'person_alert'}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h4 className="font-bold text-on-surface text-xl">{n.message}</h4>
                        <span className="text-[10px] font-black text-error bg-error/5 px-2.5 py-1 rounded border border-error/10 uppercase tracking-widest">{n.kiosk_id}</span>
                      </div>
                      <p className="text-sm text-on-surface-variant font-semibold mt-1 flex items-center gap-2">
                        <span className="material-symbols-rounded text-sm">schedule</span>
                        Received at {new Date(n.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleMarkRead(n.id)}
                    className="px-8 py-3 bg-error text-white rounded-xl font-bold text-xs hover:bg-error/90 transition-all opacity-0 group-hover:opacity-100 shadow-lg active:scale-95"
                  >
                    Resolve Alert
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map((stat, idx) => (
          <div key={idx} className="stat-card group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-surface-container rounded-2xl group-hover:bg-primary/10 transition-colors">
                <span className="material-symbols-rounded text-primary">{stat.icon}</span>
              </div>
              <span className="text-[10px] font-black text-success bg-success/10 px-2.5 py-1 rounded-lg italic tracking-wider">
                {stat.subValue}
              </span>
            </div>
            <h3 className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-1">{stat.label}</h3>
            <p className="text-3xl font-bold text-on-surface font-display">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-outline-variant/30 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl font-bold font-display text-on-surface">Doctor Request Review</h3>
            <p className="text-sm text-on-surface-variant font-medium mt-1">
              Approve new sessions, review reschedules, and reject cancellation requests from doctors.
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/doctor-requests')}
            className="px-6 py-3 rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
          >
            Open Doctor Requests
          </button>
        </div>

        <div className="space-y-3">
          {doctorRequests.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-outline-variant/20 bg-slate-50/70 px-5 py-8 text-center">
              <p className="text-xs font-black uppercase tracking-widest text-outline">No pending doctor requests</p>
            </div>
          ) : (
            doctorRequests.slice(0, 3).map((item) => (
              <div key={item.id} className="rounded-[1.75rem] border border-slate-100 bg-slate-50/60 px-5 py-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
                      {formatDoctorRequestType(item.request_type)}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-outline">
                      {item.department || 'Department N/A'}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-on-surface">{item.doctor_name}</h4>
                  <p className="mt-1 text-sm font-medium text-on-surface-variant">
                    {item.reason || 'No doctor note provided.'}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleReviewDoctorRequest(item.id, 'Approved')}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReviewDoctorRequest(item.id, 'Rejected')}
                    className="px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming Appointments & Activity */}
        <div className="lg:col-span-2 queue-control-card shadow-sm flex flex-col">
          <div className="p-8 pb-0 border-b border-outline-variant/5">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold font-display">Upcoming Appointments & Activity</h3>
              <div className="flex bg-surface-container/50 p-1 rounded-xl">
                <button 
                  onClick={() => setActiveTab('upcoming')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'upcoming' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant hover:text-primary'}`}
                >
                  Upcoming
                </button>
                <button 
                  onClick={() => setActiveTab('rescheduled')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'rescheduled' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant hover:text-primary'}`}
                >
                  Rescheduled
                </button>
                <button 
                  onClick={() => setActiveTab('cancelled')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'cancelled' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant hover:text-primary'}`}
                >
                  Cancelled
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 flex-1 overflow-y-auto max-h-[600px] no-scrollbar">
            <div className="space-y-2">
              {appointments
                .filter(apt => {
                  if (activeTab === 'upcoming') return apt.status === 'Booked' || apt.status === 'Confirmed' || apt.status === 'Checked-In';
                  if (activeTab === 'rescheduled') return apt.status === 'Rescheduled';
                  if (activeTab === 'cancelled') return apt.status === 'Cancelled';
                  return false;
                })
                .map((item, idx) => (
                <div 
                  key={idx} 
                  className="queue-item group cursor-pointer hover:bg-primary/5 border border-transparent hover:border-primary/10 transition-all"
                  onClick={() => setSelectedItem(item)}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold transition-all ${
                    activeTab === 'upcoming' ? 'bg-primary/10 text-primary' : 
                    activeTab === 'rescheduled' ? 'bg-warning/10 text-warning' : 
                    'bg-error/10 text-error'
                  }`}>
                    <span className="material-symbols-rounded">
                      {activeTab === 'upcoming' ? 'event' : activeTab === 'rescheduled' ? 'event_repeat' : 'event_busy'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-on-surface text-lg">{item.patient}</h4>
                    <div className="flex items-center gap-2 text-on-surface-variant text-xs mt-1">
                      <span className="material-symbols-rounded text-sm italic">medical_information</span>
                      <span className="font-semibold">{item.dr}</span>
                      <span className="opacity-30">•</span>
                      <span className="font-medium text-outline">{item.status}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-on-surface">{item.time}</p>
                    <p className="text-[10px] font-bold text-outline-variant uppercase tracking-widest">{item.date}</p>
                  </div>
                </div>
              ))}
              {appointments.filter(apt => {
                  if (activeTab === 'upcoming') return apt.status === 'Booked' || apt.status === 'Confirmed' || apt.status === 'Checked-In';
                  if (activeTab === 'rescheduled') return apt.status === 'Rescheduled';
                  if (activeTab === 'cancelled') return apt.status === 'Cancelled';
                  return false;
                }).length === 0 && (
                <div className="py-20 text-center opacity-40">
                  <span className="material-symbols-rounded text-4xl mb-2">inventory_2</span>
                  <p className="text-xs font-black uppercase tracking-widest">No activity found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Insights & Availability */}
        <div className="space-y-8">
          {/* Smart Insights */}
          {(() => {
            const activeInsight = CLINIC_INSIGHTS[activeInsightIndex];
            const status = insightsStatus[activeInsight.id];
            
            return (
              <div 
                className={`insight-card group bg-gradient-to-br ${activeInsight.color}`}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-rounded text-white animate-pulse text-xl">auto_awesome</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-100">MediAssist AI Insight</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-white/10 rounded-full border border-white/10 shrink-0">
                    <span className="material-symbols-rounded text-xs text-blue-200">query_stats</span>
                    <span className="text-[9px] font-black text-white tracking-wider uppercase">{activeInsight.impact}</span>
                  </div>
                </div>

                {/* Body */}
                <h3 className="text-lg font-bold font-display tracking-tight text-white mb-2">{activeInsight.title}</h3>
                
                <p className="text-xs leading-relaxed text-blue-100 mb-6 font-medium min-h-[50px] transition-all duration-300">
                  {activeInsight.description}
                </p>

                {/* Actions */}
                <div className="space-y-4">
                  {status === 'pending' && (
                    <button 
                      onClick={() => handleApplyInsight(activeInsight)}
                      className="w-full py-3.5 px-6 bg-white text-blue-900 hover:bg-blue-50 hover:shadow-lg rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-[0.98]"
                    >
                      {activeInsight.actionLabel}
                    </button>
                  )}
                  {status === 'loading' && (
                    <button 
                      disabled
                      className="w-full py-3.5 px-6 bg-white/20 backdrop-blur-md text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                    >
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {activeInsight.loadingLabel}
                    </button>
                  )}
                  {status === 'applied' && (
                    <div 
                      className="w-full py-3.5 px-6 bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 animate-in fade-in duration-300"
                    >
                      <span className="material-symbols-rounded text-base text-emerald-300">check_circle</span>
                      {activeInsight.successLabel}
                    </div>
                  )}

                  {/* Pagination Slider Dots */}
                  <div className="flex justify-center gap-2.5 pt-2">
                    {CLINIC_INSIGHTS.map((insight, idx) => (
                      <button 
                        key={insight.id}
                        onClick={() => setActiveInsightIndex(idx)}
                        className={`insight-dot ${activeInsightIndex === idx ? 'active' : ''}`}
                        title={insight.title}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Availability Card */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-outline-variant/30 shadow-sm flex-1">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-outline-variant/10">
              <h3 className="text-lg font-bold font-display">Doctor Availability</h3>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
              </span>
            </div>
            <div className="space-y-6">
              {doctors.map((doc, idx) => (
                <div key={idx} className="flex items-center gap-4 group cursor-pointer">
                  <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center font-bold text-outline group-hover:bg-primary group-hover:text-white transition-all transform group-hover:scale-110">
                    {doc.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-on-surface leading-none">{doc.name}</p>
                    <p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider mt-1.5">{doc.specialty}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-[10px] font-black uppercase tracking-widest ${
                      doc.status === 'Available' ? 'text-secondary' : 'text-outline'
                    }`}>{doc.status}</p>
                    <p className="text-[10px] text-outline-variant font-bold mt-1">Rs. {doc.fee || '0'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-primary/5">
              <div>
                <h3 className="text-2xl font-bold text-on-surface">Appointment Details</h3>
                <p className="text-sm text-on-surface-variant font-medium">Full information for {selectedItem.id}</p>
              </div>
              <button onClick={() => setSelectedItem(null)} className="w-10 h-10 rounded-full hover:bg-slate-200 flex items-center justify-center transition-all">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-outline">Patient Name</label>
                  <p className="font-bold text-on-surface text-lg">{selectedItem.patient}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-outline">Assigned Doctor</label>
                  <p className="font-bold text-on-surface text-lg">{selectedItem.dr}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-outline">Scheduled Time</label>
                  <p className="font-bold text-on-surface">{selectedItem.time} on {selectedItem.date}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-outline">Dept & Room</label>
                  <p className="font-bold text-on-surface">{selectedItem.department} • {selectedItem.room}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-outline">Status</label>
                  <div className="flex">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${
                      selectedItem.status === 'Booked' || selectedItem.status === 'Checked-In' ? 'bg-primary/10 text-primary' : 
                      selectedItem.status === 'Rescheduled' ? 'bg-warning/10 text-warning' : 'bg-error/10 text-error'
                    }`}>
                      {selectedItem.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <label className="text-[10px] font-black uppercase tracking-widest text-outline">Symptoms / Reason</label>
                <p className="text-sm font-medium text-on-surface-variant leading-relaxed">
                  {selectedItem.type || "No specific symptoms provided during booking."}
                </p>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="flex-1 py-4 bg-surface-container rounded-2xl font-bold text-on-surface-variant hover:bg-slate-200 transition-all"
                >
                  Close
                </button>
                {selectedItem.status !== 'Cancelled' && (
                  <button 
                    className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
                  >
                    Manage Appointment
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Toast System */}
      {toast && (
        <div className="fixed top-6 right-6 z-[9999] no-print animate-in slide-in-from-top-10 slide-in-from-right-10 duration-500">
          <div className="backdrop-blur-md bg-white/90 border border-slate-100/50 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-3xl p-5 flex items-center gap-4 max-w-sm">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <span className="material-symbols-rounded text-xl">check_circle</span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">Optimization Active</h4>
              <p className="text-xs text-slate-500 font-bold mt-0.5 leading-relaxed break-words">
                {toast.message}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
