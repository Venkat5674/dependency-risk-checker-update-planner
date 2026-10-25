/**
 * @file projectService.js
 * @description API service for managing projects and dependency manifests.
 */

import api from './api';

export const projectService = {
  /**
   * List all projects for current user.
   */
  list: async () => {
    const res = await api.get('/projects');
    return res.data;
  },

  /**
   * Get single project details by ID.
   */
  get: async (id) => {
    const res = await api.get(`/projects/${id}`);
    return res.data;
  },

  /**
   * Create a new project from a dependency manifest.
   */
  create: async (projectData) => {
    const res = await api.post('/projects', projectData);
    return res.data;
  },

  /**
   * Update project metadata.
   */
  update: async (id, payload) => {
    const res = await api.patch(`/projects/${id}`, payload);
    return res.data;
  },

  /**
   * Delete a project.
   */
  remove: async (id) => {
    const res = await api.delete(`/projects/${id}`);
    return res.data;
  },
};

export default projectService;
