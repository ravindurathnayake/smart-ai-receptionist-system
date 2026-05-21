import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import { socketService } from '../../services/socketService';
import { useAdminSearch } from '../../context/AdminSearchContext';
import ConfirmModal from '../../components/common/ConfirmModal';
import './AdminDoctors.css';

const normalizeSessionTimeForApi = (value) => {
  if (!value) return '';

  const raw = String(value).trim();
  if (/^\d{2}:\d{2}$/.test(raw)) return raw;
  if (/^\d{2}:\d{2}:\d{2}$/.test(raw)) return raw.slice(0, 5);

  const amPmMatch = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
  if (amPmMatch) {
    let hours = Number(amPmMatch[1]);
    const minutes = amPmMatch[2];
    const meridiem = amPmMatch[3].toUpperCase();

    if (meridiem === 'AM' && hours === 12) hours = 0;
    if (meridiem === 'PM' && hours !== 12) hours += 12;

    return `${String(hours).padStart(2, '0')}:${minutes}`;
  }

  return raw;
};

const sanitizeDrawerSessionsForApi = (sessions = []) =>
  sessions.map((session, index) => ({
    id: session.id,
    day_of_week: session.day_of_week || '',
    session_date: session.session_date || null,
    start_time: normalizeSessionTimeForApi(session.start_time),
    end_time: normalizeSessionTimeForApi(session.end_time),
    max_patients: Number(session.max_patients) || 0,
    session_number: session.session_number ?? index + 1,
    room_number: session.room_number || '',
    status: session.status || 'NOT_STARTED'
  }));

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
  
  // Doctor Details & Session Management Drawer States
  const [activeDetailsDoctor, setActiveDetailsDoctor] = useState(null);
  const [isEditingSessions, setIsEditingSessions] = useState(false);
  const [drawerSessions, setDrawerSessions] = useState([]);
  const [isSavingDrawer, setIsSavingDrawer] = useState(false);
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
        (doc.name || '').toLowerCase().includes(q) ||
        (doc.specialty || '').toLowerCase().includes(q)
      );
    }
    setFilteredDoctors(result);
  }, [doctors, searchQuery]);

  useEffect(() => {
    if (activeDetailsDoctor) {
      const updatedDoc = doctors.find(d => d.id === activeDetailsDoctor.id);
      if (updatedDoc) {
        setActiveDetailsDoctor(updatedDoc);
        if (!isEditingSessions) {
          setDrawerSessions(updatedDoc.raw.sessions || []);
        }
      }
    }
  }, [doctors, activeDetailsDoctor?.id, isEditingSessions]);

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

  // Drawer session modification handlers
  const addDrawerSessionRow = () => {
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setDrawerSessions([
      ...drawerSessions,
      {
        session_date: today,
        day_of_week: '',
        start_time: '09:00',
        end_time: '13:00',
        room_number: 'Room 01',
        max_patients: 20
      }
    ]);
    setIsEditingSessions(true);
  };

  const removeDrawerSessionRow = (index) => {
    const updated = [...drawerSessions];
    updated.splice(index, 1);
    setDrawerSessions(updated);
  };

  const handleDrawerSessionChange = (index, field, value) => {
    const updated = [...drawerSessions];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setDrawerSessions(updated);
  };

  const handleSaveDrawerSessions = async () => {
    if (!activeDetailsDoctor) return;
    setIsSavingDrawer(true);
    try {
      const sanitizedSessions = sanitizeDrawerSessionsForApi(drawerSessions);
      const updatedRaw = {
        ...activeDetailsDoctor.raw,
        sessions: sanitizedSessions
      };
      await apiService.updateSpecialist(activeDetailsDoctor.id, updatedRaw);
      setIsEditingSessions(false);
      await fetchData(true);
    } catch (err) {
      console.error('Failed to save session changes:', err);
      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Failed to save session changes. Please check time formats and date fields.';
      alert(errorMessage);
    } finally {
      setIsSavingDrawer(false);
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
    <div className="doctors-wrapper">
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
                <tr 
                  key={doc.id} 
                  className="group cursor-pointer hover:bg-slate-50/50 transition-colors"
                  onClick={() => {
                    setActiveDetailsDoctor(doc);
                    setDrawerSessions(doc.raw.sessions || []);
                    setIsEditingSessions(false);
                  }}
                >
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
                          onClick={(e) => { e.stopPropagation(); handleStatusUpdate(doc.sessionId, 'start'); }}
                          className="px-4 py-2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                        >
                          Start Session
                        </button>
                      )}
                      {doc.sessionStatus === 'ACTIVE' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleStatusUpdate(doc.sessionId, 'end'); }}
                          className="px-4 py-2 bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-200"
                        >
                          End Session
                        </button>
                      )}
                      {doc.sessionStatus === 'ACTIVE' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate('/admin/queue'); }}
                          className="px-4 py-2 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary-container transition-all shadow-lg shadow-primary/20"
                        >
                          Monitor Queue
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenModal(doc); }}
                        className="p-2.5 bg-surface-container rounded-xl text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-all"
                        title="Edit Doctor"
                      >
                        <span className="material-symbols-rounded text-xl">tune</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(doc.id); }}
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
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
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
                {/* Personal & Profile Section */}
                <div className="space-y-6">
                  <h4 className="text-sm font-black text-primary uppercase tracking-[0.2em] flex items-center gap-3">
                    <span className="h-px w-8 bg-primary/20"></span>
                    Personal & Profile Details
                  </h4>
                  <div className="grid grid-cols-12 gap-8 items-start">
                    
                    {/* Visual Avatar Manager (Left) */}
                    <div className="col-span-12 md:col-span-4 flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-100/80 rounded-[2rem] text-center">
                      <div className="relative group w-32 h-32 rounded-3xl bg-primary/5 border border-primary/10 overflow-hidden flex items-center justify-center shadow-inner mb-4">
                        {formData.profile_image ? (
                          <img 
                            src={formData.profile_image} 
                            alt="Profile Preview" 
                            className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200";
                            }}
                          />
                        ) : (
                          <div className="text-center p-3 text-primary/40">
                            <span className="material-symbols-rounded text-4xl block mb-1">add_a_photo</span>
                            <span className="text-[9px] font-black uppercase tracking-wider block">No Photo</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                          <span className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-1">
                            <span className="material-symbols-rounded text-sm">edit</span> Roster Image
                          </span>
                        </div>
                      </div>

                      {/* URL input field */}
                      <div className="w-full">
                        <div className="space-y-1 text-left">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block px-1">Roster Photo URL</label>
                          <input
                            className="w-full px-3 py-2 bg-white border border-slate-100 rounded-xl outline-none focus:border-primary/50 transition-all font-bold text-xs text-slate-700 shadow-sm"
                            value={formData.profile_image}
                            onChange={(e) => setFormData({ ...formData, profile_image: e.target.value })}
                            placeholder="Paste photo link..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Standard inputs (Right) */}
                    <div className="col-span-12 md:col-span-8 grid grid-cols-12 gap-5">
                      <div className="col-span-4 space-y-2">
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

                      <div className="col-span-8 space-y-2">
                        <label className="text-[10px] font-black text-outline uppercase tracking-widest px-1">Full Legal Name</label>
                        <input
                          required
                          className="w-full px-4 py-3.5 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl outline-none focus:border-primary/50 transition-all font-bold text-sm"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g. Ravindu Rathnayake"
                        />
                      </div>

                      <div className="col-span-6 space-y-2">
                        <label className="text-[10px] font-black text-outline uppercase tracking-widest px-1">Email Address</label>
                        <input
                          type="email"
                          className="w-full px-4 py-3.5 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl outline-none focus:border-primary/50 transition-all font-bold text-sm"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="doctor@hospital.com"
                        />
                      </div>

                      <div className="col-span-6 space-y-2">
                        <label className="text-[10px] font-black text-outline uppercase tracking-widest px-1">Contact Number</label>
                        <input
                          className="w-full px-4 py-3.5 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl outline-none focus:border-primary/50 transition-all font-bold text-sm"
                          value={formData.phone_number}
                          onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                          placeholder="+94 7X XXX XXXX"
                        />
                      </div>
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

      {/* Session Details & Queue Management Drawer */}
      {activeDetailsDoctor && (
        <div className="details-drawer-overlay" onClick={() => {
          if (!isEditingSessions) {
            setActiveDetailsDoctor(null);
          }
        }}>
          <div className="details-drawer animate-in slide-in-from-right duration-300" onClick={(e) => e.stopPropagation()}>
            
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <span className="material-symbols-rounded text-2xl text-primary">clinical_notes</span>
                <div>
                  <h3 className="text-xl font-bold font-display text-on-surface">Specialist Session Details</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Roster & Live Queues</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setActiveDetailsDoctor(null);
                  setIsEditingSessions(false);
                }} 
                className="w-9 h-9 flex items-center justify-center hover:bg-slate-100 rounded-full transition-colors"
              >
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>

            {/* Drawer Content Body */}
            <div className="details-drawer-body">
              {/* Doctor Quick Profile */}
              <div className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] mb-6 flex gap-4 items-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center text-primary font-bold overflow-hidden shadow-inner">
                  {activeDetailsDoctor.raw.profile_image ? (
                    <img src={activeDetailsDoctor.raw.profile_image} alt={activeDetailsDoctor.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-black">
                      {activeDetailsDoctor.name.replace('Dr. ', '').replace('Prof. ', '').split(' ').map(n => n[0]).join('')}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-base text-slate-800 leading-snug">{activeDetailsDoctor.name}</h4>
                  <p className="text-xs font-bold text-primary uppercase tracking-wider mt-0.5">{activeDetailsDoctor.specialty}</p>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium flex items-center gap-1">
                    <span className="material-symbols-rounded text-[11px]">payments</span> Consultation Fee: LKR {activeDetailsDoctor.raw.consultation_fee || 'TBD'}
                  </p>
                </div>
              </div>

              {/* Bio & Details */}
              {activeDetailsDoctor.raw.bio && (
                <div className="mb-6 px-2">
                  <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Professional Profile</h5>
                  <p className="text-xs font-medium text-slate-600 leading-relaxed italic">"{activeDetailsDoctor.raw.bio}"</p>
                </div>
              )}

              {/* Sessions Rosters */}
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Consultation Rosters</h5>
                  {!isEditingSessions && (
                    <button
                      onClick={addDrawerSessionRow}
                      className="text-[11px] font-bold text-primary flex items-center gap-1 hover:underline"
                    >
                      <span className="material-symbols-rounded text-sm">add_circle</span> Add Session
                    </button>
                  )}
                </div>

                {drawerSessions.length === 0 ? (
                  <div className="p-8 border border-dashed border-slate-200 rounded-[2rem] text-center bg-slate-50/50">
                    <span className="material-symbols-rounded text-3xl text-slate-300">event_busy</span>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-wider mt-2">No Scheduled Rosters</p>
                    <p className="text-[10px] text-slate-500 mt-1">Configure shifts to enable this doctor to receive patients.</p>
                    <button
                      onClick={addDrawerSessionRow}
                      className="mt-4 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-xl transition-all"
                    >
                      Add New Session Shift
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    {drawerSessions.map((session, idx) => (
                      <div 
                        key={idx} 
                        className={`p-5 bg-white border rounded-[1.75rem] shadow-[0_4px_20px_rgba(0,0,0,0.01)] transition-all ${
                          session.status === 'ACTIVE' ? 'border-emerald-200 bg-emerald-50/10' : 'border-slate-100'
                        }`}
                      >
                        {/* Session Header */}
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-primary/10 text-primary flex items-center justify-center font-black text-[10px]">
                              #{idx + 1}
                            </span>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Consultation Session</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getSessionStatusBadge(session.status)}`}>
                              {getSessionStatusLabel(session.status)}
                            </span>
                            {isEditingSessions && (
                              <button
                                onClick={() => removeDrawerSessionRow(idx)}
                                className="w-8 h-8 flex items-center justify-center text-rose-500 hover:bg-rose-50 rounded-full transition-all"
                                title="Remove Session"
                              >
                                <span className="material-symbols-rounded text-base">delete</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Edit Mode inputs */}
                        {isEditingSessions ? (
                          <div className="grid grid-cols-12 gap-4">
                            <div className="col-span-6 space-y-1">
                              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Session Date</label>
                              <input
                                type="date"
                                required
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold outline-none focus:border-primary/40 transition-all"
                                value={session.session_date || ''}
                                onChange={(e) => handleDrawerSessionChange(idx, 'session_date', e.target.value)}
                              />
                            </div>
                            <div className="col-span-6 space-y-1">
                              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Room Number</label>
                              <input
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold outline-none focus:border-primary/40 transition-all"
                                value={session.room_number || ''}
                                onChange={(e) => handleDrawerSessionChange(idx, 'room_number', e.target.value)}
                                placeholder="Room 04"
                              />
                            </div>
                            <div className="col-span-8 space-y-1">
                              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Time Slot</label>
                              <div className="flex items-center gap-1 px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg">
                                <input
                                  type="time"
                                  className="w-full bg-transparent text-xs font-bold outline-none"
                                  value={session.start_time || '09:00'}
                                  onChange={(e) => handleDrawerSessionChange(idx, 'start_time', e.target.value)}
                                />
                                <span className="text-[10px] font-bold text-slate-400">TO</span>
                                <input
                                  type="time"
                                  className="w-full bg-transparent text-xs font-bold outline-none"
                                  value={session.end_time || '13:00'}
                                  onChange={(e) => handleDrawerSessionChange(idx, 'end_time', e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="col-span-4 space-y-1">
                              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Patients Limit</label>
                              <input
                                type="number"
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold outline-none focus:border-primary/40 transition-all"
                                value={session.max_patients || 20}
                                onChange={(e) => handleDrawerSessionChange(idx, 'max_patients', parseInt(e.target.value, 10) || 0)}
                              />
                            </div>
                          </div>
                        ) : (
                          /* View Mode Details & Active Queue Ratios */
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex items-center gap-2">
                                <span className="material-symbols-rounded text-sm text-primary/60">calendar_today</span>
                                <span className="text-xs font-bold text-slate-700">
                                  {session.session_date || session.day_of_week || 'N/A'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="material-symbols-rounded text-sm text-primary/60">meeting_room</span>
                                <span className="text-xs font-bold text-slate-700">
                                  {session.room_number || 'Room 04'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="material-symbols-rounded text-sm text-primary/60">schedule</span>
                                <span className="text-xs font-bold text-slate-700">
                                  {session.start_time} - {session.end_time}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="material-symbols-rounded text-sm text-primary/60">groups</span>
                                <span className="text-xs font-bold text-slate-700">
                                  Limit: {session.max_patients} Patients
                                </span>
                              </div>
                            </div>

                            {/* Queue Metrics */}
                            {session.id && (
                              <div className="pt-3 border-t border-slate-50 grid grid-cols-3 gap-2">
                                <div className="p-2 bg-slate-50 rounded-xl text-center">
                                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Bookings</p>
                                  <p className="text-xs font-black text-slate-700">{session.current_bookings || 0} / {session.max_patients}</p>
                                </div>
                                <div className="p-2 bg-amber-50/40 rounded-xl text-center border border-amber-100/20">
                                  <p className="text-[8px] font-black text-amber-500 uppercase tracking-tighter mb-0.5">In Queue</p>
                                  <p className="text-xs font-black text-amber-700">{session.waiting_count || 0} Waiting</p>
                                </div>
                                <div className="p-2 bg-emerald-50/40 rounded-xl text-center border border-emerald-100/20">
                                  <p className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter mb-0.5">Checked In</p>
                                  <p className="text-xs font-black text-emerald-700">{session.checked_in_count || 0}</p>
                                </div>
                              </div>
                            )}

                            {/* Live Session Control Panel */}
                            {session.id && (
                              <div className="pt-2 flex gap-3">
                                {session.status === 'NOT_STARTED' && (
                                  <button
                                    onClick={() => handleStatusUpdate(session.id, 'start')}
                                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-emerald-100 flex items-center justify-center gap-1.5"
                                  >
                                    <span className="material-symbols-rounded text-sm">play_arrow</span> Start Session
                                  </button>
                                )}
                                {session.status === 'ACTIVE' && (
                                  <>
                                    <button
                                      onClick={() => handleStatusUpdate(session.id, 'end')}
                                      className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-rose-100 flex items-center justify-center gap-1.5"
                                    >
                                      <span className="material-symbols-rounded text-sm">stop</span> End Session
                                    </button>
                                    <button
                                      onClick={() => navigate('/admin/queue')}
                                      className="flex-1 py-2.5 bg-primary hover:bg-primary-container text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-primary/10 flex items-center justify-center gap-1.5"
                                    >
                                      <span className="material-symbols-rounded text-sm">monitoring</span> Monitor Queue
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Sticky Footer Actions */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3">
              {isEditingSessions ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setDrawerSessions(activeDetailsDoctor.raw.sessions || []);
                      setIsEditingSessions(false);
                    }}
                    className="flex-1 py-3.5 text-slate-600 font-bold uppercase text-[10px] tracking-widest hover:bg-slate-100 rounded-xl transition-all border border-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveDrawerSessions}
                    disabled={isSavingDrawer}
                    className="flex-[2] py-3.5 bg-primary text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {isSavingDrawer ? 'Saving Changes...' : 'Save Roster Changes'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditingSessions(true)}
                    className="flex-1 py-3.5 bg-primary/10 text-primary font-bold uppercase text-[10px] tracking-widest hover:bg-primary/20 rounded-xl transition-all flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-rounded text-sm">edit_calendar</span> Edit Rosters
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveDetailsDoctor(null);
                    }}
                    className="flex-1 py-3.5 bg-slate-800 text-white font-black uppercase text-[10px] tracking-widest hover:bg-slate-900 rounded-xl transition-all"
                  >
                    Close Details
                  </button>
                </>
              )}
            </div>

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
