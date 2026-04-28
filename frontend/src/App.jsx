import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import KioskHome from './pages/kiosk/KioskHome';
import KioskAIAssistant from './pages/kiosk/KioskAIAssistant';
import KioskQueueStatus from './pages/kiosk/KioskQueueStatus';
import KioskSearchDoctors from './pages/kiosk/KioskSearchDoctors';
import KioskSessions from './pages/kiosk/KioskSessions';
import KioskCheckInOut from './pages/kiosk/KioskCheckInOut';
import KioskManualCheckIn from './pages/kiosk/KioskManualCheckIn';
import KioskCheckOut from './pages/kiosk/KioskCheckOut';
import KioskRegistrationStep1 from './pages/kiosk/KioskRegistrationStep1';
import KioskRegistrationStep2 from './pages/kiosk/KioskRegistrationStep2';
import KioskRegistrationStep3 from './pages/kiosk/KioskRegistrationStep3';
import KioskRegistrationStep4 from './pages/kiosk/KioskRegistrationStep4';
import PatientDashboard from './pages/kiosk/PatientDashboard';
import KioskPatientLogin from './pages/kiosk/KioskPatientLogin';
import KioskPayment from './pages/kiosk/KioskPayment';
import HospitalMap from './pages/kiosk/HospitalMap';

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminAppointments from './pages/admin/AdminAppointments';
import AdminDoctors from './pages/admin/AdminDoctors';
import AdminQueue from './pages/admin/AdminQueue';
import AdminPatients from './pages/admin/AdminPatients';
import HospitalAnalytics from './pages/admin/HospitalAnalytics';
import AdminLogin from './pages/admin/AdminLogin';

import AdminReviews from './pages/admin/AdminReviews';
import AdminSystemHealth from './pages/admin/AdminSystemHealth';
import { AdminSearchProvider } from './context/AdminSearchContext';

import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Kiosk Routes */}
        <Route path="/" element={<KioskHome />} />
        <Route path="/assistant" element={<KioskAIAssistant />} />
        <Route path="/queue" element={<KioskQueueStatus />} />
        <Route path="/doctors" element={<KioskSearchDoctors />} />
        <Route path="/sessions" element={<KioskSessions />} />
        <Route path="/checkin-out" element={<KioskCheckInOut />} />
        <Route path="/manual-checkin" element={<KioskManualCheckIn />} />
        <Route path="/checkout" element={<KioskCheckOut />} />
        <Route path="/register/step1" element={<KioskRegistrationStep1 />} />
        <Route path="/register/step2" element={<KioskRegistrationStep2 />} />
        <Route path="/register/step3" element={<KioskRegistrationStep3 />} />
        <Route path="/register/step4" element={<KioskRegistrationStep4 />} />
        <Route path="/patient-dashboard" element={<PatientDashboard />} />
        <Route path="/patient-login" element={<KioskPatientLogin />} />
        <Route path="/payment" element={<KioskPayment />} />
        <Route path="/hospital-map" element={<HospitalMap />} />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminSearchProvider><AdminLayout /></AdminSearchProvider>}>
          <Route index element={<AdminDashboard />} />
          <Route path="appointments" element={<AdminAppointments />} />
          <Route path="doctors" element={<AdminDoctors />} />
          <Route path="queue" element={<AdminQueue />} />
          <Route path="patients" element={<AdminPatients />} />
          <Route path="analytics" element={<HospitalAnalytics />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="system-health" element={<AdminSystemHealth />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
