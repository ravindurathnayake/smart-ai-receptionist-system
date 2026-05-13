import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import { socketService } from '../../services/socketService';
import { useAdminSearch } from '../../context/AdminSearchContext';
import ConfirmModal from '../../components/common/ConfirmModal';
import './AdminDoctors.css';

const AdminDoctors = () => {
  const navigate = useNavigate();
  const { searchQuery } = useAdminSearch();
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [stats, setStats] = useState({ onDuty: 0, activeConsultations: 0 });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [showEndSessionConfirm, setShowEndSessionConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [doctorToDelete, setDoctorToDelete] = useState(null);
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

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const specs = await apiService.getSpecialists();
      const adminStats = await apiService.getAdminStats();

      if (specs) {
        setDoctors(specs.map(s => {
          let shiftText = 'Not Set';
          let totalBookings = 0;
          let totalCapacity = 15; // Default fallback

          if (s.sessions && s.sessions.length > 0) {
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            const currentDayName = today.toLocaleDateString('en-US', { weekday: 'long' });

            // Aggregate today's stats across all sessions
            const totalBooked = s.sessions.reduce((acc, sess) => acc + (sess.current_bookings || 0), 0);
            const totalWaiting = s.sessions.reduce((acc, sess) => acc + (sess.waiting_count || 0), 0);
            const totalCapacity = s.sessions.reduce((acc, sess) => acc + (sess.max_patients || 20), 0);

            // Find the most relevant session for display
            // 1. ACTIVE session
            // 2. Today's session
            // 3. First session in list
            const displaySession = s.sessions.find(sess => sess.status === 'ACTIVE') || 
                                  s.sessions.find(sess => sess.session_date === todayStr || sess.day_of_week === currentDayName) ||
                                  s.sessions[0];

            const dateStr = displaySession.session_date || displaySession.day_of_week || 'N/A';
            shiftText = `${dateStr} • ${displaySession.start_time} (S${displaySession.session_number || 1})`;

            return {
              id: s.id,
              name: s.title ? `${s.title} ${s.name}` : `Dr. ${s.name}`,
              specialty: s.specialization || s.department,
              nextSession: s.sessions.length > 1 ? `${shiftText} (+${s.sessions.length - 1} more)` : shiftText,
              room: `${displaySession.room_number || 'Room 04'} • OPD Block`,
              capacity: totalCapacity,
              booked: totalBooked,
              waiting: totalWaiting,
              sessionStatus: displaySession.status || 'NOT_STARTED',
              sessionId: displaySession.id,
              raw: s
            };
          }

          return {
            id: s.id,
            name: s.title ? `${s.title} ${s.name}` : `Dr. ${s.name}`,
            specialty: s.specialization || s.department,
            nextSession: 'No Sessions Scheduled',
            room: 'TBD',
            capacity: 0,
            booked: 0,
            waiting: 0,
            sessionStatus: 'NOT_STARTED',
            raw: s
          };
        }));
        setStats({
          onDuty: specs.length,
          activeConsultations: adminStats?.queue?.active || 0
        });
      }
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let result = [...doctors];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(doc =>
        doc.name.toLowerCase().includes(q) ||
        doc.specialty.toLowerCase().includes(q)
      );
    }
    setFilteredDoctors(result);
  }, [doctors, searchQuery]);

  useEffect(() => {
    fetchData();

    const handleUpdate = () => {
      console.log('Real-time update triggered');
      fetchData(true);
    };

    socketService.on('appointment_booked', handleUpdate);
    socketService.on('appointment_rescheduled', handleUpdate);
    socketService.on('specialist_updated', handleUpdate);
    socketService.on('queue_updated', handleUpdate);
    socketService.on('stats_updated', handleUpdate);

    return () => {
      socketService.off('appointment_booked', handleUpdate);
      socketService.off('appointment_rescheduled', handleUpdate);
      socketService.off('specialist_updated', handleUpdate);
      socketService.off('queue_updated', handleUpdate);
      socketService.off('stats_updated', handleUpdate);
    };
  }, [fetchData]);

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
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setFormData({
      ...formData,
      sessions: [...formData.sessions, {
        session_date: today,
        day_of_week: '',
        start_time: '09:00',
        end_time: '13:00',
        room_number: 'Room 01',
        max_patients: 20
      }]
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

  const handleStatusUpdate = async (sessionId, action) => {
    try {
      if (action === 'start') {
        await apiService.startSession(sessionId);
        fetchData(true);
      } else if (action === 'end') {
        setSelectedSessionId(sessionId);
        setShowEndSessionConfirm(true);
      }
    } catch (err) {
      console.error('Failed to update session status:', err);
      alert('Action failed. Please try again.');
    }
  };

  const handleConfirmEndSession = async () => {
    if (!selectedSessionId) return;
    try {
      await apiService.endSession(selectedSessionId);
      setShowEndSessionConfirm(false);
      setSelectedSessionId(null);
      fetchData(true);
    } catch (err) {
      console.error('Failed to end session:', err);
      alert('Failed to end session.');
    }
  };

  const handleDeleteClick = (doctorId) => {
    setDoctorToDelete(doctorId);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!doctorToDelete) return;
    try {
      await apiService.deleteSpecialist(doctorToDelete);
      setShowDeleteConfirm(false);
      setDoctorToDelete(null);
      fetchData();
    } catch (err) {
      console.error('Failed to delete specialist:', err);
      alert('Failed to delete specialist record.');
    }
  };

  const getSessionStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-emerald-600 bg-emerald-50 border-emerald-100 ring-1 ring-emerald-500/20';
      case 'PAUSED':
        return 'text-amber-600 bg-amber-50 border-amber-100 ring-1 ring-amber-500/20';
      case 'ENDED':
        return 'text-rose-600 bg-rose-50 border-rose-100 ring-1 ring-rose-500/20';
      default:
        return 'text-slate-500 bg-slate-50 border-slate-100 ring-1 ring-slate-400/20';
    }
  };

  const getSessionStatusLabel = (status) => {
    switch (status) {
      case 'ACTIVE': return '🟢 Active';
      case 'PAUSED': return '⏸ Paused';
      case 'ENDED': return '🔴 Ended';
      default: return '🟡 Not Started';
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
        </div>
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="px-8 py-5">Doctor Name</th>
                <th className="px-8 py-5">Specialization</th>
                <th className="px-8 py-5">Next Session</th>
                <th className="px-8 py-5">Room</th>
                <th className="px-8 py-5">Queue Capacity</th>
                <th className="px-8 py-5">Patients Waiting</th>
                <th className="px-8 py-5 text-center">Session Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {loading ? (
                <tr><td colSpan="8" className="text-center py-10 text-outline">Synchronizing staff data...</td></tr>
              ) : filteredDoctors.length === 0 ? (
                <tr><td colSpan="8" className="text-center py-10 text-outline">No specialists matching your search.</td></tr>
              ) : filteredDoctors.map((doc) => (
                <tr key={doc.id} className="group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="doctor-avatar-small group-hover:scale-110 transition-transform overflow-hidden">
                        {doc.raw.profile_image ? (
                          <img src={doc.raw.profile_image} alt={doc.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-black text-primary/40">
                            {doc.name.replace('Dr. ', '').replace('Prof. ', '').split(' ').map(n => n[0]).join('')}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-on-surface text-sm">{doc.name}</p>
                        <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest mt-0.5">ID: #SPEC-{doc.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{doc.specialty}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-rounded text-sm text-primary/40">schedule</span>
                      <span className="text-sm font-bold text-on-surface">{doc.nextSession}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-rounded text-sm text-primary/40">location_on</span>
                      <span className="text-sm font-bold text-on-surface-variant">{doc.room}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="progress-bar-container w-24">
                        <div className="progress-bar-fill" style={{ width: `${Math.min(100, (doc.booked / (doc.capacity || 1)) * 100)}%` }}></div>
                      </div>
                      <span className="text-[11px] font-black text-on-surface whitespace-nowrap">{doc.booked} / {doc.capacity} Patients</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-rounded text-sm text-amber-500">group</span>
                      <span className="text-sm font-black text-on-surface">{doc.waiting} Waiting</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className={`mx-auto w-fit px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${getSessionStatusBadge(doc.sessionStatus)}`}>
                      {getSessionStatusLabel(doc.sessionStatus)}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-0 translate-x-4">
                      {doc.sessionId && doc.sessionStatus === 'NOT_STARTED' && (
                        <button
                          onClick={() => handleStatusUpdate(doc.sessionId, 'start')}
                          className="px-4 py-2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                        >
                          Start Session
                        </button>
                      )}
                      {doc.sessionStatus === 'ACTIVE' && (
                        <button
                          onClick={() => handleStatusUpdate(doc.sessionId, 'end')}
                          className="px-4 py-2 bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-200"
                        >
                          End Session
                        </button>
                      )}
                      {doc.sessionStatus === 'ACTIVE' && (
                        <button
                          onClick={() => navigate('/admin/queue')}
                          className="px-4 py-2 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary-container transition-all shadow-lg shadow-primary/20"
                        >
                          Monitor Queue
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenModal(doc)}
                        className="p-2.5 bg-surface-container rounded-xl text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-all"
                        title="Edit Doctor"
                      >
                        <span className="material-symbols-rounded text-xl">tune</span>
                      </button>
                      <button
                        onClick={() => handleDeleteClick(doc.id)}
                        className="p-2.5 bg-surface-container rounded-xl text-on-surface-variant hover:text-error hover:bg-error/10 transition-all"
                        title="Delete Doctor"
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
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Ravindu Rathnayake"
                      />
                    </div>
                    <div className="col-span-5 space-y-2">
                      <label className="text-[10px] font-black text-outline uppercase tracking-widest px-1">Email Address</label>
                      <input
                        type="email"
                        className="w-full px-4 py-3.5 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl outline-none focus:border-primary/50 transition-all font-bold text-sm"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="doctor@hospital.com"
                      />
                    </div>
                    <div className="col-span-4 space-y-2">
                      <label className="text-[10px] font-black text-outline uppercase tracking-widest px-1">Contact Number</label>
                      <input
                        className="w-full px-4 py-3.5 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl outline-none focus:border-primary/50 transition-all font-bold text-sm"
                        value={formData.phone_number}
                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                        placeholder="+94 7X XXX XXXX"
                      />
                    </div>
                    <div className="col-span-8 space-y-2">
                      <label className="text-[10px] font-black text-outline uppercase tracking-widest px-1">Profile Image URL</label>
                      <input
                        className="w-full px-4 py-3.5 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl outline-none focus:border-primary/50 transition-all font-bold text-sm"
                        value={formData.profile_image}
                        onChange={(e) => setFormData({ ...formData, profile_image: e.target.value })}
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
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        placeholder="Cardiology"
                      />
                    </div>
                    <div className="col-span-4 space-y-2">
                      <label className="text-[10px] font-black text-outline uppercase tracking-widest px-1">Sub-Specialization</label>
                      <input
                        className="w-full px-4 py-3.5 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl outline-none focus:border-primary/50 transition-all font-bold text-sm"
                        value={formData.specialization}
                        onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                        placeholder="Interventional Cardiologist"
                      />
                    </div>
                    <div className="col-span-4 space-y-2">
                      <label className="text-[10px] font-black text-outline uppercase tracking-widest px-1">Consultation Fee (LKR)</label>
                      <input
                        type="number"
                        className="w-full px-4 py-3.5 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl outline-none focus:border-primary/50 transition-all font-bold text-sm"
                        value={formData.consultation_fee}
                        onChange={(e) => setFormData({ ...formData, consultation_fee: e.target.value })}
                        placeholder="3500"
                      />
                    </div>
                    <div className="col-span-12 space-y-2">
                      <label className="text-[10px] font-black text-outline uppercase tracking-widest px-1">Professional Biography</label>
                      <textarea
                        rows="2"
                        className="w-full px-5 py-4 bg-surface-container-lowest border border-outline-variant/30 rounded-[1.5rem] outline-none focus:border-primary/50 transition-all font-bold text-sm resize-none"
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
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

                  <div className="space-y-4">
                    {formData.sessions.length === 0 ? (
                      <div className="p-12 border-2 border-dashed border-outline-variant/20 rounded-[2.5rem] text-center bg-surface-container-lowest/50">
                        <div className="w-16 h-16 bg-surface-container rounded-3xl flex items-center justify-center mx-auto mb-4 text-outline/30">
                          <span className="material-symbols-rounded text-4xl">calendar_add_on</span>
                        </div>
                        <p className="text-sm font-bold text-outline uppercase tracking-widest">No active sessions defined</p>
                        <p className="text-xs text-on-surface-variant mt-1">Add a new shift to start scheduling consultations.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {formData.sessions.map((session, idx) => (
                          <div key={idx} className="p-6 bg-white border border-outline-variant/10 rounded-[1.75rem] shadow-sm hover:shadow-md hover:border-primary/20 transition-all group animate-in slide-in-from-bottom-2 duration-300">
                            <div className="grid grid-cols-12 gap-6 items-center">
                              {/* Session Identity */}
                              <div className="col-span-1 space-y-2">
                                <div className="flex items-center gap-2 px-1">
                                  <span className="material-symbols-rounded text-sm text-primary">pin</span>
                                  <label className="text-[10px] font-black text-outline uppercase tracking-widest">No</label>
                                </div>
                                <input
                                  type="number"
                                  className="w-full px-4 py-3 bg-surface-container-low rounded-xl text-xs font-bold outline-none border-2 border-transparent focus:border-primary/20 transition-all text-center"
                                  value={session.session_number || ''}
                                  onChange={(e) => handleSessionChange(idx, 'session_number', e.target.value)}
                                  placeholder="1"
                                />
                              </div>

                              {/* Date Selection */}
                              <div className="col-span-2 space-y-2">
                                <div className="flex items-center gap-2 px-1">
                                  <span className="material-symbols-rounded text-sm text-primary">calendar_month</span>
                                  <label className="text-[10px] font-black text-outline uppercase tracking-widest">Session Date</label>
                                </div>
                                <input
                                  type="date"
                                  required
                                  className="w-full px-4 py-3 bg-surface-container-low rounded-xl text-xs font-bold outline-none border-2 border-transparent focus:border-primary/20 transition-all"
                                  value={session.session_date || ''}
                                  onChange={(e) => handleSessionChange(idx, 'session_date', e.target.value)}
                                />
                              </div>

                              {/* Time Range */}
                              <div className="col-span-4 space-y-2">
                                <div className="flex items-center gap-2 px-1">
                                  <span className="material-symbols-rounded text-sm text-primary">schedule</span>
                                  <label className="text-[10px] font-black text-outline uppercase tracking-widest">Time Window</label>
                                </div>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="time"
                                    className="flex-1 px-4 py-3 bg-surface-container-low rounded-xl text-xs font-bold outline-none border-2 border-transparent focus:border-primary/20 transition-all"
                                    value={session.start_time}
                                    onChange={(e) => handleSessionChange(idx, 'start_time', e.target.value)}
                                  />
                                  <span className="text-outline text-xs font-black">TO</span>
                                  <input
                                    type="time"
                                    className="flex-1 px-4 py-3 bg-surface-container-low rounded-xl text-xs font-bold outline-none border-2 border-transparent focus:border-primary/20 transition-all"
                                    value={session.end_time}
                                    onChange={(e) => handleSessionChange(idx, 'end_time', e.target.value)}
                                  />
                                </div>
                              </div>

                              {/* Room & Capacity */}
                              <div className="col-span-4 grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 px-1">
                                    <span className="material-symbols-rounded text-sm text-primary">meeting_room</span>
                                    <label className="text-[10px] font-black text-outline uppercase tracking-widest">Room</label>
                                  </div>
                                  <input
                                    className="w-full px-4 py-3 bg-surface-container-low rounded-xl text-xs font-bold outline-none border-2 border-transparent focus:border-primary/20 transition-all"
                                    value={session.room_number}
                                    onChange={(e) => handleSessionChange(idx, 'room_number', e.target.value)}
                                    placeholder="e.g. Room 04"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 px-1">
                                    <span className="material-symbols-rounded text-sm text-primary">groups</span>
                                    <label className="text-[10px] font-black text-outline uppercase tracking-widest">Limit</label>
                                  </div>
                                  <input
                                    type="number"
                                    className="w-full px-4 py-3 bg-surface-container-low rounded-xl text-xs font-bold outline-none border-2 border-transparent focus:border-primary/20 transition-all"
                                    value={session.max_patients}
                                    onChange={(e) => handleSessionChange(idx, 'max_patients', parseInt(e.target.value, 10) || 0)}
                                  />
                                </div>
                              </div>

                              {/* Session Stats (Practical Display) */}
                              {session.id && (
                                <div className="col-span-12 grid grid-cols-4 gap-4 pt-4 mt-2 border-t border-outline-variant/5">
                                  <div className="bg-surface-container-lowest p-3 rounded-2xl flex items-center gap-3 border border-outline-variant/10">
                                    <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                      <span className="material-symbols-rounded text-lg">book_online</span>
                                    </div>
                                    <div>
                                      <p className="text-[9px] font-black text-outline uppercase tracking-tighter">Total Bookings</p>
                                      <p className="text-sm font-black text-on-surface">{session.current_bookings || 0} Patients</p>
                                    </div>
                                  </div>
                                  <div className="bg-surface-container-lowest p-3 rounded-2xl flex items-center gap-3 border border-outline-variant/10">
                                    <div className="w-8 h-8 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600">
                                      <span className="material-symbols-rounded text-lg">how_to_reg</span>
                                    </div>
                                    <div>
                                      <p className="text-[9px] font-black text-outline uppercase tracking-tighter">Remaining Slots</p>
                                      <p className="text-sm font-black text-on-surface">{(session.max_patients || 20) - (session.current_bookings || 0)} Available</p>
                                    </div>
                                  </div>
                                  <div className="bg-surface-container-lowest p-3 rounded-2xl flex items-center gap-3 border border-outline-variant/10">
                                    <div className="w-8 h-8 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-600">
                                      <span className="material-symbols-rounded text-lg">group</span>
                                    </div>
                                    <div>
                                      <p className="text-[9px] font-black text-outline uppercase tracking-tighter">Check-in Rate</p>
                                      <p className="text-sm font-black text-on-surface">
                                        {Math.round(((session.checked_in_count || 0) / Math.max(1, session.current_bookings || 0)) * 100)}% Verified
                                      </p>
                                    </div>
                                  </div>
                                  <div className="bg-surface-container-lowest p-3 rounded-2xl flex items-center gap-3 border border-outline-variant/10">
                                    <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                      <span className="material-symbols-rounded text-lg">pending_actions</span>
                                    </div>
                                    <div>
                                      <p className="text-[9px] font-black text-outline uppercase tracking-tighter">Status</p>
                                      <p className="text-sm font-black text-on-surface uppercase tracking-tighter">{session.status || 'Scheduled'}</p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Actions */}
                              <div className="col-span-1 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => removeSessionRow(idx)}
                                  className="w-12 h-12 flex items-center justify-center text-outline-variant hover:text-error hover:bg-error/10 rounded-2xl transition-all"
                                  title="Remove Shift"
                                >
                                  <span className="material-symbols-rounded text-xl">delete_outline</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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

      <ConfirmModal 
        isOpen={showEndSessionConfirm}
        title="End Medical Session?"
        message="Are you sure you want to mark this doctor as left and end the current session? This will affect all active patient queues for this room."
        confirmText="End Session Now"
        cancelText="Keep Session Active"
        onConfirm={handleConfirmEndSession}
        onCancel={() => setShowEndSessionConfirm(false)}
        type="warning"
      />

      <ConfirmModal 
        isOpen={showDeleteConfirm}
        title="Remove Specialist?"
        message="Are you sure you want to permanently remove this specialist from the directory? This will delete all their assigned sessions and records."
        confirmText="Delete Permanently"
        cancelText="Keep Directory"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        type="danger"
      />
    </div>
  );
};

export default AdminDoctors;
