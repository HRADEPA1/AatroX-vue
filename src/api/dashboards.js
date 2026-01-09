// src/api/dashboards.js

import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

/**
 * Load dashboard definition from file
 */
export const getDashboardDefinition = async (dashboardName = 'PegasGonda_cutting_analyse_dashboard') => {
    // For now, we'll import the JSON directly
    // In production, this could be loaded from the backend
    try {
        const response = await fetch(`/resources/grafana/dashboard/${dashboardName}.json`);
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
        // This is a placeholder - you would implement this endpoint in your backend
        const response = await axios.post(`${API_BASE_URL}/api/influx/query`, {
            query,
            timeRange
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
    return [
        {
            id: 'pegas-gonda-cutting',
            name: 'PEGAS-GONDA Cutting Analysis',
            description: 'Main dashboard for cutting analysis and effectivity monitoring',
            filename: 'PegasGonda_cutting_analyse_dashboard',
            panels: 6
        }
    ];
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
