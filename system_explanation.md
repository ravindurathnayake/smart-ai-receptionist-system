# Smart AI Receptionist System (MediAssist) - Full Explanation

This guide breaks down your entire project in simple English so you can confidently explain it, present it, and answer technical questions.

---

## 1. SYSTEM OVERVIEW

**What is this system?**  
It is a comprehensive "Smart AI Receptionist" and Hospital Kiosk System. 

**What problem does it solve?**  
It reduces long lines at hospital reception desks by automating patient registration, appointment booking, queue management, and checking-in. Instead of talking to a human receptionist, patients interact with an AI Chatbot or a physical Kiosk terminal.

**Main features:**
*   **AI Chatbot:** Understands symptoms and books appointments.
*   **Smart Queue System:** Manages live queues for different doctor sessions without confusing ticket numbers.
*   **Kiosk Interface:** A self-service screen for patients to search doctors, check-in, and view live queues.
*   **Face Recognition Check-in:** Patients can scan their faces to check-in instantly.
*   **Admin Command Center:** A dashboard for hospital staff to call the next patient and pause/resume sessions.

---

## 2. TECHNOLOGY STACK

*   **Frontend (The UI):** React.js (built with Vite for speed). It uses plain CSS for styling (no heavy CSS frameworks) and the Context API for managing user state.
*   **Backend (The Server):** Python using the Flask framework. It follows a clean architecture (Routes -> Services -> Models).
*   **Database:** PostgreSQL with SQLAlchemy ORM. It handles all the relational database tables robustly.
*   **APIs and Integrations:** 
    *   **Twilio API:** For sending WhatsApp notifications (queue tickets, confirmations).
    *   **SMTP Service:** For sending Email receipts and notifications.
*   **WebSockets:** Uses `Flask-SocketIO` on the backend and `socket.io-client` on the frontend for instant, real-time screen updates without refreshing the page.

---

## 3. PROJECT STRUCTURE (VERY IMPORTANT)

### Frontend (`frontend/src`)
*   **`components/`:** Small, reusable UI building blocks.
    *   `ai/`: Face recognition camera components.
    *   `chatbot/`: Chatbot message bubbles and input box.
    *   `common/`: Standard buttons, headers, and top bars used everywhere.
    *   `forms/`: Reusable input forms.
    *   `kiosk/`: Components specific to the kiosk screens.
    *   `queue/`: Components that display the live queue numbers.
*   **`pages/`:** The main full-screen views.
    *   `admin/`: Pages for hospital staff (Doctor management, Admin Queue Control).
    *   `kiosk/`: Public-facing screens (Registration, Check-in, Search Doctors).
    *   `patient/`: Patient dashboard screens.
*   **`services/`:** The "bridge" to the backend. Files like `apiService.js` handle fetching data from the Python backend.

### Backend (`backend/app`)
*   **`models/`:** Defines the Database Tables (e.g., `patient.py`, `queue.py`).
*   **`routes/`:** Defines the API URLs. When the frontend says "Hey, get me the queue status", it hits a route here (e.g., `/api/queue`).
*   **`services/`:** **The most important folder.** This is where the actual business logic happens. Routes just receive the request and pass it to a service to do the heavy lifting (e.g., `queue_service.py`).
*   **`ml/`:** Holds the AI/Machine Learning code and trained models.

---

## 4. CORE WORKFLOWS (Step-by-Step)

**A. Appointment Booking**
1. Patient selects a doctor and time on the Kiosk/Chatbot.
2. Frontend sends data to the backend API.
3. `appointment_service.py` creates a new row in the `Appointment` database table.
4. System sends an email/WhatsApp confirmation.

**B. Check-in → Queue Generation**
1. Patient arrives at the hospital and enters their NIC/Phone at the Kiosk.
2. Backend (`queue_service.py`) finds their `Appointment` for today.
3. System generates a `Queue` entry, calculates their estimated wait time, and saves it.
4. Backend triggers a WebSocket event, instantly updating the Admin and Kiosk screens.

**C. Queue Calling (Admin Side)**
1. Admin clicks "Call Next" on the dashboard.
2. `queue_service.py` changes the current patient's status to `COMPLETED`.
3. It finds the next `WAITING` patient and changes their status to `ACTIVE`.
4. WebSocket alerts the Kiosk to display "Now Serving: John Doe (Token S1-01)".

**D. Chatbot Flow**
1. User types "I have chest pain".
2. `chatbot_service.py` receives the text and sends it to the AI Model.
3. AI Model predicts the "Intent" (Recommend Specialist) and extracts the symptom (Cardiology).
4. Chatbot replies using predefined rules: "I recommend our Cardiology department. Want to book?"

**E. Face Recognition Flow**
1. Kiosk camera captures a picture.
2. Frontend sends the image to `face_service.py`.
3. The service converts the face into a 128-number mathematical array (embedding).
4. It compares this array to all patients in the database. If it finds a match, the patient is instantly checked in.

---

## 5. DATABASE DESIGN

The database is built on connected tables:
*   **`Patient`**: Holds name, phone, email, and face data.
*   **`Specialist`**: Holds doctor details and their department.
*   **`DoctorSession`**: A specific shift for a doctor (e.g., "Monday Morning Shift in Room 4").
*   **`Appointment`**: Connects a `Patient` to a `DoctorSession`.
*   **`Queue`**: Connects an `Appointment` to a live waiting room ticket.

*How they connect:* A Patient has an Appointment. That Appointment is linked to a specific DoctorSession. When they check in, a Queue ticket is created for that Appointment.

---

## 6. API FLOW EXAMPLE (Check-in)

1. **Frontend:** User clicks "Check In". React calls `apiService.checkIn(patientId)`.
2. **Network:** An HTTP POST request is sent to `http://backend/api/queue/check-in`.
3. **Route:** `backend/app/routes/queue_routes.py` receives the request.
4. **Service:** It hands the ID to `queue_service.check_in_patient(patientId)`.
5. **Database:** The service writes to the database.
6. **Response:** It returns a JSON message: `{"token": "S1-01", "estimated_wait": 10}` to the frontend.

---

## 7. REAL-TIME FEATURES

Instead of the frontend constantly asking the backend "Did the queue change?", the system uses **WebSockets**.
*   **How it's used:** When a doctor clicks "Call Next", the Python backend broadcasts a `socketio.emit('queue_updated')` event.
*   **The Result:** Every connected kiosk and admin screen instantly updates without the user needing to refresh the page.

---

## 8. AI / ML FEATURES (Crucial for Defense)

**Does this system use AI or ML?**  
Yes, it uses Machine Learning (ML) for the Chatbot and Deep Learning for Face Recognition. **It does NOT use external APIs like ChatGPT.** Everything runs locally, which is a great talking point for privacy and security.

**Where AI is used:**
1.  **Chatbot (Intent & Symptoms):** Uses `scikit-learn` (`TfidfVectorizer` + `LogisticRegression`). 
    *   *How it works:* It turns words into numbers (TF-IDF) and uses a statistical model (Logistic Regression) to predict what the user wants (e.g., "book appointment" vs "queue status") and to match symptoms to departments.
    *   *Training:* It is trained locally inside `backend/app/ml/train_models.py` using a hardcoded dataset of phrases.
    *   *Storage:* The trained models are saved as `.pkl` files in the `backend/app/ml/models/` folder.
2.  **Face Recognition:** Uses the Python `face_recognition` library (which uses dlib).
    *   *How it works:* It analyzes a picture, finds the face, maps 128 distinct facial landmarks, and compares the distance between those landmarks to faces in the database.
3.  **Rule-Based Logic:** The chatbot also uses rule-based state machines (if-else logic) to handle multi-step flows like asking for a name, then phone number, then time.

**Limitations of the AI:**  
Because it is not a Generative AI (like ChatGPT), it cannot generate new, creative sentences. It only understands the phrases it was trained on and replies with pre-programmed templates.

---

## 9. IMPORTANT LOGIC

*   **Queue Generation Per Session:** Queues are isolated. If Dr. Smith has a morning session and an evening session, the queue starts at 1 for the morning, and resets back to 1 for the evening.
*   **Token Format:** `S1-01`. (S) stands for Session. (1) is the Session Number. (01) is the patient's queue position in that specific session.
*   **Session States:** A doctor's shift goes through stages:
    *   `NOT_STARTED`: Hidden from the live board.
    *   `ACTIVE`: Doctor is seeing patients.
    *   `PAUSED`: Doctor is on a break.
    *   `ENDED`: Shift is over; remaining patients are cancelled/rescheduled.

---

## 10. FILE NAVIGATION GUIDE (Cheat Sheet)

If your supervisor asks "How do I change X?", here is exactly where you go:

*   **"I want to change how the wait time is calculated."**
    Go to: `backend/app/services/queue_service.py`
*   **"I want to add a new Chatbot intent or symptom."**
    Go to: `backend/app/ml/train_models.py` (Add it to the array, then run the file to retrain).
*   **"I want to change the Chatbot's replies."**
    Go to: `backend/app/services/chatbot_service.py`
*   **"I want to change how appointments are saved in the database."**
    Go to: `backend/app/services/appointment_service.py`
*   **"I want to change the colors or layout of the Admin screen."**
    Go to: `frontend/src/pages/admin/AdminDoctors.jsx` (or whichever Admin file applies).
*   **"I want to see the database structure."**
    Go to: `backend/app/models/` (look at `patient.py`, `queue.py`, etc.).
