import { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import './AdminPatients.css';

const AdminPatients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showApptModal, setShowApptModal] = useState(false);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setError(null);
        setLoading(true);
        console.log("Fetching patients...");
        const data = await apiService.getPatients();
        console.log("Patients data received:", data);
        setPatients(data);
      } catch (err) {
        console.error("Failed to fetch patients:", err);
        setError(err.message || "Could not connect to the healthcare server. Please ensure the backend is running.");
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const handleCheckIn = async (patient) => {
    try {
      const result = await apiService.checkInPatient(patient.id);
      alert(`Successfully checked in ${patient.name}!\nQueue Number: A-${result.queue_number.toString().padStart(2, '0')}\nDoctor: ${result.doctor}`);
      // Refresh to update badge/status if needed
      apiService.getPatients().then(setPatients);
    } catch (err) {
      console.error("Check-in failed:", err);
      alert(err.response?.data?.message || "Check-in failed. Patient might not have an appointment for today.");
    }
  };

  const handleCheckOut = async (patient) => {
    try {
      await apiService.checkOutPatient(patient.id);
      alert(`${patient.name} has been checked out successfully.`);
      apiService.getPatients().then(setPatients);
    } catch (err) {
      console.error("Check-out failed:", err);
      alert(err.response?.data?.message || "Check-out failed. No active session found.");
    }
  };

  const handleDelete = async (patient) => {
    if (window.confirm(`Are you sure you want to permanently delete records for ${patient.name}?\nThis will also remove their appointment history.`)) {
      try {
        await apiService.deletePatient(patient.id);
        setPatients(patients.filter(p => p.id !== patient.id));
      } catch (err) {
        console.error("Delete failed:", err);
        alert("Failed to delete patient record.");
      }
    }
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.nic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.formatted_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toString().includes(searchTerm)
  );

  return (
    <div className="patients-wrapper admin-page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold font-display text-on-surface tracking-tight">Patient Records</h2>
          <p className="text-sm text-on-surface-variant mt-1 font-medium">Digital health identity management and clinical history.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-primary text-white px-8 py-3.5 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
          <span className="material-symbols-rounded">person_add_alt</span>
          Register New Patient
        </button>
      </div>

      <div className="patient-search-bar group">
        <span className="material-symbols-rounded text-outline group-focus-within:text-primary transition-colors text-2xl">search</span>
        <input 
          type="text" 
          placeholder="Search by Name, NIC, Token, or Phone Number..." 
          className="search-input-field"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="bg-surface-container hover:bg-primary/10 hover:text-primary transition-all p-2.5 rounded-xl">
          <span className="material-symbols-rounded">filter_alt</span>
        </button>
      </div>

      <div className="patient-grid">
        {loading ? (
          <div className="col-span-full py-20 text-center">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-outline font-bold uppercase tracking-widest text-xs">Synchronizing patient records...</p>
          </div>
        ) : error ? (
          <div className="col-span-full py-20 text-center bg-red-50 rounded-[2rem] border-2 border-dashed border-red-200">
            <span className="material-symbols-rounded text-5xl text-red-300 mb-4">error_outline</span>
            <p className="text-red-600 font-bold mb-2">Sync Failure</p>
            <p className="text-red-400 text-sm max-w-xs mx-auto">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-6 px-6 py-2 bg-red-600 text-white rounded-full text-xs font-bold shadow-lg shadow-red-200 hover:scale-105 transition-transform"
            >
              Retry Connection
            </button>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-surface-container-low rounded-[2rem] border-2 border-dashed border-outline-variant/30">
            <span className="material-symbols-rounded text-5xl text-outline/30 mb-4">{searchTerm ? 'search_off' : 'person_off'}</span>
            <p className="text-on-surface-variant font-bold">{searchTerm ? `No results for "${searchTerm}"` : 'No patient records found'}</p>
          </div>
        ) : (
          filteredPatients.map((patient, idx) => (
            <div key={idx} className="patient-card-modern group">
              <div className="card-header">
                <div className="patient-avatar-box">
                  <div className="avatar-circle">
                    {patient.name.charAt(0)}
                  </div>
                  <div className="id-tag">{patient.formatted_id}</div>
                </div>
                <div className="badge-status">
                  <span className="pulse-dot"></span>
                  ACTIVE PATIENT
                </div>
              </div>

              <div className="card-content">
                <h3 className="patient-name-text">{patient.name}</h3>
                
                <div className="info-mini-grid">
                  <div className="mini-info-item">
                    <span className="label">AGE / SEX</span>
                    <span className="value">{patient.age}Y • {patient.gender}</span>
                  </div>
                  <div className="mini-info-item">
                    <span className="label">BLOOD TYPE</span>
                    <span className="value-highlight">{patient.blood_type || 'N/A'}</span>
                  </div>
                  <div className="mini-info-item">
                    <span className="label">LAST VISIT</span>
                    <span className="value">{patient.last_visit || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="card-actions-refined">
                <div className="action-row-main">
                  <button onClick={() => { setSelectedPatient(patient); setShowHistoryModal(true); }} className="btn-icon-label secondary" title="View History">
                    <span className="material-symbols-rounded">history</span>
                    HISTORY
                  </button>
                  <button onClick={() => { setSelectedPatient(patient); setShowEditModal(true); }} className="btn-icon-label secondary" title="Edit Profile">
                    <span className="material-symbols-rounded">edit</span>
                    EDIT
                  </button>
                </div>
                
                <div className="action-row-primary">
                  <button onClick={() => handleCheckIn(patient)} className="btn-action checkin">
                    <span className="material-symbols-rounded">login</span>
                    CHECK-IN
                  </button>
                  <button onClick={() => handleCheckOut(patient)} className="btn-action checkout">
                    <span className="material-symbols-rounded">logout</span>
                    CHECK-OUT
                  </button>
                </div>

                <div className="action-row-bottom">
                  <button onClick={() => { setSelectedPatient(patient); setShowApptModal(true); }} className="btn-book-appt">
                    <span className="material-symbols-rounded">calendar_add_on</span>
                    BOOK APPOINTMENT
                  </button>
                  <button onClick={() => handleDelete(patient)} className="btn-delete" title="Delete Patient Record">
                    <span className="material-symbols-rounded">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <PatientModal 
          onClose={() => setShowModal(false)} 
          onSuccess={() => {
            setShowModal(false);
            apiService.getPatients().then(setPatients);
          }}
        />
      )}

      {showEditModal && selectedPatient && (
        <PatientModal 
          mode="edit"
          patient={selectedPatient}
          onClose={() => setShowEditModal(false)} 
          onSuccess={() => {
            setShowEditModal(false);
            apiService.getPatients().then(setPatients);
          }}
        />
      )}

      {showHistoryModal && selectedPatient && (
        <HistoryModal 
          patient={selectedPatient}
          onClose={() => setShowHistoryModal(false)} 
        />
      )}

      {showApptModal && selectedPatient && (
        <AppointmentModal 
          patient={selectedPatient}
          onClose={() => setShowApptModal(false)} 
          onSuccess={() => setShowApptModal(false)}
        />
      )}
    </div>
  );
};

const PatientModal = ({ onClose, onSuccess, mode = 'create', patient = null }) => {
  const [formData, setFormData] = useState({
    full_name: patient?.name || '',
    phone_number: patient?.phone || '',
    email: patient?.email || '',
    age: patient?.age || '',
    gender: patient?.gender || 'Male',
    nic: patient?.nic || '',
    address: patient?.address || '',
    blood_type: patient?.blood_type || 'O+',
    medical_history: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'edit') {
        await apiService.updatePatient(patient.id, formData);
      } else {
        await apiService.createPatient(formData);
      }
      onSuccess();
    } catch (err) {
      console.error(`Failed to ${mode} patient:`, err);
      alert(`${mode === 'edit' ? 'Update' : 'Registration'} failed. Please check your data.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-2xl font-bold text-on-surface font-display">{mode === 'edit' ? 'Edit Patient Info' : 'New Patient Registration'}</h3>
            <p className="text-sm text-on-surface-variant font-medium">{mode === 'edit' ? `Updating records for ${patient.name}` : 'Enter patient details for digital identity.'}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-slate-200 transition-colors flex items-center justify-center text-outline">
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2 space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-outline ml-1">Full Name</label>
              <input 
                required
                className="w-full bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white px-5 py-3.5 rounded-2xl outline-none transition-all font-medium"
                value={formData.full_name}
                onChange={e => setFormData({...formData, full_name: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-outline ml-1">Phone Number</label>
              <input 
                className="w-full bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white px-5 py-3.5 rounded-2xl outline-none transition-all font-medium"
                value={formData.phone_number}
                onChange={e => setFormData({...formData, phone_number: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-outline ml-1">NIC Number</label>
              <input 
                className="w-full bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white px-5 py-3.5 rounded-2xl outline-none transition-all font-medium"
                value={formData.nic}
                onChange={e => setFormData({...formData, nic: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-outline ml-1">Age</label>
              <input 
                type="number"
                className="w-full bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white px-5 py-3.5 rounded-2xl outline-none transition-all font-medium"
                value={formData.age}
                onChange={e => setFormData({...formData, age: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-outline ml-1">Gender</label>
              <select 
                className="w-full bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white px-5 py-3.5 rounded-2xl outline-none transition-all font-medium appearance-none"
                value={formData.gender}
                onChange={e => setFormData({...formData, gender: e.target.value})}
              >
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-outline ml-1">Blood Type</label>
              <select 
                className="w-full bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white px-5 py-3.5 rounded-2xl outline-none transition-all font-medium appearance-none"
                value={formData.blood_type}
                onChange={e => setFormData({...formData, blood_type: e.target.value})}
              >
                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(type => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-outline ml-1">Email</label>
              <input 
                type="email"
                className="w-full bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white px-5 py-3.5 rounded-2xl outline-none transition-all font-medium"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div className="col-span-2 space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-outline ml-1">Address</label>
              <textarea 
                className="w-full bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white px-5 py-3.5 rounded-2xl outline-none transition-all font-medium resize-none h-20"
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl font-bold text-outline hover:bg-slate-100 transition-all">
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-[2] py-4 rounded-2xl font-bold bg-primary text-white shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-50 transition-all">
              {loading ? (mode === 'edit' ? 'Updating...' : 'Registering...') : (mode === 'edit' ? 'Save Changes' : 'Complete Registration')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const HistoryModal = ({ patient, onClose }) => {
  const [history, setHistory] = useState({ appointments: [], queue: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await apiService.getPatientHistory(patient.id);
        setHistory(data);
      } catch (err) {
        console.error("Failed to fetch history:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [patient.id]);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div>
            <h3 className="text-2xl font-bold text-on-surface font-display">Medical Journey: {patient.name}</h3>
            <p className="text-sm text-on-surface-variant font-medium">Tracking all visits, queue entries, and clinical interactions.</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-slate-200 transition-colors flex items-center justify-center text-outline">
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
          {loading ? (
            <div className="py-20 text-center">
              <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-outline font-bold uppercase tracking-widest text-xs">Retrieving patient history...</p>
            </div>
          ) : (
            <>
              <section>
                <div className="flex items-center gap-3 mb-5">
                  <span className="material-symbols-rounded text-primary bg-primary/10 p-2 rounded-xl">calendar_month</span>
                  <h4 className="text-lg font-bold text-on-surface font-display">Appointment History</h4>
                </div>
                <div className="grid gap-3">
                  {history.appointments.length === 0 ? (
                    <p className="text-sm text-outline italic p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">No past appointments recorded.</p>
                  ) : (
                    history.appointments.map(appt => (
                      <div key={appt.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-primary/20 transition-all">
                        <div className="flex gap-5 items-center">
                          <div className="w-12 h-12 rounded-xl bg-white flex flex-col items-center justify-center border border-slate-100 shadow-sm">
                            <span className="text-[10px] font-black text-primary uppercase leading-none">{appt.date.split('-')[1]}</span>
                            <span className="text-lg font-black text-on-surface leading-none mt-0.5">{appt.date.split('-')[2]}</span>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-on-surface">{appt.specialist}</p>
                            <p className="text-[11px] font-bold text-outline uppercase tracking-wider">{appt.department}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            appt.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {appt.status}
                          </span>
                          <p className="text-[11px] text-outline mt-1 font-medium">{appt.symptom}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <div className="grid grid-cols-2 gap-8">
                <section>
                  <div className="flex items-center gap-3 mb-5">
                    <span className="material-symbols-rounded text-amber-600 bg-amber-50 p-2 rounded-xl">clinical_notes</span>
                    <h4 className="text-lg font-bold text-on-surface font-display">Recommended Specialist</h4>
                  </div>
                  <div className="p-6 bg-amber-50/50 rounded-[2rem] border border-amber-100">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-amber-200 flex items-center justify-center text-amber-800 font-black">AI</div>
                      <div>
                        <p className="text-sm font-bold text-on-surface">Neurology (Dr. Samantha)</p>
                        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Based on symptom history</p>
                      </div>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Patient has mentioned recurring migraines. Recommendation: Consultation with Neurology department for a comprehensive neurological screening.
                    </p>
                  </div>
                </section>

                <section>
                  <div className="flex items-center gap-3 mb-5">
                    <span className="material-symbols-rounded text-rose-600 bg-rose-50 p-2 rounded-xl">forum</span>
                    <h4 className="text-lg font-bold text-on-surface font-display">Complaints & Feedback</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Complaint</span>
                        <span className="text-[10px] font-bold text-outline">2024-04-10</span>
                      </div>
                      <p className="text-xs font-medium text-on-surface">Long waiting time at the pharmacy counter during last visit.</p>
                    </div>
                  </div>
                </section>
              </div>

              <section>
                <div className="flex items-center gap-3 mb-5">
                  <span className="material-symbols-rounded text-secondary bg-secondary/10 p-2 rounded-xl">list_alt</span>
                  <h4 className="text-lg font-bold text-on-surface font-display">Queue & Activity Logs</h4>
                </div>
                <div className="grid gap-3">
                  {history.queue.length === 0 ? (
                    <p className="text-sm text-outline italic p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">No queue logs found.</p>
                  ) : (
                    history.queue.map(q => (
                      <div key={q.id} className="flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-100 shadow-sm border-l-4 border-l-secondary">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-black text-secondary uppercase tracking-widest">{q.token}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span className="text-[10px] font-bold text-outline uppercase tracking-wider">{q.status}</span>
                          </div>
                          <p className="text-sm font-bold text-on-surface">Visited {q.specialist}</p>
                        </div>
                        <p className="text-xs font-bold text-outline">{q.created_at}</p>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const AppointmentModal = ({ patient, onClose, onSuccess }) => {
  const [specialists, setSpecialists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    specialist_id: '',
    symptom: '',
    appointment_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    apiService.getSpecialists().then(data => {
      setSpecialists(data);
      if (data.length > 0) setFormData(prev => ({ ...prev, specialist_id: data[0].id }));
      setLoading(false);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiService.bookAppointment({
        patient_id: patient.id,
        ...formData
      });
      onSuccess();
    } catch (err) {
      console.error("Booking error:", err);
      alert("Failed to book appointment.");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="p-8 border-b border-slate-100 bg-primary/5">
          <h3 className="text-2xl font-bold text-on-surface font-display">Quick Booking</h3>
          <p className="text-sm text-on-surface-variant font-medium">Schedule appointment for <strong>{patient.name}</strong></p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-outline ml-1">Select Doctor</label>
            <select 
              className="w-full bg-slate-50 border-none px-5 py-4 rounded-2xl outline-none font-bold text-sm appearance-none"
              value={formData.specialist_id}
              onChange={e => setFormData({...formData, specialist_id: e.target.value})}
            >
              {specialists.map(s => (
                <option key={s.id} value={s.id}>Dr. {s.name} ({s.department})</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-outline ml-1">Visit Date</label>
            <input 
              type="date"
              className="w-full bg-slate-50 border-none px-5 py-4 rounded-2xl outline-none font-bold text-sm"
              value={formData.appointment_date}
              onChange={e => setFormData({...formData, appointment_date: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-outline ml-1">Primary Symptom</label>
            <input 
              placeholder="e.g. Fever, Routine checkup"
              className="w-full bg-slate-50 border-none px-5 py-4 rounded-2xl outline-none font-bold text-sm"
              value={formData.symptom}
              onChange={e => setFormData({...formData, symptom: e.target.value})}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-4 rounded-2xl font-bold text-outline hover:bg-slate-100 transition-all">Cancel</button>
            <button type="submit" className="flex-[2] py-4 rounded-2xl font-bold bg-primary text-white shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all">Book Now</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminPatients;
