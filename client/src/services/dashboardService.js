/**
 * @file dashboardService.js
 * @description API service for dashboard statistics, trends, and recent scan overviews.
 */

import api from './api';

export const dashboardService = {
  /**
   * Fetch top-level dashboard metrics (counts, open vulns, latest scan).
   */
  summary: async () => {
    const res = await api.get('/dashboard/summary');
    return res.data;
  },

  /**
   * Fetch visual trend analytics (severity distribution, scan history, top affected packages).
   */
  trends: async () => {
    const res = await api.get('/dashboard/trends');
    return res.data;
  },

  /**
   * Fetch recent scans preview.
   */
  recentScans: async () => {
    const res = await api.get('/dashboard/recent-scans');
    return res.data;
  },
};

export default dashboardService;
