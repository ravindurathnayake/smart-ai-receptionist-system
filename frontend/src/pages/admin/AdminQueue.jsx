import React from 'react';
import './AdminQueue.css';

const AdminQueue = () => {
  const queueData = [
    { token: 'A-24', patient: 'Kasun Perera', doctor: 'Dr. Silva', status: 'In Session', waitTime: '34m', room: '04' },
    { token: 'A-25', patient: 'Dilini Jayasekara', doctor: 'Dr. Perera', status: 'Next', waitTime: '28m', room: '01' },
    { token: 'B-09', patient: 'Sahan Mendis', doctor: 'Dr. Wickrama', status: 'Waiting', waitTime: '15m', room: '12' },
    { token: 'A-26', patient: 'Mary de Silva', doctor: 'Dr. Perera', status: 'Waiting', waitTime: '12m', room: '01' },
    { token: 'C-02', patient: 'Nuwan Perera', doctor: 'Physio Team', status: 'Waiting', waitTime: '5m', room: '15' },
  ];

  return (
    <div className="queue-wrapper admin-page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold font-display text-on-surface tracking-tight">Queue Control Center</h2>
          <p className="text-sm text-on-surface-variant mt-1 font-medium">Real-time monitoring and active token management.</p>
        </div>
        <div className="flex gap-4">
          <button className="bg-white border border-outline-variant/30 text-on-surface px-6 py-3 rounded-2xl font-bold hover:bg-surface-container transition-all shadow-sm">Pause Queue</button>
          <button className="bg-primary text-white px-8 py-3.5 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
            <span className="material-symbols-rounded">campaign</span>
            Announce Next
          </button>
        </div>
      </div>

      <div className="queue-stats-grid">
        <div className="queue-stat-card">
           <p className="text-[10px] font-black text-outline uppercase mb-2 tracking-widest">Currently Serving</p>
           <p className="text-4xl font-black text-primary font-display">A-24</p>
           <p className="text-[10px] text-on-surface-variant mt-2 font-bold uppercase tracking-wider">Counter 01 • Room 04</p>
        </div>
        <div className="queue-stat-card">
           <p className="text-[10px] font-black text-outline uppercase mb-2 tracking-widest">Average Wait</p>
           <p className="text-4xl font-black text-secondary font-display">18m</p>
           <p className="text-[10px] text-on-surface-variant mt-2 font-bold uppercase tracking-wider">Last hour: 22m</p>
        </div>
        <div className="queue-stat-card">
           <p className="text-[10px] font-black text-outline uppercase mb-2 tracking-widest">Critical Wait</p>
           <p className="text-4xl font-black text-error font-display">02</p>
           <p className="text-[10px] text-on-surface-variant mt-2 font-bold uppercase tracking-wider italic">Wait time &gt; 45m</p>
        </div>
        <div className="queue-stat-card">
           <p className="text-[10px] font-black text-outline uppercase mb-2 tracking-widest">Throughput</p>
           <p className="text-4xl font-black text-tertiary font-display">92%</p>
           <p className="text-[10px] text-on-surface-variant mt-2 font-bold uppercase tracking-wider font-bold">12 patients / hour</p>
        </div>
      </div>

      <div className="main-queue-container shadow-sm">
        <div className="queue-tabs">
          <button className="queue-tab-btn active">Main Queue</button>
          <button className="queue-tab-btn inactive">Emergency</button>
          <button className="queue-tab-btn inactive">Laboratory</button>
          <div className="ml-auto flex gap-3">
             <button className="p-2.5 bg-surface-container rounded-xl text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-all">
               <span className="material-symbols-rounded">filter_list</span>
             </button>
             <button className="p-2.5 bg-surface-container rounded-xl text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-all">
               <span className="material-symbols-rounded">refresh</span>
             </button>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-3">
            {queueData.map((item, idx) => (
              <div key={idx} className="queue-control-item group">
                <div className="token-circle group-hover:scale-105 transition-transform">
                  <span className="text-[10px] font-black text-primary uppercase tracking-tighter">Token</span>
                  <span className="text-2xl font-black text-primary leading-none">{item.token}</span>
                </div>
                <div className="flex-1">
                   <div className="flex items-center gap-3">
                     <h4 className="font-bold text-on-surface text-xl">{item.patient}</h4>
                     <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        item.status === 'In Session' ? 'bg-secondary text-white shadow-lg shadow-secondary/20' : 
                        item.status === 'Next' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-surface-container text-outline border border-outline-variant/30'
                     }`}>
                       {item.status}
                     </span>
                   </div>
                   <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1.5 text-on-surface-variant text-sm">
                        <span className="material-symbols-rounded text-[18px]">medical_services</span>
                        <span className="font-bold">{item.doctor}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-on-surface-variant text-sm">
                        <span className="material-symbols-rounded text-[18px]">meeting_room</span>
                        <span className="font-bold">Room {item.room}</span>
                      </div>
                   </div>
                </div>
                <div className="text-right px-8 border-r border-outline-variant/10 mr-4">
                   <p className="text-[10px] font-black text-outline uppercase tracking-widest mb-1">Total Wait</p>
                   <p className={`text-xl font-black font-display ${parseInt(item.waitTime) > 30 ? 'text-error animate-pulse' : 'text-on-surface'}`}>{item.waitTime}</p>
                </div>
                <div className="flex gap-2">
                   <button className="w-12 h-12 bg-surface-container rounded-2xl flex items-center justify-center text-outline hover:bg-primary hover:text-white transition-all shadow-sm">
                     <span className="material-symbols-rounded">call_forward</span>
                   </button>
                   <button className="w-12 h-12 bg-surface-container rounded-2xl flex items-center justify-center text-outline hover:bg-error hover:text-white transition-all shadow-sm">
                     <span className="material-symbols-rounded">block</span>
                   </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminQueue;
