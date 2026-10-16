const API_BASE = '/api/v1';

export async function fetchSessions() {
  const res = await fetch(`${API_BASE}/sessions`);
  if (!res.ok) throw new Error('Failed to fetch sessions');
  return res.json();
}

export async function fetchSession(sessionId) {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}`);
  if (!res.ok) throw new Error(`Failed to fetch session ${sessionId}`);
  return res.json();
}

export async function fetchClaims(sessionId, minStatus = null) {
  const url = minStatus 
    ? `${API_BASE}/sessions/${sessionId}/claims?min_status=${minStatus}`
    : `${API_BASE}/sessions/${sessionId}/claims`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch claims for ${sessionId}`);
  return res.json();
}

export async function createSession(data) {
  const res = await fetch(`${API_BASE}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create session');
  return res.json();
}

export async function verifyCustomClaim(sessionId, payload) {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/claims/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to verify custom claim');
  return res.json();
}

export async function analyzeSegment(sessionId, timestamp) {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/claims/analyze_segment?timestamp=${timestamp}`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to analyze segment');
  return res.json();
}

export function getExportUrl(sessionId, format = 'markdown') {
  return `${API_BASE}/sessions/${sessionId}/dossier/export?format=${format}`;
}
