import { AlertCircle, ArrowLeft, Check, CircleStop, Mic, RotateCcw, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const bars = [13, 22, 31, 16, 27, 36, 19, 29, 14, 34, 20, 26, 12, 32, 18, 24, 36, 15, 27, 19, 33, 14, 25, 17, 31, 12, 21, 35, 16, 27, 13, 30, 18, 24, 34, 15, 28, 20, 32, 14, 23, 17, 36, 12, 28, 19, 31, 15, 25, 34, 17, 27];

export default function SpeechRecorder({ transcript, interim, state, supported, audioAvailable, audioMode, audioRecorded, processingLabel, error, onStart, onPause, onResume, onReset, onUseAudioFallback, onSubmit, onBack, onTranscriptChange, submitting }) {
  const listening = state === 'listening';
  const recordHint = listening ? (audioMode ? 'RECORDING AUDIO · TAP TO PAUSE' : 'TAP TO PAUSE') : state === 'paused' ? 'TAP TO RESUME' : audioMode ? 'TAP TO RECORD AUDIO' : 'TAP TO BEGIN';
  return (
    <motion.section className="recite-screen" initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
      <button className="back-link" onClick={onBack}><ArrowLeft size={15} /> BACK TO PASSAGE</button>
      <div className="recite-heading"><div className="live-label"><span className={`status-dot ${listening ? 'pulse' : ''}`} /> {listening ? (audioMode ? 'RECORDING AUDIO' : 'LISTENING') : state === 'paused' ? 'PAUSED' : audioMode ? 'AUDIO FALLBACK' : 'YOUR TURN'}</div><h1>Make the idea <em>yours.</em></h1><p>Explain what stayed with you. Don't aim for perfect; aim for clear.</p></div>
      <div className={`record-stage ${listening ? 'is-live' : ''}`}>
        <div className="waveform" aria-hidden="true">{bars.map((height, index) => <motion.span key={index} style={{ height }} animate={listening ? { scaleY: [0.42, 1, 0.5, 0.86, 0.42] } : { scaleY: 0.38 }} transition={listening ? { duration: 0.76 + (index % 5) * 0.12, repeat: Infinity, delay: index * 0.018 } : { duration: 0.2 }} />)}</div>
        <motion.button className={`record-button ${listening ? 'recording' : ''}`} onClick={listening ? onPause : state === 'paused' ? onResume : onStart} whileTap={{ scale: 0.95 }} aria-label={listening ? 'Pause recording' : state === 'paused' ? 'Resume recording' : 'Start recording'}>
          {listening ? <CircleStop size={28} fill="currentColor" /> : <Mic size={28} />}
        </motion.button>
        <div className="record-hint">{recordHint}</div>
      </div>
      {!supported && !audioMode && <div className="inline-notice"><AlertCircle size={16} /> Live speech recognition is unavailable here. Type your response below instead.</div>}
      {audioMode && audioAvailable && <div className="inline-notice warning"><AlertCircle size={16} /> Audio stays in this browser while recording. On submit, Gemini receives it to create your transcript.</div>}
      {error && <div className="inline-notice warning"><AlertCircle size={16} /> {error}</div>}
      {!audioMode && audioAvailable && !supported && <button className="secondary-button fallback-button" onClick={onUseAudioFallback}><Mic size={14} /> Record audio for Gemini transcription</button>}
      <div className="transcript-panel"><div className="transcript-top"><div><span className="transcript-indicator" /><strong>{audioMode && audioRecorded && !transcript.trim() ? 'AUDIO READY TO TRANSCRIBE' : 'YOUR TRANSCRIPT'}</strong></div><span>{transcript.trim() ? `${transcript.trim().split(/\s+/).length} WORDS` : audioMode && audioRecorded ? 'TRANSCRIBED ON SUBMIT' : 'WORDS APPEAR HERE'}</span></div>
        <textarea value={transcript} onChange={(event) => onTranscriptChange(event.target.value)} placeholder={audioMode && audioRecorded ? 'Your recording will be transcribed when you submit.' : supported ? 'Your words will appear here as you speak. You can also edit the transcript.' : 'Share what you remember about the concept...'} aria-label="Your recitation transcript" />
        {interim && <div className="interim-line">{interim}</div>}
      </div>
      <div className="recite-controls"><button className="text-button" onClick={onReset}><RotateCcw size={15} /> Clear &amp; restart</button><div className="control-right">{state === 'paused' && <button className="secondary-button" onClick={onResume}><Mic size={15} /> Resume</button>}<button className="primary-button" onClick={onSubmit} disabled={submitting || (transcript.trim().length < 20 && !(audioMode && audioRecorded))}><Sparkles size={16} /> {submitting ? processingLabel : audioMode && audioRecorded ? 'Transcribe & evaluate' : 'Submit recitation'} <Check size={15} /></button></div></div>
      <div className="privacy-caption">{audioMode ? 'Audio is sent to Gemini only when submitted. Only its transcript is saved with your session.' : 'Live speech stays in your browser. If its network service fails, use audio fallback; audio uploads only on submit.'} Feedback cannot assess pronunciation or vocal delivery.</div>
    </motion.section>
  );
}