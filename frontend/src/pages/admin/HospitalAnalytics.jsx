import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import './HospitalAnalytics.css';

const HospitalAnalytics = () => {
  const volumeData = [
    { day: 'Mon', count: 120 },
    { day: 'Tue', count: 142 },
    { day: 'Wed', count: 98 },
    { day: 'Thu', count: 115 },
    { day: 'Fri', count: 165 },
    { day: 'Sat', count: 180 },
    { day: 'Sun', count: 142 },
  ];

  const specialtyData = [
    { name: 'General Physician', value: 45, color: '#00478d' },
    { name: 'Cardiology', value: 25, color: '#006e1c' },
    { name: 'Orthopedics', value: 15, color: '#004f5d' },
    { name: 'Pediatrics', value: 10, color: '#ba1a1a' },
    { name: 'Other', value: 5, color: '#727783' },
  ];

  const hourlyData = [
    { time: '08:00', patients: 12 },
    { time: '10:00', patients: 45 },
    { time: '12:00', patients: 38 },
    { time: '14:00', patients: 52 },
    { time: '16:00', patients: 30 },
    { time: '18:00', patients: 15 },
    { time: '20:00', patients: 8 },
  ];

  return (
    <div className="analytics-wrapper admin-page-transition">
      <div>
        <h2 className="text-3xl font-bold font-display text-on-surface tracking-tight">Hospital Analytics</h2>
        <p className="text-sm text-on-surface-variant mt-1 font-medium">Deep insights into patient flow, occupancy, and staff efficiency.</p>
      </div>

      <div className="analytics-grid">
        {/* Weekly Volume Chart */}
        <div className="analytics-card group">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-lg font-display tracking-tight">Patient Volume (Weekly)</h3>
            <div className="chart-legend">
               <span className="legend-dot bg-primary"></span>
               <span className="legend-label">Total Visits</span>
            </div>
          </div>
          <div className="chart-container-inner">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f1f2" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f8f9fa' }}
                  contentStyle={{ borderRadius: '1.5rem', border: '1px solid #e1e3e4', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}
                />
                <Bar dataKey="count" fill="#00478d" radius={[12, 12, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Specialty Distribution */}
        <div className="analytics-card group">
          <h3 className="font-bold text-lg font-display tracking-tight mb-8">Specialty Distribution</h3>
          <div className="flex-1 flex items-center justify-center relative min-h-[260px]">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={specialtyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {specialtyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '1.5rem' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-black text-on-surface leading-none">100%</span>
              <span className="text-[10px] text-outline uppercase tracking-widest font-bold mt-1">Total Patients</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6">
             {specialtyData.map((item, idx) => (
               <div key={idx} className="flex items-center gap-2">
                 <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                 <span className="text-[11px] font-bold text-on-surface-variant truncate">{item.name}</span>
                 <span className="ml-auto text-xs font-black text-on-surface">{item.value}%</span>
               </div>
             ))}
          </div>
        </div>

        {/* Busy Hours Area Chart */}
        <div className="analytics-card group">
          <h3 className="font-bold text-lg font-display tracking-tight mb-8">Peak Load Analysis (Hourly)</h3>
          <div className="chart-container-inner">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData}>
                <defs>
                  <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00478d" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#00478d" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f1f2" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '1.5rem' }} />
                <Area type="monotone" dataKey="patients" stroke="#00478d" strokeWidth={3} fillOpacity={1} fill="url(#colorPatients)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Insights Summary */}
        <div className="analytics-insight-hero">
          <span className="material-symbols-rounded text-5xl text-primary/40 mb-4 animate-bounce">rocket_launch</span>
          <h3 className="text-2xl font-black font-display text-primary mb-2 italic">94.8% Efficiency</h3>
          <p className="text-on-surface-variant text-sm max-w-sm mx-auto leading-relaxed font-medium">
            Your facility is performing above capacity. Predicted patient surge at **02:00 PM** in **General Consultation**.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4">
             <div className="analytics-stat-tile">
                <p>Avg Wait</p>
                <p>12.5m</p>
             </div>
             <div className="analytics-stat-tile">
                <p>SAT Score</p>
                <p style={{ color: 'var(--md-sys-color-secondary, #006e1c)' }}>4.8/5</p>
             </div>
             <div className="analytics-stat-tile">
                <p>Canceled</p>
                <p style={{ color: 'var(--md-sys-color-error, #ba1a1a)' }}>1.2%</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalAnalytics;
