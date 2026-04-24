import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState([
    { label: 'Total Patients Today', value: '0', subValue: 'Refreshing...', icon: 'person', color: 'primary' },
    { label: 'Active Queue', value: '0', subValue: 'Refreshing...', icon: 'queue', color: 'secondary' },
    { label: 'Appointments Count', value: '0', subValue: 'Refreshing...', icon: 'calendar_today', color: 'tertiary' },
    { label: 'Completed Visits', value: '0', subValue: 'Refreshing...', icon: 'task_alt', color: 'success' },
  ]);

  const [queueItems, setQueueItems] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const queueResponse = await apiService.getQueueStatus();
        const specialistsResponse = await apiService.getSpecialists();
        const statsResponse = await apiService.getAdminStats();

        if (statsResponse) {
          setStats([
            { label: 'Total Patients', value: statsResponse.patients.total.toString(), subValue: `+${statsResponse.patients.new_today} today`, icon: 'person', color: 'primary' },
            { label: 'Active Queue', value: statsResponse.queue.active.toString(), subValue: `Next: #${queueResponse.current_serving || '---'}`, icon: 'queue', color: 'secondary' },
            { label: 'Appointments', value: statsResponse.appointments.total.toString(), subValue: `${statsResponse.appointments.today} today`, icon: 'calendar_today', color: 'tertiary' },
            { label: 'Revenue Today', value: `Rs. ${statsResponse.revenue.today.toLocaleString()}`, subValue: 'Real-time', icon: 'payments', color: 'success' },
          ]);
        }

        if (queueResponse) {
          const qData = queueResponse;
          setQueueItems(qData.queue.map(item => ({
            token: item.token,
            patient: item.patient,
            doctor: `${item.doctor} (${item.room || 'Room 04'})`,
            type: item.status,
            wait: item.waitTime
          })));
        }

        if (specialistsResponse) {
          setDoctors(specialistsResponse.map(d => ({
            name: d.name.startsWith('Dr.') ? d.name : `Dr. ${d.name}`,
            specialty: d.specialization || d.department,
            status: d.availability_status || 'Available',
            room: 'Room 04', // Fallback until session management is fully implemented in UI
            fee: d.consultation_fee
          })));
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // 30s refresh
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="admin-dashboard-wrapper admin-page-transition">
      {/* Page Title */}
      <div>
        <h2 className="text-3xl font-bold font-display text-on-surface tracking-tight">Hospital Overview</h2>
        <p className="text-sm text-on-surface-variant mt-1 font-medium">Real-time status of MediAssist AI Facility.</p>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Live Queue Control */}
        <div className="lg:col-span-2 queue-control-card shadow-sm">
          <div className="p-8 pb-4 flex items-center justify-between border-b border-outline-variant/5">
            <h3 className="text-xl font-bold font-display">Live Queue Control</h3>
            <button className="text-sm font-bold text-primary hover:bg-primary/5 px-4 py-2 rounded-xl transition-all">View Full Queue</button>
          </div>
          <div className="p-4 flex-1">
            <div className="space-y-2">
              {queueItems.map((item, idx) => (
                <div key={idx} className="queue-item group cursor-pointer">
                  <div className="token-badge group-hover:scale-105 transition-transform">
                    <span className="token-label">Token</span>
                    <span className="token-number">{item.token}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-on-surface text-lg">{item.patient}</h4>
                    <div className="flex items-center gap-2 text-on-surface-variant text-xs mt-1">
                      <span className="material-symbols-rounded text-sm italic">medical_information</span>
                      <span className="font-semibold">{item.doctor}</span>
                      <span className="opacity-30">•</span>
                      <span className="font-medium text-outline">{item.type}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      item.wait === 'Called' ? 'bg-secondary text-white' : 'bg-surface-container text-on-surface-variant'
                    }`}>
                      {item.wait}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Insights & Availability */}
        <div className="space-y-8">
          {/* Smart Insights */}
          <div className="insight-card group">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-rounded text-white animate-pulse">auto_awesome</span>
              <h3 className="font-bold font-display tracking-tight">MediAssist Smart Insights</h3>
            </div>
            <p className="text-sm leading-relaxed text-blue-100 mb-6 font-medium">
              "High patient volume predicted for **Orthopedics** between 2 PM - 4 PM today. Recommend opening an extra consultation room."
            </p>
            <button className="w-full py-3.5 px-6 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl text-[13px] font-black uppercase tracking-widest transition-all border border-white/20">
              Apply Optimization
            </button>
          </div>

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
    </div>
  );
};

export default AdminDashboard;
