import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import './AdminDashboard.css'; // Reuse some styles or create AdminReviews.css

const AdminReviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReview, setSelectedReview] = useState(null);
    const [adminResponse, setAdminResponse] = useState('');
    const [filter, setFilter] = useState('all'); // all, complaints, reviews

    const fetchReviews = async () => {
        try {
            const response = await apiService.getAllReviews();
            if (response.success) {
                setReviews(response.data);
            }
        } catch (err) {
            console.error("Failed to fetch reviews:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    const handleRespond = async () => {
        if (!selectedReview || !adminResponse) return;
        try {
            await apiService.respondToReview(selectedReview.id, {
                admin_response: adminResponse,
                status: 'Resolved'
            });
            setSelectedReview(null);
            setAdminResponse('');
            fetchReviews();
        } catch (err) {
            console.error("Failed to respond:", err);
            alert("Failed to send response");
        }
    };

    const filteredReviews = reviews.filter(r => {
        if (filter === 'complaints') return r.is_complaint;
        if (filter === 'reviews') return !r.is_complaint;
        return true;
    });

    return (
        <div className="p-8">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-3xl font-bold font-display text-on-surface tracking-tight">Patient Feedback</h2>
                    <p className="text-sm text-on-surface-variant mt-1 font-medium">Manage reviews and resolve patient complaints.</p>
                </div>
                <div className="flex gap-2 bg-surface-container p-1.5 rounded-2xl border border-outline-variant/10">
                    <button 
                        onClick={() => setFilter('all')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === 'all' ? 'bg-primary text-white shadow-lg' : 'text-on-surface-variant hover:bg-white'}`}
                    >
                        All
                    </button>
                    <button 
                        onClick={() => setFilter('complaints')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === 'complaints' ? 'bg-error text-white shadow-lg' : 'text-on-surface-variant hover:bg-white'}`}
                    >
                        Complaints
                    </button>
                    <button 
                        onClick={() => setFilter('reviews')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === 'reviews' ? 'bg-success text-white shadow-lg' : 'text-on-surface-variant hover:bg-white'}`}
                    >
                        Reviews
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {filteredReviews.length > 0 ? filteredReviews.map((review) => (
                    <div key={review.id} className={`bg-white rounded-[2.5rem] p-8 border border-outline-variant/20 shadow-sm transition-all hover:shadow-md ${review.is_complaint ? 'border-l-8 border-l-error' : 'border-l-8 border-l-success'}`}>
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-6">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black ${review.is_complaint ? 'bg-error/10 text-error' : 'bg-success/10 text-success'}`}>
                                    {review.is_complaint ? '!' : review.rating}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-on-surface">{review.patient_name}</h3>
                                    <p className="text-sm text-on-surface-variant font-semibold flex items-center gap-2 mt-1">
                                        <span className="material-symbols-rounded text-sm">medical_information</span>
                                        Consulted {review.specialist_name}
                                        <span className="opacity-30">•</span>
                                        <span className="text-[10px] uppercase tracking-widest">{review.created_at}</span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <span key={s} className={`material-symbols-rounded text-lg ${review.rating >= s ? 'text-yellow-500' : 'text-slate-200'}`} style={{ fontVariationSettings: review.rating >= s ? "'FILL' 1" : "" }}>star</span>
                                    ))}
                                </div>
                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                    review.status === 'Resolved' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning animate-pulse'
                                }`}>
                                    {review.status}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Review Content</p>
                                <p className="text-sm font-bold text-on-surface leading-relaxed">"{review.review_text || 'No comment provided.'}"</p>
                            </div>

                            {review.is_complaint && (
                                <div className="bg-error/5 p-6 rounded-2xl border border-error/10">
                                    <p className="text-[10px] font-black text-error uppercase tracking-widest mb-2">Formal Complaint</p>
                                    <p className="text-sm font-black text-error leading-relaxed">{review.complaint_text}</p>
                                </div>
                            )}

                            {review.admin_response ? (
                                <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 ml-12 relative">
                                    <div className="absolute -left-6 top-6 w-6 h-px bg-primary/20"></div>
                                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">Admin Response</p>
                                    <p className="text-sm font-bold text-on-surface leading-relaxed">{review.admin_response}</p>
                                </div>
                            ) : (
                                <div className="pt-4 flex justify-end">
                                    <button 
                                        onClick={() => setSelectedReview(review)}
                                        className="px-8 py-3 bg-primary text-white rounded-xl font-bold text-xs hover:bg-primary/90 transition-all shadow-lg active:scale-95 flex items-center gap-2"
                                    >
                                        <span className="material-symbols-rounded text-sm">reply</span>
                                        Respond to Patient
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-outline-variant/20">
                        <span className="material-symbols-rounded text-6xl text-outline-variant mb-4 block">rate_review</span>
                        <h3 className="text-xl font-bold text-on-surface">No feedback records found</h3>
                        <p className="text-sm text-on-surface-variant font-medium mt-1">Patients will see review options after their sessions.</p>
                    </div>
                )}
            </div>

            {/* Response Modal */}
            {selectedReview && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-6 animate-fade-in">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedReview(null)}></div>
                    <div className="bg-white rounded-[3rem] w-full max-w-xl relative z-10 shadow-2xl overflow-hidden border border-white">
                        <div className="p-10">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h2 className="text-3xl font-bold font-display tracking-tight text-on-surface">Admin Response</h2>
                                    <p className="text-sm font-bold text-slate-500 mt-1">To: {selectedReview.patient_name}</p>
                                </div>
                                <button onClick={() => setSelectedReview(null)} className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-primary transition-colors">
                                    <span className="material-symbols-rounded">close</span>
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Original Feedback</p>
                                    <p className="text-sm font-bold text-on-surface italic">"{selectedReview.review_text}"</p>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-2">Your Response</label>
                                    <textarea 
                                        className="w-full p-6 bg-slate-50 border-none rounded-[2rem] text-sm font-bold placeholder:text-slate-300 focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all min-h-[150px]"
                                        placeholder="Write your message to the patient..."
                                        value={adminResponse}
                                        onChange={(e) => setAdminResponse(e.target.value)}
                                    ></textarea>
                                </div>

                                <button 
                                    onClick={handleRespond}
                                    className="w-full py-5 bg-primary text-white rounded-[2rem] font-black text-lg hover:scale-[1.02] active:scale-[0.95] transition-all shadow-xl flex items-center justify-center gap-3"
                                >
                                    Send Response
                                    <span className="material-symbols-rounded">send</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminReviews;
