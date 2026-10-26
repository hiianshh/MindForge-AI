export function createSpeechRecognition({ onTranscript, onState, onError }) {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) return null;

  const recognition = new Recognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  let committedText = '';
  let finalResults = new Map();
  let interimResults = new Map();
  let shouldListen = false;
  let recognitionRunning = false;
  let restartTimer;

  function normalizedWords(value) {
    return value.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim().split(/\s+/).filter(Boolean);
  }

  function removeRepeatedPhrases(value) {
    const words = value.trim().split(/\s+/).filter(Boolean);
    const output = [];
    let cursor = 0;
    while (cursor < words.length) {
      const maximumPhraseLength = Math.min(32, Math.floor((words.length - cursor) / 2));
      let repeatedLength = 0;
      let repeatCount = 0;
      for (let length = maximumPhraseLength; length > 0; length -= 1) {
        const phrase = words.slice(cursor, cursor + length).map((word) => word.toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu, ''));
        let repeats = 1;
        while (cursor + (repeats + 1) * length <= words.length) {
          const nextPhrase = words.slice(cursor + repeats * length, cursor + (repeats + 1) * length)
            .map((word) => word.toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu, ''));
          if (!phrase.every((word, index) => word === nextPhrase[index])) break;
          repeats += 1;
        }
        if (repeats > 1) {
          repeatedLength = length;
          repeatCount = repeats;
          break;
        }
      }
      output.push(...words.slice(cursor, cursor + (repeatedLength || 1)));
      cursor += repeatedLength ? repeatedLength * repeatCount : 1;
    }
    return output.join(' ');
  }

  function mergeTranscript(existing, incoming) {
    const oldText = existing.trim();
    const newText = removeRepeatedPhrases(incoming);
    if (!oldText) return newText;
    if (!newText) return oldText;

    const oldWords = normalizedWords(oldText);
    const newWords = normalizedWords(newText);
    if (!oldWords.length) return newText;
    if (!newWords.length) return oldText;

    const containsAt = (source, target) => source.length >= target.length
      && target.every((word, index) => source[index] === word);
    if (containsAt(newWords, oldWords)) return newText;
    if (containsAt(oldWords, newWords)) return oldText;

    let overlap = Math.min(oldWords.length, newWords.length);
    while (overlap > 0) {
      const oldTail = oldWords.slice(-overlap);
      const newHead = newWords.slice(0, overlap);
      if (oldTail.every((word, index) => word === newHead[index])) break;
      overlap -= 1;
    }
    if (overlap > 0) {
      const remainder = newText.split(/\s+/).slice(overlap).join(' ');
      return remainder ? `${oldText} ${remainder}` : oldText;
    }
    return `${oldText} ${newText}`;
  }

  function currentFinalText() {
    return [...finalResults.entries()]
      .sort(([left], [right]) => left - right)
      .map(([, text]) => text.trim())
      .reduce((text, segment) => mergeTranscript(text, segment), '');
  }

  function publishTranscript() {
    const finalText = mergeTranscript(committedText, currentFinalText());
    const interimText = [...interimResults.entries()]
      .sort(([left], [right]) => left - right)
      .map(([, text]) => text.trim())
      .filter(Boolean)
      .reduce((text, segment) => mergeTranscript(text, segment), '')
      .trim();
    onTranscript(finalText, interimText);
  }

  function startRecognition() {
    if (!shouldListen || recognitionRunning) return;
    finalResults = new Map();
    interimResults = new Map();
    try {
      recognition.start();
      recognitionRunning = true;
    } catch (error) {
      if (error.name === 'InvalidStateError') {
        clearTimeout(restartTimer);
        restartTimer = setTimeout(startRecognition, 250);
        return;
      }
      shouldListen = false;
      onError(error.name === 'NotAllowedError' ? 'not-allowed' : 'start-failed');
    }
  }

  recognition.onstart = () => {
    recognitionRunning = true;
    onState('listening');
  };
  recognition.onend = () => {
    recognitionRunning = false;
    committedText = mergeTranscript(committedText, currentFinalText());
    finalResults = new Map();
    interimResults = new Map();
    publishTranscript();
    if (shouldListen) {
      clearTimeout(restartTimer);
      restartTimer = setTimeout(startRecognition, 250);
    } else {
      onState('stopped');
    }
  };
  recognition.onerror = (event) => {
    if (event.error !== 'no-speech' && event.error !== 'aborted') shouldListen = false;
    onError(event.error);
  };
  recognition.onresult = (event) => {
    for (let index = 0; index < event.results.length; index += 1) {
      const result = event.results[index];
      const text = result[0].transcript.trim();
      if (!text) continue;
      if (result.isFinal) {
        finalResults.set(index, text);
        interimResults.delete(index);
      } else if (!finalResults.has(index)) {
        interimResults.set(index, text);
      }
    }
    publishTranscript();
  };

  return {
    start: () => {
      shouldListen = true;
      clearTimeout(restartTimer);
      startRecognition();
    },
    stop: () => {
      shouldListen = false;
      clearTimeout(restartTimer);
      if (recognitionRunning) recognition.stop();
    },
    abort: () => {
      shouldListen = false;
      recognitionRunning = false;
      clearTimeout(restartTimer);
      recognition.abort();
    },
  };
}