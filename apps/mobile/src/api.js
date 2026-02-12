import { API_BASE_URL } from './config';

async function parseJson(response) {
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || 'Request failed');
  }

  return payload;
}

export async function startSpotifyAuth() {
  const response = await fetch(`${API_BASE_URL}/auth/spotify/start`, {
    method: 'POST'
  });
  return parseJson(response);
}

export async function runAnalysis(userId = 'demo-user') {
  const response = await fetch(`${API_BASE_URL}/analysis/${encodeURIComponent(userId)}`);
  return parseJson(response);
}

export async function createDonationCheckout({ amountUsd, roundUpProcessingFees }) {
  const response = await fetch(`${API_BASE_URL}/donations/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amountUsd, roundUpProcessingFees })
  });

  return parseJson(response);
}

export async function processSpotifyCallbackUrl(callbackUrl) {
  const response = await fetch(`${API_BASE_URL}/auth/spotify/callback?${callbackUrl.split('?')[1] || ''}`);
  return parseJson(response);
}

export async function exchangeSpotifyCode(code) {
  const response = await fetch(`${API_BASE_URL}/auth/spotify/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code })
  });

  return parseJson(response);
}
