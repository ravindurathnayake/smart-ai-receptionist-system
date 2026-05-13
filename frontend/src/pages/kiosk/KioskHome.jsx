import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../../components/common/Logo';
import './KioskHome.css';
import { apiService } from '../../services/apiService';
import { socketService } from '../../services/socketService';

import AvatarImage from '../../assets/ai_receptionist_avatar.png';
import Spline from '@splinetool/react-spline';

const translations = {
  en: {
    welcome: "Ayubowan, Welcome",
    hospitalName: "Colombo Central General Hospital",
    howCanIHelp: "How can I assist you today?",
    description: "I can help you check-in, find a doctor, or register as a new patient. Just ask!",
    tryLabel: "Try:",
    emergency: "Emergency Assistance",
    personalDashboard: "Personal Dashboard",
    quickCheckIn: "Quick Check-In",
    newPatient: "New Patient",
    findDoctors: "Find Doctors",
    hospitalMap: "Hospital Map",
    liveQueue: "LIVE QUEUE STATUS",
    login: "Login",
    checkOut: "Check-Out",
    admin: "Admin",
    help: "Help",
    accessProfile: "Access Profile",
    viewProfile: "View Profile",
    checkInNow: "Check-In Now",
    getStarted: "Get Started",
    searchDirectory: "Search Directory",
    viewMap: "View Map",
    typeMessage: "Type your message...",
    send: "Send",
    clearConversation: "Clear Conversation",
    smartAIActive: "Smart AI Active",
    ayubowan: "Ayubowan",
    medicalHistory: "Medical history & profile",
    scanAppointment: "Scan appointment or NIC",
    registerFirstTime: "Register for first time",
    specialistsAvailability: "Specialists availability",
    facilitiesNavigation: "Facilities navigation",
    helpTitle: "Kiosk Support Center",
    quickGuide: "Quick Guide",
    faqs: "FAQs",
    guideDesc: "Learn how to use the MediAssist Smart Kiosk",
    faqDesc: "Commonly asked questions and hospital information",
    close: "Close",
    faq1: "How do I check-in for my appointment?",
    faq1_ans: "Simply click on 'Quick Check-In' and scan your NIC or enter your appointment token.",
    faq2: "Where can I find the pharmacy?",
    faq2_ans: "The pharmacy is located on the Ground Floor, next to the Main Entrance.",
    faq3: "How do I pay for my consultation?",
    faq3_ans: "You can pay at any payment kiosk or the main billing counter on the 1st floor.",
    faq4: "Can I register as a new patient here?",
    faq4_ans: "Yes! Click the 'New Patient' card on the home screen to start your registration.",
    guide1_title: "Smart AI Assistant",
    guide1_desc: "Type or speak to our AI bot for any health-related questions or hospital info.",
    guide2_title: "Emergency Actions",
    guide2_desc: "Use the red button for immediate medical assistance or staff alerts.",
    guide3_title: "Dashboard & Queue",
    guide3_desc: "Check your profile, scan your token, and monitor live wait times at the bottom."
  },
  si: {
    welcome: "ආයුබෝවන්, සාදරයෙන් පිළිගනිමු",
    hospitalName: "කොළඹ මධ්‍යම මහ රෝහල",
    howCanIHelp: "අද මම ඔබට සහය වන්නේ කෙසේද?",
    description: "මට ඔබට ඇතුළත් වීමට, වෛද්‍යවරයකු සොයා ගැනීමට හෝ නව රෝගියෙකු ලෙස ලියාපදිංචි වීමට උදවු කළ හැක. අසන්න!",
    tryLabel: "උත්සාහ කරන්න:",
    emergency: "හදිසි සහය",
    personalDashboard: "පුද්ගලික උපකරණ පුවරුව",
    quickCheckIn: "ඉක්මන් ඇතුළත් වීම",
    newPatient: "නව රෝගියා",
    findDoctors: "වෛද්‍යවරුන් සොයන්න",
    hospitalMap: "රෝහල් සිතියම",
    liveQueue: "සජීවී පෝලිම් තත්ත්වය",
    login: "ඇතුළු වන්න",
    checkOut: "පිටවීම",
    admin: "පරිපාලක",
    help: "උදවු",
    accessProfile: "ගිණුමට පිවිසෙන්න",
    viewProfile: "ගිණුම බලන්න",
    checkInNow: "දැන් ඇතුළු වන්න",
    getStarted: "ආරම්භ කරන්න",
    searchDirectory: "නාමාවලිය සොයන්න",
    viewMap: "සිතියම බලන්න",
    typeMessage: "පණිවිඩය ටයිප් කරන්න...",
    send: "යවන්න",
    clearConversation: "සංවාදය මකන්න",
    smartAIActive: "ස්මාර්ට් AI සක්‍රීයයි",
    ayubowan: "ආයුබෝවන්",
    medicalHistory: "වෛද්‍ය ඉතිහාසය සහ පැතිකඩ",
    scanAppointment: "පත්වීම් හෝ හැඳුනුම්පත පරිලෝකනය කරන්න",
    registerFirstTime: "පළමු වරට ලියාපදිංචි වන්න",
    specialistsAvailability: "විශේෂඥ වෛද්‍යවරුන්ගේ පවතින බව",
    facilitiesNavigation: "පහසුකම් සංචලනය",
    helpTitle: "කිොස්ක් සහය මධ්‍යස්ථානය",
    quickGuide: "ඉක්මන් මඟ පෙන්වීම",
    faqs: "නිතර අසන ප්‍රශ්න",
    guideDesc: "MediAssist Smart Kiosk භාවිතා කරන්නේ කෙසේදැයි ඉගෙන ගන්න",
    faqDesc: "පොදු ප්‍රශ්න සහ රෝහල් තොරතුරු",
    close: "වසන්න",
    faq1: "මගේ පත්වීම සඳහා මම ඇතුළත් වන්නේ කෙසේද?",
    faq1_ans: "'ඉක්මන් ඇතුළත් වීම' මත ක්ලික් කර ඔබේ හැඳුනුම්පත පරිලෝකනය කරන්න හෝ පත්වීම් ටෝකනය ඇතුළත් කරන්න.",
    faq2: "මට ඔසුසල සොයාගත හැක්කේ කොහෙන්ද?",
    faq2_ans: "ඔසුසල බිම් මහලේ, ප්‍රධාන දොරටුව අසල පිහිටා ඇත.",
    faq3: "මගේ උපදේශනය සඳහා මම ගෙවන්නේ කෙසේද?",
    faq3_ans: "ඔබට ඕනෑම ගෙවීම් යන්ත්‍රයකින් හෝ 1 වන මහලේ ඇති ප්‍රධාන බිල්පත් කවුන්ටරයෙන් ගෙවිය හැකිය.",
    faq4: "මට මෙහි නව රෝගියෙකු ලෙස ලියාපදිංචි විය හැකිද?",
    faq4_ans: "ඔව්! ඔබේ ලියාපදිංචිය ආරම්භ කිරීමට මුල් තිරයේ ඇති 'නව රෝගියා' කාඩ්පත ක්ලික් කරන්න.",
    guide1_title: "ස්මාර්ට් AI සහායක",
    guide1_desc: "ඕනෑම සෞඛ්‍ය ප්‍රශ්නයක් හෝ රෝහල් තොරතුරු සඳහා අපගේ AI බොට් සමඟ කතා කරන්න.",
    guide2_title: "හදිසි ක්‍රියාමාර්ග",
    guide2_desc: "හදිසි වෛද්‍ය ආධාර හෝ කාර්ය මණ්ඩල ඇඟවීම් සඳහා රතු බොත්තම භාවිතා කරන්න.",
    guide3_title: "උපකරණ පුවරුව සහ පෝලිම",
    guide3_desc: "ඔබේ පැතිකඩ පරීක්ෂා කරන්න, ටෝකනය පරිලෝකනය කරන්න, සහ සජීවී පෝලිම බලන්න."
  },
  ta: {
    welcome: "ஆயுபோவன், வரவேற்கிறோம்",
    hospitalName: "கொழும்பு மத்திய பொது மருத்துவமனை",
    howCanIHelp: "இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?",
    description: "செக்-இன் செய்ய, மருத்துவரை கண்டுபிடிக்க அல்லது புதிய நோயாளி என பதிவு செய்ய நான் உங்களுக்கு உதவ முடியும். கேளுங்கள்!",
    tryLabel: "முயற்சிக்கவும்:",
    emergency: "அவசர உதவி",
    personalDashboard: "தனிப்பட்ட டாஷ்போர்டு",
    quickCheckIn: "விரைவான செக்-இன்",
    newPatient: "புதிய நோயாளி",
    findDoctors: "மருத்துவர்களைக் கண்டுபிடி",
    hospitalMap: "மருத்துவமனை வரைபடம்",
    liveQueue: "நேரடி வரிசை நிலை",
    login: "உள்நுழைய",
    checkOut: "வெளியேறு",
    admin: "நிர்வாகி",
    help: "உதவி",
    accessProfile: "சுயவிவரத்தை அணுகவும்",
    viewProfile: "சுயவிவரத்தைப் பார்க்கவும்",
    checkInNow: "இப்போது செக்-இன் செய்யவும்",
    getStarted: "தொடங்குங்கள்",
    searchDirectory: "பட்டியலைத் தேடுங்கள்",
    viewMap: "வரைபடத்தைப் பார்க்கவும்",
    typeMessage: "உங்கள் செய்தியைத் தட்டச்சு செய்க...",
    send: "அனுப்புக",
    clearConversation: "உரையாடலை அழிக்கவும்",
    smartAIActive: "ஸ்மார்ட் AI செயலில் உள்ளது",
    ayubowan: "ஆயுபோவன்",
    medicalHistory: "மருத்துவ வரலாறு மற்றும் சுயவிவரம்",
    scanAppointment: "சந்திப்பு அல்லது NIC ஐ ஸ்கேன் செய்யவும்",
    registerFirstTime: "முதல் முறையாக பதிவு செய்யுங்கள்",
    specialistsAvailability: "நிபுணர்களின் கிடைக்கும் தன்மை",
    facilitiesNavigation: "வசதிகள் வழிசெலுத்தல்",
    helpTitle: "கியோஸ்க் ஆதரவு மையம்",
    quickGuide: "விரைவான வழிகாட்டி",
    faqs: "அடிக்கடி கேட்கப்படும் கேள்விகள்",
    guideDesc: "MediAssist Smart Kiosk ஐ எவ்வாறு பயன்படுத்துவது என்பதை அறியுங்கள்",
    faqDesc: "பொதுவான கேள்விகள் மற்றும் மருத்துவமனை தகவல்கள்",
    close: "மூடுக",
    faq1: "எனது சந்திப்பிற்கு நான் எவ்வாறு செக்-இன் செய்வது?",
    faq1_ans: "'விரைவான செக்-இன்' என்பதைக் கிளிக் செய்து உங்கள் NIC ஐ ஸ்கேன் செய்யவும் அல்லது சந்திப்பு டோக்கனை உள்ளிடவும்.",
    faq2: "மருந்தகத்தை நான் எங்கே காணலாம்?",
    faq2_ans: "மருந்தகம் தரைதளத்தில், பிரதான நுழைவாயிலுக்கு அருகில் அமைந்துள்ளது.",
    faq3: "எனது ஆலோசனைக்கு நான் எப்படி பணம் செலுத்துவது?",
    faq3_ans: "நீங்கள் எந்த கட்டண கியோஸ்க் அல்லது 1வது மாடியில் உள்ள பிரதான பில்லிங் கவுண்டரில் பணம் செலுத்துங்கள்.",
    faq4: "நான் இங்கே ஒரு புதிய நோயாளியாக பதிவு செய்ய முடியுமா?",
    faq4_ans: "ஆம்! உங்கள் பதிவைத் தொடங்க முகப்புத் திரையில் உள்ள 'புதிய நோயாளி' கார்டைக் கிளிக் செய்யவும்.",
    guide1_title: "ஸ்மார்ட் AI உதவியாளர்",
    guide1_desc: "எந்தவொரு சுகாதார கேள்விகள் அல்லது மருத்துவமனை தகவல்களுக்கு எமது AI போட் உடன் பேசுங்கள்.",
    guide2_title: "அவசர நடவடிக்கைகள்",
    guide2_desc: "உடனடி மருத்துவ உதவி அல்லது ஊழியர் எச்சரிக்கைகளுக்கு சிவப்பு பொத்தானைப் பயன்படுத்தவும்.",
    guide3_title: "டாஷ்போர்டு மற்றும் வரிசை",
    guide3_desc: "உங்கள் சுயவிவரத்தைச் சரிபார்க்கவும், டோக்கனை ஸ்கேன் செய்யவும் மற்றும் நேரடி வரிசையைக் கண்காணிக்கவும்."
  }
};

const KioskHome = () => {
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // For security, log out the patient whenever they return to the main kiosk home screen
    localStorage.removeItem('activePatient');
    setPatient(null);

    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // KIOSK HEARTBEAT (For Admin Monitoring)
    const heartbeat = setInterval(() => {
      socketService.emit('kiosk_heartbeat', { kiosk_id: 'Main Kiosk #1' });
    }, 5000);

    return () => {
      clearInterval(timer);
      clearInterval(heartbeat);
    };
  }, []);

  // --- CHAT LOGIC ---
  const [inputValue, setInputValue] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'bot', text: 'Ayubowan! I am your MediAssist AI. How can I help you today?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [language, setLanguage] = useState('en');
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpTab, setHelpTab] = useState('guide');
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [emergencyNotification, setEmergencyNotification] = useState(null);
  const [queueStatus, setQueueStatus] = useState([]);
  const scrollRef = React.useRef(null);

  useEffect(() => {
    const fetchQueue = async () => {
        try {
            const data = await apiService.getAllQueuesStatus();
            if (Array.isArray(data)) {
                setQueueStatus(data);
            }
        } catch (error) {
            console.error("Error fetching queue status:", error);
        }
    };

    fetchQueue();

    // CONNECT SOCKET FOR REAL-TIME UPDATES
    socketService.connect();
    socketService.on('queue_updated', () => {
        console.log('Kiosk: Queue updated via Socket');
        fetchQueue();
    });

    return () => {
        socketService.off('queue_updated');
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, isTyping]);

  const handleSend = async (messageOverride = null) => {
    const text = messageOverride || inputValue;
    if (!text.trim()) return;

    // Add user message immediately
    setChatHistory(prev => [...prev, { role: 'user', text }]);
    setInputValue('');
    setIsTyping(true);
    setShowChat(true);

    if (isEmergencyMode) {
      const lowerText = text.toLowerCase();
      const emergencyKeywords = ['chest pain', 'bleeding', 'unconscious', 'heart attack', 'choking', 'stroke'];
      
      if (emergencyKeywords.some(k => lowerText.includes(k))) {
          setChatHistory(prev => [...prev, { 
              role: 'bot', 
              text: "⚠️ Please go to the Emergency Room immediately! 📍 Ground Floor - Emergency Unit. 🚑 Medical staff has been notified of your situation.",
              actions: [
                  { label: 'View ER Route', type: 'navigate', payload: '/hospital-map?destination=emergency' },
                  { label: 'Exit Emergency Mode', type: 'message', payload: 'Thank you, I am okay now.' }
              ]
          }]);
          setIsTyping(false);
          return;
      } else if (lowerText.includes('thank you') || lowerText.includes('okay now')) {
          setIsEmergencyMode(false);
          setChatHistory(prev => [...prev, { role: 'bot', text: "I'm glad to hear that. Switching back to normal assistance. How else can I help?" }]);
          setIsTyping(false);
          return;
      }
    }

    // STREAMING SOCKET FLOW
    socketService.emit('message_sent', { 
      message: text, 
      patient_id: patient ? patient.id : null 
    });

    // We prepare a temporary bot message to update with chunks
    let currentActions = [];
    
    const onChatStart = (data) => {
      currentActions = data.actions || [];
      setChatHistory(prev => [...prev, { role: 'bot', text: '', actions: [] }]);
      setIsTyping(false);
    };

    const onChatChunk = (data) => {
      setChatHistory(prev => {
        const history = [...prev];
        const lastMsg = history[history.length - 1];
        if (lastMsg && lastMsg.role === 'bot') {
          lastMsg.text = data.text;
        }
        return history;
      });
    };

    const onChatEnd = () => {
      setChatHistory(prev => {
        const history = [...prev];
        const lastMsg = history[history.length - 1];
        if (lastMsg && lastMsg.role === 'bot') {
          lastMsg.actions = currentActions;
        }
        return history;
      });
      // Clean up listeners for this specific interaction
      socketService.off('chat_start', onChatStart);
      socketService.off('chat_chunk', onChatChunk);
      socketService.off('chat_end', onChatEnd);
    };

    socketService.on('chat_start', onChatStart);
    socketService.on('chat_chunk', onChatChunk);
    socketService.on('chat_end', onChatEnd);
  };

  const patientName = patient ? (patient.full_name || patient.name || 'Patient') : null;

  // Format Sri Lanka Time
  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    timeZone: 'Asia/Colombo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    timeZone: 'Asia/Colombo',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).toUpperCase();

  const handleEmergencyAction = (action) => {
    setShowEmergencyModal(false);
    
    switch(action) {
      case 'call':
        setEmergencyNotification("🚑 Emergency Unit called. Help is on the way!");
        apiService.createNotification({
            type: 'Emergency',
            message: '🚨 EMERGENCY UNIT CALLED! Immediate assistance required.',
            kiosk_id: 'Kiosk Home #1'
        }).catch(err => console.error("Notification failed:", err));
        setTimeout(() => setEmergencyNotification(null), 5000);
        break;
      case 'location':
        setEmergencyNotification("📍 Redirecting to Hospital Map... ER is highlighted on the Ground Floor.");
        setTimeout(() => {
            setEmergencyNotification(null);
            navigate('/hospital-map?destination=emergency');
        }, 2000);
        break;
      case 'staff':
        setEmergencyNotification("🧑‍⚕️ Staff alerted! A medical assistant will be with you shortly.");
        apiService.createNotification({
            type: 'Staff Assistance',
            message: '🧑‍⚕️ Staff requested for assistance.',
            kiosk_id: 'Kiosk Home #1'
        }).catch(err => console.error("Notification failed:", err));
        setTimeout(() => setEmergencyNotification(null), 5000);
        break;
      case 'chat':
        setIsEmergencyMode(true);
        setShowChat(true);
        setChatHistory(prev => [...prev, { 
            role: 'bot', 
            text: "🚨 EMERGENCY MODE ACTIVE: Please describe your emergency briefly so I can provide immediate guidance." 
        }]);
        break;
      default:
        break;
    }
  };

  return (
    <div className="bg-background font-body text-on-surface h-full flex flex-col overflow-hidden w-screen h-screen text-left">
      {/* Emergency Notification Banner */}
      {emergencyNotification && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-error text-white py-4 px-8 flex items-center justify-center gap-4 shadow-2xl animate-in slide-in-from-top duration-500">
            <span className="material-symbols-outlined animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>emergency</span>
            <span className="font-headline font-bold text-lg">{emergencyNotification}</span>
            <button onClick={() => setEmergencyNotification(null)} className="ml-8 text-white/80 hover:text-white">
                <span className="material-symbols-outlined">close</span>
            </button>
        </div>
      )}

      {/* Emergency Modal */}
      <EmergencyModal 
        isOpen={showEmergencyModal} 
        onClose={() => setShowEmergencyModal(false)} 
        onAction={handleEmergencyAction} 
      />
      {/* Top Navigation Shell */}
      <header className="bg-transparent backdrop-blur-none w-full top-0 px-8 py-4 z-40 border-b border-outline-variant/10 shrink-0">
        <div className="flex justify-between items-center w-full max-w-[1920px] mx-auto">
          <div className="flex items-center gap-6">
            <Logo 
              className="cursor-pointer" 
              onClick={() => navigate('/')} 
            />
            <div className="h-8 w-px bg-outline-variant/30 mx-4"></div>
            <div className="flex gap-4">
              <button 
                onClick={() => setLanguage('en')}
                className={`px-6 py-2 rounded-full font-bold transition-all shadow-lg ${language === 'en' ? 'bg-primary text-white shadow-primary/20' : 'bg-white text-on-surface-variant hover:bg-surface-container-high border border-outline-variant/30'}`}
              >
                English
              </button>
              <button 
                onClick={() => setLanguage('si')}
                className={`px-6 py-2 rounded-full font-bold transition-all shadow-lg ${language === 'si' ? 'bg-primary text-white shadow-primary/20' : 'bg-white text-on-surface-variant hover:bg-surface-container-high border border-outline-variant/30'}`}
              >
                සිංහල
              </button>
              <button 
                onClick={() => setLanguage('ta')}
                className={`px-6 py-2 rounded-full font-bold transition-all shadow-lg ${language === 'ta' ? 'bg-primary text-white shadow-primary/20' : 'bg-white text-on-surface-variant hover:bg-surface-container-high border border-outline-variant/30'}`}
              >
                தமிழ்
              </button>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="font-headline font-bold text-lg leading-none">
                {patientName ? `${translations[language].ayubowan}, ${patientName.split(' ')[0]}` : translations[language].welcome}
              </div>
              <div className="text-sm text-on-surface-variant font-medium">{translations[language].hospitalName}</div>
            </div>
            {patient && (
              <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-full border border-slate-100 font-headline">
                <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-white">
                  {patientName.charAt(0)}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content: Focused AI Bot Canvas */}
      <main className="flex-grow flex flex-col items-center justify-center relative px-8 gap-4 pt-2 pb-8 overflow-hidden h-full">
        {/* Background Ambient Element */}
        <div className="absolute inset-0 ai-pulse-bg -z-10"></div>
        <div className="cyber-grid"></div>

        {/* Emergency Assistance Button - Top Right Positioning */}
        <div className="absolute top-4 right-8 z-20">
          <button 
            onClick={() => setShowEmergencyModal(true)}
            className="bg-error-container/90 backdrop-blur-md text-on-error-container py-3 px-8 rounded-full flex items-center justify-center gap-3 shadow-lg hover:bg-error-container transition-all active:scale-95 border border-error/20"
          >
            <span className="material-symbols-outlined text-xl animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>emergency</span>
            <span className="font-headline font-bold text-base tracking-wider uppercase">{translations[language].emergency}</span>
          </button>
        </div>

        {/* Central AI Chatbot Section */}
        <div className={`w-full max-w-4xl flex flex-col items-center text-center gap-6 relative z-10 transition-all duration-500 ${showChat ? 'mt-4' : 'mt-auto'}`}>
          {/* Friendly AI Bot Avatar */}
          <div className="relative group cursor-pointer" onClick={() => setShowChat(!showChat)}>
            <div className="absolute -inset-8 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-700"></div>
            <div className="floating-bot relative">
              <div className="w-48 h-48 md:w-56 md:h-56 rounded-full bg-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] glow-effect flex items-center justify-center overflow-hidden border-4 border-white relative">
                <img 
                  alt="Friendly AI Robot Avatar" 
                  className="w-full h-full object-cover rounded-full" 
                  src={AvatarImage} 
                />
              </div>
              <div className="absolute -bottom-2 right-1/2 translate-x-1/2 glass-panel border border-primary/20 px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
                <div className="w-2.5 h-2.5 bg-secondary rounded-full animate-pulse"></div>
                <span className="text-xs font-bold text-primary tracking-widest uppercase">{translations[language].smartAIActive}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="font-headline text-4xl md:text-5xl font-extrabold text-on-surface tracking-tight leading-tight">
              {patientName ? `${translations[language].howCanIHelp.replace('you', patientName.split(' ')[0])}` : translations[language].howCanIHelp}
            </h2>
            <p className="text-on-surface-variant text-lg max-w-2xl mx-auto font-medium">
              {translations[language].description}
            </p>
          </div>

          {/* Chat Input Area */}
          <div className="w-full max-w-2xl space-y-3">
            {showChat && (
              <div className="glass-panel w-full p-6 mb-4 rounded-[2rem] border border-white/50 text-left bg-white/40 backdrop-blur-xl shadow-2xl">
                <div 
                  ref={scrollRef}
                  className="max-h-[300px] overflow-y-auto no-scrollbar space-y-4 mb-4 scroll-smooth"
                >
                  {chatHistory.map((chat, idx) => (
                    <div key={idx} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-4 rounded-2xl ${
                        chat.role === 'user' 
                          ? 'bg-primary text-white rounded-tr-none' 
                          : 'bg-white/80 text-on-surface rounded-tl-none shadow-sm'
                      }`}>
                        <p className="text-sm font-medium leading-relaxed">{chat.text}</p>
                        {chat.actions && chat.actions.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {chat.actions.map((action, aidx) => (
                              <button
                                key={aidx}
                                onClick={() => {
                                  if (action.type === 'navigate') navigate(action.payload);
                                  else handleSend(action.payload);
                                }}
                                className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs font-bold transition-colors border border-primary/20"
                              >
                                {action.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-white/80 p-4 rounded-2xl rounded-tl-none shadow-sm flex gap-1">
                        <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                        <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex justify-end">
                   <button onClick={() => {setShowChat(false); setChatHistory([{ role: 'bot', text: 'Ayubowan! I am your MediAssist AI. How can I help you today?' }])}} className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest hover:text-primary transition-colors">Clear Conversation</button>
                </div>
              </div>
            )}

            <div className="glass-panel p-2 rounded-[2.5rem] shadow-2xl border border-white/50 flex items-center gap-2">
              <div className="flex-grow relative">
                <input 
                  className="w-full bg-transparent border-none focus:outline-none text-xl py-4 px-8 font-medium placeholder:text-on-surface-variant/40" 
                  placeholder={translations[language].typeMessage} 
                  type="text" 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                />
              </div>
              <button 
                onClick={() => navigate('/assistant')}
                className="bg-primary text-white w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all flex-shrink-0 relative mic-ripple"
              >
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>mic</span>
              </button>
              <button 
                onClick={() => handleSend()}
                className="bg-primary text-white px-8 py-3 md:py-4 rounded-full font-bold text-lg shadow-xl hover:bg-primary-container transition-all active:scale-95 flex-shrink-0 mr-1"
              >
                {translations[language].send}
              </button>
            </div>
            <div className="flex justify-center gap-3">
              <span className="text-xs font-bold text-on-surface-variant/60 tracking-widest uppercase mb-4">{translations[language].tryLabel} "Where is the pharmacy?" • "Check me in" • "Doctor directory"</span>
            </div>
          </div>
        </div>

        {/* Secondary Action Cards */}
        <div className="w-full max-w-7xl mt-auto mb-4 px-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {/* Personal Dashboard */}
            <button 
              onClick={() => navigate(patient ? '/patient-dashboard' : '/patient-login')}
              className={`group relative p-6 rounded-[2rem] bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl hover:bg-white/80 transition-all text-left flex flex-col gap-4 overflow-hidden service-card animate-fade-in ${patient ? 'ring-2 ring-primary/20 bg-primary/5' : ''}`}
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="material-symbols-outlined text-8xl">account_circle</span>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-primary-container flex items-center justify-center text-primary shadow-inner">
                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>account_circle</span>
              </div>
              <div>
                <h3 className="text-lg font-bold font-headline text-on-surface">
                  {patient ? (language === 'si' ? 'උපකරණ පුවරුව බලන්න' : language === 'ta' ? 'டாஷ்போர்டைப் பார்க்கவும்' : 'View Dashboard') : translations[language].personalDashboard}
                </h3>
                <p className="text-xs text-slate-500 font-body mt-1">{translations[language].medicalHistory}</p>
              </div>
              <div className="flex items-center text-primary font-semibold text-xs mt-auto">
                <span>{patient ? translations[language].viewProfile : translations[language].accessProfile}</span>
                <span className="material-symbols-outlined ml-2 text-sm">arrow_forward</span>
              </div>
            </button>

            {/* Check-in */}
            <button 
              onClick={() => navigate('/checkin-out')}
              className="group relative p-6 rounded-[2rem] bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl hover:bg-white/80 transition-all text-left flex flex-col gap-4 overflow-hidden service-card animate-fade-in [animation-delay:0.1s]"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="material-symbols-outlined text-8xl">check_circle</span>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-secondary-container flex items-center justify-center text-on-secondary-container">
                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              </div>
              <div>
                <h3 className="text-lg font-bold font-headline text-on-surface">{translations[language].quickCheckIn}</h3>
                <p className="text-xs text-slate-500 font-body mt-1">{translations[language].scanAppointment}</p>
              </div>
              <div className="flex items-center text-secondary font-semibold text-xs mt-auto">
                <span>{translations[language].checkInNow}</span>
                <span className="material-symbols-outlined ml-2 text-sm">arrow_forward</span>
              </div>
            </button>

            {/* New Patient */}
            <button 
              onClick={() => navigate('/register/step1')}
              className="group relative p-6 rounded-[2rem] bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl hover:bg-white/80 transition-all text-left flex flex-col gap-4 overflow-hidden service-card animate-fade-in [animation-delay:0.2s]"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="material-symbols-outlined text-8xl">person_add</span>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-primary-fixed flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>person_add</span>
              </div>
              <div>
                <h3 className="text-lg font-bold font-headline text-on-surface">{translations[language].newPatient}</h3>
                <p className="text-xs text-slate-500 font-body mt-1">{translations[language].registerFirstTime}</p>
              </div>
              <div className="flex items-center text-primary font-semibold text-xs mt-auto">
                <span>{translations[language].getStarted}</span>
                <span className="material-symbols-outlined ml-2 text-sm">arrow_forward</span>
              </div>
            </button>

            {/* Find Doctor */}
            <button 
              onClick={() => navigate('/doctors')}
              className="group relative p-6 rounded-[2rem] bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl hover:bg-white/80 transition-all text-left flex flex-col gap-4 overflow-hidden service-card animate-fade-in [animation-delay:0.3s]"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="material-symbols-outlined text-8xl">medical_information</span>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-tertiary-fixed flex items-center justify-center text-tertiary">
                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>medical_information</span>
              </div>
              <div>
                <h3 className="text-lg font-bold font-headline text-on-surface">{translations[language].findDoctors}</h3>
                <p className="text-xs text-slate-500 font-body mt-1">{translations[language].specialistsAvailability}</p>
              </div>
              <div className="flex items-center text-tertiary font-semibold text-xs mt-auto">
                <span>{translations[language].searchDirectory}</span>
                <span className="material-symbols-outlined ml-2 text-sm">arrow_forward</span>
              </div>
            </button>

            {/* Hospital Map */}
            <button 
              onClick={() => navigate('/hospital-map')}
              className="group relative p-6 rounded-[2rem] bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl hover:bg-white/80 transition-all text-left flex flex-col gap-4 overflow-hidden service-card animate-fade-in [animation-delay:0.4s]"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="material-symbols-outlined text-8xl">map</span>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-surface-container-highest flex items-center justify-center text-on-surface-variant">
                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>map</span>
              </div>
              <div>
                <h3 className="text-lg font-bold font-headline text-on-surface">{translations[language].hospitalMap}</h3>
                <p className="text-xs text-slate-500 font-body mt-1">{translations[language].facilitiesNavigation}</p>
              </div>
              <div className="flex items-center text-on-surface-variant font-semibold text-xs mt-auto">
                <span>{translations[language].viewMap}</span>
                <span className="material-symbols-outlined ml-2 text-sm">arrow_forward</span>
              </div>
            </button>
          </div>
        </div>
      </main>

      {/* Bottom Queue Ticker */}
      <footer className="bg-white/90 backdrop-blur-lg h-16 flex items-center overflow-hidden border-t border-outline-variant/10 relative z-50 shrink-0 cursor-pointer" onClick={() => navigate('/queue')}>
        <div className="px-10 h-full flex items-center bg-primary text-white font-headline font-bold text-lg whitespace-nowrap shadow-[10px_0_30px_rgba(0,0,0,0.1)] relative z-10 gap-3">
          <div className="live-dot"></div>
          {translations[language].liveQueue}
        </div>
        <div className="flex-grow scrolling-ticker h-full flex items-center relative overflow-hidden">
          <div className="ticker-content flex items-center gap-12 px-12 animate-scroll">
            {queueStatus.length > 0 ? (
                // Duplicate for infinite scroll effect
                [...queueStatus, ...queueStatus].map((item, idx) => (
                    <React.Fragment key={idx}>
                        <div className="flex items-center gap-4 w-max">
                            <span className="text-on-surface-variant font-medium">
                                {item.department} {item.room !== 'TBA' ? `(${item.room})` : ''}:
                            </span>
                            <span className={`px-3 py-1 rounded-lg font-bold ${
                                item.status === 'NOW SERVING' 
                                ? 'bg-primary-fixed text-on-primary-fixed' 
                                : 'bg-secondary-container text-on-secondary-container'
                            }`}>
                                {item.status}: {item.token}
                            </span>
                            {item.session_status && item.session_status !== 'ACTIVE' && (
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                    item.session_status === 'PAUSED' ? 'bg-warning-container text-on-warning-container' : 
                                    item.session_status === 'ENDED' ? 'bg-error-container text-on-error-container' : 
                                    'bg-outline-variant/20 text-on-surface-variant'
                                }`}>
                                    {item.session_status.replace('_', ' ')}
                                </span>
                            )}
                        </div>
                        <div className="w-1.5 h-1.5 bg-outline-variant/30 rounded-full flex-shrink-0"></div>
                    </React.Fragment>
                ))
            ) : (
                <div className="flex items-center gap-4 w-max text-on-surface-variant/40 font-bold italic uppercase tracking-widest text-xs">
                   No active queues at the moment • Updates automatically
                </div>
            )}
          </div>
        </div>

        <div className="h-full flex items-center px-8 bg-surface-container-low/50 border-l border-outline-variant/10 min-w-[200px]">
          <div className="flex flex-col items-end w-full">
            <span className="text-2xl font-bold font-headline leading-none text-primary">{formattedTime}</span>
            <span className="text-xs font-bold text-on-surface-variant tracking-tighter mt-1">{formattedDate}</span>
          </div>
        </div>
      </footer>

      {/* Side Navigation Accessibility Hub */}
      <aside className="fixed left-6 top-1/2 -translate-y-1/2 h-auto w-20 flex flex-col gap-6 py-8 z-50">
        <button 
          onClick={() => navigate(patient ? '/patient-dashboard' : '/patient-login')}
          className="w-16 h-16 rounded-[1.25rem] bg-white shadow-2xl flex flex-col items-center justify-center text-primary hover:bg-primary hover:text-white transition-all border border-outline-variant/10 group"
        >
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>account_circle</span>
          <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter">{patient ? translations[language].viewProfile : translations[language].login}</span>
        </button>
        <button 
          onClick={() => navigate('/checkin-out', { state: { mode: 'checkout' } })}
          className="w-16 h-16 rounded-[1.25rem] bg-white shadow-2xl flex flex-col items-center justify-center text-primary hover:bg-primary hover:text-white transition-all border border-outline-variant/10 group"
        >
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>logout</span>
          <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter">{translations[language].checkOut}</span>
        </button>
        <button 
          onClick={() => navigate('/admin/login')}
          className="w-16 h-16 rounded-[1.25rem] bg-white shadow-2xl flex flex-col items-center justify-center text-primary hover:bg-primary hover:text-white transition-all border border-outline-variant/10 group"
        >
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>admin_panel_settings</span>
          <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter">{translations[language].admin}</span>
        </button>
        <button 
          onClick={() => setShowHelpModal(true)}
          className="w-16 h-16 rounded-[1.25rem] bg-white shadow-2xl flex flex-col items-center justify-center text-primary hover:bg-primary hover:text-white transition-all border border-outline-variant/10 group"
        >
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>live_help</span>
          <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter">{translations[language].help}</span>
        </button>
      </aside>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-on-surface/20 backdrop-blur-sm" onClick={() => setShowHelpModal(false)}></div>
          <div className="bg-white/90 backdrop-blur-2xl w-full max-w-4xl rounded-[3rem] shadow-[0_32px_128px_rgba(0,0,0,0.2)] border border-white/40 overflow-hidden relative animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="p-8 pb-0 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black font-headline text-on-surface tracking-tight">{translations[language].helpTitle}</h2>
                  <p className="text-on-surface-variant font-medium mt-1">{helpTab === 'guide' ? translations[language].guideDesc : translations[language].faqDesc}</p>
                </div>
                <button 
                  onClick={() => setShowHelpModal(false)}
                  className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-error/10 hover:text-error transition-all"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 p-1.5 bg-surface-container rounded-2xl w-fit">
                <button 
                  onClick={() => setHelpTab('guide')}
                  className={`px-8 py-3 rounded-xl font-bold text-sm transition-all ${helpTab === 'guide' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:bg-white/50'}`}
                >
                  {translations[language].quickGuide}
                </button>
                <button 
                  onClick={() => setHelpTab('faq')}
                  className={`px-8 py-3 rounded-xl font-bold text-sm transition-all ${helpTab === 'faq' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:bg-white/50'}`}
                >
                  {translations[language].faqs}
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-8 h-[500px] overflow-y-auto custom-scrollbar">
              {helpTab === 'guide' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10 flex flex-col gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                      <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                    </div>
                    <h3 className="font-bold text-lg text-primary">{translations[language].guide1_title}</h3>
                    <p className="text-sm text-on-surface-variant leading-relaxed font-medium">{translations[language].guide1_desc}</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-error/5 border border-error/10 flex flex-col gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-error text-white flex items-center justify-center shadow-lg shadow-error/20">
                      <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>emergency</span>
                    </div>
                    <h3 className="font-bold text-lg text-error">{translations[language].guide2_title}</h3>
                    <p className="text-sm text-on-surface-variant leading-relaxed font-medium">{translations[language].guide2_desc}</p>
                  </div>
                  <div className="p-6 rounded-3xl bg-secondary/5 border border-secondary/10 flex flex-col gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-secondary text-white flex items-center justify-center shadow-lg shadow-secondary/20">
                      <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard_customize</span>
                    </div>
                    <h3 className="font-bold text-lg text-secondary">{translations[language].guide3_title}</h3>
                    <p className="text-sm text-on-surface-variant leading-relaxed font-medium">{translations[language].guide3_desc}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map(num => (
                    <div key={num} className="p-6 rounded-2xl bg-surface-container/50 border border-outline-variant/30 hover:bg-white hover:shadow-md transition-all group">
                      <h4 className="font-bold text-on-surface mb-2 flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-primary"></span>
                        {translations[language][`faq${num}`]}
                      </h4>
                      <p className="text-sm text-on-surface-variant leading-relaxed font-medium ml-5">
                        {translations[language][`faq${num}_ans`]}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-8 pt-0 border-t border-outline-variant/10 mt-auto bg-surface-container/20">
              <div className="flex items-center justify-between pt-6">
                <div className="flex items-center gap-3 text-xs font-bold text-on-surface-variant/60 uppercase tracking-widest">
                  <span className="material-symbols-outlined text-sm">info</span>
                  MediAssist Smart Kiosk v2.0
                </div>
                <button 
                  onClick={() => setShowHelpModal(false)}
                  className="px-10 py-3 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary-container transition-all shadow-lg shadow-primary/20"
                >
                  {translations[language].close}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Sub-components ---

const EmergencyModal = ({ isOpen, onClose, onAction }) => {
    if (!isOpen) return null;
  
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-error/20 backdrop-blur-xl animate-in fade-in duration-300">
        <div className="bg-white rounded-[2.5rem] shadow-2xl border-4 border-error w-full max-w-2xl p-10 flex flex-col items-center gap-8 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-error/5 rounded-full blur-3xl"></div>
          
          <div className="w-24 h-24 rounded-full bg-error/10 flex items-center justify-center text-error animate-pulse">
            <span className="material-symbols-outlined text-6xl" style={{ fontVariationSettings: "'FILL' 1" }}>emergency</span>
          </div>
  
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-extrabold font-headline text-on-surface">⚠️ Emergency Assistance Activated</h2>
            <p className="text-on-surface-variant font-medium">Please select an option for immediate help</p>
          </div>
  
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <button onClick={() => onAction('call')} className="flex items-center gap-4 p-6 bg-error text-white rounded-2xl font-bold hover:bg-error/90 transition-all shadow-lg active:scale-95">
              <span className="material-symbols-outlined text-3xl">emergency_share</span>
              <span className="text-lg">Call Emergency Unit</span>
            </button>
            <button onClick={() => onAction('location')} className="flex items-center gap-4 p-6 bg-surface-container-highest text-on-surface rounded-2xl font-bold hover:bg-surface-container-high transition-all shadow-md active:scale-95">
              <span className="material-symbols-outlined text-3xl">location_on</span>
              <span className="text-lg">ER Location</span>
            </button>
            <button onClick={() => onAction('staff')} className="flex items-center gap-4 p-6 bg-surface-container-highest text-on-surface rounded-2xl font-bold hover:bg-surface-container-high transition-all shadow-md active:scale-95">
              <span className="material-symbols-outlined text-3xl">person_alert</span>
              <span className="text-lg">Request Staff</span>
            </button>
            <button onClick={() => onAction('chat')} className="flex items-center gap-4 p-6 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-lg active:scale-95">
              <span className="material-symbols-outlined text-3xl">forum</span>
              <span className="text-lg">I Need Immediate Help</span>
            </button>
          </div>
  
          <button onClick={onClose} className="mt-4 text-on-surface-variant font-bold hover:text-on-surface transition-colors">Dismiss</button>
        </div>
      </div>
    );
  };

export default KioskHome;
