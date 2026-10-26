import { Pause, Play, RotateCcw } from 'lucide-react';

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const remainder = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainder}`;
}

export default function Timer({ seconds, duration, running, onDuration, onToggle, onReset }) {
  const progress = Math.max(0, Math.min(100, ((duration * 60 - seconds) / (duration * 60)) * 100));
  return (
    <div className="timer-widget">
      <div className="timer-topline"><span>READING PACE</span><div className="timer-controls">
        <button className={duration === 5 ? 'selected' : ''} onClick={() => onDuration(5)}>5 min</button>
        <button className={duration === 10 ? 'selected' : ''} onClick={() => onDuration(10)}>10 min</button>
      </div></div>
      <div className="timer-display"><strong>{formatTime(seconds)}</strong><div className="timer-actions">
        <button className="icon-button" onClick={onToggle} aria-label={running ? 'Pause timer' : 'Start timer'}>{running ? <Pause size={15} /> : <Play size={15} />}</button>
        <button className="icon-button" onClick={onReset} aria-label="Reset timer"><RotateCcw size={14} /></button>
      </div></div>
      <div className="timer-track"><span style={{ width: `${progress}%` }} /></div>
      <p>{running ? 'Stay with the idea, not the clock.' : 'Start the timer when you begin reading.'}</p>
    </div>
  );
}