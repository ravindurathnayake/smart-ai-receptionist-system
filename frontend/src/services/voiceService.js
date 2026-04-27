// voiceService.js

class VoiceService {
    constructor() {
        this.synth = window.speechSynthesis;
        this.isVoiceEnabled = localStorage.getItem('voice_announcements') !== 'false';
        this.language = localStorage.getItem('voice_lang') || 'en-US';
    }

    setVoiceEnabled(enabled) {
        this.isVoiceEnabled = enabled;
        localStorage.setItem('voice_announcements', enabled);
    }

    setLanguage(lang) {
        this.language = lang;
        localStorage.setItem('voice_lang', lang);
    }

    speakMessage(text, lang) {
        const speechLang = lang || this.language;
        if (!this.isVoiceEnabled || !this.synth) return;

        // Cancel any ongoing speech
        this.synth.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = speechLang;
        utterance.rate = 0.9; 
        utterance.pitch = 1;

        // Optionally find a specific voice (e.g., female professional)
        const voices = this.synth.getVoices();
        const preferredVoice = voices.find(v => v.name.includes('Female') || v.name.includes('Google US English'));
        if (preferredVoice) utterance.voice = preferredVoice;

        this.synth.speak(utterance);
    }

    announcePatient(token, room) {
        // Professional announcement format
        const cleanToken = token.replace('TKN-', '');
        const message = `Attention please. Token number ${cleanToken}, please proceed to ${room}. Thank you.`;
        this.speakMessage(message);
    }
}

export const voiceService = new VoiceService();
