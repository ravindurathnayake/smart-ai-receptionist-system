import face_recognition
import numpy as np
import base64
import cv2
import io
from PIL import Image
from app.models import Patient

def decode_base64_image(base64_string):
    """
    Decodes a base64 string into a numpy array image for OpenCV/face_recognition.
    """
    if "," in base64_string:
        base64_string = base64_string.split(",")[1]
    
    img_data = base64.b64decode(base64_string)
    img = Image.open(io.BytesIO(img_data))
    return cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)

def get_face_embedding(base64_image):
    """
    Extracts face embedding from a base64 encoded image.
    Returns a list of 128 floats or None if no face is detected.
    """
    try:
        img = decode_base64_image(base64_image)
        # Convert BGR to RGB for face_recognition
        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        face_encodings = face_recognition.face_encodings(rgb_img)
        
        if len(face_encodings) > 0:
            # Return the first face detected as a list
            return face_encodings[0].tolist()
        return None
    except Exception as e:
        print(f"Error generating face embedding: {str(e)}")
        return None

def find_patient_by_face(base64_image, tolerance=0.6):
    """
    Compares the provided face image against all patients in the database.
    Returns the matching Patient object or None.
    """
    print(f"DEBUG: Starting face identification (Tolerance: {tolerance})")
    target_encoding = get_face_embedding(base64_image)
    if not target_encoding:
        print("DEBUG: No face detected in the scan.")
        return None
    
    target_encoding = np.array(target_encoding)
    
    # Fetch all patients with embeddings
    patients_with_faces = Patient.query.filter(Patient.face_embedding != None).all()
    print(f"DEBUG: Comparing against {len(patients_with_faces)} patients with biometric data.")
    
    if not patients_with_faces:
        return None
    
    known_encodings = [np.array(p.face_embedding) for p in patients_with_faces]
    
    # Compare faces
    # face_recognition.compare_faces returns a list of True/False
    results = face_recognition.compare_faces(known_encodings, target_encoding, tolerance=tolerance)
    
    if True in results:
        # Find the best match index
        distances = face_recognition.face_distance(known_encodings, target_encoding)
        best_match_index = np.argmin(distances)
        
        if results[best_match_index]:
            matched_patient = patients_with_faces[best_match_index]
            print(f"DEBUG: Match found! Patient: {matched_patient.full_name} (ID: {matched_patient.id}) - Distance: {distances[best_match_index]:.4f}")
            return matched_patient
            
    print("DEBUG: No biometric match found in the database.")
    return None
