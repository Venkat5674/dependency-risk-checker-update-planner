/**
 * @file auditService.js
 * @description API service for retrieving audit trail logs.
 */

import api from './api';

export const auditService = {
  /**
   * List audit logs with pagination.
   */
  list: async (params = {}) => {
    const res = await api.get('/audit-logs', { params });
    return res.data;
  },
};

export default auditService;
