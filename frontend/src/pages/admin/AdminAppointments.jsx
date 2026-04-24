import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import './AdminAppointments.css';

const AdminAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedApt, setSelectedApt] = useState(null);

  const fetchAppointments = async () => {
    try {
      const data = await apiService.getAllAppointments();
      if (data) {
        setAppointments(data);
      }
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCancel = async (aptId) => {
    if (window.confirm("Are you sure you want to cancel this appointment?")) {
      try {
        await apiService.cancelAppointment(aptId);
        fetchAppointments();
      } catch (err) {
        console.error("Cancel failed:", err);
        alert("Failed to cancel appointment.");
      }
    }
  };

  const handleRescheduleSubmit = async (newDate) => {
    try {
      await apiService.rescheduleAppointment(selectedApt.raw_id, newDate);
      setShowRescheduleModal(false);
      fetchAppointments();
    } catch (err) {
      console.error("Reschedule failed:", err);
      alert("Failed to reschedule.");
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Confirmed': return 'bg-primary/10 text-primary border-primary/20';
      case 'Booked': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Pending': return 'bg-tertiary/10 text-tertiary border-tertiary/20';
      case 'Checked-in': return 'bg-secondary/10 text-secondary border-secondary/20';
      case 'Cancelled': return 'bg-red-50 text-red-500 border-red-100';
      case 'Completed': return 'bg-green-50 text-green-600 border-green-100';
      default: return 'bg-surface-container text-outline';
    }
  };

  return (
    <div className="appointments-wrapper admin-page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold font-display text-on-surface tracking-tight">Appointment Management</h2>
          <p className="text-sm text-on-surface-variant mt-1 font-medium">Manage and monitor patient bookings.</p>
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
            {loading ? (
              <tr><td colSpan="6" className="text-center py-10">Loading appointments...</td></tr>
            ) : appointments.length === 0 ? (
              <tr><td colSpan="6" className="text-center py-10">No appointments found.</td></tr>
            ) : appointments.map((apt, idx) => (
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
                    {apt.status !== 'Cancelled' && apt.status !== 'Completed' && (
                      <>
                        <button 
                          onClick={() => { setSelectedApt(apt); setShowRescheduleModal(true); }}
                          className="p-2.5 bg-surface-container rounded-xl text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-all" title="Reschedule">
                          <span className="material-symbols-rounded text-xl">calendar_clock</span>
                        </button>
                        <button 
                          onClick={() => handleCancel(apt.raw_id)}
                          className="p-2.5 bg-surface-container rounded-xl text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-all" title="Cancel">
                          <span className="material-symbols-rounded text-xl">cancel</span>
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Pagination/Summary */}
        <div className="p-8 border-t border-outline-variant/10 flex items-center justify-between">
          <p className="text-sm text-on-surface-variant font-medium">Showing <span className="font-bold text-on-surface">1 - {appointments.length}</span> of {appointments.length} appointments</p>
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

      {/* Reschedule Modal */}
      {showRescheduleModal && selectedApt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-100 bg-primary/5">
              <h3 className="text-2xl font-bold text-on-surface font-display">Reschedule Appointment</h3>
              <p className="text-sm text-on-surface-variant font-medium">Select a new date for {selectedApt.patient}</p>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleRescheduleSubmit(e.target.new_date.value);
            }} className="p-8 space-y-6">
              <div className="space-y-2 text-left">
                <label className="text-xs font-black uppercase tracking-widest text-outline ml-1">New Appointment Date</label>
                <input 
                  name="new_date"
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  defaultValue={selectedApt.date}
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white px-5 py-4 rounded-2xl outline-none transition-all font-bold text-lg"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowRescheduleModal(false)} className="flex-1 py-4 rounded-2xl font-bold text-outline hover:bg-slate-100 transition-all">Cancel</button>
                <button type="submit" className="flex-[2] py-4 rounded-2xl font-bold bg-primary text-white shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all">Update Date</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAppointments;
