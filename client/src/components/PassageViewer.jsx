import { ArrowDown, ArrowLeft, ArrowRight, BookOpen, Clock3, LoaderCircle, Quote, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import Timer from './Timer.jsx';
import './PassageDepth.css';

export default function PassageViewer({ passage, seconds, duration, running, onDuration, onToggle, onReset, onStart, onBack, onExpand, expanding, expandError }) {
  const expansions = passage.expansions || [];
  const wordCount = [passage.content, ...expansions.map((section) => section.content)].join(' ').trim().split(/\s+/).filter(Boolean).length;

  return (
    <motion.section className="reader-layout" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
      <div className="reader-main">
        <button className="back-link" onClick={onBack}><ArrowLeft size={15} /> ALL TOPICS</button>
        <div className="concept-kicker"><span className="kicker-line" /> FEATURED CONCEPT <span className="kicker-category">{passage.category}</span></div>
        <h1 className="concept-title">{passage.title}<span className="title-period">.</span></h1>
        <div className="concept-meta"><span className="phonetic-spelling">/{passage.pronunciation}/</span><i /> <span>{passage.origin}</span></div>
        <p className="concept-definition">{passage.definition}</p>
        <div className="passage-heading"><div><BookOpen size={16} /><span>THE DEEP DIVE</span></div><small>{wordCount} WORDS <i /> ABOUT {Math.max(1, Math.ceil(wordCount / 210))} MIN READ</small></div>
        <article className="passage-body"><Quote className="quote-mark" size={23} /><div>{passage.content.split(/\n\n+/).filter(Boolean).map((paragraph, index) => <p key={`original-${index}`}>{paragraph}</p>)}</div></article>
        {expansions.map((section, sectionIndex) => <section className="expansion-section" key={`${sectionIndex}-${section.title}`}><div className="expansion-heading"><span>DEEPER DIVE <b>{String(sectionIndex + 1).padStart(2, '0')}</b></span><h2>{section.title}</h2></div><article className="passage-body"><Quote className="quote-mark" size={20} /><div>{section.content.split(/\n\n+/).filter(Boolean).map((paragraph, index) => <p key={`${sectionIndex}-${index}`}>{paragraph}</p>)}</div></article></section>)}
        <div className="expand-action"><button className="expand-button" onClick={onExpand} disabled={expanding}><span className="expand-button-icon">{expanding ? <LoaderCircle size={16} className="spin" /> : <Sparkles size={16} />}</span><span className="expand-button-copy"><strong>{expanding ? 'Building the next layer…' : 'Go deeper'}</strong><small>{expanding ? 'A fresh 500-word exploration is on its way' : 'Add a new 500-word exploration'}</small></span>{!expanding && <ArrowDown size={16} />}</button>{expandError && <p className="expand-error" role="status">{expandError}</p>}</div>
        <div className="reader-footer"><span><span className="footer-spark">✳</span> Let the idea settle before you speak.</span><button className="primary-button" onClick={onStart}>Hide passage &amp; start recitation <ArrowRight size={16} /></button></div>
      </div>
      <aside className="reader-rail"><div className="rail-label"><Clock3 size={15} /> YOUR SESSION</div><Timer seconds={seconds} duration={duration} running={running} onDuration={onDuration} onToggle={onToggle} onReset={onReset} /><div className="rail-note"><span className="note-number">01</span><div><strong>Read for meaning</strong><p>Look for the central idea, then notice the details that make it matter.</p></div></div><div className="rail-note"><span className="note-number">02</span><div><strong>Recall, don't recite</strong><p>In the next step, explain the idea naturally in your own words.</p></div></div><div className="secure-note"><span className="status-dot" /> Your passage hides when you begin speaking.</div></aside>
    </motion.section>
  );
}