import React from 'react';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const stats = [
    { label: 'Total Patients Today', value: '142', subValue: '+12% from yesterday', icon: 'person', color: 'primary' },
    { label: 'Active Queue', value: '18', subValue: 'Avg wait: 12m', icon: 'queue', color: 'secondary' },
    { label: 'Appointments Count', value: '64', subValue: '12 remaining', icon: 'calendar_today', color: 'tertiary' },
    { label: 'Completed Visits', value: '88', subValue: 'Efficiency: 94%', icon: 'task_alt', color: 'success' },
  ];

  const queueItems = [
    { token: 'A-24', patient: 'Kasun Perera', doctor: 'Dr. Silva (Cardiology)', type: 'General Checkup', wait: 'Called' },
    { token: 'A-25', patient: 'Dilini Jayasekara', doctor: 'Dr. Perera (GP)', type: 'Persistent Fever', wait: '12m' },
    { token: 'B-09', patient: 'Sahan Mendis', doctor: 'Dr. Wickrama (Orthopedics)', type: 'Fracture Follow-up', wait: '8m' },
    { token: 'A-26', patient: 'Mary de Silva', doctor: 'Dr. Perera (GP)', type: 'Health Certificate', wait: 'In Parking' },
  ];

  const doctors = [
    { name: 'Dr. Kamal Perera', specialty: 'General Physician', status: 'In Session', room: 'Room 01' },
    { name: 'Dr. Harshani Silva', specialty: 'Cardiologist', status: 'Available', room: 'Room 04' },
    { name: 'Dr. Nimal Wickrama', specialty: 'Orthopedics', status: 'On Break', room: 'Room 12' },
  ];

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
                    <p className="text-[10px] text-outline-variant font-bold mt-1">{doc.room}</p>
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
