import React from 'react';
import './AdminDoctors.css';

const AdminDoctors = () => {
  const doctors = [
    { name: 'Dr. Aruni Perera', specialty: 'General Physician', shift: 'Morning', status: 'In Consultation', room: 'Room 01', patients: 12 },
    { name: 'Dr. Harshani Silva', specialty: 'Cardiologist', shift: 'Morning/Afternoon', status: 'Available', room: 'Room 04', patients: 8 },
    { name: 'Dr. Nimal Wickrama', specialty: 'Orthopedics', shift: 'Afternoon', status: 'On Break', room: 'Room 12', patients: 5 },
    { name: 'Dr. Nuwan Hettiarachchi', specialty: 'Neurologist', shift: 'Morning', status: 'In Consultation', room: 'Room 08', patients: 9 },
    { name: 'Dr. Ishara Fernando', specialty: 'Pediatrician', shift: 'Evening', status: 'Not In', room: 'Room 03', patients: 0 },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available': return 'text-success bg-success/10 border-success/20';
      case 'In Consultation': return 'text-primary bg-primary/10 border-primary/20';
      case 'On Break': return 'text-tertiary bg-tertiary/10 border-tertiary/20';
      default: return 'text-outline bg-surface-container border-outline-variant/30';
    }
  };

  return (
    <div className="doctors-wrapper admin-page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold font-display text-on-surface tracking-tight">Doctor Management</h2>
          <p className="text-sm text-on-surface-variant mt-1 font-medium">Manage hospital medical staff and their shift schedules.</p>
        </div>
        <button className="bg-primary text-white px-8 py-3.5 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
          <span className="material-symbols-rounded">person_add</span>
          Add New Doctor
        </button>
      </div>

      <div className="doctors-overview-grid">
        <div className="overview-stat-pill">
          <p className="text-[10px] font-black text-outline uppercase tracking-widest mb-1.5">Total On-Duty</p>
          <p className="text-3xl font-bold font-display text-on-surface">14 Doctors</p>
        </div>
        <div className="overview-stat-pill">
          <p className="text-[10px] font-black text-outline uppercase tracking-widest mb-1.5">Active Consultations</p>
          <p className="text-3xl font-bold font-display text-primary">09 Rooms</p>
        </div>
        <div className="overview-stat-pill">
          <p className="text-[10px] font-black text-outline uppercase tracking-widest mb-1.5">Next Shift Staff</p>
          <p className="text-3xl font-bold font-display text-secondary">06 Staff</p>
        </div>
      </div>

      <div className="roster-card shadow-sm">
        <div className="roster-header">
          <h3 className="font-bold text-lg font-display tracking-tight">Staff Roster</h3>
          <div className="flex gap-4">
            <div className="relative group">
              <span className="material-symbols-rounded absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg transition-colors group-focus-within:text-primary">search</span>
              <input type="text" placeholder="Search doctor..." className="pl-10 pr-4 py-2.5 bg-white border border-outline-variant/30 rounded-xl text-sm outline-none focus:border-primary/30 transition-all w-64 shadow-sm" />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="px-8 py-5">Doctor</th>
                <th className="px-8 py-5">Shift</th>
                <th className="px-8 py-5">Patients</th>
                <th className="px-8 py-5">Location</th>
                <th className="px-8 py-5 text-center">Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {doctors.map((doc, idx) => (
                <tr key={idx} className="group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="doctor-avatar-small group-hover:scale-110 transition-transform">
                        {doc.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-bold text-on-surface text-sm">{doc.name}</p>
                        <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mt-1">{doc.specialty}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                       <span className="material-symbols-rounded text-sm text-outline">schedule</span>
                       <span className="text-sm font-bold text-on-surface">{doc.shift}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="progress-bar-container">
                        <div className="progress-bar-fill" style={{ width: `${(doc.patients / 15) * 100}%` }}></div>
                      </div>
                      <span className="text-[11px] font-black text-on-surface">{doc.patients}/15</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-sm font-bold text-outline italic">{doc.room}</td>
                  <td className="px-8 py-6">
                    <div className={`mx-auto w-fit status-badge ${getStatusColor(doc.status)}`}>
                      {doc.status}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="p-2.5 bg-surface-container rounded-xl text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-all opacity-0 group-hover:opacity-100">
                      <span className="material-symbols-rounded text-xl">settings</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDoctors;
