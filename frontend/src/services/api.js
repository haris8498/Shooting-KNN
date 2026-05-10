import axios from 'axios';

const ML_API = 'http://localhost:8000';
const BACKEND_API = 'http://localhost:3000/api';

export const mlService = {
  train: async (settings) => {
    const res = await axios.post(`${ML_API}/train`, settings);
    return res.data;
  },
  predict: async (features) => {
    const res = await axios.post(`${ML_API}/predict`, features);
    return res.data;
  },
  getMetrics: async () => {
    const res = await axios.get(`${ML_API}/metrics`);
    return res.data;
  },
  saveSettings: async (settings) => {
    const res = await axios.post(`${ML_API}/settings`, settings);
    return res.data;
  },
  getRandomPlane: async () => {
    const res = await axios.get(`${ML_API}/random_plane`);
    return res.data;
  }
};

export const backendService = {
  saveMatch: async (matchData) => {
    const res = await axios.post(`${BACKEND_API}/game/save`, matchData);
    return res.data;
  },
  getHistory: async () => {
    const res = await axios.get(`${BACKEND_API}/game/history`);
    return res.data;
  },
  getStats: async () => {
    const res = await axios.get(`${BACKEND_API}/game/stats`);
    return res.data;
  }
};
