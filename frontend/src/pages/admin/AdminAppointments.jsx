import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import { useAdminSearch } from '../../context/AdminSearchContext';
import ConfirmModal from '../../components/common/ConfirmModal';
import { socketService } from '../../services/socketService';
import './AdminAppointments.css';

const AdminAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showNewAptModal, setShowNewAptModal] = useState(false);
  const [selectedApt, setSelectedApt] = useState(null);
  const [isUnregistered, setIsUnregistered] = useState(false);
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [aptToCancel, setAptToCancel] = useState(null);
  const [isLive, setIsLive] = useState(false);
  
  // Drawer & Rescheduling States
  const [activeDetailsApt, setActiveDetailsApt] = useState(null);
  const [isReschedulingInline, setIsReschedulingInline] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  
  // New Appointment Form State
  const [newAptForm, setNewAptForm] = useState({
    patient_id: '',
    full_name: '',
    phone_number: '',
    nic: '',
    specialist_id: '',
    appointment_date: new Date().toISOString().split('T')[0],
    doctor_session_id: '',
    symptom: 'General Consultation'
  });
  const [patientSearch, setPatientSearch] = useState('');
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [availableSessions, setAvailableSessions] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [doctorAvailableDates, setDoctorAvailableDates] = useState([]);
  
  // States for Filtering & Sorting
  const { searchQuery } = useAdminSearch();
  const [activeFilter, setActiveFilter] = useState('All'); // All, Pending, Today
  const [sortBy, setSortBy] = useState('Recent First');
  const [filterDate, setFilterDate] = useState('');
  
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    pending: 0,
    confirmed: 0
  });

  const fetchAppointments = async () => {
    try {
      const [aptData, patientData, doctorData] = await Promise.all([
        apiService.getAllAppointments(),
        apiService.getPatients(),
        apiService.getSpecialists()
      ]);
      if (aptData) setAppointments(aptData);
      if (patientData) setPatients(patientData);
      if (doctorData) {
        setDoctors(doctorData);
        const specs = [...new Set(doctorData.map(d => d.specialization))].filter(Boolean);
        setSpecializations(specs);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();

    // Socket listeners for real-time updates
    const handleUpdate = (data) => {
      console.log('Real-time appointment update received:', data);
      fetchAppointments();
    };

    socketService.on('appointment_created', handleUpdate);
    socketService.on('appointment_booked', handleUpdate);
    socketService.on('appointment_updated', handleUpdate);
    socketService.on('appointment_rescheduled', handleUpdate);
    socketService.on('appointment_deleted', handleUpdate);
    socketService.on('queue_updated', handleUpdate);
    
    setIsLive(true);

    return () => {
      socketService.off('appointment_created', handleUpdate);
      socketService.off('appointment_booked', handleUpdate);
      socketService.off('appointment_updated', handleUpdate);
      socketService.off('appointment_rescheduled', handleUpdate);
      socketService.off('appointment_deleted', handleUpdate);
      socketService.off('queue_updated', handleUpdate);
      setIsLive(false);
    };
  }, []);

  useEffect(() => {
    let result = [...appointments];
    const todayStr = new Date().toISOString().split('T')[0];

    // Apply Tab Filters
    if (activeFilter === 'Today') {
      result = result.filter(apt => apt.date === todayStr);
    } else if (activeFilter === 'Pending') {
      result = result.filter(apt => apt.status === 'Booked' || apt.status === 'Pending');
    }

    // Apply Date Filter
    if (filterDate) {
      result = result.filter(apt => apt.date === filterDate);
    }

    // Apply Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(apt => 
        apt.patient.toLowerCase().includes(q) || 
        apt.dr.toLowerCase().includes(q) ||
        apt.id.toLowerCase().includes(q)
      );
    }

    // Apply Sorting
    result.sort((a, b) => {
      if (sortBy === 'Recent First') {
        // Sort by raw_id (Descending) which represents creation order
        return b.raw_id - a.raw_id;
      } else if (sortBy === 'Time Ascending') {
        const dateA = new Date(a.date + ' ' + a.time);
        const dateB = new Date(b.date + ' ' + b.time);
        return dateA - dateB;
      } else if (sortBy === 'Time Descending') {
        const dateA = new Date(a.date + ' ' + a.time);
        const dateB = new Date(b.date + ' ' + b.time);
        return dateB - dateA;
      } else if (sortBy === 'Patient Name') {
        return (a.patient || "").toLowerCase().localeCompare((b.patient || "").toLowerCase());
      }
      return 0;
    });

    setFilteredAppointments(result);

    // Update Stats
    setStats({
      total: appointments.length,
      today: appointments.filter(apt => apt.date === todayStr).length,
      pending: appointments.filter(apt => apt.status === 'Booked' || apt.status === 'Pending').length,
      confirmed: appointments.filter(apt => apt.status === 'Confirmed' || apt.status === 'Checked-in').length
    });
  }, [appointments, activeFilter, searchQuery, sortBy, filterDate]);

  const handleCancelClick = (aptId) => {
    setAptToCancel(aptId);
    setShowCancelConfirm(true);
  };

  const handleConfirmCancel = async () => {
    if (!aptToCancel) return;
    try {
      await apiService.cancelAppointment(aptToCancel);
      setShowCancelConfirm(false);
      setAptToCancel(null);
      fetchAppointments();
    } catch (err) {
      console.error("Cancel failed:", err);
      alert("Failed to cancel appointment.");
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

  const handleNewAptSubmit = async (e) => {
    e.preventDefault();
    if (!isUnregistered && !newAptForm.patient_id) {
      alert("Please select a registered patient or switch to Unregistered.");
      return;
    }
    if (isUnregistered && (!newAptForm.full_name || !newAptForm.phone_number || !newAptForm.nic)) {
      alert("Please provide name, phone, and NIC for unregistered patient. NIC is mandatory.");
      return;
    }
    if (!newAptForm.specialist_id || !newAptForm.doctor_session_id) {
      alert("Please select doctor and a specific session.");
      return;
    }

    try {
      setLoading(true);
      let bookingPayload = { ...newAptForm };
      
      if (!isUnregistered) {
        const selectedPatient = patients.find(p => p.id === parseInt(newAptForm.patient_id));
        bookingPayload.full_name = selectedPatient?.full_name || selectedPatient?.name;
        bookingPayload.phone_number = selectedPatient?.phone_number;
      }

      await apiService.bookAppointment(bookingPayload);
      setShowNewAptModal(false);
      setIsUnregistered(false);
      setPatientSearch('');
      setNewAptForm({
        patient_id: '',
        full_name: '',
        phone_number: '',
        nic: '',
        specialist_id: '',
        appointment_date: new Date().toISOString().split('T')[0],
        doctor_session_id: '',
        symptom: 'General Consultation'
      });
      fetchAppointments();
    } catch (err) {
      console.error("Booking failed:", err);
      alert("Failed to book appointment. Please check session capacity.");
    } finally {
      setLoading(false);
    }
  };

  const updateNewAptField = (field, value) => {
    setNewAptForm(prev => {
      const updated = { ...prev, [field]: value };
      
      // If specialist or date changes, reset session and fetch new sessions
      if (field === 'specialist_id' || field === 'appointment_date') {
        updated.doctor_session_id = '';
        if (updated.specialist_id) {
          const doc = doctors.find(d => d.id === parseInt(updated.specialist_id));
          if (doc && doc.sessions) {
            // Update highlighting for available dates
            const availableDates = doc.sessions
              .map(s => s.session_date)
              .filter((date, index, self) => date && self.indexOf(date) === index)
              .sort();
            setDoctorAvailableDates(availableDates);

            const dateObj = new Date(updated.appointment_date);
            const dayOfWeek = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(dateObj);
            
            const sessions = doc.sessions.filter(s => {
              if (s.session_date) return s.session_date === updated.appointment_date;
              return s.day_of_week === dayOfWeek;
            });
            setAvailableSessions(sessions);
          }
        } else {
          setAvailableSessions([]);
          setDoctorAvailableDates([]);
        }
      }
      return updated;
    });
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
    <div className="appointments-wrapper">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold font-display text-on-surface tracking-tight">Appointment Management</h2>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-sm text-on-surface-variant font-medium">Manage and monitor patient bookings.</p>
            {isLive && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md border border-emerald-100">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] font-black uppercase tracking-widest">Live Sync</span>
              </div>
            )}
          </div>
        </div>
        <button 
          onClick={() => setShowNewAptModal(true)}
          className="bg-primary text-white px-8 py-3.5 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <span className="material-symbols-rounded">add</span>
          New Appointment
        </button>
      </div>

      {/* Operational Stats */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="overview-stat-pill">
          <p className="text-[10px] font-black text-outline uppercase tracking-widest mb-1.5">Total Registry</p>
          <p className="text-3xl font-bold font-display text-on-surface">{stats.total} Bookings</p>
        </div>
        <div className="overview-stat-pill">
          <p className="text-[10px] font-black text-outline uppercase tracking-widest mb-1.5">Today's Workload</p>
          <p className="text-3xl font-bold font-display text-primary">{stats.today} Slots</p>
        </div>
        <div className="overview-stat-pill">
          <p className="text-[10px] font-black text-outline uppercase tracking-widest mb-1.5">Outstanding Check-ins</p>
          <p className="text-3xl font-bold font-display text-tertiary">{stats.pending} Waiting</p>
        </div>
        <div className="overview-stat-pill">
          <p className="text-[10px] font-black text-outline uppercase tracking-widest mb-1.5">System Status</p>
          <p className="text-3xl font-bold font-display text-secondary">Operational</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6 bg-white/50 p-4 rounded-[2rem] border border-outline-variant/10 backdrop-blur-sm">
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveFilter('All')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeFilter === 'All' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-outline hover:bg-surface-container'}`}
          >
            All Appointments
          </button>
          <button 
            onClick={() => setActiveFilter('Pending')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeFilter === 'Pending' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-outline hover:bg-surface-container'}`}
          >
            Pending
          </button>
          <button 
            onClick={() => setActiveFilter('Today')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeFilter === 'Today' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-outline hover:bg-surface-container'}`}
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-outline uppercase tracking-widest">Filter Date:</span>
            <div className="relative flex items-center">
              <input 
                type="date"
                className="bg-white border border-outline-variant/30 rounded-xl pl-4 pr-10 py-2 text-sm font-bold outline-none focus:border-primary/30 transition-all text-on-surface"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
              {filterDate && (
                <button 
                  onClick={() => setFilterDate('')}
                  className="absolute right-3 text-outline hover:text-primary transition-all flex items-center justify-center bg-transparent border-0 outline-none p-0 cursor-pointer"
                  title="Clear Date"
                >
                  <span className="material-symbols-rounded text-sm">close</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-outline uppercase tracking-widest">Sort:</span>
            <select 
              className="bg-white border border-outline-variant/30 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-primary/30 transition-all"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option>Recent First</option>
              <option>Time Ascending</option>
              <option>Time Descending</option>
              <option>Patient Name</option>
            </select>
          </div>
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
            ) : filteredAppointments.length === 0 ? (
              <tr><td colSpan="6" className="text-center py-10">No appointments found.</td></tr>
            ) : filteredAppointments.map((apt, idx) => (
              <tr 
                key={idx} 
                className="group hover:bg-slate-50/50 transition-all duration-200 cursor-pointer"
                onClick={() => {
                  setActiveDetailsApt(apt);
                  setIsReschedulingInline(false);
                  setRescheduleDate(apt.date);
                }}
              >
                <td className="px-8 py-6">
                  <p className="font-bold text-on-surface text-sm">{apt.id}</p>
                  <p className="text-xs text-outline font-bold mt-1 uppercase tracking-tighter">{apt.date}</p>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center font-bold text-primary group-hover:bg-primary group-hover:text-white transition-all">
                      {apt.patient ? apt.patient[0] : 'P'}
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
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setSelectedApt(apt); 
                            setRescheduleDate(apt.date);
                            setShowRescheduleModal(true); 
                          }}
                          className="p-2.5 bg-surface-container rounded-xl text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-all" title="Reschedule">
                          <span className="material-symbols-rounded text-xl">calendar_clock</span>
                        </button>
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            handleCancelClick(apt.raw_id); 
                          }}
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
          <p className="text-sm text-on-surface-variant font-medium">Showing <span className="font-bold text-on-surface">1 - {filteredAppointments.length}</span> of {filteredAppointments.length} appointments</p>
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

      {/* New Appointment Modal */}
      {showNewAptModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col">
            <div className="p-8 border-b border-slate-100 bg-primary/5 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-2xl font-bold text-on-surface font-display">Hospital Intake / New Appointment</h3>
                <p className="text-sm text-on-surface-variant font-medium">Create a booking for registered or walk-in patients.</p>
              </div>
              <button onClick={() => setShowNewAptModal(false)} className="w-10 h-10 rounded-full hover:bg-slate-200 transition-all flex items-center justify-center">
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>
            
            <form onSubmit={handleNewAptSubmit} className="p-8 overflow-y-auto no-scrollbar grid grid-cols-12 gap-x-8 gap-y-6">
              {/* Patient Type Toggle */}
              <div className="col-span-12 flex items-center gap-4 bg-surface-container/50 p-2 rounded-2xl border border-outline-variant/10">
                <button 
                  type="button"
                  onClick={() => setIsUnregistered(false)}
                  className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${!isUnregistered ? 'bg-white shadow-sm text-primary' : 'text-outline hover:text-on-surface'}`}
                >
                  Registered Patient
                </button>
                <button 
                  type="button"
                  onClick={() => setIsUnregistered(true)}
                  className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${isUnregistered ? 'bg-white shadow-sm text-primary' : 'text-outline hover:text-on-surface'}`}
                >
                  Walk-in / Unregistered
                </button>
              </div>

              {/* Patient Identity Section */}
              <div className="col-span-12 grid grid-cols-3 gap-6 animate-in slide-in-from-top-4 duration-300">
                {!isUnregistered ? (
                  <div className="col-span-3 space-y-2 relative">
                    <label className="text-[10px] font-black uppercase tracking-widest text-outline ml-1">Search Patient (Name, NIC or Mobile)</label>
                    <div className="relative">
                      <span className="material-symbols-rounded absolute left-4 top-1/2 -translate-y-1/2 text-outline/40">search</span>
                      <input 
                        type="text"
                        placeholder="Type to search..."
                        className="w-full bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white pl-12 pr-5 py-3.5 rounded-xl outline-none transition-all font-bold"
                        value={patientSearch}
                        onChange={(e) => setPatientSearch(e.target.value)}
                      />
                    </div>
                    {patientSearch && !newAptForm.patient_id && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-outline-variant/20 rounded-2xl shadow-xl z-[110] max-h-[200px] overflow-y-auto no-scrollbar py-2 animate-in slide-in-from-top-2 duration-200">
                        {patients
                          .filter(p => {
                            const q = patientSearch.toLowerCase();
                            const nameMatch = (p.full_name || p.name || "").toLowerCase().includes(q);
                            const nicMatch = (p.nic || "").toLowerCase().includes(q);
                            const phoneMatch = (p.phone_number || p.mobile_number || p.phone || "").toString().includes(q);
                            return nameMatch || nicMatch || phoneMatch;
                          })
                          .map(p => (
                            <div 
                              key={p.id} 
                              onClick={() => {
                                updateNewAptField('patient_id', p.id.toString());
                                setPatientSearch(`${p.full_name || p.name} • ${p.nic || 'No NIC'}`);
                              }}
                              className="px-4 py-3 hover:bg-primary/5 cursor-pointer flex justify-between items-center group"
                            >
                              <div>
                                <p className="text-sm font-bold text-on-surface">{p.full_name || p.name}</p>
                                <p className="text-[10px] font-bold text-outline uppercase">{p.nic || 'No NIC'} • {p.phone_number || p.mobile_number || 'No Phone'}</p>
                              </div>
                              <span className="material-symbols-rounded text-primary opacity-0 group-hover:opacity-100 transition-opacity">add_circle</span>
                            </div>
                          ))
                        }
                      </div>
                    )}
                    {newAptForm.patient_id && (
                      <div className="flex items-center justify-between bg-primary/5 border border-primary/20 p-3 rounded-xl mt-1">
                        <span className="text-xs font-bold text-primary">{patientSearch}</span>
                        <button onClick={() => { updateNewAptField('patient_id', ''); setPatientSearch(''); }} className="text-primary hover:text-primary-container"><span className="material-symbols-rounded text-sm">cancel</span></button>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-outline ml-1">Full Name <span className="text-error">*</span></label>
                      <input 
                        type="text"
                        placeholder="Patient's legal name"
                        className="w-full bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white px-5 py-3.5 rounded-xl outline-none transition-all font-bold"
                        value={newAptForm.full_name}
                        onChange={(e) => updateNewAptField('full_name', e.target.value)}
                        required={isUnregistered}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-outline ml-1">Phone Number <span className="text-error">*</span></label>
                      <input 
                        type="tel"
                        placeholder="07x xxxxxxx"
                        className="w-full bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white px-5 py-3.5 rounded-xl outline-none transition-all font-bold"
                        value={newAptForm.phone_number}
                        onChange={(e) => updateNewAptField('phone_number', e.target.value)}
                        required={isUnregistered}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-outline ml-1">NIC <span className="text-error">*</span></label>
                      <input 
                        type="text"
                        placeholder="Mandatory for new registry"
                        className="w-full bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white px-5 py-3.5 rounded-xl outline-none transition-all font-bold"
                        value={newAptForm.nic}
                        onChange={(e) => updateNewAptField('nic', e.target.value)}
                        required={isUnregistered}
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="col-span-12 h-px bg-outline-variant/10 my-2" />

              {/* Medical Selection Section */}
              <div className="col-span-4 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-outline ml-1">Department / Specialization</label>
                <select 
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white px-5 py-3.5 rounded-xl outline-none transition-all font-bold"
                  value={selectedSpecialization}
                  onChange={(e) => {
                    setSelectedSpecialization(e.target.value);
                    updateNewAptField('specialist_id', '');
                  }}
                >
                  <option value="">All Departments</option>
                  {specializations.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="col-span-4 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-outline ml-1">Specialist Doctor</label>
                <select 
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white px-5 py-3.5 rounded-xl outline-none transition-all font-bold"
                  value={newAptForm.specialist_id}
                  onChange={(e) => updateNewAptField('specialist_id', e.target.value)}
                  required
                >
                  <option value="">Select Consultant...</option>
                  {doctors
                    .filter(d => !selectedSpecialization || d.specialization === selectedSpecialization)
                    .map(d => (
                      <option key={d.id} value={d.id}>{d.title} {d.name}</option>
                    ))
                  }
                </select>
              </div>

              <div className="col-span-4 space-y-2 relative">
                <label className="text-[10px] font-black uppercase tracking-widest text-outline ml-1">Appointment Date</label>
                <div className="relative">
                  <input 
                    type="date"
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white px-5 py-3.5 rounded-xl outline-none transition-all font-bold"
                    value={newAptForm.appointment_date}
                    onChange={(e) => updateNewAptField('appointment_date', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                  {newAptForm.specialist_id && (
                    <div className="absolute top-full left-0 mt-2 w-full">
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Available Session Roster</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {doctorAvailableDates.length > 0 ? (
                          doctorAvailableDates.slice(0, 4).map(date => (
                            <button
                              key={date}
                              type="button"
                              onClick={() => updateNewAptField('appointment_date', date)}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                                newAptForm.appointment_date === date 
                                ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-200' 
                                : 'bg-white text-emerald-600 border-emerald-100 hover:border-emerald-300'
                              }`}
                            >
                              {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </button>
                          ))
                        ) : (
                          <span className="text-[9px] font-bold text-outline italic">No specific dates scheduled</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Visual Session Selection */}
              <div className="col-span-12 space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-outline ml-1">Choose Live Session Slot</label>
                {availableSessions.length > 0 ? (
                  <div className="grid grid-cols-3 gap-4">
                    {availableSessions.map(s => {
                      const isSelected = newAptForm.doctor_session_id === s.id.toString();
                      const isFull = s.current_bookings >= s.max_patients;
                      return (
                        <div 
                          key={s.id}
                          onClick={() => !isFull && updateNewAptField('doctor_session_id', s.id.toString())}
                          className={`relative p-5 rounded-[2rem] border-2 transition-all cursor-pointer group ${
                            isSelected 
                            ? 'bg-primary/5 border-primary shadow-lg shadow-primary/5' 
                            : isFull 
                            ? 'bg-slate-50 border-transparent opacity-50 cursor-not-allowed'
                            : 'bg-white border-outline-variant/20 hover:border-primary/30'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <span className={`text-lg font-black ${isSelected ? 'text-primary' : 'text-on-surface'}`}>{s.start_time}</span>
                            <div className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${isSelected ? 'bg-primary text-white' : 'bg-surface-container text-outline'}`}>
                              Room {s.room_number}
                            </div>
                          </div>
                          <div className="space-y-1.5">
                             <div className="flex justify-between text-[10px] font-bold text-outline">
                                <span>Load</span>
                                <span className={isSelected ? 'text-primary' : ''}>{s.current_bookings}/{s.max_patients}</span>
                             </div>
                             <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all duration-500 ${isSelected ? 'bg-primary' : 'bg-outline-variant'}`} 
                                  style={{ width: `${(s.current_bookings/s.max_patients)*100}%` }}
                                />
                             </div>
                          </div>
                          {isSelected && <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center shadow-md animate-in zoom-in"><span className="material-symbols-rounded text-sm">check</span></div>}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-outline-variant/30">
                    <span className="material-symbols-rounded text-outline/30 text-3xl mb-1">calendar_today</span>
                    <p className="text-xs font-bold text-outline uppercase tracking-widest">No sessions scheduled for this date</p>
                  </div>
                )}
              </div>

              {/* Consultation Details */}
              <div className="col-span-12 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-outline ml-1">Consultation Reason / Symptoms</label>
                <textarea 
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white px-5 py-4 rounded-2xl outline-none transition-all font-bold min-h-[80px]"
                  value={newAptForm.symptom}
                  onChange={(e) => updateNewAptField('symptom', e.target.value)}
                  placeholder="Describe the patient's condition briefly..."
                />
              </div>

              <div className="col-span-12 flex gap-4 pt-4 shrink-0">
                <button type="button" onClick={() => setShowNewAptModal(false)} className="flex-1 py-4 rounded-2xl font-bold text-outline hover:bg-slate-100 transition-all">Discard</button>
                <button type="submit" disabled={!newAptForm.doctor_session_id} className="flex-[2] py-4 rounded-2xl font-bold bg-primary text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale">
                  {loading ? 'Confirming Booking...' : 'Complete Patient Intake'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={showCancelConfirm}
        title="Cancel Appointment?"
        message="Are you sure you want to cancel this appointment? This slot will be made available for other patients."
        confirmText="Yes, Cancel It"
        cancelText="No, Keep It"
        onConfirm={handleConfirmCancel}
        onCancel={() => setShowCancelConfirm(false)}
        type="warning"
      />

      {/* Top-Level Reschedule Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-on-surface mb-2 font-display">Reschedule Appointment</h3>
            <p className="text-xs text-outline mb-6">Change the scheduled date for appointment {selectedApt?.id}</p>
            
            <div className="space-y-4 mb-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-outline">New Appointment Date</label>
                <input 
                  type="date"
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white px-4 py-3 rounded-xl outline-none font-bold"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setShowRescheduleModal(false)}
                className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-all text-sm"
              >
                Discard
              </button>
              <button 
                onClick={() => handleRescheduleSubmit(rescheduleDate)}
                className="flex-1 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/10 hover:scale-[1.01] transition-all text-sm"
              >
                Confirm Date
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Sliding Details Drawer */}
      {activeDetailsApt && (
        <div className="details-drawer-overlay" onClick={() => setActiveDetailsApt(null)}>
          <div className="details-drawer animate-in slide-in-from-right duration-300" onClick={(e) => e.stopPropagation()}>
            
            {/* Drawer Header */}
            <div className="p-8 border-b border-slate-100 bg-primary/5 flex justify-between items-center shrink-0">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-on-surface font-display">{activeDetailsApt.id}</h3>
                  <div className={`status-badge ${getStatusStyle(activeDetailsApt.status)}`}>
                    {activeDetailsApt.status}
                  </div>
                </div>
                <p className="text-xs text-outline font-semibold mt-1">Appointment Registration Profile</p>
              </div>
              <button 
                onClick={() => setActiveDetailsApt(null)} 
                className="w-10 h-10 rounded-full hover:bg-slate-200 transition-all flex items-center justify-center"
              >
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>

            {/* Drawer Body */}
            <div className="details-drawer-body">
              
              {/* Patient Profile Card */}
              <div className="details-card-section">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-outline mb-4">Patient Profile</h4>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center font-bold text-lg shadow-md shadow-primary/10">
                    {activeDetailsApt.patient ? activeDetailsApt.patient[0] : 'P'}
                  </div>
                  <div>
                    <h5 className="font-bold text-on-surface text-base">{activeDetailsApt.patient}</h5>
                    <p className="text-[10px] font-bold text-outline uppercase tracking-wider mt-0.5">ID: #PAT-{activeDetailsApt.patient_id || 'N/A'}</p>
                  </div>
                </div>
                <div className="space-y-2 border-t border-slate-200/50 pt-3">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-outline">NIC / Identity:</span>
                    <span className="font-black text-on-surface">{activeDetailsApt.patient_nic || 'Unregistered Walk-in'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-outline">Phone Number:</span>
                    <span className="font-black text-on-surface">{activeDetailsApt.patient_phone || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-outline">Email Address:</span>
                    <span className="font-black text-on-surface">{activeDetailsApt.patient_email || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Consultation Details */}
              <div className="details-card-section">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-outline mb-4">Consultation & Doctor</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-rounded text-primary text-lg mt-0.5">medical_information</span>
                    <div>
                      <p className="text-[10px] font-bold text-outline uppercase tracking-wider leading-none mb-1">Consultant</p>
                      <p className="text-xs font-black text-on-surface">{activeDetailsApt.dr}</p>
                      <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase">{activeDetailsApt.department} Wing</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-rounded text-secondary text-lg mt-0.5">calendar_today</span>
                    <div>
                      <p className="text-[10px] font-bold text-outline uppercase tracking-wider leading-none mb-1">Schedule & Slot</p>
                      <p className="text-xs font-black text-on-surface">{activeDetailsApt.date} at {activeDetailsApt.time}</p>
                      <p className="text-[10px] font-bold text-slate-500 mt-1">{activeDetailsApt.session} • {activeDetailsApt.room}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-rounded text-amber-500 text-lg mt-0.5">psychology</span>
                    <div>
                      <p className="text-[10px] font-bold text-outline uppercase tracking-wider leading-none mb-1">Stated Reason / Symptom</p>
                      <p className="text-xs font-bold text-slate-600 italic bg-white px-3 py-2 rounded-xl border border-slate-100 mt-1 leading-relaxed">{activeDetailsApt.type}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Official Payment Receipt Card */}
              <div className="official-receipt-box">
                {activeDetailsApt.payment_status === 'Paid' ? (
                  <div className="receipt-stamp-paid">
                    <span>PAID</span>
                  </div>
                ) : (
                  <div className="receipt-stamp-unpaid">
                    <span>UNPAID</span>
                  </div>
                )}
                
                <div className="text-center mb-4 border-b border-slate-200 pb-2">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-0.5">Official Payment Receipt</h4>
                  <p className="text-[9px] text-slate-400">MediAssist Healthcare Systems</p>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-500">Transaction Status:</span>
                    <span className={`font-black uppercase tracking-wider ${activeDetailsApt.payment_status === 'Paid' ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {activeDetailsApt.payment_status || 'Unpaid'}
                    </span>
                  </div>
                  {activeDetailsApt.payment_status === 'Paid' && (
                    <>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-500">Payment Method:</span>
                        <span className="font-black text-on-surface">{activeDetailsApt.payment_method || 'Card'}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-500">Transaction ID:</span>
                        <span className="font-mono font-bold text-slate-600">{activeDetailsApt.payment_txn_id || 'TXN-N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-500">Payment Date:</span>
                        <span className="font-black text-on-surface">{activeDetailsApt.payment_date}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="border-t border-dashed border-slate-300 pt-3 mb-3 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">Consultation Fee:</span>
                    <span className="font-bold text-on-surface">Rs. {(activeDetailsApt.payment_amount ? activeDetailsApt.payment_amount - 500 : 4500).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">Hospital Service Charge:</span>
                    <span className="font-bold text-on-surface">Rs. 500</span>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-3 flex justify-between items-end">
                  <div>
                    <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest">Billing Currency</span>
                    <span className="text-[10px] font-bold text-slate-500">LKR (Lankan Rupee)</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[8px] font-bold text-primary uppercase tracking-widest mb-0.5">Total Amount</span>
                    <span className="text-base font-black text-primary">Rs. {(activeDetailsApt.payment_amount || 5000).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Inline Rescheduling Form inside drawer */}
              {isReschedulingInline && (
                <div className="mt-6 p-5 bg-primary/5 rounded-[2rem] border border-primary/20 animate-in slide-in-from-top-4 duration-300">
                  <h4 className="text-xs font-black uppercase tracking-widest text-primary mb-3">Reschedule Date</h4>
                  <div className="space-y-3">
                    <input 
                      type="date"
                      className="w-full bg-white border border-outline-variant/30 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-primary"
                      value={rescheduleDate}
                      onChange={(e) => setRescheduleDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <div className="flex gap-2">
                      <button 
                        onClick={async () => {
                          if (!rescheduleDate) return;
                          try {
                            setLoading(true);
                            await apiService.rescheduleAppointment(activeDetailsApt.raw_id, rescheduleDate);
                            fetchAppointments();
                            setActiveDetailsApt(prev => ({ ...prev, date: rescheduleDate }));
                            setIsReschedulingInline(false);
                          } catch (e) {
                            alert("Failed to reschedule appointment.");
                          } finally {
                            setLoading(false);
                          }
                        }}
                        className="flex-1 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-md"
                      >
                        Confirm Reschedule
                      </button>
                      <button 
                        onClick={() => setIsReschedulingInline(false)}
                        className="px-4 py-2 bg-slate-200 text-slate-600 text-xs font-bold rounded-xl"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-8 border-t border-slate-100 bg-slate-50 flex gap-3 shrink-0">
              {activeDetailsApt.status !== 'Cancelled' && activeDetailsApt.status !== 'Completed' && (
                <>
                  <button 
                    onClick={() => {
                      setRescheduleDate(activeDetailsApt.date);
                      setIsReschedulingInline(true);
                    }}
                    className="flex-1 py-3 border border-primary/30 text-primary hover:bg-primary/5 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-rounded text-sm">calendar_clock</span>
                    Reschedule
                  </button>
                  <button 
                    onClick={() => {
                      handleCancelClick(activeDetailsApt.raw_id);
                      setActiveDetailsApt(null);
                    }}
                    className="flex-1 py-3 border border-red-200 text-red-500 hover:bg-red-50 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-rounded text-sm">cancel</span>
                    Cancel Appt
                  </button>
                </>
              )}
              {activeDetailsApt.payment_status === 'Paid' && (
                <button 
                  onClick={() => {
                    alert(`Printing Receipt for Transaction ${activeDetailsApt.payment_txn_id}...`);
                    window.print();
                  }}
                  className="flex-1 py-3 bg-slate-900 text-white hover:bg-slate-800 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-rounded text-sm">print</span>
                  Print Receipt
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAppointments;
