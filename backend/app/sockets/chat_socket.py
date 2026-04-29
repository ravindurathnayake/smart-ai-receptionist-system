from flask import request
from app.extensions import socketio
from app.services import process_message
import time

@socketio.on('message_sent')
def handle_message(data):
    """
    Handles AI chat messages via WebSockets and streams the response.
    """
    message = data.get('message')
    patient_id = data.get('patient_id')
    
    if not message:
        return

    # Get the full response from the existing service
    response_data = process_message(message, patient_id)
    full_reply = response_data.get('reply', "")
    actions = response_data.get('actions', [])

    # Start streaming
    socketio.emit('chat_start', {'actions': actions}, room=request.sid)
    
    # Split by words to simulate typing
    words = full_reply.split(' ')
    accumulated = ""
    
    for i, word in enumerate(words):
        accumulated += (word + " ")
        socketio.emit('chat_chunk', {'text': accumulated.strip()}, room=request.sid)
        # Small delay for natural feel
        time.sleep(0.05) 
        
    socketio.emit('chat_end', {}, room=request.sid)

@socketio.on('kiosk_heartbeat')
def handle_heartbeat(data):
    """
    Relays kiosk heartbeat to all connected clients (Admin Dashboard).
    """
    socketio.emit('kiosk_heartbeat', data)
