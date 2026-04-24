import { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import './AdminDoctors.css';

const AdminDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [stats, setStats] = useState({ onDuty: 0, activeConsultations: 0 });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [formData, setFormData] = useState({
    title: 'Dr.',
    name: '',
    email: '',
    phone_number: '',
    department: '',
    specialization: '',
    consultation_fee: '',
    availability_status: 'Available',
    bio: '',
    profile_image: '',
    sessions: []
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const specs = await apiService.getSpecialists();
      const adminStats = await apiService.getAdminStats();
      
      if (specs) {
        setDoctors(specs.map(s => ({
          id: s.id,
          name: s.title ? `${s.title} ${s.name}` : `Dr. ${s.name}`,
          specialty: s.specialization || s.department,
          shift: s.sessions && s.sessions.length > 0 ? `${s.sessions[0].day_of_week} ${s.sessions[0].start_time}` : 'Not Set',
          status: s.availability_status || 'Available',
          room: s.sessions && s.sessions.length > 0 ? s.sessions[0].room_number : 'N/A',
          patients: 0,
          raw: s
        })));
        setStats({
          onDuty: specs.length,
          activeConsultations: adminStats?.queue?.active || 0
        });
      }
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (doc = null) => {
    if (doc) {
      setEditingDoctor(doc);
      setFormData({
        title: doc.raw.title || 'Dr.',
        name: doc.raw.name,
        email: doc.raw.email || '',
        phone_number: doc.raw.phone_number || '',
        department: doc.raw.department,
        specialization: doc.raw.specialization || '',
        consultation_fee: doc.raw.consultation_fee || '',
        availability_status: doc.raw.availability_status || 'Available',
        bio: doc.raw.bio || '',
        profile_image: doc.raw.profile_image || '',
        sessions: doc.raw.sessions || []
      });
    } else {
      setEditingDoctor(null);
      setFormData({
        title: 'Dr.',
        name: '',
        email: '',
        phone_number: '',
        department: '',
        specialization: '',
        consultation_fee: '',
        availability_status: 'Available',
        bio: '',
        profile_image: '',
        sessions: []
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDoctor(null);
  };

  const addSessionRow = () => {
    setFormData({
      ...formData,
      sessions: [...formData.sessions, { day_of_week: 'Monday', start_time: '09:00', end_time: '13:00', room_number: 'Room 01', max_patients: 20 }]
    });
  };

  const removeSessionRow = (index) => {
    const newSessions = [...formData.sessions];
    newSessions.splice(index, 1);
    setFormData({ ...formData, sessions: newSessions });
  };

  const handleSessionChange = (index, field, value) => {
    const newSessions = [...formData.sessions];
    newSessions[index][field] = value;
    setFormData({ ...formData, sessions: newSessions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDoctor) {
        await apiService.updateSpecialist(editingDoctor.id, formData);
      } else {
        await apiService.addSpecialist(formData);
      }
      handleCloseModal();
      fetchData();
    } catch (err) {
      alert('Failed to save doctor details');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this doctor?')) {
      try {
        await apiService.deleteSpecialist(id);
        fetchData();
      } catch (err) {
        alert('Failed to delete doctor');
      }
    }
  };

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
          <h2 className="text-3xl font-bold font-display text-on-surface tracking-tight">Staff Management</h2>
          <p className="text-sm text-on-surface-variant mt-1 font-medium">Control the hospital medical directory and active session rosters.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-primary text-white px-8 py-3.5 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <span className="material-symbols-rounded">add_moderator</span>
          Register New Specialist
        </button>
      </div>

      <div className="doctors-overview-grid">
        <div className="overview-stat-pill">
          <p className="text-[10px] font-black text-outline uppercase tracking-widest mb-1.5">Active Specialists</p>
          <p className="text-3xl font-bold font-display text-on-surface">{stats.onDuty} Active</p>
        </div>
        <div className="overview-stat-pill">
          <p className="text-[10px] font-black text-outline uppercase tracking-widest mb-1.5">Live Consultations</p>
          <p className="text-3xl font-bold font-display text-primary">{stats.activeConsultations} Active</p>
        </div>
        <div className="overview-stat-pill">
          <p className="text-[10px] font-black text-outline uppercase tracking-widest mb-1.5">System Status</p>
          <p className="text-3xl font-bold font-display text-secondary">Optimal</p>
        </div>
      </div>

      <div className="roster-card shadow-sm">
        <div className="roster-header">
          <h3 className="font-bold text-lg font-display tracking-tight">Specialist Directory</h3>
          <div className="flex gap-4">
            <div className="relative group">
              <span className="material-symbols-rounded absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg transition-colors group-focus-within:text-primary">search</span>
              <input type="text" placeholder="Filter by name or specialty..." className="pl-10 pr-4 py-2.5 bg-white border border-outline-variant/30 rounded-xl text-sm outline-none focus:border-primary/30 transition-all w-64 shadow-sm" />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="px-8 py-5">Staff Member</th>
                <th className="px-8 py-5">Main Session</th>
                <th className="px-8 py-5">Load</th>
                <th className="px-8 py-5">Location</th>
                <th className="px-8 py-5 text-center">Status</th>
                <th className="px-8 py-5 text-right">Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {loading ? (
                <tr><td colSpan="6" className="text-center py-10 text-outline">Synchronizing staff data...</td></tr>
              ) : doctors.map((doc) => (
                <tr key={doc.id} className="group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="doctor-avatar-small group-hover:scale-110 transition-transform overflow-hidden">
                        {doc.raw.profile_image ? (
                          <img src={doc.raw.profile_image} alt={doc.name} className="w-full h-full object-cover" />
                        ) : (
                          doc.name.replace('Dr. ', '').replace('Prof. ', '').split(' ').map(n => n[0]).join('')
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-on-surface text-sm">{doc.name}</p>
                        <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mt-1">{doc.specialty}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                       <span className="material-symbols-rounded text-sm text-outline">event_repeat</span>
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
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleOpenModal(doc)}
                        className="p-2.5 bg-surface-container rounded-xl text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-all"
                      >
                        <span className="material-symbols-rounded text-xl">tune</span>
                      </button>
                      <button 
                        onClick={() => handleDelete(doc.id)}
                        className="p-2.5 bg-surface-container rounded-xl text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-all"
                      >
                        <span className="material-symbols-rounded text-xl">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Professional Modal for Registration/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-8 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white">
                  <span className="material-symbols-rounded text-2xl">{editingDoctor ? 'edit_note' : 'person_add'}</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold font-display text-on-surface">
                    {editingDoctor ? 'Modify Specialist Profile' : 'Register New Specialist'}
                  </h3>
                  <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wider">Hospital Medical Directory</p>
                </div>
              </div>
              <button onClick={handleCloseModal} className="w-10 h-10 flex items-center justify-center hover:bg-surface-container rounded-full transition-colors">
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="overflow-y-auto no-scrollbar">
              <div className="p-8 space-y-8">
                {/* Personal Info Section */}
                <div className="space-y-6">
                  <h4 className="text-sm font-black text-primary uppercase tracking-[0.2em] flex items-center gap-3">
                    <span className="h-px w-8 bg-primary/20"></span>
                    Personal Information
                  </h4>
                  <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-2 space-y-2">
                      <label className="text-[10px] font-black text-outline uppercase tracking-widest px-1">Title</label>
                      <select 
                        className="w-full px-4 py-3.5 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl outline-none focus:border-primary/50 transition-all font-bold text-sm"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                      >
                        <option value="Dr.">Dr.</option>
                        <option value="Prof.">Prof.</option>
                        <option value="Consultant">Consultant</option>
                        <option value="VOG">VOG</option>
                      </select>
                    </div>
                    <div className="col-span-5 space-y-2">
                      <label className="text-[10px] font-black text-outline uppercase tracking-widest px-1">Full Legal Name</label>
                      <input 
                        required
                        className="w-full px-4 py-3.5 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl outline-none focus:border-primary/50 transition-all font-bold text-sm"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="e.g. Ravindu Rathnayake"
                      />
                    </div>
                    <div className="col-span-5 space-y-2">
                      <label className="text-[10px] font-black text-outline uppercase tracking-widest px-1">Email Address</label>
                      <input 
                        type="email"
                        className="w-full px-4 py-3.5 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl outline-none focus:border-primary/50 transition-all font-bold text-sm"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="doctor@hospital.com"
                      />
                    </div>
                    <div className="col-span-4 space-y-2">
                      <label className="text-[10px] font-black text-outline uppercase tracking-widest px-1">Contact Number</label>
                      <input 
                        className="w-full px-4 py-3.5 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl outline-none focus:border-primary/50 transition-all font-bold text-sm"
                        value={formData.phone_number}
                        onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                        placeholder="+94 7X XXX XXXX"
                      />
                    </div>
                    <div className="col-span-8 space-y-2">
                      <label className="text-[10px] font-black text-outline uppercase tracking-widest px-1">Profile Image URL</label>
                      <input 
                        className="w-full px-4 py-3.5 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl outline-none focus:border-primary/50 transition-all font-bold text-sm"
                        value={formData.profile_image}
                        onChange={(e) => setFormData({...formData, profile_image: e.target.value})}
                        placeholder="https://example.com/photo.jpg"
                      />
                    </div>
                  </div>
                </div>

                {/* Professional Info Section */}
                <div className="space-y-6">
                  <h4 className="text-sm font-black text-primary uppercase tracking-[0.2em] flex items-center gap-3">
                    <span className="h-px w-8 bg-primary/20"></span>
                    Medical Qualifications
                  </h4>
                  <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-4 space-y-2">
                      <label className="text-[10px] font-black text-outline uppercase tracking-widest px-1">Main Department</label>
                      <input 
                        required
                        className="w-full px-4 py-3.5 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl outline-none focus:border-primary/50 transition-all font-bold text-sm"
                        value={formData.department}
                        onChange={(e) => setFormData({...formData, department: e.target.value})}
                        placeholder="Cardiology"
                      />
                    </div>
                    <div className="col-span-4 space-y-2">
                      <label className="text-[10px] font-black text-outline uppercase tracking-widest px-1">Sub-Specialization</label>
                      <input 
                        className="w-full px-4 py-3.5 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl outline-none focus:border-primary/50 transition-all font-bold text-sm"
                        value={formData.specialization}
                        onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                        placeholder="Interventional Cardiologist"
                      />
                    </div>
                    <div className="col-span-4 space-y-2">
                      <label className="text-[10px] font-black text-outline uppercase tracking-widest px-1">Consultation Fee (LKR)</label>
                      <input 
                        type="number"
                        className="w-full px-4 py-3.5 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl outline-none focus:border-primary/50 transition-all font-bold text-sm"
                        value={formData.consultation_fee}
                        onChange={(e) => setFormData({...formData, consultation_fee: e.target.value})}
                        placeholder="3500"
                      />
                    </div>
                    <div className="col-span-12 space-y-2">
                      <label className="text-[10px] font-black text-outline uppercase tracking-widest px-1">Professional Biography</label>
                      <textarea 
                        rows="2"
                        className="w-full px-5 py-4 bg-surface-container-lowest border border-outline-variant/30 rounded-[1.5rem] outline-none focus:border-primary/50 transition-all font-bold text-sm resize-none"
                        value={formData.bio}
                        onChange={(e) => setFormData({...formData, bio: e.target.value})}
                        placeholder="Brief summary of experience and credentials..."
                      />
                    </div>
                  </div>
                </div>

                {/* Session Management Section */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-primary uppercase tracking-[0.2em] flex items-center gap-3">
                      <span className="h-px w-8 bg-primary/20"></span>
                      Working Sessions & Locations
                    </h4>
                    <button 
                      type="button"
                      onClick={addSessionRow}
                      className="text-xs font-black bg-primary/10 text-primary px-4 py-2 rounded-xl hover:bg-primary/20 transition-all flex items-center gap-2"
                    >
                      <span className="material-symbols-rounded text-sm">add_circle</span>
                      Add Shift
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {formData.sessions.length === 0 ? (
                      <div className="p-10 border-2 border-dashed border-outline-variant/20 rounded-[2rem] text-center">
                        <span className="material-symbols-rounded text-3xl text-outline/30 mb-2 block">event_busy</span>
                        <p className="text-xs font-bold text-outline uppercase tracking-widest">No active sessions defined</p>
                      </div>
                    ) : formData.sessions.map((session, idx) => (
                      <div key={idx} className="p-4 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl grid grid-cols-12 gap-4 items-end animate-in slide-in-from-right-4 duration-300">
                        <div className="col-span-2 space-y-1">
                          <label className="text-[9px] font-black text-outline uppercase px-1">Day</label>
                          <select 
                            className="w-full p-2 bg-surface-container-low rounded-lg text-xs font-bold outline-none border-none"
                            value={session.day_of_week}
                            onChange={(e) => handleSessionChange(idx, 'day_of_week', e.target.value)}
                          >
                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                              <option key={day} value={day}>{day}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-2 space-y-1">
                          <label className="text-[9px] font-black text-outline uppercase px-1">Start Time</label>
                          <input 
                            type="time"
                            className="w-full p-2 bg-surface-container-low rounded-lg text-xs font-bold outline-none border-none"
                            value={session.start_time}
                            onChange={(e) => handleSessionChange(idx, 'start_time', e.target.value)}
                          />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <label className="text-[9px] font-black text-outline uppercase px-1">End Time</label>
                          <input 
                            type="time"
                            className="w-full p-2 bg-surface-container-low rounded-lg text-xs font-bold outline-none border-none"
                            value={session.end_time}
                            onChange={(e) => handleSessionChange(idx, 'end_time', e.target.value)}
                          />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <label className="text-[9px] font-black text-outline uppercase px-1">Room/Location</label>
                          <input 
                            className="w-full p-2 bg-surface-container-low rounded-lg text-xs font-bold outline-none border-none"
                            value={session.room_number}
                            onChange={(e) => handleSessionChange(idx, 'room_number', e.target.value)}
                            placeholder="Room 04"
                          />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <label className="text-[9px] font-black text-outline uppercase px-1">Capacity</label>
                          <input 
                            type="number"
                            className="w-full p-2 bg-surface-container-low rounded-lg text-xs font-bold outline-none border-none"
                            value={session.max_patients}
                            onChange={(e) => handleSessionChange(idx, 'max_patients', e.target.value)}
                          />
                        </div>
                        <div className="col-span-2 flex justify-end">
                          <button 
                            type="button"
                            onClick={() => removeSessionRow(idx)}
                            className="w-10 h-10 flex items-center justify-center text-error hover:bg-error/10 rounded-xl transition-all"
                          >
                            <span className="material-symbols-rounded">delete_sweep</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-8 border-t border-outline-variant/10 bg-surface-container-low flex gap-6 sticky bottom-0">
                <button 
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 py-4.5 text-on-surface font-black uppercase text-xs tracking-widest hover:bg-surface-container-high rounded-[1.25rem] transition-all"
                >
                  Cancel Registration
                </button>
                <button 
                  type="submit"
                  className="flex-[2] py-4.5 bg-primary text-white font-black uppercase text-xs tracking-[0.2em] rounded-[1.25rem] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  {editingDoctor ? 'Apply System Updates' : 'Authorize New Specialist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDoctors;
