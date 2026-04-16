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
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
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
      </Routes>
    </Router>
  );
}

export default App;
