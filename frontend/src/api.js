import axios from 'axios';

/**
 * Base Axios instance pointing to the FastAPI backend.
 */
export const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000, // 2 minutes to accommodate Gemini LLM generation if needed
});

/**
 * Normalize role strings between UI display values and backend enum values.
 * Backend accepts: "project_head" | "junior_dev"
 */
export const normalizeRole = (role) => {
  if (!role) return 'project_head';
  const clean = String(role).trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (clean.includes('junior') || clean.includes('contributor') || clean === 'junior_dev') {
    return 'junior_dev';
  }
  return 'project_head';
};

/**
 * Format error message from Axios or network failures.
 */
const extractErrorMessage = (error, defaultMessage) => {
  if (error.response?.data?.detail) {
    const detail = error.response.data.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      return detail.map((d) => d.msg || JSON.stringify(d)).join(', ');
    }
    return JSON.stringify(detail);
  }
  if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
    return 'Cannot connect to ContextBridge API on http://localhost:8000. Ensure the FastAPI backend is running.';
  }
  return error.message || defaultMessage;
};

/**
 * Seed synthetic chat records demonstrating conflict resolution & RBAC.
 * @param {number} projectId 
 */
export const seedChat = async (projectId = 1) => {
  try {
    const response = await apiClient.post('/seed/chat', {
      project_id: Number(projectId),
    });
    return response.data;
  } catch (error) {
    const message = extractErrorMessage(error, 'Failed to seed synthetic chat data.');
    console.error('[API] seedChat error:', message);
    throw new Error(message);
  }
};

/**
 * Trigger Gemini/Groq knowledge claim extraction and persistence.
 * Supports standard RAG extraction or custom text extraction for the Interactive Sandbox.
 * @param {number} projectId 
 * @param {string} role 
 * @param {string|null} customText 
 */
export const generateHandover = async (projectId = 1, role = 'project_head', customText = null) => {
  try {
    const payload = {
      project_id: Number(projectId) || 1,
      role: normalizeRole(role),
    };
    if (customText !== null && customText !== undefined) {
      payload.custom_text = customText;
    }
    const response = await apiClient.post('/handover/generate', payload);
    return response.data;
  } catch (error) {
    const message = extractErrorMessage(error, 'Failed to generate handover blueprint.');
    console.error('[API] generateHandover error:', message);
    throw new Error(message);
  }
};

/**
 * Interactive Sandbox extraction: posts custom chat script directly to /api/handover/generate.
 * Sends { role: "project_head", custom_text: <text> }.
 * @param {string} customText
 * @param {string} role
 * @param {number} projectId
 */
export const runSandboxExtraction = async (customText, role = 'project_head', projectId = 1) => {
  try {
    const response = await apiClient.post('/handover/generate', {
      role: normalizeRole(role),
      project_id: Number(projectId) || 1,
      custom_text: customText,
    });
    return response.data;
  } catch (error) {
    const message = extractErrorMessage(error, 'Failed to extract claims from sandbox script.');
    console.error('[API] runSandboxExtraction error:', message);
    throw new Error(message);
  }
};

/**
 * Fetch persisted handover claims with nested source evidence.
 * @param {number} projectId 
 * @param {string} role 
 */
export const getHandover = async (projectId = 1, role = 'project_head') => {
  try {
    const response = await apiClient.get(`/handover/${Number(projectId)}`, {
      params: {
        role: normalizeRole(role),
      },
    });
    return response.data;
  } catch (error) {
    const message = extractErrorMessage(error, 'Failed to retrieve handover data.');
    console.error('[API] getHandover error:', message);
    throw new Error(message);
  }
};

/**
 * Fetch bus-factor domain continuity risk metrics.
 * @param {number} projectId 
 */
export const getBusFactor = async (projectId = 1) => {
  try {
    const response = await apiClient.get(`/analytics/bus-factor/${Number(projectId)}`);
    return response.data;
  } catch (error) {
    const message = extractErrorMessage(error, 'Failed to retrieve bus-factor metrics.');
    console.error('[API] getBusFactor error:', message);
    throw new Error(message);
  }
};

export default {
  seedChat,
  generateHandover,
  runSandboxExtraction,
  getHandover,
  getBusFactor,
};

