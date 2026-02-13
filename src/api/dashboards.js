// src/api/dashboards.js

import axios from 'axios';
import { API_BASE_URL } from './api.js';

/**
 * Convert custom time range values to InfluxDB format
 */
export const convertTimeRange = (timeRange) => {
    const { start, stop } = timeRange;
    
    // Handle custom year ranges
    if (start === 'this-year') {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        return {
            start: startOfYear.toISOString(),
            stop: stop || 'now()'
        };
    }
    
    if (start === 'last-year') {
        const now = new Date();
        const lastYear = now.getFullYear() - 1;
        const startOfLastYear = new Date(lastYear, 0, 1);
        const endOfLastYear = new Date(lastYear, 11, 31, 23, 59, 59);
        return {
            start: startOfLastYear.toISOString(),
            stop: endOfLastYear.toISOString()
        };
    }
    
    // Return original time range for standard values
    return timeRange;
};

/**
 * Load dashboard definition from file
 */
export const getDashboardDefinition = async (dashboardName = 'PegasGonda_cutting_analyse_dashboard') => {
    // For now, we'll import the JSON directly
    // In production, this could be loaded from the backend
    try {
        const response = await fetch(`${API_BASE_URL}/resources/grafana/dashboard/${dashboardName}.json`);
        return await response.json();
    } catch (error) {
        console.error('Error loading dashboard definition:', error);
        throw error;
    }
};

/**
 * Execute InfluxDB Flux query
 * This would typically go through your backend API
 */
export const executeFluxQuery = async (query, timeRange = { start: '-7d', stop: 'now()' }) => {
    try {
        // Convert custom time ranges to InfluxDB format
        const convertedTimeRange = convertTimeRange(timeRange);
        
        // This is a placeholder - you would implement this endpoint in your backend
        const response = await axios.post(`${API_BASE_URL}/api/influx/query`, {
            query,
            timeRange: convertedTimeRange
        });
        return response.data;
    } catch (error) {
        console.error('Error executing Flux query:', error);
        // For testing, return mock data
        return generateMockData(query);
    }
};

/**
 * Generate mock data for testing
 */
function generateMockData(query) {
    const points = 30;
    const data = [];
    const now = Date.now();
    
    // Generate multiple series for stacked charts
    const series = ['Overall_cuts', 'Power_on_Hours', 'Effectivity'];
    
    for (let i = 0; i < points; i++) {
        const timestamp = now - (points - i) * 86400000; // Daily data
        
        series.forEach(seriesName => {
            const baseValue = seriesName === 'Overall_cuts' ? 60 : 
                            seriesName === 'Power_on_Hours' ? 40 : 50;
            const trend = (i / points) * (seriesName === 'Effectivity' ? 15 : 10);
            const noise = Math.random() * 16 - 8;
            const value = Math.max(0, baseValue + trend + noise);
            
            data.push({
                _time: new Date(timestamp).toISOString(),
                _value: Math.round(value * 100) / 100,
                _field: seriesName,
                _measurement: 'pegas_data'
            });
        });
    }
    
    return {
        results: [{
            series: [{
                name: 'result',
                columns: ['_time', '_value', '_field'],
                values: data.map(d => [d._time, d._value, d._field])
            }]
        }],
        data: data
    };
}

/**
 * List available dashboards
 */
export const listDashboards = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/dashboards/list`);
        return response.data;
    } catch (error) {
        console.error('Error listing dashboards:', error);
        // Fallback to hardcoded list
        return [
            {
                id: 'pegas-gonda-cutting',
                name: 'PEGAS-GONDA Cutting Analysis',
                description: 'Main dashboard for cutting analysis and effectivity monitoring',
                filename: 'PegasGonda_cutting_analyse_dashboard',
                panels: 6
            }
        ];
    }
};

/**
 * Upload a new dashboard JSON file
 */
export const uploadDashboard = async (file) => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await axios.post(`${API_BASE_URL}/api/dashboards/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error uploading dashboard:', error);
        throw error;
    }
};

/**
 * Update an existing dashboard
 */
export const updateDashboard = async (dashboardId, dashboardData) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/api/dashboards/${dashboardId}`, dashboardData);
        return response.data;
    } catch (error) {
        console.error('Error updating dashboard:', error);
        throw error;
    }
};

/**
 * Delete a dashboard
 */
export const deleteDashboard = async (dashboardId) => {
    try {
        const response = await axios.delete(`${API_BASE_URL}/api/dashboards/${dashboardId}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting dashboard:', error);
        throw error;
    }
};

/**
 * Duplicate a dashboard
 */
export const duplicateDashboard = async (dashboardId, newName = null) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/api/dashboards/${dashboardId}/duplicate`, null, {
            params: { new_name: newName }
        });
        return response.data;
    } catch (error) {
        console.error('Error duplicating dashboard:', error);
        throw error;
    }
};

/**
 * Download a dashboard JSON
 */
export const downloadDashboard = async (dashboardId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/dashboards/${dashboardId}/download`, {
            responseType: 'blob'
        });
        
        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${dashboardId}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading dashboard:', error);
        throw error;
    }
};

// ============================================================
// Panel Visibility Settings API
// ============================================================

/**
 * Get all panel visibility settings from backend
 */
export const getAllPanelVisibility = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/dashboards/settings/panel-visibility`);
        return response.data;
    } catch (error) {
        console.error('Error loading panel visibility settings:', error);
        return {};
    }
};

/**
 * Get panel visibility settings for a specific dashboard
 */
export const getPanelVisibility = async (dashboardId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/dashboards/settings/panel-visibility/${dashboardId}`);
        return response.data;
    } catch (error) {
        console.error('Error loading panel visibility for dashboard:', error);
        return {};
    }
};

/**
 * Save panel visibility settings for a specific dashboard
 */
export const savePanelVisibility = async (dashboardId, visibility) => {
    try {
        const response = await axios.put(
            `${API_BASE_URL}/api/dashboards/settings/panel-visibility/${dashboardId}`,
            visibility
        );
        return response.data;
    } catch (error) {
        console.error('Error saving panel visibility:', error);
        throw error;
    }
};

/**
 * Save all panel visibility settings at once
 */
export const saveAllPanelVisibility = async (allVisibility) => {
    try {
        const response = await axios.put(
            `${API_BASE_URL}/api/dashboards/settings/panel-visibility`,
            allVisibility
        );
        return response.data;
    } catch (error) {
        console.error('Error saving all panel visibility:', error);
        throw error;
    }
};

/**
 * Parse Grafana dashboard and extract panels
 */
export const parseDashboardPanels = (dashboard) => {
    if (!dashboard || !dashboard.panels) {
        return [];
    }
    
    return dashboard.panels.map(panel => ({
        id: panel.id,
        title: panel.title,
        type: panel.type || 'graph',
        datasource: panel.datasource,
        targets: panel.targets || [],
        gridPos: panel.gridPos,
        options: panel.options,
        fieldConfig: panel.fieldConfig,
        transformations: panel.transformations || []
    }));
};
