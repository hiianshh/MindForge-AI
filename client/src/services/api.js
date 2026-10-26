const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
const VISITOR_KEY = 'mindforge.visitor-id';
const SEEN_CONCEPTS_KEY = 'mindforge.seen-concepts';
let fallbackVisitorId;
let fallbackSeenConcepts = {};

function getVisitorId() {
  try {
    const existing = window.localStorage.getItem(VISITOR_KEY);
    if (existing) return existing;
    const visitorId = window.crypto.randomUUID();
    window.localStorage.setItem(VISITOR_KEY, visitorId);
    return visitorId;
  } catch {
    fallbackVisitorId ||= window.crypto.randomUUID();
    return fallbackVisitorId;
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'The request could not be completed.');
  return payload;
}

function readSeenConcepts() {
  try {
    return JSON.parse(window.localStorage.getItem(SEEN_CONCEPTS_KEY) || '{}');
  } catch {
    return fallbackSeenConcepts;
  }
}

function saveSeenConcepts(concepts) {
  fallbackSeenConcepts = concepts;
  try {
    window.localStorage.setItem(SEEN_CONCEPTS_KEY, JSON.stringify(concepts));
  } catch {
    return;
  }
}

export async function generatePassage(category) {
  const key = category.trim().toLocaleLowerCase();
  const seen = readSeenConcepts();
  const avoidConcepts = Array.isArray(seen[key]) ? seen[key].slice(-40) : [];
  const payload = await request('/ai/generate', {
    method: 'POST',
    body: JSON.stringify({ category, avoidConcepts }),
  });
  if (payload.passage?.title) {
    seen[key] = [...avoidConcepts, payload.passage.title].slice(-50);
    saveSeenConcepts(seen);
  }
  return payload;
}

export const expandPassage = (passage) => request('/ai/expand', {
  method: 'POST',
  body: JSON.stringify(passage),
});

export const evaluateRecitation = (session) => request('/ai/evaluate', {
  method: 'POST',
  body: JSON.stringify({ ...session, ownerId: getVisitorId() }),
});

export async function transcribeAudio(blob) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not prepare the audio for transcription.'));
    reader.readAsDataURL(blob);
  });
  const separator = dataUrl.indexOf(',');
  const audioBase64 = dataUrl.slice(separator + 1);
  const mimeType = blob.type.split(';')[0] || 'audio/webm';
  return request('/ai/transcribe', {
    method: 'POST',
    body: JSON.stringify({ audioBase64, mimeType }),
  });
}

export const fetchHistory = () => request(`/history?ownerId=${encodeURIComponent(getVisitorId())}`);
export const fetchStatus = () => request('/health');