import React from 'react';
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

// Switch between pages here for preview.
// Options: 'home' | 'assistant' | 'queue' | 'doctors' | 'sessions' | 'checkin' | 'manualcheckin' | 'checkout' | 'register-step1' | 'register-step2' | 'register-step3' | 'register-step4'
const CURRENT_PAGE = 'register-step4';

function App() {
  if (CURRENT_PAGE === 'assistant')     return <KioskAIAssistant />;
  if (CURRENT_PAGE === 'queue')         return <KioskQueueStatus />;
  if (CURRENT_PAGE === 'doctors')       return <KioskSearchDoctors />;
  if (CURRENT_PAGE === 'sessions')      return <KioskSessions />;
  if (CURRENT_PAGE === 'checkin')       return <KioskCheckInOut />;
  if (CURRENT_PAGE === 'manualcheckin') return <KioskManualCheckIn />;
  if (CURRENT_PAGE === 'checkout')      return <KioskCheckOut />;
  if (CURRENT_PAGE === 'register-step1') return <KioskRegistrationStep1 />;
  if (CURRENT_PAGE === 'register-step2') return <KioskRegistrationStep2 />;
  if (CURRENT_PAGE === 'register-step3') return <KioskRegistrationStep3 />;
  if (CURRENT_PAGE === 'register-step4') return <KioskRegistrationStep4 />;
  return <KioskHome />;
}

export default App;
