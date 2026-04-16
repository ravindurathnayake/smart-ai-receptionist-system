import React from 'react';
import './AdminAppointments.css';

const AdminAppointments = () => {
  const appointments = [
    { id: '#APT-9821', patient: 'Kumara Sangakkara', dr: 'Dr. Aruni Perera', time: '09:30 AM', date: 'Today', status: 'Confirmed', type: 'Consultation' },
    { id: '#APT-9822', patient: 'Mahela Jayawardene', dr: 'Dr. Silva', time: '10:15 AM', date: 'Today', status: 'Pending', type: 'Follow-up' },
    { id: '#APT-9823', patient: 'Lasith Malinga', dr: 'Dr. Wickrama', time: '11:00 AM', date: 'Today', status: 'Confirmed', type: 'Orthopedics' },
    { id: '#APT-9824', patient: 'Chamari Athapaththu', dr: 'Dr. Perera', time: '02:00 PM', date: 'Today', status: 'Checked-in', type: 'General' },
  ];

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Confirmed': return 'bg-primary/10 text-primary border-primary/20';
      case 'Pending': return 'bg-tertiary/10 text-tertiary border-tertiary/20';
      case 'Checked-in': return 'bg-secondary/10 text-secondary border-secondary/20';
      default: return 'bg-surface-container text-outline';
    }
  };

  return (
    <div className="appointments-wrapper admin-page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold font-display text-on-surface tracking-tight">Appointment Management</h2>
          <p className="text-sm text-on-surface-variant mt-1 font-medium">Manage and monitor patient bookings for today.</p>
        </div>
        <button className="bg-primary text-white px-8 py-3.5 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
          <span className="material-symbols-rounded">add</span>
          New Appointment
        </button>
      </div>

      {/* Filters */}
      <div className="appointment-filters">
        <button className="filter-btn filter-btn-active">All Appointments</button>
        <button className="filter-btn filter-btn-inactive">Pending</button>
        <button className="filter-btn filter-btn-inactive">Today</button>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm font-bold text-outline uppercase tracking-wider">Sort by:</span>
          <select className="bg-white border border-outline-variant/30 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-primary/30 transition-all">
            <option>Recent First</option>
            <option>Time Ascending</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="appointments-table-card shadow-sm">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID & Date</th>
              <th>Patient</th>
              <th>Doctor / Specialty</th>
              <th>Time</th>
              <th className="text-center">Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {appointments.map((apt, idx) => (
              <tr key={idx} className="group">
                <td className="px-8 py-6">
                  <p className="font-bold text-on-surface text-sm">{apt.id}</p>
                  <p className="text-xs text-outline font-bold mt-1 uppercase tracking-tighter">{apt.date}</p>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center font-bold text-primary group-hover:bg-primary group-hover:text-white transition-all">
                      {apt.patient[0]}
                    </div>
                    <div>
                      <p className="font-bold text-on-surface text-sm">{apt.patient}</p>
                      <p className="text-[10px] uppercase font-bold text-on-surface-variant mt-1 tracking-wider">{apt.type}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <p className="font-bold text-on-surface text-sm">{apt.dr}</p>
                  <p className="text-[10px] text-outline mt-1 italic uppercase font-black tracking-widest">Consultation Wing</p>
                </td>
                <td className="px-8 py-6 font-bold text-primary text-sm">{apt.time}</td>
                <td className="px-8 py-6">
                  <div className={`mx-auto w-fit status-badge ${getStatusStyle(apt.status)}`}>
                    {apt.status}
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2.5 bg-surface-container rounded-xl text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-all">
                      <span className="material-symbols-rounded text-xl">edit</span>
                    </button>
                    <button className="p-2.5 bg-surface-container rounded-xl text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-all">
                      <span className="material-symbols-rounded text-xl">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Pagination/Summary */}
        <div className="p-8 border-t border-outline-variant/10 flex items-center justify-between">
          <p className="text-sm text-on-surface-variant font-medium">Showing <span className="font-bold text-on-surface">1 - 4</span> of 64 appointments</p>
          <div className="flex gap-2">
            <button className="p-2 bg-surface-container rounded-lg text-outline cursor-not-allowed">
              <span className="material-symbols-rounded">chevron_left</span>
            </button>
            <button className="p-2 bg-white border border-outline-variant/30 rounded-lg text-primary hover:bg-surface-container transition-all">
              <span className="material-symbols-rounded">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAppointments;
