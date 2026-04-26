import os
import joblib
import numpy as np

class MLService:
    def __init__(self):
        self.intent_model = None
        self.symptom_model = None
        self.load_models()

    def load_models(self):
        base_path = os.path.dirname(os.path.abspath(__file__))
        intent_path = os.path.join(base_path, '../ml/models/intent_model.pkl')
        symptom_path = os.path.join(base_path, '../ml/models/symptom_model.pkl')

        if os.path.exists(intent_path):
            self.intent_model = joblib.load(intent_path)
            print("INFO: Intent Model Loaded Successfully")
        else:
            print("WARNING: Intent Model Not Found at", intent_path)

        if os.path.exists(symptom_path):
            self.symptom_model = joblib.load(symptom_path)
            print("INFO: Symptom Model Loaded Successfully")
        else:
            print("WARNING: Symptom Model Not Found at", symptom_path)

    def predict_intent(self, text):
        if not self.intent_model:
            return "fallback", 0.0
        
        probs = self.intent_model.predict_proba([text])[0]
        max_prob_idx = np.argmax(probs)
        intent = self.intent_model.classes_[max_prob_idx]
        confidence = probs[max_prob_idx]
        
        print(f"DEBUG: Intent Prediction: '{text}' -> {intent} (Confidence: {confidence:.2f})")
        return intent, float(confidence)

    def predict_symptom_dept(self, text):
        if not self.symptom_model:
            return "General Medicine", 0.0
            
        probs = self.symptom_model.predict_proba([text])[0]
        max_prob_idx = np.argmax(probs)
        dept = self.symptom_model.classes_[max_prob_idx]
        confidence = probs[max_prob_idx]
        
        print(f"DEBUG: Symptom Prediction: '{text}' -> {dept} (Confidence: {confidence:.2f})")
        return dept, float(confidence)

# Singleton instance
ml_service = MLService()
