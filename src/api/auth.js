// src/api/auth.js

import axios from 'axios';
import { API_BASE_URL } from './api.js';

/**
 * Login and get JWT token
 */
export const login = async (username, password) => {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        username,
        password,
    });
    return response.data; // { access_token, token_type }
};

/**
 * Login with PIN code (operator only)
 */
export const loginWithPin = async (pin) => {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login/pin`, {
        pin,
    });
    return response.data; // { access_token, token_type }
};

/**
 * Get current user info
 */
export const getCurrentUser = async () => {
    const response = await axios.get(`${API_BASE_URL}/api/auth/me`);
    return response.data;
};

/**
 * Change password
 */
export const changePassword = async (currentPassword, newPassword) => {
    const response = await axios.post(`${API_BASE_URL}/api/auth/change-password`, {
        current_password: currentPassword,
        new_password: newPassword,
    });
    return response.data;
};

// ---- User Management API (Service/Admin only) ----

/**
 * List all users
 */
export const listUsers = async () => {
    const response = await axios.get(`${API_BASE_URL}/api/users/`);
    return response.data;
};

/**
 * List available roles
 */
export const listRoles = async () => {
    const response = await axios.get(`${API_BASE_URL}/api/users/roles`);
    return response.data;
};

/**
 * Create a new user
 */
export const createUser = async (userData) => {
    const response = await axios.post(`${API_BASE_URL}/api/users/`, userData);
    return response.data;
};

/**
 * Update a user
 */
export const updateUser = async (userId, userData) => {
    const response = await axios.put(`${API_BASE_URL}/api/users/${userId}`, userData);
    return response.data;
};

/**
 * Reset a user's password
 */
export const resetUserPassword = async (userId, newPassword) => {
    const response = await axios.post(`${API_BASE_URL}/api/users/${userId}/reset-password`, {
        new_password: newPassword,
    });
    return response.data;
};

/**
 * Delete a user
 */
export const deleteUser = async (userId) => {
    const response = await axios.delete(`${API_BASE_URL}/api/users/${userId}`);
    return response.data;
};

/**
 * Set PIN for an operator user
 */
export const setUserPin = async (userId, pin) => {
    const response = await axios.post(`${API_BASE_URL}/api/users/${userId}/set-pin`, {
        pin,
    });
    return response.data;
};

/**
 * Clear PIN from a user
 */
export const clearUserPin = async (userId) => {
    const response = await axios.delete(`${API_BASE_URL}/api/users/${userId}/pin`);
    return response.data;
};
