import axios from 'axios';
import io from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Axios instance
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Socket.IO connection
export const socket = io(API_BASE_URL, {
  autoConnect: false,
});

// API methods
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
};

export const masteryAPI = {
  calculateMastery: (data) => api.post('/mastery/calculate', data),
  getStudentMastery: (studentId) => api.get(`/mastery/student/${studentId}`),
};

export const practiceAPI = {
  generateSession: (data) => api.post('/practice/generate', data),
};

export const engagementAPI = {
  analyzeEngagement: (data) => api.post('/engagement/analyze', data),
  getClassEngagement: (classId) => api.get(`/engagement/class/${classId}`),
};

export const pollsAPI = {
  createPoll: (data) => api.post('/polls/create', data),
  respondToPoll: (pollId, data) => api.post(`/polls/${pollId}/respond`, data),
  getPollResults: (pollId) => api.get(`/polls/${pollId}`),
};

export const projectsAPI = {
  listProjects: (params) => api.get('/projects', { params }),
  getProjectDetails: (projectId) => api.get(`/projects/${projectId}`),
};

export const softSkillsAPI = {
  submitAssessment: (data) => api.post('/soft-skills/assess', data),
  getTeamScores: (teamId) => api.get(`/soft-skills/team/${teamId}`),
};

export const templatesAPI = {
  listTemplates: (params) => api.get('/templates', { params }),
};

export const analyticsAPI = {
  getUnifiedMetrics: (date) => api.get('/analytics/unified', { params: { date } }),
};

export default api;