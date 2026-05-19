import React, { useEffect, useMemo, useState } from 'react';
import { apiService } from '../../services/apiService';
import { socketService } from '../../services/socketService';

const statusTabs = ['All', 'Pending', 'Approved', 'Rejected'];

const requestTypeLabels = {
  NEW_SESSION_REQUEST: 'New Session',
  RESCHEDULE_REQUEST: 'Reschedule',
  CANCEL_REQUEST: 'Cancellation',
  ARRIVAL_CONFIRMATION: 'Arrival Confirmation'
};

const formatDate = (value) => {
  if (!value) return 'Not specified';
  const dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? value : dt.toLocaleDateString();
};

const AdminDoctorRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('Pending');
  const [notes, setNotes] = useState({});
  const [submittingId, setSubmittingId] = useState(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiService.getAdminDoctorRequests(activeTab === 'All' ? null : activeTab);
      setRequests(data || []);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 404) {
        setError('Doctor request tools are not available from the backend yet. Restart the backend and open this page again.');
      } else {
        setError(err.response?.data?.message || err.response?.data?.error || 'Unable to load doctor requests.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [activeTab]);

  useEffect(() => {
    socketService.connect();
    const refresh = () => fetchRequests();
    socketService.on('doctor_request_created', refresh);
    socketService.on('doctor_request_updated', refresh);

    return () => {
      socketService.off('doctor_request_created', refresh);
      socketService.off('doctor_request_updated', refresh);
    };
  }, [activeTab]);

  const pendingCount = useMemo(
    () => requests.filter((item) => item.status === 'Pending').length,
    [requests]
  );

  const handleReview = async (requestId, status) => {
    try {
      setSubmittingId(requestId);
      setError('');
      await apiService.reviewDoctorRequest(requestId, {
        status,
        admin_note: notes[requestId] || ''
      });
      await fetchRequests();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.response?.data?.error || 'Unable to update doctor request.');
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold font-display text-on-surface tracking-tight">Doctor Requests</h2>
          <p className="text-sm text-on-surface-variant font-medium mt-1">
            Review session requests, approvals, rejections, and doctor arrival confirmations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchRequests}
            className="px-4 py-2.5 rounded-2xl border border-outline-variant/20 bg-white text-xs font-black uppercase tracking-widest text-on-surface hover:border-primary/20 hover:text-primary transition-all"
          >
            Refresh
          </button>
          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-outline-variant/20 shadow-sm">
            <span className="material-symbols-rounded text-primary">pending_actions</span>
            <span className="text-xs font-black uppercase tracking-widest text-on-surface">
              {pendingCount} Pending Review
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-600">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {statusTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === tab
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'bg-white text-outline border border-outline-variant/20 hover:border-primary/20 hover:text-primary'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full py-16 text-center text-on-surface-variant font-bold">
            Loading doctor requests...
          </div>
        ) : requests.length === 0 ? (
          <div className="col-span-full rounded-[2rem] border border-dashed border-outline-variant/30 bg-white p-14 text-center">
            <span className="material-symbols-rounded text-4xl text-outline-variant/40">inventory_2</span>
            <p className="mt-3 text-xs font-black uppercase tracking-widest text-outline">No doctor requests found</p>
          </div>
        ) : (
          requests.map((item) => (
            <div key={item.id} className="rounded-[2rem] bg-white border border-outline-variant/15 shadow-sm p-6 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.22em]">
                      {requestTypeLabels[item.request_type] || item.request_type}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.22em] ${
                      item.status === 'Approved'
                        ? 'bg-emerald-50 text-emerald-600'
                        : item.status === 'Rejected'
                          ? 'bg-rose-50 text-rose-600'
                          : 'bg-amber-50 text-amber-700'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-on-surface">{item.doctor_name}</h3>
                  <p className="text-xs font-bold uppercase tracking-widest text-outline mt-1">
                    {item.department || 'Department N/A'} | {item.specialization || 'Specialization N/A'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-outline">Submitted</p>
                  <p className="mt-1 text-sm font-bold text-on-surface">{formatDate(item.created_at)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <MetaCard label="Requested Date" value={formatDate(item.requested_date)} />
                <MetaCard label="Requested Time" value={item.requested_start_time ? `${item.requested_start_time} - ${item.requested_end_time || 'TBD'}` : 'Not specified'} />
                <MetaCard label="Room" value={item.requested_room_number || item.session?.room_number || 'Not specified'} />
                <MetaCard label="Patients Limit" value={item.requested_max_patients || item.session?.max_patients || 'Not specified'} />
              </div>

              {item.reason && (
                <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-outline mb-2">Doctor Note</p>
                  <p className="text-sm font-medium text-on-surface-variant leading-relaxed">{item.reason}</p>
                </div>
              )}

              {item.session && (
                <div className="rounded-2xl bg-primary/5 border border-primary/10 px-4 py-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Linked Session</p>
                  <p className="text-sm font-bold text-on-surface">
                    Session {item.session.session_number || 'N/A'} | {item.session.session_date || item.session.day_of_week || 'Date TBA'} | Room {item.session.room_number || 'TBA'}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-outline ml-1">Admin Note</label>
                <textarea
                  value={notes[item.id] ?? item.admin_note ?? ''}
                  onChange={(e) => setNotes((prev) => ({ ...prev, [item.id]: e.target.value }))}
                  className="w-full min-h-[96px] resize-none rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm font-medium text-on-surface outline-none focus:border-primary/20 focus:bg-white transition-all"
                  placeholder="Add approval or rejection notes for the doctor..."
                />
              </div>

              {item.status === 'Pending' ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleReview(item.id, 'Approved')}
                    disabled={submittingId === item.id}
                    className="flex-1 py-3.5 rounded-2xl bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all disabled:opacity-60"
                  >
                    {submittingId === item.id ? 'Saving...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleReview(item.id, 'Rejected')}
                    disabled={submittingId === item.id}
                    className="flex-1 py-3.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 font-bold hover:bg-rose-600 hover:text-white transition-all disabled:opacity-60"
                  >
                    {submittingId === item.id ? 'Saving...' : 'Reject'}
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs font-bold text-on-surface-variant">
                  Review complete. This request is currently marked as <span className="text-on-surface">{item.status}</span>.
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const MetaCard = ({ label, value }) => (
  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-4">
    <p className="text-[10px] font-black uppercase tracking-widest text-outline">{label}</p>
    <p className="mt-2 text-sm font-bold text-on-surface">{value}</p>
  </div>
);

export default AdminDoctorRequests;
