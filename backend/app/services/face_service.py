import base64
import binascii
import cv2
import face_recognition
import io
import numpy as np
from urllib.parse import unquote

from PIL import Image

from app.models import Patient


def _clean_base64_payload(base64_payload):
    if not isinstance(base64_payload, str):
        return None

    cleaned = unquote(base64_payload).replace("\ufeff", "").strip()
    cleaned = "".join(cleaned.split())
    return cleaned or None


def _decode_image_bytes(image_string):
    if not isinstance(image_string, str):
        return None

    image_string = image_string.strip()
    if not image_string:
        return None

    payload = image_string.split(",", 1)[1] if "," in image_string else image_string
    payload = _clean_base64_payload(payload)
    if not payload:
        return None

    try:
        return base64.b64decode(payload, validate=True)
    except (binascii.Error, ValueError):
        return None


def normalize_profile_image(image_string):
    """
    Returns a safe image reference for frontend rendering.
    Invalid or malformed image strings return None.
    """
    if not isinstance(image_string, str):
        return None

    image_string = image_string.strip()
    if not image_string:
        return None

    if image_string.startswith(("http://", "https://", "blob:", "/")):
        return image_string

    image_bytes = _decode_image_bytes(image_string)
    if not image_bytes:
        return None

    try:
        image = Image.open(io.BytesIO(image_bytes))
        image.load()
        image_format = (image.format or "").upper()
    except Exception:
        return None

    mime_type_map = {
        "JPEG": "image/jpeg",
        "JPG": "image/jpeg",
        "PNG": "image/png",
        "GIF": "image/gif",
        "WEBP": "image/webp",
        "BMP": "image/bmp",
    }
    mime_type = mime_type_map.get(image_format)
    if not mime_type:
        return None

    normalized_base64 = base64.b64encode(image_bytes).decode("ascii")
    return f"data:{mime_type};base64,{normalized_base64}"


def decode_base64_image(base64_string):
    """
    Decodes a base64 string into a numpy array image for OpenCV/face_recognition.
    """
    img_data = _decode_image_bytes(base64_string)
    if not img_data:
        raise ValueError("Invalid base64 image data")

    img = Image.open(io.BytesIO(img_data))
    return cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)


def get_face_embedding(base64_image):
    """
    Extracts face embedding from a base64 encoded image.
    Returns a list of 128 floats or None if no face is detected.
    """
    try:
        img = decode_base64_image(base64_image)
        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        face_encodings = face_recognition.face_encodings(rgb_img)

        if len(face_encodings) > 0:
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

    patients_with_faces = Patient.query.filter(Patient.face_embedding != None).all()
    print(f"DEBUG: Comparing against {len(patients_with_faces)} patients with biometric data.")

    if not patients_with_faces:
        return None

    known_encodings = [np.array(p.face_embedding) for p in patients_with_faces]
    results = face_recognition.compare_faces(known_encodings, target_encoding, tolerance=tolerance)

    if True in results:
        distances = face_recognition.face_distance(known_encodings, target_encoding)
        best_match_index = np.argmin(distances)

        if results[best_match_index]:
            matched_patient = patients_with_faces[best_match_index]
            print(
                f"DEBUG: Match found! Patient: {matched_patient.full_name} "
                f"(ID: {matched_patient.id}) - Distance: {distances[best_match_index]:.4f}"
            )
            return matched_patient

    print("DEBUG: No biometric match found in the database.")
    return None
