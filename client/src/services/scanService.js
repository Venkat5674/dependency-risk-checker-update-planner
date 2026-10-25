/**
 * @file scanService.js
 * @description API service for triggering scans, viewing history, and retrying failed scans.
 */

import api from './api';

export const scanService = {
  /**
   * List all scans for the user, or scans for a specific project.
   */
  list: async (projectId = null) => {
    const url = projectId ? `/projects/${projectId}/scans` : '/scans';
    const res = await api.get(url);
    return res.data;
  },

  /**
   * Trigger a new scan for a project.
   */
  create: async (projectId) => {
    const res = await api.post(`/projects/${projectId}/scans`);
    return res.data;
  },

  /**
   * Get full details of a specific scan.
   */
  get: async (scanId) => {
    const res = await api.get(`/scans/${scanId}`);
    return res.data;
  },

  /**
   * Poll status of an active scan.
   */
  status: async (scanId) => {
    const res = await api.get(`/scans/${scanId}/status`);
    return res.data;
  },

  /**
   * Retry a failed scan.
   */
  retry: async (scanId) => {
    const res = await api.post(`/scans/${scanId}/retry`);
    return res.data;
  },
};

export default scanService;
