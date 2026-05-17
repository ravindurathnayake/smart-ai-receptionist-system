import os
import joblib
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

# ─── TRAINING DATA: INTENT CLASSIFICATION ─────────────────────────────────────
intent_data = [
    # Greeting
    ("hello", "greeting"), ("hi", "greeting"), ("hey", "greeting"), ("good morning", "greeting"),
    ("good afternoon", "greeting"), ("ayubowan", "greeting"), ("vanakkam", "greeting"),
    ("tell me about mediassist", "greeting"), ("who are you", "greeting"),
    ("sign out", "greeting"), ("log me out", "greeting"), ("i want to leave", "greeting"),
    ("clear my session", "greeting"),
    
    # Recommend Specialist / Symptoms
    ("i feel sick", "recommend_specialist"), ("i have some symptoms", "recommend_specialist"),
    ("which doctor should i see", "recommend_specialist"), ("can you recommend a specialist", "recommend_specialist"),
    ("i have chest pain", "recommend_specialist"), ("my head hurts", "recommend_specialist"),
    ("i have a skin rash", "recommend_specialist"), ("my joints ache", "recommend_specialist"),
    ("i have a headache", "recommend_specialist"), ("i have hedache", "recommend_specialist"),
    ("my head is paining", "recommend_specialist"), ("i feel dizzy", "recommend_specialist"),
    ("i have a fever", "recommend_specialist"), ("i am coughing", "recommend_specialist"),
    ("stomach pain", "recommend_specialist"), ("my back is killing me", "recommend_specialist"),
    ("i am feeling unwell", "recommend_specialist"), ("need medical advice", "recommend_specialist"),
    ("what doctor for chest pain", "recommend_specialist"), ("i have a heart problem", "recommend_specialist"),
    ("my skin is itchy", "recommend_specialist"), ("my back hurts", "recommend_specialist"),
    ("recommend doctor", "recommend_specialist"), ("symptom check", "recommend_specialist"),
    
    # Book Appointment
    ("book an appointment", "book_appointment"), ("schedule a visit", "book_appointment"),
    ("i want to see a doctor", "book_appointment"), ("make a reservation", "book_appointment"),
    ("appointment booking", "book_appointment"),
    
    # Queue Status
    ("check my queue", "queue_status"), ("what is my position", "queue_status"),
    ("how long is the wait", "queue_status"), ("queue status", "queue_status"),
    ("when is my turn", "queue_status"), ("what is my next appointment", "queue_status"),
    ("show my next appointment", "queue_status"), ("next visit", "queue_status"),
    
    # Check-In
    ("i want to check in", "check_in"), ("check-in now", "check_in"),
    ("arrival confirmation", "check_in"), ("i am here for my appointment", "check_in"),
    
    # Payment Help
    ("how to pay", "payment_help"), ("payment methods", "payment_help"),
    ("billing assistance", "payment_help"), ("how much is the fee", "payment_help"),
    ("receipt download", "payment_help"), ("insurance claim", "payment_help"),
    ("do you accept insurance", "payment_help"), ("billing question", "payment_help"),
    
    # Hospital FAQ
    ("where is the pharmacy", "hospital_faq"), ("visiting hours", "hospital_faq"),
    ("hospital map", "hospital_faq"), ("where is the restroom", "hospital_faq"),
    ("emergency contact", "hospital_faq"), ("parking information", "hospital_faq"),
    ("where is the cardiology wing", "hospital_faq"), ("where is radiology", "hospital_faq"),
    ("hospital direction", "hospital_faq"), ("how to find a room", "hospital_faq"),
    ("show my prescription history", "hospital_faq"), ("medical history", "hospital_faq"),
    ("my records", "hospital_faq"), ("prescriptions", "hospital_faq"),
    ("appointment history", "hospital_faq"), ("past visits", "hospital_faq"),
    ("check me in for today", "check_in"), ("i want to check in", "check_in"),
    ("check me in for today", "check_in"), ("i want to check in", "check_in"),
]

# ─── TRAINING DATA: SYMPTOM CLASSIFICATION ────────────────────────────────────
symptom_data = [
    # Cardiology
    ("chest pain", "Cardiology"), ("heart palpitation", "Cardiology"),
    ("shortness of breath", "Cardiology"), ("irregular heartbeat", "Cardiology"),
    ("heavy pressure in chest", "Cardiology"), ("pain in left arm", "Cardiology"),
    ("heart attack", "Cardiology"), ("high blood pressure", "Cardiology"),
    ("heart valve problem", "Cardiology"), ("fast heartbeat", "Cardiology"),
    ("chest tightness", "Cardiology"), ("heart surgery", "Cardiology"),
    ("fainting", "Cardiology"), ("short of breath", "Cardiology"),
    ("racing heart", "Cardiology"), ("skipped heart beat", "Cardiology"),
    
    # Dermatology
    ("skin rash", "Dermatology"), ("itchy skin", "Dermatology"), ("acne", "Dermatology"),
    ("mole changes", "Dermatology"), ("red spots on skin", "Dermatology"), ("eczema", "Dermatology"),
    ("dermatitis", "Dermatology"), ("psoriasis", "Dermatology"), ("skin infection", "Dermatology"),
    ("pimples", "Dermatology"), ("dry skin", "Dermatology"), ("skin allergy", "Dermatology"),
    
    # Neurology
    ("headache", "Neurology"), ("dizziness", "Neurology"), ("seizures", "Neurology"),
    ("memory loss", "Neurology"), ("numbness in limbs", "Neurology"), ("migraine", "Neurology"),
    ("slurred speech", "Neurology"), ("headache", "Neurology"),
    ("hedache", "Neurology"), ("migrane", "Neurology"), ("bad headache", "Neurology"),
    ("blurry vision", "Neurology"), ("loss of balance", "Neurology"),
    ("fainting spells", "Neurology"), ("brain fog", "Neurology"),
    ("shaking hands", "Neurology"), ("tremors", "Neurology"),
    
    # Orthopedics
    ("joint pain", "Orthopedics"), ("back pain", "Orthopedics"), ("broken bone", "Orthopedics"),
    ("knee injury", "Orthopedics"), ("arthritis", "Orthopedics"), ("fracture", "Orthopedics"),
    ("shoulder pain", "Orthopedics"), ("muscle strain", "Orthopedics"),
    ("bone pain", "Orthopedics"), ("spinal problem", "Orthopedics"),
    ("leg pain", "Orthopedics"), ("hip pain", "Orthopedics"),
    ("sprain", "Orthopedics"), ("orthopedic surgery", "Orthopedics"),
    ("stiff neck", "Orthopedics"), ("swollen joint", "Orthopedics"),
    ("difficulty walking", "Orthopedics"), ("leg weakness", "Orthopedics"),
    ("broken arm", "Orthopedics"), ("broken leg", "Orthopedics"),
    ("backache", "Orthopedics"), ("spinal pain", "Orthopedics"),
    
    # General Medicine
    ("fever", "General Medicine"), ("cough", "General Medicine"), ("flu symptoms", "General Medicine"),
    ("stomach ache", "General Medicine"), ("sore throat", "General Medicine"),
    ("general checkup", "General Medicine"), ("common cold", "General Medicine"),
    ("fatigue", "General Medicine"), ("nausea", "General Medicine"),
    ("diarrhea", "General Medicine"), ("vomiting", "General Medicine"),
    ("sore throat", "General Medicine"), ("flu", "General Medicine"),
    ("cold and cough", "General Medicine"), ("runny nose", "General Medicine"),
    ("body aches", "General Medicine"), ("weakness", "General Medicine"),
    ("loss of appetite", "General Medicine"), ("infection", "General Medicine"),

    # Pediatrics
    ("child fever", "Pediatrics"), ("baby cough", "Pediatrics"), ("toddler rash", "Pediatrics"),
    ("infant colic", "Pediatrics"), ("child vomiting", "Pediatrics"), ("pediatric checkup", "Pediatrics"),
    ("childhood vaccination", "Pediatrics"), ("teething pain", "Pediatrics"), ("child flu", "Pediatrics"),
    ("kids stomach ache", "Pediatrics"), ("infant crying", "Pediatrics"), ("child earache", "Pediatrics"),
    ("baby breathing difficulty", "Pediatrics"),
    
    # Ophthalmology
    ("blurry vision", "Ophthalmology"), ("double vision", "Ophthalmology"), ("eye pain", "Ophthalmology"),
    ("dry eyes", "Ophthalmology"), ("itchy eyes", "Ophthalmology"), ("eye redness", "Ophthalmology"),
    ("pink eye", "Ophthalmology"), ("vision loss", "Ophthalmology"), ("flashes of light", "Ophthalmology"),
    ("floaters in vision", "Ophthalmology"), ("eye strain", "Ophthalmology"), ("burning sensation in eyes", "Ophthalmology"),
    ("cataract concerns", "Ophthalmology"), ("glaucoma screening", "Ophthalmology"),
    
    # Gynecology
    ("menstrual cramps", "Gynecology"), ("heavy period flow", "Gynecology"), ("irregular periods", "Gynecology"),
    ("missed period", "Gynecology"), ("pregnancy test", "Gynecology"), ("prenatal checkup", "Gynecology"),
    ("pelvic pain", "Gynecology"), ("vaginal itching", "Gynecology"), ("menopause hot flashes", "Gynecology"),
    ("breast pain", "Gynecology"), ("uterine pain", "Gynecology"), ("ovarian cyst concerns", "Gynecology"),
    
    # Oncology
    ("breast lump", "Oncology"), ("swollen lymph nodes", "Oncology"), ("unexplained tumor", "Oncology"),
    ("cancer screening", "Oncology"), ("mole biopsy", "Oncology"), ("suspicious growth", "Oncology"),
    ("lymphoma concerns", "Oncology"), ("chronic cough with blood", "Oncology"), ("bone pain at night", "Oncology"),
    ("rapid weight loss", "Oncology"),
    
    # Gastroenterology
    ("stomach pain", "Gastroenterology"), ("acid reflux", "Gastroenterology"), ("heartburn", "Gastroenterology"),
    ("indigestion", "Gastroenterology"), ("bloating", "Gastroenterology"), ("gas", "Gastroenterology"),
    ("chronic diarrhea", "Gastroenterology"), ("loose motion", "Gastroenterology"), ("severe constipation", "Gastroenterology"),
    ("abdominal cramps", "Gastroenterology"), ("nausea", "Gastroenterology"), ("vomiting", "Gastroenterology"),
    ("food poisoning", "Gastroenterology"), ("blood in stool", "Gastroenterology"), ("swallow difficulty", "Gastroenterology"),
    ("ulcer symptoms", "Gastroenterology"),
    
    # ENT
    ("ear pain", "ENT"), ("ear discharge", "ENT"), ("hearing loss", "ENT"),
    ("ringing in ears", "ENT"), ("tinnitus", "ENT"), ("sore throat", "ENT"),
    ("painful swallowing", "ENT"), ("throat irritation", "ENT"), ("tonsil swelling", "ENT"),
    ("voice hoarseness", "ENT"), ("chronic sinus congestion", "ENT"), ("runny nose", "ENT"),
    ("sneezing", "ENT"), ("nosebleed", "ENT"), ("blocked ears", "ENT"),
    
    # Pulmonology
    ("chronic cough", "Pulmonology"), ("dry cough", "Pulmonology"), ("wet cough", "Pulmonology"),
    ("breathing difficulties", "Pulmonology"), ("shortness of breath", "Pulmonology"), ("asthma attack", "Pulmonology"),
    ("wheezing", "Pulmonology"), ("chest congestion", "Pulmonology"), ("coughing up phlegm", "Pulmonology"),
    ("chronic bronchitis", "Pulmonology"), ("lung pain", "Pulmonology"), ("sleep apnea", "Pulmonology"),
    ("snoring", "Pulmonology"),
    
    # Urology
    ("burning during urination", "Urology"), ("urinary tract infection", "Urology"), ("uti", "Urology"),
    ("frequent urination", "Urology"), ("blood in urine", "Urology"), ("difficulty urinating", "Urology"),
    ("weak urine flow", "Urology"), ("kidney stones", "Urology"), ("flank pain", "Urology"),
    ("bladder pain", "Urology"), ("prostate concerns", "Urology"), ("urinary incontinence", "Urology"),
    
    # Endocrinology
    ("high blood sugar", "Endocrinology"), ("diabetes checkup", "Endocrinology"), ("diabetic management", "Endocrinology"),
    ("extreme thirst", "Endocrinology"), ("frequent urination", "Endocrinology"), ("thyroid problem", "Endocrinology"),
    ("thyroid swelling", "Endocrinology"), ("rapid weight gain", "Endocrinology"), ("hormonal imbalance", "Endocrinology"),
    ("fatigue from thyroid", "Endocrinology"),
    
    # Psychiatry
    ("constant anxiety", "Psychiatry"), ("panic attacks", "Psychiatry"), ("depression", "Psychiatry"),
    ("persistent sadness", "Psychiatry"), ("mood swings", "Psychiatry"), ("bipolar disorder", "Psychiatry"),
    ("insomnia", "Psychiatry"), ("sleep issues", "Psychiatry"), ("hallucinations", "Psychiatry"),
    ("obsessive thoughts", "Psychiatry"), ("chronic stress", "Psychiatry"), ("adhd symptoms", "Psychiatry"),
    ("low concentration", "Psychiatry")
]

def train_and_save():
    # 1. Train Intent Classifier
    intent_texts = [d[0] for d in intent_data]
    intent_labels = [d[1] for d in intent_data]
    
    intent_model = Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 2))),
        ('clf', LogisticRegression(max_iter=1000))
    ])
    intent_model.fit(intent_texts, intent_labels)
    
    # 2. Train Symptom Classifier
    symptom_texts = [d[0] for d in symptom_data]
    symptom_labels = [d[1] for d in symptom_data]
    
    symptom_model = Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 2))),
        ('clf', LogisticRegression(max_iter=1000))
    ])
    symptom_model.fit(symptom_texts, symptom_labels)
    
    # Save models
    os.makedirs('app/ml/models', exist_ok=True)
    joblib.dump(intent_model, 'app/ml/models/intent_model.pkl')
    joblib.dump(symptom_model, 'app/ml/models/symptom_model.pkl')
    
    print("Models trained and saved successfully!")

if __name__ == "__main__":
    train_and_save()
