/**
 * @file upgradeService.js
 * @description API service for retrieving upgrade recommendations and managing remediation plans.
 */

import api from './api';

export const upgradeService = {
  /**
   * List prioritized upgrade recommendations.
   */
  list: async (params = {}) => {
    const res = await api.get('/upgrades', { params });
    return res.data;
  },

  /**
   * Get single upgrade recommendation details.
   */
  get: async (id) => {
    const res = await api.get(`/upgrades/${id}`);
    return res.data;
  },

  /**
   * Update recommendation status.
   */
  updateStatus: async (id, status, notes = '') => {
    const res = await api.patch(`/upgrades/${id}/status`, { status, notes });
    return res.data;
  },
};

export default upgradeService;
