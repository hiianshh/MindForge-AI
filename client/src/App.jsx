import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Atom, BookMarked, Brain, CircleHelp, Compass, FlaskConical, Globe2, Landmark, LoaderCircle, Microscope, Scale, Sparkles, WandSparkles } from 'lucide-react';
import CategoryCard from './components/CategoryCard.jsx';
import EvaluationDashboard from './components/EvaluationDashboard.jsx';
import Navbar from './components/Navbar.jsx';
import PassageViewer from './components/PassageViewer.jsx';
import SpeechRecorder from './components/SpeechRecorder.jsx';
import { evaluateRecitation, expandPassage, fetchHistory, fetchStatus, generatePassage, transcribeAudio } from './services/api.js';
import { createAudioRecorder } from './services/audioRecorder.js';
import { createSpeechRecognition } from './services/speechToText.js';

const categories = [
  { name: 'History & Ancient Civilizations', short: 'Empires, ideas & turning points', icon: Landmark, color: '#f6bc72' },
  { name: 'Physics & Scientific Discoveries', short: 'Forces, matter & new frontiers', icon: Atom, color: '#71c9f0' },
  { name: 'Geography & Earth Wonders', short: 'Landscapes, systems & our planet', icon: Globe2, color: '#6ed6b0' },
  { name: 'Medical Concepts & Bio-Science', short: 'Living systems & human health', icon: Microscope, color: '#fb8e9e' },
  { name: 'Philosophy & Human Psychology', short: 'The mind, meaning & being', icon: Brain, color: '#bd9bf2' },
  { name: 'Modern Technology & AI', short: 'Emerging tools & tomorrow', icon: FlaskConical, color: '#9aabff' },
  { name: 'Classic Literature & Literary Terms', short: 'Stories, language & interpretation', icon: BookMarked, color: '#ed9bc2' },
  { name: 'Politics, Economics & World Affairs', short: 'Power, markets & global change', icon: Scale, color: '#f0a36c' },
];

const HistoryTrend = lazy(() => import('./components/HistoryTrend.jsx'));

export default function App() {
  const [step, setStep] = useState('home');
  const [view, setView] = useState('practice');
  const [passage, setPassage] = useState(null);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [transcript, setTranscript] = useState('');
  const [aiReady, setAiReady] = useState(false);
  const [theme, setTheme] = useState(() => {
    try { return window.localStorage.getItem('mindforge.theme') || 'light'; }
    catch { return 'dark'; }
  });
  const [databaseReady, setDatabaseReady] = useState(false);
  const [statusChecked, setStatusChecked] = useState(false);
  const [interim, setInterim] = useState('');
  const [recognitionState, setRecognitionState] = useState('idle');
  const [recognitionSupported] = useState(() => Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));
  const [audioAvailable] = useState(() => Boolean(window.MediaRecorder && navigator.mediaDevices?.getUserMedia));
  const [audioMode, setAudioMode] = useState(() => !Boolean(window.SpeechRecognition || window.webkitSpeechRecognition) && Boolean(window.MediaRecorder && navigator.mediaDevices?.getUserMedia));
  const [audioRecorded, setAudioRecorded] = useState(false);
  const [speechError, setSpeechError] = useState('');
  const [processingLabel, setProcessingLabel] = useState('Evaluating…');
  const [busy, setBusy] = useState(false);
  const [expanding, setExpanding] = useState(false);
  const [expandError, setExpandError] = useState('');
  const [error, setError] = useState('');
  const [duration, setDuration] = useState(5);
  const [seconds, setSeconds] = useState(300);
  const [timerRunning, setTimerRunning] = useState(false);
  const [historyAvailable, setHistoryAvailable] = useState(true);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');
  const recordingStartedAtRef = useRef(null);
  const recordingElapsedRef = useRef(0);
  const audioRecorderRef = useRef(null);

  useEffect(() => {
    fetchStatus().then((status) => {
      setAiReady(status.aiConfigured);
      const connected = status.database === 'connected';
      setDatabaseReady(connected);
      setHistoryAvailable(connected);
      if (connected) fetchHistory().then((payload) => setHistory(payload.sessions || [])).catch(() => setHistoryAvailable(false));
    }).catch(() => setHistoryAvailable(false)).finally(() => setStatusChecked(true));
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { window.localStorage.setItem('mindforge.theme', theme); } catch { /* Theme still applies for this visit. */ }
  }, [theme]);

  useEffect(() => {
    if (!timerRunning || step !== 'reader') return undefined;
    const timer = window.setInterval(() => setSeconds((value) => {
      if (value <= 1) { setTimerRunning(false); return 0; }
      return value - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [timerRunning, step]);

  useEffect(() => () => {
    recognitionRef.current?.abort();
    audioRecorderRef.current?.dispose();
  }, []);

  function resetSession() {
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    audioRecorderRef.current?.dispose(); audioRecorderRef.current = null;
    transcriptRef.current = '';
    recordingStartedAtRef.current = null; recordingElapsedRef.current = 0;
    setAudioRecorded(false); setAudioMode(!recognitionSupported && audioAvailable);
    setTranscript(''); setInterim(''); setSpeechError(''); setRecognitionState('idle');
    setPassage(null); setResult(null); setError(''); setBusy(false); setTimerRunning(false); setDuration(5); setSeconds(300); setStep('home'); setView('practice');
  }

  async function beginPractice(category) {
    setBusy(true); setError(''); setView('practice');
    try {
      const payload = await generatePassage(category);
      setPassage(payload.passage); setStep('reader'); setSeconds(300); setDuration(5);
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  }

  async function addPassageDepth() {
    if (!passage || expanding) return;
    setExpanding(true); setExpandError('');
    try {
      const payload = await expandPassage({
        title: passage.title,
        category: passage.category,
        definition: passage.definition,
        content: passage.content,
        previousSections: passage.expansions || [],
        depthNumber: (passage.expansions?.length || 0) + 1,
      });
      setPassage((current) => current ? { ...current, expansions: [...(current.expansions || []), payload.expansion] } : current);
    } catch (requestError) {
      setExpandError(requestError.message || 'Could not add a deeper section. Try again.');
    } finally {
      setExpanding(false);
    }
  }

  function startRecordingClock() {
    if (recordingStartedAtRef.current === null) recordingStartedAtRef.current = Date.now();
  }

  function stopRecordingClock() {
    if (recordingStartedAtRef.current !== null) {
      recordingElapsedRef.current += Date.now() - recordingStartedAtRef.current;
      recordingStartedAtRef.current = null;
    }
  }

  async function startRecording() {
    setSpeechError('');
    if (audioMode) {
      try {
        if (!audioRecorderRef.current) audioRecorderRef.current = await createAudioRecorder();
        else audioRecorderRef.current.resume();
        startRecordingClock();
        setAudioRecorded(true); setRecognitionState('listening');
      } catch (recordError) {
        setSpeechError(recordError.message || 'Microphone could not start. Check browser permissions, or type your response.');
        setRecognitionState('paused');
      }
      return;
    }
    if (!recognitionSupported) {
      if (audioAvailable) setAudioMode(true);
      else setRecognitionState('paused');
      return;
    }
    try {
      startRecordingClock();
      if (!recognitionRef.current) {
        recognitionRef.current = createSpeechRecognition({
          onTranscript: (recognizedText, liveText) => {
            if (recognizedText) {
              transcriptRef.current = recognizedText;
              setTranscript(recognizedText);
            }
            setInterim(liveText);
          },
          onState: (state) => {
            if (state === 'stopped' && recordingStartedAtRef.current !== null) {
              recordingElapsedRef.current += Date.now() - recordingStartedAtRef.current;
              recordingStartedAtRef.current = null;
            }
            setRecognitionState((current) => current === 'paused' && state === 'stopped' ? 'paused' : state);
          },
          onError: (code) => {
            if (code === 'network' && audioAvailable) {
              stopRecordingClock();
              recognitionRef.current?.abort(); recognitionRef.current = null;
              setAudioMode(true);
              setSpeechError('Live transcription lost its network connection. Tap the microphone to record audio; Gemini will transcribe it when you submit.');
              setRecognitionState('idle');
              return;
            }
            if (code === 'no-speech' || code === 'aborted') return;
            setSpeechError(`Speech recognition issue (${code}). You can continue by typing below.`);
            setRecognitionState('paused');
          },
        });
      }
      recognitionRef.current.start();
    } catch { recordingStartedAtRef.current = null; setSpeechError('Microphone could not start. Check browser permissions, or type your response below.'); setRecognitionState('paused'); }
  }

  function pauseRecording() {
    stopRecordingClock();
    if (audioMode) audioRecorderRef.current?.pause();
    else recognitionRef.current?.stop();
    setRecognitionState('paused');
  }

  function clearRecording() {
    recognitionRef.current?.abort(); recognitionRef.current = null; transcriptRef.current = '';
    audioRecorderRef.current?.dispose(); audioRecorderRef.current = null;
    recordingStartedAtRef.current = null; recordingElapsedRef.current = 0;
    setAudioRecorded(false);
    setTranscript(''); setInterim(''); setSpeechError(''); setRecognitionState('idle');
  }

  function useAudioFallback() {
    recognitionRef.current?.abort(); recognitionRef.current = null;
    stopRecordingClock(); setAudioMode(true); setRecognitionState('idle');
    setSpeechError('Audio fallback is ready. Record a clip, then submit it for transcription.');
  }

  function updateTranscript(value) { transcriptRef.current = value; setTranscript(value); }

  async function submitRecitation() {
    if (transcriptRef.current.trim().length < 20 && !(audioMode && audioRecorded)) return;
    stopRecordingClock();
    recognitionRef.current?.stop(); setRecognitionState('stopped'); setBusy(true); setError('');
    try {
      let spokenTranscript = transcriptRef.current.trim();
      if (audioMode && audioRecorderRef.current) {
        setProcessingLabel('Transcribing audio…');
        const audio = await audioRecorderRef.current.stop();
        audioRecorderRef.current = null;
        if (audio.size > 3 * 1024 * 1024) throw new Error('That recording is over 3 MB. Clear it and record a shorter response.');
        const transcribed = await transcribeAudio(audio);
        spokenTranscript = [spokenTranscript, transcribed.transcript].filter(Boolean).join('\n').trim();
        transcriptRef.current = spokenTranscript; setTranscript(spokenTranscript);
      }
      if (spokenTranscript.length < 20) throw new Error('Not enough clear speech was captured. Record again or type your response.');
      setProcessingLabel('Evaluating…');
      const expandedSource = [passage.content, ...(passage.expansions || []).slice(-2).map((section) => `${section.title}\n${section.content}`)].join('\n\n').slice(0, 16000);
      const payload = await evaluateRecitation({ passage: { ...passage, content: expandedSource }, transcript: spokenTranscript, recitationSeconds: Math.round(recordingElapsedRef.current / 1000) || null });
      setResult(payload.evaluation); setStep('report');
      if (payload.session) setHistory((existing) => [payload.session, ...existing]);
      else setHistoryAvailable(false);
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  }

  async function showHistory() {
    setView('history'); setStep('history');
    if (!databaseReady) { setHistoryAvailable(false); return; }
    try { const payload = await fetchHistory(); setHistory(payload.sessions || []); setHistoryAvailable(true); }
    catch { setHistoryAvailable(false); }
  }

  function returnToPassage() {
    recognitionRef.current?.abort(); recognitionRef.current = null;
    audioRecorderRef.current?.dispose(); audioRecorderRef.current = null;
    stopRecordingClock(); setAudioRecorded(false); setRecognitionState('idle'); setStep('reader');
  }

  function setReadingDuration(value) { setDuration(value); setSeconds(value * 60); setTimerRunning(false); }

  return <div className="app-shell">
    <div className="ambient ambient-one" /><div className="ambient ambient-two" />
    <Navbar view={view} theme={theme} onToggleTheme={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')} onNavigate={(next) => next === 'history' ? showHistory() : (setView('practice'), setStep('home'))} completedCount={history.length} />
    <main className="main-content">
      {view === 'history' ? <section className="history-screen"><div className="section-eyebrow"><span className="kicker-line" /> YOUR PRACTICE ARCHIVE</div><div className="history-heading"><div><h1>Growth, <em>in hindsight.</em></h1><p>Every session makes the next idea easier to carry.</p></div><button className="primary-button" onClick={resetSession}><Sparkles size={15} /> New practice</button></div>
        {!historyAvailable && <div className="history-notice">Session storage is offline. Add a MongoDB connection to persist practice history across visits.</div>}
        {history.length > 0 ? <><Suspense fallback={<div className="trend-loading">Loading your progress…</div>}><HistoryTrend sessions={history} /></Suspense><div className="history-table"><div className="history-table-head"><span>CONCEPT</span><span>FIELD</span><span>DATE</span><span>PERFORMANCE</span></div>{history.map((session, index) => <button className="history-row" key={session._id || `${session.concept}-${index}`} onClick={() => { setPassage({ title: session.concept, category: session.category }); setResult(session.evaluation); setView('practice'); setStep('report'); }}><span className="history-concept">{session.concept}<small>{session.evaluation?.badge || 'Practice session'}</small></span><span className="history-field">{session.category}</span><span className="history-date">{new Date(session.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span><span className="history-score"><strong>{session.score ?? session.evaluation?.overallScore ?? '—'}</strong><small>/100</small><ArrowUpRightIcon /></span></button>)}</div></> : <div className="empty-history"><span className="empty-icon"><Compass size={23} /></span><h2>Your first idea is waiting.</h2><p>Complete a speaking session and your progress will live here.</p><button className="secondary-button" onClick={() => { setView('practice'); setStep('home'); }}>Explore topics <ArrowRightIcon /></button></div>}
        <div className="history-footnote"><span className="status-dot" /> {historyAvailable ? 'Your practice history is synced to this workspace.' : 'MongoDB is not connected; sessions cannot be saved yet.'}</div>
      </section> : <AnimatePresence mode="wait">
        {step === 'home' && <section className="home-screen" key="home">{statusChecked && !aiReady && <div className="setup-notice"><CircleHelp size={16} /><span><strong>Connect Gemini to begin.</strong> {import.meta.env.PROD ? <>Add <code>GEMINI_API_KEY</code> in Vercel Project Settings → Environment Variables, then redeploy.</> : <>Add your Google AI Studio key as <code>GEMINI_API_KEY</code> in <code>server/.env</code>.</>}</span></div>}<div className="hero-copy"><div className="section-eyebrow"><span className="kicker-line" /> THINK DEEPER. SPEAK CLEARER.</div><h1>Knowledge worth<br /> <em>speaking about.</em></h1><p>Explore an idea. Make it yours. Find the words to bring it to life.</p><div className="hero-actions"><button className="surprise-button" disabled={busy} onClick={() => beginPractice(categories[Math.floor(Math.random() * categories.length)].name)}><WandSparkles size={17} /> Surprise me <span>↗</span></button><span className="hero-action-note">ONE IDEA. ONE CLEARER VOICE.</span></div></div>
          <div className="topic-section"><div className="topic-heading"><div><span className="section-eyebrow"><span className="kicker-line" /> CHOOSE YOUR TERRITORY</span><h2>Where shall we <em>wander?</em></h2></div><span className="topic-count">08 FIELDS <i /> ENDLESS IDEAS</span></div><div className="category-grid">{categories.map((category, index) => <CategoryCard key={category.name} category={category} index={index} onSelect={beginPractice} disabled={busy} />)}</div></div>
          {busy && <div className="loading-banner"><LoaderCircle className="spin" size={17} /> Finding an idea worth your attention…</div>}{error && <div className="error-banner">{error}<button onClick={() => setError('')}>Dismiss</button></div>}
          <div className="home-bottom"><div className="bottom-stat"><span>01</span><p><b>One curious concept</b> picked just for your chosen field</p></div><div className="bottom-stat"><span>02</span><p><b>A considered reading</b> built to reward attention</p></div><div className="bottom-stat"><span>03</span><p><b>Useful feedback</b> for your next conversation</p></div><div className="bottom-micro">PRIVATE BY DESIGN <i /> WORDS, NOT WAVES</div></div>
        </section>}
        {step === 'reader' && passage && <PassageViewer key="reader" passage={passage} seconds={seconds} duration={duration} running={timerRunning} onDuration={setReadingDuration} onToggle={() => setTimerRunning((value) => !value)} onReset={() => { setSeconds(duration * 60); setTimerRunning(false); }} onStart={() => { setTimerRunning(false); setStep('record'); }} onBack={() => { setStep('home'); setTimerRunning(false); }} onExpand={addPassageDepth} expanding={expanding} expandError={expandError} />}
        {step === 'record' && passage && <SpeechRecorder key="record" transcript={transcript} interim={interim} state={recognitionState} supported={recognitionSupported} audioAvailable={audioAvailable} audioMode={audioMode} audioRecorded={audioRecorded} processingLabel={processingLabel} error={speechError} onStart={startRecording} onPause={pauseRecording} onResume={startRecording} onReset={clearRecording} onUseAudioFallback={useAudioFallback} onSubmit={submitRecitation} submitting={busy} onBack={returnToPassage} onTranscriptChange={updateTranscript} />}
        {step === 'report' && result && <EvaluationDashboard key="report" result={result} passage={passage} onAgain={resetSession} onHistory={showHistory} />}
      </AnimatePresence>}
      {error && step !== 'home' && view !== 'history' && <div className="error-banner floating-error">{error}<button onClick={() => setError('')}>Dismiss</button></div>}
    </main>
  </div>;
}

function ArrowUpRightIcon() { return <span className="score-arrow">↗</span>; }
function ArrowRightIcon() { return <span className="button-arrow">→</span>; }