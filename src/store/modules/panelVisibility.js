/**
 * Vuex module for managing dashboard panel visibility settings.
 * Settings are persisted to the backend API and cached in localStorage.
 * 
 * Storage format:
 * {
 *   "dashboardFilename": {
 *     "panelId": true/false
 *   }
 * }
 */

import { getAllPanelVisibility, savePanelVisibility } from '@/api/dashboards';

const STORAGE_KEY = 'dashboard_panel_visibility';

function loadFromStorage() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function saveToLocalStorage(visibility) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visibility));
  } catch (e) {
    console.error('Failed to save panel visibility to localStorage:', e);
  }
}

export default {
  namespaced: true,

  state: () => ({
    // { dashboardId: { panelId: boolean } }
    visibility: loadFromStorage(),
    loaded: false
  }),

  getters: {
    /**
     * Returns whether a specific panel is visible.
     * Defaults to true (visible) if no setting exists.
     */
    isPanelVisible: (state) => (dashboardId, panelId) => {
      const dashSettings = state.visibility[dashboardId];
      if (!dashSettings || dashSettings[String(panelId)] === undefined) {
        return true; // visible by default
      }
      return dashSettings[String(panelId)];
    },

    /**
     * Returns the visibility map for a specific dashboard.
     */
    getDashboardVisibility: (state) => (dashboardId) => {
      return state.visibility[dashboardId] || {};
    }
  },

  mutations: {
    SET_VISIBILITY(state, visibility) {
      state.visibility = visibility;
      state.loaded = true;
      saveToLocalStorage(visibility);
    },

    SET_PANEL_VISIBILITY(state, { dashboardId, panelId, visible }) {
      if (!state.visibility[dashboardId]) {
        state.visibility[dashboardId] = {};
      }
      state.visibility[dashboardId][String(panelId)] = visible;
      // Force reactivity
      state.visibility = { ...state.visibility };
      saveToLocalStorage(state.visibility);
    },

    SET_ALL_PANELS_VISIBILITY(state, { dashboardId, panelIds, visible }) {
      if (!state.visibility[dashboardId]) {
        state.visibility[dashboardId] = {};
      }
      panelIds.forEach(id => {
        state.visibility[dashboardId][String(id)] = visible;
      });
      state.visibility = { ...state.visibility };
      saveToLocalStorage(state.visibility);
    }
  },

  actions: {
    /**
     * Load all visibility settings from backend
     */
    async loadFromBackend({ commit, state }) {
      if (state.loaded) return;
      try {
        const data = await getAllPanelVisibility();
        if (data && Object.keys(data).length > 0) {
          commit('SET_VISIBILITY', data);
        }
      } catch (e) {
        console.error('Failed to load panel visibility from backend:', e);
        // localStorage cache will be used as fallback
      }
    },

    /**
     * Toggle a single panel and save to backend
     */
    async togglePanel({ commit, state }, { dashboardId, panelId, visible }) {
      commit('SET_PANEL_VISIBILITY', { dashboardId, panelId, visible });
      try {
        await savePanelVisibility(dashboardId, state.visibility[dashboardId]);
      } catch (e) {
        console.error('Failed to save panel visibility to backend:', e);
      }
    },

    /**
     * Show all panels and save to backend
     */
    async showAllPanels({ commit, state }, { dashboardId, panelIds }) {
      commit('SET_ALL_PANELS_VISIBILITY', { dashboardId, panelIds, visible: true });
      try {
        await savePanelVisibility(dashboardId, state.visibility[dashboardId]);
      } catch (e) {
        console.error('Failed to save panel visibility to backend:', e);
      }
    },

    /**
     * Hide all panels and save to backend
     */
    async hideAllPanels({ commit, state }, { dashboardId, panelIds }) {
      commit('SET_ALL_PANELS_VISIBILITY', { dashboardId, panelIds, visible: false });
      try {
        await savePanelVisibility(dashboardId, state.visibility[dashboardId]);
      } catch (e) {
        console.error('Failed to save panel visibility to backend:', e);
      }
    }
  }
};
