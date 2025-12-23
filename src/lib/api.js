import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://top14-api-production.up.railway.app/api';

// Config
export async function getConfig() {
  const response = await axios.get(`${API_URL}/config`);
  return response.data;
}

// Stats
export async function getStats() {
  const response = await axios.get(`${API_URL}/stats`);
  return response.data;
}

// Classement
export async function getClassement(saison) {
  const url = saison 
    ? `${API_URL}/classement?saison=${saison}`
    : `${API_URL}/classement`;
  const response = await axios.get(url);
  return response.data;
}

// Odds Live
export async function getOddsLive() {
  const response = await axios.get(`${API_URL}/odds/live`);
  return response.data;
}

// Stats Précision
export async function getStatsPrecision(userId) {
  const url = userId
    ? `${API_URL}/stats/precision?userId=${userId}`
    : `${API_URL}/stats/precision`;
  const response = await axios.get(url);
  return response.data;
}
