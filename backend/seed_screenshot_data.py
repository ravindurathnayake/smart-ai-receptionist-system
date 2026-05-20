import sys
import os
from datetime import datetime, time, date, timedelta

# Add backend directory to sys.path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app import create_app
from app.extensions import db
from app.models import (
    Specialist, Patient, Appointment, Queue, Department, 
    DoctorSession, Payment, Notification, Review, Prescription, LabReport
)

def seed_screenshot_data():
    app = create_app()
    with app.app_context():
        print("Starting data seeding for screenshots...")

        # 1. Clear old transactional data to avoid overlap
        print("Clearing old transactional data...")
        from app.models.doctor_portal import DoctorSessionRequest, VitalRecord
        db.session.query(Review).delete()
        db.session.query(Queue).delete()
        db.session.query(Payment).delete()
        db.session.query(Prescription).delete()
        db.session.query(LabReport).delete()
        db.session.query(Notification).delete()
        db.session.query(DoctorSessionRequest).delete()
        db.session.query(VitalRecord).delete()
        db.session.query(Appointment).delete()
        db.session.query(DoctorSession).delete()
        db.session.commit()

        # 2. Get or Create Departments
        dept_names = ["Cardiology", "Neurology", "Pediatrics", "Orthopedics", "General Medicine", "Endocrinology", "Gynecology", "Psychiatry", "Dermatology", "Dental"]
        depts = {}
        for dname in dept_names:
            dept = Department.query.filter_by(name=dname).first()
            if not dept:
                dept = Department(name=dname, description=f"{dname} care services")
                db.session.add(dept)
                db.session.flush()
            depts[dname] = dept
        db.session.commit()

        # 3. Ensure Specialists Exist with details
        specialist_info = [
            {"name": "Ravindu Rathnayake", "dept": "Cardiology", "spec": "Senior Cardiologist", "fee": 4500.0, "rating": 4.9, "exp": 15},
            {"name": "Aruni Rajapaksa", "dept": "Cardiology", "spec": "Consultant Cardiologist", "fee": 4500.0, "rating": 4.8, "exp": 12},
            {"name": "Rohan Jayasinghe", "dept": "Neurology", "spec": "Chief Neurologist", "fee": 3500.0, "rating": 4.7, "exp": 14},
            {"name": "Sarah de Silva", "dept": "Pediatrics", "spec": "Senior Pediatrician", "fee": 3000.0, "rating": 4.9, "exp": 10},
            {"name": "Nimal Siriwardena", "dept": "General Medicine", "spec": "Family Physician", "fee": 2500.0, "rating": 4.6, "exp": 20},
            {"name": "Ishani de Alwis", "dept": "Endocrinology", "spec": "Endocrinologist", "fee": 3500.0, "rating": 4.8, "exp": 11},
            {"name": "Nilanthi Wijesinghe", "dept": "Gynecology", "spec": "Obstetrician & Gynecologist", "fee": 4000.0, "rating": 4.7, "exp": 13},
            {"name": "Kamal Gunaratne", "dept": "Psychiatry", "spec": "Neuropsychiatrist", "fee": 4000.0, "rating": 4.8, "exp": 16},
            {"name": "Sanduni Ratnayake", "dept": "Dermatology", "spec": "Cosmetic Dermatologist", "fee": 3500.0, "rating": 4.9, "exp": 8},
            {"name": "Prasad Jayasinghe", "dept": "Dental", "spec": "Senior Dentist", "fee": 3000.0, "rating": 4.8, "exp": 12}
        ]

        specs = {}
        for sdata in specialist_info:
            spec = Specialist.query.filter_by(name=sdata["name"]).first()
            dept = depts[sdata["dept"]]
            if not spec:
                spec = Specialist(
                    name=sdata["name"],
                    title="Dr.",
                    department=sdata["dept"],
                    department_id=dept.id,
                    specialization=sdata["spec"],
                    consultation_fee=sdata["fee"],
                    rating=sdata["rating"],
                    experience_years=sdata["exp"],
                    availability_status="Available",
                    email=f"{sdata['name'].lower().replace(' ', '')}@hospital.com",
                    phone_number="0112345678"
                )
                db.session.add(spec)
                db.session.flush()
            else:
                spec.department_id = dept.id
                spec.department = sdata["dept"]
                spec.consultation_fee = sdata["fee"]
            specs[sdata["name"]] = spec
        db.session.commit()

        # 4. Ensure Patients exist and have proper fields
        # Note: We query by NIC to preserve existing patients (especially those with face embeddings)
        patients_data = [
            {"nic": "200115501357", "full_name": "R M R E Rathnayake", "phone_number": "0771234567", "email": "ravindurathnayake258@gmail.com", "age": 24, "dob": "2002-05-15", "gender": "Male", "blood_type": "A+", "address": "No. 123, Galle Road, Colombo 03", "emergency_contact_name": "K. M. Rathnayake", "emergency_contact_phone": "0777654321"},
            {"nic": "695970294V", "full_name": "Umanda Menike", "phone_number": "0712345678", "email": "umandamenike@gmail.com", "age": 57, "dob": "1969-08-20", "gender": "Female", "blood_type": "B+", "address": "No. 45, Kandy Road, Yakkala", "emergency_contact_name": "S. Menike", "emergency_contact_phone": "0718765432"},
            {"nic": "200315501357", "full_name": "Brian Fernando", "phone_number": "0723456789", "email": "brfernando@gmail.com", "age": 23, "dob": "2003-02-10", "gender": "Male", "blood_type": "O-", "address": "No. 88, Negombo Road, Kurunegala", "emergency_contact_name": "A. Fernando", "emergency_contact_phone": "0729876543"},
            {"nic": "951234567V", "full_name": "Jane Doe", "phone_number": "0751234567", "email": "jane@example.com", "age": 31, "dob": "1995-11-12", "gender": "Female", "blood_type": "AB+", "address": "No. 12, Flower Road, Colombo 07", "emergency_contact_name": "John Doe", "emergency_contact_phone": "0759876543"},
            {"nic": "851234567V", "full_name": "Kamal Gunaratne", "phone_number": "0761234567", "email": "kamal@gmail.com", "age": 41, "dob": "1985-04-12", "gender": "Male", "blood_type": "A-", "address": "No. 23, Temple Road, Maharagama", "emergency_contact_name": "N. Gunaratne", "emergency_contact_phone": "0769876543"},
            {"nic": "752345678V", "full_name": "Sunil Perera", "phone_number": "0772345678", "email": "sunil@gmail.com", "age": 51, "dob": "1975-06-25", "gender": "Male", "blood_type": "O+", "address": "No. 55, Station Road, Dehiwala", "emergency_contact_name": "S. Perera", "emergency_contact_phone": "0778765432"},
            {"nic": "923456789V", "full_name": "Nimali Silva", "phone_number": "0783456789", "email": "nimali@gmail.com", "age": 34, "dob": "1992-09-05", "gender": "Female", "blood_type": "B-", "address": "No. 10, Lake Road, Rajagiriya", "emergency_contact_name": "M. Silva", "emergency_contact_phone": "0789876543"},
            {"nic": "884567890V", "full_name": "Priyanka Jayawardena", "phone_number": "0794567890", "email": "priyanka@gmail.com", "age": 38, "dob": "1988-10-30", "gender": "Female", "blood_type": "A+", "address": "No. 67, Kottawa Road, Pannipitiya", "emergency_contact_name": "D. Jayawardena", "emergency_contact_phone": "0798765432"}
        ]

        patients = {}
        for pdata in patients_data:
            patient = Patient.query.filter_by(nic=pdata["nic"]).first()
            if not patient:
                patient = Patient(nic=pdata["nic"])
                db.session.add(patient)
            
            # Update all fields
            patient.full_name = pdata["full_name"]
            patient.phone_number = pdata["phone_number"]
            patient.email = pdata["email"]
            patient.age = pdata["age"]
            patient.dob = pdata["dob"]
            patient.gender = pdata["gender"]
            patient.blood_type = pdata["blood_type"]
            patient.address = pdata["address"]
            patient.emergency_contact_name = pdata["emergency_contact_name"]
            patient.emergency_contact_phone = pdata["emergency_contact_phone"]
            db.session.flush()
            patients[pdata["full_name"]] = patient
        db.session.commit()

        # 5. Create Doctor Sessions for TODAY
        today_date = date.today()
        day_name = today_date.strftime("%A")

        sessions = {}
        room_assignments = {
            "Ravindu Rathnayake": "Room 01",
            "Aruni Rajapaksa": "Room 02",
            "Rohan Jayasinghe": "Room 03",
            "Sarah de Silva": "Room 04",
            "Nimal Siriwardena": "Room 05",
            "Ishani de Alwis": "Room 06",
            "Nilanthi Wijesinghe": "Room 07",
            "Kamal Gunaratne": "Room 08",
            "Sanduni Ratnayake": "Room 09",
            "Prasad Jayasinghe": "Room 10"
        }

        # Session times starting at different hours
        start_hours = {
            "Ravindu Rathnayake": 9,
            "Aruni Rajapaksa": 10,
            "Rohan Jayasinghe": 11,
            "Sarah de Silva": 13,
            "Nimal Siriwardena": 14,
            "Ishani de Alwis": 15,
            "Nilanthi Wijesinghe": 9,
            "Kamal Gunaratne": 10,
            "Sanduni Ratnayake": 16,
            "Prasad Jayasinghe": 12
        }

        for name, spec in specs.items():
            sh = start_hours[name]
            session = DoctorSession(
                specialist_id=spec.id,
                day_of_week=day_name,
                session_date=today_date,
                start_time=time(sh, 0),
                end_time=time(sh + 3, 0),
                max_patients=20,
                session_number=1,
                room_number=room_assignments[name],
                status="ACTIVE"
            )
            db.session.add(session)
            db.session.flush()
            sessions[name] = session
        db.session.commit()

        # 6. Create today's Appointments, Payments, and Queue entries
        print("Creating today's appointments...")
        
        # Helper to quickly add appointment, payment and optional queue record
        def make_appointment(patient_name, doc_name, time_obj, status, symptom, pay_method, pay_status, queue_num=None, queue_status=None, checkin_offset=0):
            pat = patients[patient_name]
            doc = specs[doc_name]
            sess = sessions[doc_name]
            
            apt_date = datetime.combine(today_date, time_obj)
            
            apt = Appointment(
                patient_id=pat.id,
                specialist_id=doc.id,
                doctor_session_id=sess.id,
                symptom=symptom,
                appointment_date=apt_date,
                status=status,
                queue_number=queue_num
            )
            db.session.add(apt)
            db.session.flush()
            
            # Payment
            pay = Payment(
                appointment_id=apt.id,
                amount=doc.consultation_fee,
                payment_method=pay_method,
                status=pay_status,
                transaction_id=f"TXN{100000 + apt.id}" if pay_status == "Paid" else None
            )
            db.session.add(pay)
            
            # Queue
            if queue_num and queue_status:
                checkin_time = datetime.now() - timedelta(minutes=checkin_offset)
                completed_at = datetime.now() if queue_status == "COMPLETED" else None
                
                q = Queue(
                    appointment_id=apt.id,
                    patient_id=pat.id,
                    doctor_session_id=sess.id,
                    queue_number=queue_num,
                    estimated_wait_time=(queue_num - 1) * 10,
                    status=queue_status,
                    check_in_time=checkin_time,
                    completed_at=completed_at
                )
                db.session.add(q)
            return apt

        # Appointment list design:
        # A. Dr. Aruni Rajapaksa session (Room 02):
        #   - Sunil Perera (Queue 1, ACTIVE serving, checked in 20m ago, Paid)
        #   - Jane Doe (Queue 2, WAITING, checked in 15m ago, Paid)
        #   - R M R E Rathnayake (Queue 3, WAITING, checked in 10m ago, Paid)
        #   - Priyanka Jayawardena (Queue 4, WAITING, checked in 5m ago, Paid)
        make_appointment("Sunil Perera", "Aruni Rajapaksa", time(10, 10), "Checked-in", "Chronic chest discomfort", "Card", "Paid", queue_num=1, queue_status="ACTIVE", checkin_offset=20)
        make_appointment("Jane Doe", "Aruni Rajapaksa", time(10, 20), "Checked-in", "Irregular heartbeats", "PayHere", "Paid", queue_num=2, queue_status="WAITING", checkin_offset=15)
        # Active patient appointment (the user!)
        make_appointment("R M R E Rathnayake", "Aruni Rajapaksa", time(10, 30), "Checked-in", "Mild chest tightness & shortness of breath", "Card", "Paid", queue_num=3, queue_status="WAITING", checkin_offset=10)
        make_appointment("Priyanka Jayawardena", "Aruni Rajapaksa", time(10, 40), "Checked-in", "Palpitations during sleep", "Card", "Paid", queue_num=4, queue_status="WAITING", checkin_offset=5)

        # B. Dr. Ishani de Alwis session (Room 06):
        #   - Umanda Menike (Queue 1, ACTIVE serving, checked in 10m ago, Paid)
        make_appointment("Umanda Menike", "Ishani de Alwis", time(15, 15), "Checked-in", "Diabetes routine follow-up", "Card", "Paid", queue_num=1, queue_status="ACTIVE", checkin_offset=10)

        # C. Dr. Sanduni Ratnayake session (Room 09):
        #   - Brian Fernando (Booked, Unpaid / Cash at Counter, not checked in yet)
        make_appointment("Brian Fernando", "Sanduni Ratnayake", time(16, 15), "Booked", "Severe skin rash on arms", "Cash at Counter", "Unpaid")

        # D. Dr. Nimal Siriwardena session (Room 05):
        #   - Kamal Gunaratne (Completed, checked in 60m ago, completed 15m ago, Paid)
        make_appointment("Kamal Gunaratne", "Nimal Siriwardena", time(14, 15), "Completed", "Fever and body aches", "Card", "Paid", queue_num=1, queue_status="COMPLETED", checkin_offset=60)

        # E. Dr. Sarah de Silva session (Room 04):
        #   - Nimali Silva (Booked, Paid, not checked in yet)
        make_appointment("Nimali Silva", "Sarah de Silva", time(13, 15), "Booked", "Toddler routine growth checkup", "PayHere", "Paid")

        db.session.commit()
        print("Created today's appointments successfully.")

        # 7. Create Past Completed Appointments for R M R E Rathnayake (Patient ID 30) for history
        print("Creating historical appointments...")
        
        # Past Apt 1: 5 Days ago
        past_date_1 = datetime.now() - timedelta(days=5)
        apt_past_1 = Appointment(
            patient_id=patients["R M R E Rathnayake"].id,
            specialist_id=specs["Ravindu Rathnayake"].id,
            symptom="Post-exertion fatigue and minor chest ache",
            appointment_date=past_date_1,
            status="Completed"
        )
        db.session.add(apt_past_1)
        db.session.flush()
        
        pay_past_1 = Payment(
            appointment_id=apt_past_1.id,
            amount=4500.0,
            payment_method="Card",
            status="Paid",
            transaction_id="TXN88990011",
            created_at=past_date_1
        )
        db.session.add(pay_past_1)
        
        # Prescription for Past Apt 1
        presc_1 = Prescription(
            patient_id=patients["R M R E Rathnayake"].id,
            appointment_id=apt_past_1.id,
            doctor_name="Dr. Ravindu Rathnayake",
            medications="Atorvastatin 20mg - 1 tablet daily at night\nParacetamol 500mg - 1 tablet three times daily if needed",
            instructions="Please take Atorvastatin strictly after dinner. Monitor blood pressure twice daily.",
            attachment="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
            created_at=past_date_1
        )
        db.session.add(presc_1)

        # Past Apt 2: 15 Days ago
        past_date_2 = datetime.now() - timedelta(days=15)
        apt_past_2 = Appointment(
            patient_id=patients["R M R E Rathnayake"].id,
            specialist_id=specs["Rohan Jayasinghe"].id,
            symptom="Occasional vertigo and tension headaches",
            appointment_date=past_date_2,
            status="Completed"
        )
        db.session.add(apt_past_2)
        db.session.flush()

        pay_past_2 = Payment(
            appointment_id=apt_past_2.id,
            amount=3500.0,
            payment_method="Card",
            status="Paid",
            transaction_id="TXN77665544",
            created_at=past_date_2
        )
        db.session.add(pay_past_2)

        # Prescription for Past Apt 2
        presc_2 = Prescription(
            patient_id=patients["R M R E Rathnayake"].id,
            appointment_id=apt_past_2.id,
            doctor_name="Dr. Rohan Jayasinghe",
            medications="Betahistine 16mg - 1 tablet twice daily\nVitamin B-Complex - 1 tablet daily with breakfast",
            instructions="Continue Betahistine for 10 days. Avoid sudden head movements and maintain adequate hydration.",
            attachment="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
            created_at=past_date_2
        )
        db.session.add(presc_2)

        # 8. Create Lab Reports for R M R E Rathnayake
        print("Creating lab reports...")
        lr_1 = LabReport(
            patient_id=patients["R M R E Rathnayake"].id,
            test_name="Lipid Profile / Serum Cholesterol",
            result_summary="Total Cholesterol: 195 mg/dL (Normal < 200)\nTriglycerides: 140 mg/dL (Normal < 150)\nHDL Cholesterol: 48 mg/dL (Normal > 40)\nLDL Cholesterol: 119 mg/dL (Optimal < 100, Borderline High)",
            attachment="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
            status="Completed",
            created_at=past_date_1
        )
        db.session.add(lr_1)

        lr_2 = LabReport(
            patient_id=patients["R M R E Rathnayake"].id,
            test_name="Full Blood Count (FBC)",
            result_summary="WBC Count: 6.5 x 10^3/uL (Normal: 4.0 - 11.0)\nRBC Count: 4.8 x 10^6/uL (Normal: 4.5 - 5.9)\nHemoglobin: 14.8 g/dL (Normal: 13.5 - 17.5)\nPlatelets: 250 x 10^3/uL (Normal: 150 - 450)",
            attachment="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
            status="Completed",
            created_at=past_date_2
        )
        db.session.add(lr_2)

        # 9. Create Reviews / Complaints
        print("Creating reviews & complaints...")
        # Review 1: Kamal Gunaratne's feedback on Nimal Siriwardena (General Medicine)
        # Find Siriwardena's completed appointment
        apt_siri = Appointment.query.filter_by(patient_id=patients["Kamal Gunaratne"].id, specialist_id=specs["Nimal Siriwardena"].id).first()
        if apt_siri:
            rev_1 = Review(
                appointment_id=apt_siri.id,
                patient_id=patients["Kamal Gunaratne"].id,
                specialist_id=specs["Nimal Siriwardena"].id,
                rating=4,
                review_text="Dr. Nimal was very friendly and detailed. The check-in was incredibly fast using the face scanner!",
                is_complaint=False,
                status="Resolved",
                admin_response="Thank you for your valuable feedback! We are glad you liked our AI receptionist check-in service."
            )
            db.session.add(rev_1)

        # Review 2: Let's create an active complaint for admin dashboard review
        # Create a past appointment for Brian Fernando to link a complaint
        past_date_complaint = datetime.now() - timedelta(days=2)
        apt_complaint = Appointment(
            patient_id=patients["Brian Fernando"].id,
            specialist_id=specs["Sanduni Ratnayake"].id,
            symptom="Allergic skin reaction checkup",
            appointment_date=past_date_complaint,
            status="Completed"
        )
        db.session.add(apt_complaint)
        db.session.flush()
        
        pay_complaint = Payment(
            appointment_id=apt_complaint.id,
            amount=3500.0,
            payment_method="PayHere",
            status="Paid",
            transaction_id="TXN33221100",
            created_at=past_date_complaint
        )
        db.session.add(pay_complaint)

        rev_complaint = Review(
            appointment_id=apt_complaint.id,
            patient_id=patients["Brian Fernando"].id,
            specialist_id=specs["Sanduni Ratnayake"].id,
            rating=2,
            review_text="Consultation was fine, but the wait time after face scan was almost 45 minutes.",
            complaint_text="Queue wait time exceeded estimated time by 30 minutes. Staff assistance was unhelpful.",
            is_complaint=True,
            status="Pending"
        )
        db.session.add(rev_complaint)

        # 10. Create Notifications for R M R E Rathnayake (Patient ID 30)
        print("Creating notification inbox records...")
        notif_1 = Notification(
            patient_id=patients["R M R E Rathnayake"].id,
            type="Prescription",
            message="Dr. Ravindu Rathnayake uploaded a new prescription for your cardiac follow-up.",
            status="Read",
            created_at=datetime.now() - timedelta(days=5)
        )
        db.session.add(notif_1)

        notif_2 = Notification(
            patient_id=patients["R M R E Rathnayake"].id,
            type="Lab Report",
            message="Your Lipid Profile lab report has been finalized and uploaded by the laboratory.",
            status="Read",
            created_at=datetime.now() - timedelta(days=5, hours=2)
        )
        db.session.add(notif_2)

        notif_3 = Notification(
            patient_id=patients["R M R E Rathnayake"].id,
            type="Check-In",
            message="You have successfully checked in for Dr. Aruni Rajapaksa. Token: S02-03. Current Serving: S02-01.",
            status="Unread",
            created_at=datetime.now() - timedelta(minutes=10)
        )
        db.session.add(notif_3)

        notif_4 = Notification(
            patient_id=patients["R M R E Rathnayake"].id,
            type="Payment",
            message="Payment of LKR 4,500.00 for appointment #APT-0003 was successfully processed.",
            status="Read",
            created_at=datetime.now() - timedelta(minutes=12)
        )
        db.session.add(notif_4)

        db.session.commit()
        print("Database populated successfully with rich screenshot data!")

if __name__ == "__main__":
    seed_screenshot_data()
