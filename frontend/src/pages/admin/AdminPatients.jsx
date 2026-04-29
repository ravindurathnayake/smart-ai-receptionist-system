import { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import { useAdminSearch } from '../../context/AdminSearchContext';
import { socketService } from '../../services/socketService';
import ConfirmModal from '../../components/common/ConfirmModal';
import './AdminPatients.css';

const AdminPatients = () => {
  const { searchQuery } = useAdminSearch();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showApptModal, setShowApptModal] = useState(false);
  const [showMedicalModal, setShowMedicalModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState(null);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setError(null);
        setLoading(true);
        const data = await apiService.getPatients();
        setPatients(data);
      } catch (err) {
        console.error("Failed to fetch patients:", err);
        setError(err.message || "Could not connect to the healthcare server. Please ensure the backend is running.");
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();

    // REAL-TIME LISTENERS
    socketService.on('patient_created', (data) => {
      console.log("New patient registered in real-time:", data);
      fetchPatients();
    });

    socketService.on('patient_updated', (data) => {
      console.log("Patient updated in real-time:", data);
      fetchPatients();
    });

    socketService.on('patient_deleted', (data) => {
      console.log("Patient deleted in real-time:", data);
      fetchPatients();
    });

    return () => {
      socketService.off('patient_created');
      socketService.off('patient_updated');
      socketService.off('patient_deleted');
    };
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

  const handleDeleteClick = (patient) => {
    setPatientToDelete(patient);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!patientToDelete) return;
    try {
      await apiService.deletePatient(patientToDelete.id);
      setPatients(patients.filter(p => p.id !== patientToDelete.id));
      setShowDeleteConfirm(false);
      setPatientToDelete(null);
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete patient record.");
    }
  };

  const filteredPatients = patients.filter(p => {
    const term = searchQuery.toLowerCase();
    return (
      (p.name || "").toLowerCase().includes(term) ||
      (p.nic || "").toLowerCase().includes(term) ||
      (p.phone || "").toLowerCase().includes(term) ||
      (p.phone_number || "").toLowerCase().includes(term) ||
      (p.guardian_nic || "").toLowerCase().includes(term) ||
      (p.guardian_phone || "").toLowerCase().includes(term) ||
      (p.guardian_name || "").toLowerCase().includes(term) ||
      (p.formatted_id || "").toLowerCase().includes(term) ||
      (p.id || "").toString().includes(term)
    );
  });

  return (
    <div className="patients-wrapper admin-page-transition">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold font-display text-on-surface tracking-tight">Patient Records</h2>
            <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-[10px] font-black border border-green-100 shadow-sm">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              LIVE SYNC
            </div>
          </div>
          <p className="text-sm text-on-surface-variant mt-1 font-medium">Digital health identity management and clinical history.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-primary text-white px-8 py-3.5 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
          <span className="material-symbols-rounded">person_add_alt</span>
          Register New Patient
        </button>
      </div>

      <div className="h-8"></div> {/* Spacer replaces redundant search bar */}

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
            <span className="material-symbols-rounded text-5xl text-outline/30 mb-4">{searchQuery ? 'search_off' : 'person_off'}</span>
            <p className="text-on-surface-variant font-bold">{searchQuery ? `No results for "${searchQuery}"` : 'No patient records found'}</p>
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
                <div className="badge-status-container">
                  <div className="badge-status">
                    <span className="pulse-dot"></span>
                    {patient.nic ? 'ADULT PATIENT' : 'MINOR / CHILD'}
                  </div>
                  {patient.guardian_name && (
                    <div className="guardian-tag">
                      <span className="material-symbols-rounded text-[10px]">family_restroom</span>
                      Guardian: {patient.guardian_name}
                    </div>
                  )}
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
                  <button onClick={() => { setSelectedPatient(patient); setShowMedicalModal(true); }} className="btn-icon-label secondary" title="Add Medical Record">
                    <span className="material-symbols-rounded">description</span>
                    MEDICAL
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
                  <button onClick={() => handleDeleteClick(patient)} className="btn-delete" title="Delete Patient Record">
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

      {showMedicalModal && selectedPatient && (
        <MedicalRecordsModal 
          patient={selectedPatient}
          onClose={() => setShowMedicalModal(false)} 
          onSuccess={() => setShowMedicalModal(false)}
        />
      )}

      <ConfirmModal 
        isOpen={showDeleteConfirm}
        title="Delete Patient Record?"
        message={`Are you sure you want to permanently delete records for ${patientToDelete?.name}? This action cannot be undone and will remove all medical history.`}
        confirmText="Delete Permanently"
        cancelText="Keep Record"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        type="danger"
      />
    </div>
  );
};

const PatientModal = ({ onClose, onSuccess, mode = 'create', patient = null }) => {
  const calculateAge = (dobString) => {
    if (!dobString) return 0;
    const today = new Date();
    const birthDate = new Date(dobString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const [formData, setFormData] = useState({
    full_name: patient?.full_name || patient?.name || '',
    phone_number: patient?.phone_number || patient?.phone || '',
    email: patient?.email || '',
    dob: patient?.dob || '',
    age: patient?.age || '',
    gender: patient?.gender || 'Male',
    nic: patient?.nic || '',
    address: patient?.address || '',
    blood_type: patient?.blood_type || 'O+',
    medical_history: '',
    guardian_name: patient?.guardian_name || '',
    guardian_nic: patient?.guardian_nic || '',
    guardian_phone: patient?.guardian_phone || '',
    guardian_relationship: patient?.guardian_relationship || 'Father'
  });
  const [loading, setLoading] = useState(false);

  const isFormValid = () => {
    const calculatedAge = calculateAge(formData.dob);
    const basicValid = formData.full_name.trim() !== '' && formData.dob !== '' && formData.gender !== '';
    const isMinor = calculatedAge > 0 && calculatedAge < 18;

    if (isMinor) {
      return (
        basicValid &&
        formData.guardian_name.trim() !== '' &&
        formData.guardian_nic.trim() !== '' &&
        formData.guardian_phone.trim() !== '' &&
        formData.guardian_relationship !== ''
      );
    } else {
      return basicValid && formData.phone_number.trim() !== '' && formData.nic.trim() !== '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        age: calculateAge(formData.dob)
      };
      if (mode === 'edit') {
        await apiService.updatePatient(patient.id, payload);
      } else {
        await apiService.createPatient(payload);
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

            {(formData.dob === '' || calculateAge(formData.dob) >= 18) && (
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-outline ml-1">NIC Number</label>
                <input 
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white px-5 py-3.5 rounded-2xl outline-none transition-all font-medium"
                  placeholder="Patient NIC"
                  value={formData.nic}
                  onChange={e => setFormData({...formData, nic: e.target.value})}
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-outline ml-1">Date of Birth</label>
              <input 
                type="date"
                className="w-full bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white px-5 py-3.5 rounded-2xl outline-none transition-all font-medium"
                value={formData.dob}
                onChange={e => {
                  const newDob = e.target.value;
                  setFormData({...formData, dob: newDob, age: calculateAge(newDob)});
                }}
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
                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', "Don't Know"].map(type => (
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

            {formData.dob !== '' && calculateAge(formData.dob) < 18 && (
              <div className="col-span-2 grid grid-cols-2 gap-6 bg-primary/5 p-6 rounded-3xl border border-primary/10 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="col-span-2">
                  <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">Guardian Information (Required)</h4>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-outline ml-1">Guardian Name</label>
                  <input 
                    className="w-full bg-white border-2 border-transparent focus:border-primary/20 px-5 py-3.5 rounded-2xl outline-none transition-all font-medium"
                    value={formData.guardian_name}
                    onChange={e => setFormData({...formData, guardian_name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-outline ml-1">Guardian NIC</label>
                  <input 
                    className="w-full bg-white border-2 border-transparent focus:border-primary/20 px-5 py-3.5 rounded-2xl outline-none transition-all font-medium"
                    value={formData.guardian_nic}
                    onChange={e => setFormData({...formData, guardian_nic: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-outline ml-1">Guardian Phone</label>
                  <input 
                    className="w-full bg-white border-2 border-transparent focus:border-primary/20 px-5 py-3.5 rounded-2xl outline-none transition-all font-medium"
                    value={formData.guardian_phone}
                    onChange={e => setFormData({...formData, guardian_phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-outline ml-1">Relationship</label>
                  <select 
                    className="w-full bg-white border-2 border-transparent focus:border-primary/20 px-5 py-3.5 rounded-2xl outline-none transition-all font-medium appearance-none"
                    value={formData.guardian_relationship}
                    onChange={e => setFormData({...formData, guardian_relationship: e.target.value})}
                  >
                    <option>Father</option>
                    <option>Mother</option>
                    <option>Guardian</option>
                  </select>
                </div>
              </div>
            )}

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
              disabled={loading || !isFormValid()}
              className="flex-[2] py-4 rounded-2xl font-bold bg-primary text-white shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-50 disabled:grayscale transition-all">
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
  const [medical, setMedical] = useState({ prescriptions: [], labReports: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [historyData, presData, labData] = await Promise.all([
          apiService.getPatientHistory(patient.id),
          apiService.getPrescriptions(patient.id),
          apiService.getLabReports(patient.id)
        ]);
        setHistory(historyData);
        setMedical({ prescriptions: presData, labReports: labData });
      } catch (err) {
        console.error("Failed to fetch history:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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
                    <span className="material-symbols-rounded text-indigo-600 bg-indigo-50 p-2 rounded-xl">prescriptions</span>
                    <h4 className="text-lg font-bold text-on-surface font-display">Prescriptions</h4>
                  </div>
                  <div className="space-y-3">
                    {medical.prescriptions.length === 0 ? (
                      <p className="text-xs text-outline italic p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">No prescriptions recorded.</p>
                    ) : (
                      medical.prescriptions.map(p => (
                        <div key={p.id} className="p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{p.date}</span>
                            <span className="text-[10px] font-bold text-outline">Dr. {p.doctor_name}</span>
                          </div>
                          <p className="text-sm font-bold text-on-surface">{p.medications}</p>
                          {p.instructions && <p className="text-[11px] text-on-surface-variant mt-1 italic">{p.instructions}</p>}
                        </div>
                      ))
                    )}
                  </div>
                </section>

                <section>
                  <div className="flex items-center gap-3 mb-5">
                    <span className="material-symbols-rounded text-teal-600 bg-teal-50 p-2 rounded-xl">lab_research</span>
                    <h4 className="text-lg font-bold text-on-surface font-display">Lab Reports</h4>
                  </div>
                  <div className="space-y-3">
                    {medical.labReports.length === 0 ? (
                      <p className="text-xs text-outline italic p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">No lab reports found.</p>
                    ) : (
                      medical.labReports.map(r => (
                        <div key={r.id} className="p-4 bg-teal-50/30 rounded-2xl border border-teal-100">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest">{r.date}</span>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${r.status === 'Completed' ? 'bg-teal-100 text-teal-700' : 'bg-amber-100 text-amber-700'}`}>{r.status}</span>
                          </div>
                          <p className="text-sm font-bold text-on-surface">{r.test_name}</p>
                          {r.result_summary && <p className="text-[11px] text-on-surface-variant mt-1">{r.result_summary}</p>}
                        </div>
                      ))
                    )}
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

              <section>
                <div className="flex items-center gap-3 mb-5">
                  <span className="material-symbols-rounded text-rose-600 bg-rose-50 p-2 rounded-xl">rate_review</span>
                  <h4 className="text-lg font-bold text-on-surface font-display">Reviews & Complaints</h4>
                </div>
                <div className="space-y-4">
                  {history.appointments.filter(a => a.has_review).length === 0 ? (
                    <p className="text-sm text-outline italic p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">No feedback received from this patient yet.</p>
                  ) : (
                    history.appointments.filter(a => a.has_review).map(appt => (
                      <div key={`rev-${appt.id}`} className={`p-6 rounded-[2rem] border ${appt.review.is_complaint ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map(star => (
                                <span key={star} className={`material-symbols-rounded text-sm ${appt.review.rating >= star ? 'text-yellow-500' : 'text-slate-200'}`} style={{ fontVariationSettings: appt.review.rating >= star ? "'FILL' 1" : "" }}>star</span>
                              ))}
                            </div>
                            <span className="text-[10px] font-black text-outline uppercase tracking-widest">{appt.date}</span>
                          </div>
                          {appt.review.is_complaint && (
                            <span className="px-3 py-1 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-sm">FORMAL COMPLAINT</span>
                          )}
                        </div>
                        <p className="text-sm font-bold text-on-surface mb-2">Visit to {appt.specialist}</p>
                        <p className="text-xs text-on-surface-variant italic leading-relaxed">"{appt.review.comment}"</p>
                        {appt.review.complaint && (
                          <div className="mt-4 p-4 bg-white/60 rounded-2xl border border-red-200">
                            <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Complaint Details:</p>
                            <p className="text-xs font-medium text-red-800">{appt.review.complaint}</p>
                          </div>
                        )}
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

const MedicalRecordsModal = ({ patient, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState('prescription');
  const [loading, setLoading] = useState(false);
  const [pData, setPData] = useState({ doctor_name: '', medications: '', instructions: '', attachment: '' });
  const [lData, setLData] = useState({ test_name: '', result_summary: '', status: 'Completed', attachment: '' });
  const [fileName, setFileName] = useState('');

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'prescription') {
          setPData({ ...pData, attachment: reader.result });
        } else {
          setLData({ ...lData, attachment: reader.result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePrescriptionSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiService.addPrescription({ patient_id: patient.id, ...pData });
      alert("Prescription added successfully!");
      onSuccess();
    } catch (err) {
      console.error("Prescription error:", err);
      alert("Failed to add prescription: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleLabSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiService.addLabReport({ patient_id: patient.id, ...lData });
      alert("Lab report added successfully!");
      onSuccess();
    } catch (err) {
      console.error("Lab report error:", err);
      alert("Failed to add lab report: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-on-surface font-display">Add Medical Record</h3>
            <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-slate-200 transition-colors flex items-center justify-center text-outline">
              <span className="material-symbols-rounded">close</span>
            </button>
          </div>
          <p className="text-sm text-on-surface-variant font-medium mt-1">Patient: <strong>{patient.name}</strong></p>
          
          <div className="flex gap-2 mt-6 p-1 bg-slate-200/50 rounded-xl">
            <button 
              onClick={() => setActiveTab('prescription')}
              className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'prescription' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}>
              Prescription
            </button>
            <button 
              onClick={() => setActiveTab('lab')}
              className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'lab' ? 'bg-white text-secondary shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}>
              Lab Report
            </button>
          </div>
        </div>

        <div className="p-8">
          {activeTab === 'prescription' ? (
            <form onSubmit={handlePrescriptionSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-outline ml-1">Doctor Name</label>
                <input 
                  required
                  className="w-full bg-slate-50 border-none px-5 py-4 rounded-2xl outline-none font-bold text-sm"
                  placeholder="e.g. Dr. Smith"
                  value={pData.doctor_name}
                  onChange={e => setPData({...pData, doctor_name: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-outline ml-1">Medications</label>
                <textarea 
                  required
                  className="w-full bg-slate-50 border-none px-5 py-4 rounded-2xl outline-none font-bold text-sm h-24 resize-none"
                  placeholder="List medications here..."
                  value={pData.medications}
                  onChange={e => setPData({...pData, medications: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-outline ml-1">Special Instructions</label>
                <input 
                  className="w-full bg-slate-50 border-none px-5 py-4 rounded-2xl outline-none font-bold text-sm"
                  placeholder="Take after meals..."
                  value={pData.instructions}
                  onChange={e => setPData({...pData, instructions: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-outline ml-1">Attach Prescription Image/File</label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 flex items-center justify-center gap-2 py-4 bg-slate-100 hover:bg-slate-200 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer transition-all">
                    <span className="material-symbols-rounded text-slate-500">upload_file</span>
                    <span className="text-xs font-bold text-slate-600">{fileName || 'Choose File...'}</span>
                    <input type="file" className="hidden" accept="image/*,application/pdf" onChange={(e) => handleFileChange(e, 'prescription')} />
                  </label>
                  {pData.attachment && (
                    <button type="button" onClick={() => {setPData({...pData, attachment: ''}); setFileName('');}} className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center hover:bg-red-100 transition-colors">
                      <span className="material-symbols-rounded">delete</span>
                    </button>
                  )}
                </div>
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 rounded-2xl font-bold bg-primary text-white shadow-lg shadow-primary/20 hover:scale-[1.01] transition-all disabled:opacity-50 mt-4">
                {loading ? 'Adding...' : 'Save Prescription'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLabSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-outline ml-1">Test Name</label>
                <input 
                  required
                  className="w-full bg-slate-50 border-none px-5 py-4 rounded-2xl outline-none font-bold text-sm"
                  placeholder="e.g. Full Blood Count"
                  value={lData.test_name}
                  onChange={e => setLData({...lData, test_name: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-outline ml-1">Result Summary</label>
                <textarea 
                  className="w-full bg-slate-50 border-none px-5 py-4 rounded-2xl outline-none font-bold text-sm h-24 resize-none"
                  placeholder="Enter key findings..."
                  value={lData.result_summary}
                  onChange={e => setLData({...lData, result_summary: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-outline ml-1">Report Status</label>
                <select 
                  className="w-full bg-slate-50 border-none px-5 py-4 rounded-2xl outline-none font-bold text-sm appearance-none"
                  value={lData.status}
                  onChange={e => setLData({...lData, status: e.target.value})}
                >
                  <option>Completed</option>
                  <option>Pending</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-outline ml-1">Attach Lab Report Image/File</label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 flex items-center justify-center gap-2 py-4 bg-slate-100 hover:bg-slate-200 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer transition-all">
                    <span className="material-symbols-rounded text-slate-500">upload_file</span>
                    <span className="text-xs font-bold text-slate-600">{fileName || 'Choose File...'}</span>
                    <input type="file" className="hidden" accept="image/*,application/pdf" onChange={(e) => handleFileChange(e, 'lab')} />
                  </label>
                  {lData.attachment && (
                    <button type="button" onClick={() => {setLData({...lData, attachment: ''}); setFileName('');}} className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center hover:bg-red-100 transition-colors">
                      <span className="material-symbols-rounded">delete</span>
                    </button>
                  )}
                </div>
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 rounded-2xl font-bold bg-secondary text-white shadow-lg shadow-secondary/20 hover:scale-[1.01] transition-all disabled:opacity-50 mt-4">
                {loading ? 'Adding...' : 'Save Lab Report'}
              </button>
            </form>
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
