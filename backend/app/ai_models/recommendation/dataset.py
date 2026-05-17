data = [
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
