import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../services/apiService';
import { socketService } from '../../services/socketService';
import { voiceService } from '../../services/voiceService';
import { useAdminSearch } from '../../context/AdminSearchContext';
import ConfirmModal from '../../components/common/ConfirmModal';
import './AdminQueue.css';

const AdminQueue = () => {
  const { searchQuery } = useAdminSearch();
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(voiceService.isVoiceEnabled);
  const [voiceLang, setVoiceLang] = useState(voiceService.language);
  const [showEndSessionConfirm, setShowEndSessionConfirm] = useState(false);
  const [sessionToEnd, setSessionToEnd] = useState(null);

  const fetchQueueData = useCallback(async () => {
    try {
      const data = await apiService.getSessionsQueues();
      if (Array.isArray(data)) {
        setSessions(data);
        if (!activeSessionId && data.length > 0) {
           setActiveSessionId(data[0].session_id);
        }
      }
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch sessions queue:', err);
      setError('Could not load queue data.');
      setLoading(false);
    }
  }, [activeSessionId]);

  useEffect(() => {
    fetchQueueData();

    // CONNECT SOCKET
    socketService.connect();
    
    // LISTEN FOR UPDATES
    socketService.on('queue_updated', (data) => {
      console.log('Real-time Queue Update:', data);
      fetchQueueData();
      
      // AUTO-ANNOUNCE IF CALL_NEXT
      if (data.type === 'call_next' && data.token && data.room) {
         voiceService.announcePatient(data.token, data.room);
      }
    });

    socketService.on('session_status_changed', () => {
      fetchQueueData();
    });

    return () => {
      socketService.off('queue_updated');
      socketService.off('session_status_changed');
    };
  }, [fetchQueueData]);

  useEffect(() => {
    let result = [...sessions];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => 
        (s.doctor && s.doctor.toLowerCase().includes(q)) || 
        (s.department && s.department.toLowerCase().includes(q)) ||
        (s.specialization && s.specialization.toLowerCase().includes(q))
      );
    }
    setFilteredSessions(result);

    // If active session is filtered out, select the first one of filtered results
    if (result.length > 0 && !result.find(s => s.session_id === activeSessionId)) {
      setActiveSessionId(result[0].session_id);
    }
  }, [sessions, searchQuery, activeSessionId]);

  const handleCallNext = async (sessionId) => {
    try {
      await apiService.callNextPatient(sessionId);
      fetchQueueData();
    } catch (err) {
      alert("Error calling next patient");
    }
  };

  const handleStartSession = async (sessionId) => {
    try {
      await apiService.startSession(sessionId);
      fetchQueueData();
    } catch (err) {
      alert("Error starting session");
    }
  };

  const handleTogglePause = async (sessionId) => {
    try {
      await apiService.toggleSessionPause(sessionId);
      fetchQueueData();
    } catch (err) {
      alert("Error toggling pause");
    }
  };

  const handleEndSession = (sessionId) => {
    setSessionToEnd(sessionId);
    setShowEndSessionConfirm(true);
  };

  const handleConfirmEndSession = async () => {
    if (!sessionToEnd) return;
    try {
      await apiService.endSession(sessionToEnd);
      setShowEndSessionConfirm(false);
      setSessionToEnd(null);
      fetchQueueData();
    } catch (err) {
      console.error('Error ending session:', err);
      alert("Error ending session");
    }
  };

  const handleSkipPatient = async (queueId) => {
    try {
      await apiService.skipPatient(queueId);
      fetchQueueData();
    } catch (err) {
      alert("Error skipping patient");
    }
  };

  if (loading) return <div className="p-10 text-center">Loading Queue Control Center...</div>;
  if (error) return <div className="p-10 text-center text-error">{error}</div>;

  const activeSession = filteredSessions.find(s => s.session_id === activeSessionId) || filteredSessions[0];

  return (
    <div className="queue-wrapper">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold font-display text-on-surface tracking-tight">Queue Control Center</h2>
          <p className="text-sm text-on-surface-variant mt-1 font-medium">Real-time management of active doctor sessions and patient flow.</p>
        </div>
        <div className="flex gap-4">
           <div className="bg-surface-container px-4 py-2 rounded-xl flex items-center gap-2 border border-outline-variant/10">
             <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
             <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Live Sync Active</span>
           </div>
           
           <button 
             onClick={() => {
               const newState = !isVoiceEnabled;
               setIsVoiceEnabled(newState);
               voiceService.setVoiceEnabled(newState);
             }}
             className={`px-4 py-2 rounded-xl flex items-center gap-2 border transition-all ${
               isVoiceEnabled 
               ? 'bg-secondary/10 border-secondary/20 text-secondary' 
               : 'bg-surface-container border-outline-variant/10 text-on-surface-variant opacity-60'
             }`}
           >
             <span className="material-symbols-rounded text-lg">
               {isVoiceEnabled ? 'volume_up' : 'volume_off'}
             </span>
             <span className="text-xs font-bold uppercase tracking-wider">
               Voice: {isVoiceEnabled ? 'ON' : 'OFF'}
             </span>
           </button>

           <button 
             onClick={() => {
               const newLang = voiceLang === 'en-US' ? 'si-LK' : 'en-US';
               setVoiceLang(newLang);
               voiceService.setLanguage(newLang);
             }}
             className="px-4 py-2 rounded-xl flex items-center gap-2 border border-outline-variant/10 bg-surface-container text-on-surface-variant hover:bg-primary/5 hover:text-primary transition-all"
           >
             <span className="material-symbols-rounded text-lg">language</span>
             <span className="text-xs font-bold uppercase tracking-wider">
               {voiceLang === 'en-US' ? 'EN' : 'SI'}
             </span>
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar: Sessions List */}
        <div className="lg:col-span-4 space-y-4">
           <h3 className="text-xs font-black text-outline uppercase tracking-widest mb-4">Active Sessions</h3>
           <div className="space-y-3">
             {filteredSessions.length === 0 ? (
               <div className="p-8 text-center bg-surface-container/20 rounded-2xl border border-dashed border-outline-variant/30">
                 <p className="text-xs font-bold text-outline-variant uppercase tracking-widest">No matching sessions</p>
               </div>
             ) : (
               filteredSessions.map((session) => (
               <div 
                 key={session.session_id} 
                 onClick={() => setActiveSessionId(session.session_id)}
                 className={`session-card p-4 rounded-2xl cursor-pointer transition-all border-2 ${
                    activeSessionId === session.session_id 
                    ? 'bg-primary/5 border-primary shadow-md' 
                    : 'bg-white border-transparent hover:border-outline-variant/30 grayscale-[0.5] opacity-80'
                 }`}
               >
                 <div className="flex justify-between items-start mb-2">
                   <div>
                     <p className="text-xs font-bold text-primary uppercase tracking-tighter">{session.department}</p>
                     <h4 className="font-bold text-on-surface">{session.doctor}</h4>
                   </div>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                      session.status?.toUpperCase() === 'ACTIVE' ? 'bg-success/10 text-success' : 
                      session.status?.toUpperCase() === 'PAUSED' ? 'bg-warning/10 text-warning' :
                      session.status?.toUpperCase() === 'ENDED' || session.status?.toUpperCase() === 'COMPLETED' ? 'bg-error/10 text-error' :
                      'bg-outline-variant text-outline'
                   }`}>
                     {session.status?.replace('_', ' ')}
                   </span>
                 </div>
                 <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-rounded text-sm text-on-surface-variant">groups</span>
                      <span className="text-xs font-bold text-on-surface-variant">{session.waiting_count} Waiting</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-rounded text-sm text-primary">schedule</span>
                      <span className="text-xs font-bold text-primary">Session {session.session_number}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-rounded text-sm text-on-surface-variant">meeting_room</span>
                      <span className="text-xs font-bold text-on-surface-variant">{session.room}</span>
                    </div>
                 </div>
               </div>
               ))
             )}
           </div>
        </div>

        {/* Right Content: Active Session Controls */}
        <div className="lg:col-span-8">
           {activeSession ? (
             <div className="space-y-6">
                {/* Active Patient Hero */}
                <div className="bg-white rounded-3xl p-8 border border-outline-variant/10 shadow-sm relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-8 -mt-8"></div>
                   
                   <div className="flex items-center justify-between relative z-10">
                      <div>
                        <p className="text-xs font-black text-primary uppercase tracking-widest mb-2">Currently Serving</p>
                        {activeSession.current_patient ? (
                          <>
                            <h3 className="text-4xl font-black text-on-surface font-display mb-1">{activeSession.current_patient.name}</h3>
                            <div className="flex items-center gap-3">
                              <span className="bg-primary text-white px-3 py-1 rounded-lg font-black text-lg">{activeSession.current_patient.token}</span>
                              <span className="text-on-surface-variant font-medium">In consultation with {activeSession.doctor}</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <h3 className="text-4xl font-black text-on-surface-variant/30 font-display">
                               {activeSession.status?.toUpperCase() === 'NOT_STARTED' ? 'Session Not Started' :
                                activeSession.status?.toUpperCase() === 'PAUSED' ? 'Session Paused' :
                                (activeSession.status?.toUpperCase() === 'ENDED' || activeSession.status?.toUpperCase() === 'COMPLETED') ? 'Session Ended' :
                                'No Active Patient'}
                            </h3>
                            <p className="text-on-surface-variant font-medium">
                               {activeSession.status?.toUpperCase() === 'NOT_STARTED' ? 'Please start the session to begin calling patients.' :
                                activeSession.status?.toUpperCase() === 'PAUSED' ? 'Queue calling is temporarily paused.' :
                                (activeSession.status?.toUpperCase() === 'ENDED' || activeSession.status?.toUpperCase() === 'COMPLETED') ? 'No further queue calls are allowed.' :
                                'Click Call Next Patient to begin.'}
                            </p>
                          </>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-3">
                        {activeSession.status?.toUpperCase() === 'NOT_STARTED' ? (
                           <div className="flex flex-col gap-4">
                              <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center gap-3">
                                 <span className="material-symbols-rounded text-amber-600">info</span>
                                 <p className="text-xs font-bold text-amber-700">Doctor has not arrived yet. Mark arrival to begin the session.</p>
                              </div>
                              <button 
                                onClick={() => handleStartSession(activeSession.session_id)}
                                className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 hover:scale-[1.02] active:scale-[0.98] transition-all"
                              >
                                <span className="material-symbols-rounded">how_to_reg</span>
                                Doctor Arrived & Start Session
                              </button>
                           </div>
                        ) : (
                          <>
                            <button 
                              onClick={() => handleCallNext(activeSession.session_id)}
                              disabled={activeSession.waiting_count === 0 && !activeSession.current_patient || activeSession.status?.toUpperCase() !== 'ACTIVE'}
                              className="bg-primary text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale disabled:scale-100"
                            >
                              <span className="material-symbols-rounded">campaign</span>
                              Call Next Patient
                            </button>
                            <div className="flex gap-2">
                               <button 
                                onClick={() => handleTogglePause(activeSession.session_id)}
                                disabled={activeSession.status?.toUpperCase() === 'ENDED' || activeSession.status?.toUpperCase() === 'COMPLETED'}
                                className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all ${
                                   activeSession.status?.toUpperCase() === 'PAUSED' 
                                   ? 'bg-success/5 border-success text-success' 
                                   : 'bg-white border-outline-variant/30 text-on-surface hover:bg-surface-container'
                                }`}
                               >
                                 {activeSession.status?.toUpperCase() === 'PAUSED' ? 'Resume Queue' : 'Pause Queue'}
                               </button>
                               <button 
                                 onClick={() => handleEndSession(activeSession.session_id)}
                                 disabled={activeSession.status?.toUpperCase() === 'ENDED' || activeSession.status?.toUpperCase() === 'COMPLETED'}
                                 className="flex-1 bg-rose-50 border-2 border-rose-100 text-rose-600 py-3 rounded-xl font-bold hover:bg-rose-600 hover:text-white transition-all disabled:opacity-30 shadow-sm"
                               >
                                 Doctor Left & End Session
                               </button>
                            </div>
                          </>
                        )}
                      </div>
                   </div>
                </div>

                {/* Waiting List */}
                <div className="bg-white rounded-3xl border border-outline-variant/10 shadow-sm overflow-hidden">
                   <div className="px-6 py-4 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container/30">
                      <h4 className="font-bold text-on-surface">Waiting List ({activeSession.waiting_count})</h4>
                      <div className="flex gap-2">
                         <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-black rounded uppercase">FIFO Order</span>
                      </div>
                   </div>
                   
                   <div className="p-4 max-h-[500px] overflow-y-auto no-scrollbar">
                      {activeSession.waiting_list.length > 0 ? (
                        <div className="space-y-2">
                           {activeSession.waiting_list.map((item) => (
                             <div key={item.id} className="flex items-center gap-4 p-4 rounded-2xl border border-transparent hover:border-outline-variant/30 hover:bg-surface-container/20 transition-all group">
                                <div className="w-12 h-12 bg-surface-container rounded-xl flex items-center justify-center font-black text-primary text-xs">
                                   {item.token.split('-')[1]}
                                </div>
                                <div className="flex-1">
                                   <div className="flex items-center gap-2">
                                      <h5 className="font-bold text-on-surface">{item.patient}</h5>
                                      {item.priority !== 'Normal' && (
                                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                                          item.priority === 'Emergency' ? 'bg-error text-white' : 'bg-warning-container text-on-warning-container'
                                        }`}>
                                          {item.priority}
                                        </span>
                                      )}
                                   </div>
                                   <p className="text-[10px] text-on-surface-variant font-medium">Wait Time: {item.waitTime} • ID: PAT-{item.patient_id.toString().padStart(4, '0')}</p>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <button 
                                     onClick={() => handleSkipPatient(item.id)}
                                     title="Mark as Missed"
                                     className="p-2 rounded-lg bg-surface-container text-on-surface-variant hover:bg-error hover:text-white transition-all"
                                   >
                                      <span className="material-symbols-rounded text-sm">person_remove</span>
                                   </button>
                                   <button 
                                     title="Transfer Patient"
                                     className="p-2 rounded-lg bg-surface-container text-on-surface-variant hover:bg-primary hover:text-white transition-all"
                                   >
                                      <span className="material-symbols-rounded text-sm">move_up</span>
                                   </button>
                                </div>
                             </div>
                           ))}
                        </div>
                      ) : (
                        <div className="py-20 text-center">
                           <span className="material-symbols-rounded text-4xl text-on-surface-variant/20 mb-2">task_alt</span>
                           <p className="text-on-surface-variant font-medium">All patients served for this session.</p>
                        </div>
                      )}
                   </div>
                </div>
             </div>
           ) : (
             <div className="h-full flex items-center justify-center bg-white rounded-3xl border border-dashed border-outline-variant/30">
                <p className="text-on-surface-variant font-medium">Select a session from the sidebar to manage.</p>
             </div>
           )}
        </div>
      </div>

      <ConfirmModal 
        isOpen={showEndSessionConfirm}
        title="End Medical Session?"
        message="Are you sure you want to end this session? All remaining waiting patients will be removed from the queue."
        confirmText="End Session"
        cancelText="Continue Serving"
        onConfirm={handleConfirmEndSession}
        onCancel={() => setShowEndSessionConfirm(false)}
        type="warning"
      />
    </div>
  );
};

export default AdminQueue;
