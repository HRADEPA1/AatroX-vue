/**
 * Vuex module for authentication state management.
 * Handles login, logout, user info, and token persistence.
 * Sets up axios interceptor for Authorization header.
 */

import axios from 'axios';
import { login as apiLogin, loginWithPin as apiLoginWithPin, getCurrentUser } from '@/api/auth';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

/**
 * Role hierarchy for permission checks.
 * Higher number = more privileges.
 */
const ROLE_LEVELS = {
  operator: 0,
  user: 1,
  service: 2,
  admin: 3,
};

function loadToken() {
  return localStorage.getItem(TOKEN_KEY) || null;
}

function loadUser() {
  try {
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

// Set up axios interceptor on module load
const token = loadToken();
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export default {
  namespaced: true,

  state: () => ({
    token: loadToken(),
    user: loadUser(),
    loginError: null,
    loading: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token && !!state.user,
    currentUser: (state) => state.user,
    userRole: (state) => state.user?.role || null,
    userName: (state) => state.user?.full_name || state.user?.username || '',

    /**
     * Check if current user has at least the given role level.
     */
    hasRole: (state) => (requiredRole) => {
      if (!state.user) return false;
      const userLevel = ROLE_LEVELS[state.user.role] ?? -1;
      const requiredLevel = ROLE_LEVELS[requiredRole] ?? 999;
      return userLevel >= requiredLevel;
    },

    /**
     * Check access to specific features based on role definitions:
     * - operator: dashboard charts, programs (read)
     * - user: dashboard, catalog, machines, programs (list+add)
     * - service: all user + user management + dashboard management
     * - admin: everything
     */
    canAccess: (state, getters) => (feature) => {
      const role = state.user?.role;
      if (!role) return false;

      const accessMap = {
        // Dashboard charts (read)
        'dashboard': ['operator', 'user', 'service', 'admin'],
        // Programs (read for operator, list+add for user+)
        'programs': ['operator', 'user', 'service', 'admin'],
        'programs.add': ['user', 'service', 'admin'],
        // Catalog (read)
        'catalog': ['user', 'service', 'admin'],
        // Machines (read)
        'machines': ['user', 'service', 'admin'],
        // User management
        'users': ['service', 'admin'],
        // Dashboard management (edit/upload/delete)
        'dashboard.manage': ['service', 'admin'],
        // Management section
        'management': ['service', 'admin'],
        // Datasources
        'datasources': ['admin'],
        // System admin
        'admin': ['admin'],
      };

      const allowedRoles = accessMap[feature];
      if (!allowedRoles) return getters.hasRole('admin'); // unknown feature = admin only
      return allowedRoles.includes(role);
    },
  },

  mutations: {
    SET_TOKEN(state, token) {
      state.token = token;
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } else {
        localStorage.removeItem(TOKEN_KEY);
        delete axios.defaults.headers.common['Authorization'];
      }
    },
    SET_USER(state, user) {
      state.user = user;
      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(USER_KEY);
      }
    },
    SET_LOGIN_ERROR(state, error) {
      state.loginError = error;
    },
    SET_LOADING(state, loading) {
      state.loading = loading;
    },
  },

  actions: {
    async login({ commit }, { username, password }) {
      commit('SET_LOADING', true);
      commit('SET_LOGIN_ERROR', null);
      try {
        const data = await apiLogin(username, password);
        commit('SET_TOKEN', data.access_token);

        // Fetch user profile
        const user = await getCurrentUser();
        commit('SET_USER', user);
        return true;
      } catch (err) {
        const message = err.response?.data?.detail || 'Login failed';
        commit('SET_LOGIN_ERROR', message);
        commit('SET_TOKEN', null);
        commit('SET_USER', null);
        return false;
      } finally {
        commit('SET_LOADING', false);
      }
    },

    async loginWithPin({ commit }, { pin }) {
      commit('SET_LOADING', true);
      commit('SET_LOGIN_ERROR', null);
      try {
        const data = await apiLoginWithPin(pin);
        commit('SET_TOKEN', data.access_token);

        const user = await getCurrentUser();
        commit('SET_USER', user);
        return true;
      } catch (err) {
        const message = err.response?.data?.detail || 'Invalid PIN code';
        commit('SET_LOGIN_ERROR', message);
        commit('SET_TOKEN', null);
        commit('SET_USER', null);
        return false;
      } finally {
        commit('SET_LOADING', false);
      }
    },

    logout({ commit }) {
      commit('SET_TOKEN', null);
      commit('SET_USER', null);
      commit('SET_LOGIN_ERROR', null);
    },

    /**
     * Refresh user info from backend (e.g. after role change).
     */
    async refreshUser({ commit, state }) {
      if (!state.token) return;
      try {
        const user = await getCurrentUser();
        commit('SET_USER', user);
      } catch {
        // Token likely expired
        commit('SET_TOKEN', null);
        commit('SET_USER', null);
      }
    },
  },
};
