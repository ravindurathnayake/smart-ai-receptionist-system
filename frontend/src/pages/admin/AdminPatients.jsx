import React from 'react';
import './AdminPatients.css';

const AdminPatients = () => {
  const patients = [
    { id: 'PAT-4821', name: 'Kasun Rathnayake', age: '32', gender: 'Male', lastVisit: '2023-10-12', blood: 'O+', contact: '071XXXXXXX' },
    { id: 'PAT-4822', name: 'Dilini Jayasekara', age: '28', gender: 'Female', lastVisit: '2023-10-15', blood: 'A-', contact: '077XXXXXXX' },
    { id: 'PAT-4823', name: 'Sahan Mendis', age: '45', gender: 'Male', lastVisit: 'Yesterday', blood: 'B+', contact: '075XXXXXXX' },
    { id: 'PAT-4824', name: 'Aruni Wijewardene', age: '52', gender: 'Female', lastVisit: '2023-09-28', blood: 'AB+', contact: '011XXXXXXX' },
  ];

  return (
    <div className="patients-wrapper admin-page-transition">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold font-display text-on-surface tracking-tight">Patient Records</h2>
          <p className="text-sm text-on-surface-variant mt-1 font-medium">Search and manage digital health identities.</p>
        </div>
        <button className="bg-primary text-white px-8 py-3.5 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
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
        />
        <button className="bg-surface-container hover:bg-primary/10 hover:text-primary transition-all p-2.5 rounded-xl">
          <span className="material-symbols-rounded">filter_alt</span>
        </button>
      </div>

      <div className="patient-grid">
        {patients.map((patient, idx) => (
          <div key={idx} className="patient-card group">
            <div className="flex items-start justify-between mb-6">
              <div className="patient-avatar-large group-hover:scale-110 transition-transform">
                {patient.name[0]}
              </div>
              <div className="text-right">
                 <span className="text-[10px] font-black text-outline uppercase tracking-widest">{patient.id}</span>
                 <div className="mt-1 px-3 py-1 bg-secondary/10 text-secondary border border-secondary/20 rounded-full text-[10px] font-black uppercase tracking-wider">Active Patient</div>
              </div>
            </div>

            <h3 className="text-xl font-bold text-on-surface font-display mb-6 group-hover:text-primary transition-colors">{patient.name}</h3>

            <div className="space-y-1">
              <div className="patient-info-row">
                <span className="patient-info-label">Age / Sex</span>
                <span className="patient-info-value">{patient.age}Y • {patient.gender}</span>
              </div>
              <div className="patient-info-row">
                <span className="patient-info-label">Blood Type</span>
                <span className="patient-info-value">{patient.blood}</span>
              </div>
              <div className="patient-info-row">
                <span className="patient-info-label">Last Visit</span>
                <span className="patient-info-value">{patient.lastVisit}</span>
              </div>
            </div>

            <div className="patient-card-footer">
              <button className="text-[13px] font-bold text-primary hover:underline underline-offset-4 flex items-center gap-2 decoration-2">
                <span className="material-symbols-rounded text-lg">description</span>
                Medical History
              </button>
              <button className="w-10 h-10 bg-surface-container rounded-xl flex items-center justify-center text-outline hover:bg-primary hover:text-white transition-all">
                 <span className="material-symbols-rounded">more_horiz</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminPatients;
