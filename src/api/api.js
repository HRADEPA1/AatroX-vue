// src/api/api.js

import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export const getManufacturingToolStatistics = async () => {
    const response = await axios.get(`${API_BASE_URL}/manufacturing_tool_statistics`);
    return response.data;
};

export const getEffectivity = async () => {
    // const response = await axios.get(`${API_BASE_URL}/effectivity`, { params: { time_range: timeRange } });
    const response = await axios.get(`${API_BASE_URL}/effectivity`);
    return response.data;
};

export const getLoadedPrograms = async () => {
    const response = await axios.get(`${API_BASE_URL}/loaded_programs`);
    return response.data;
};

export const getAlarms = async () => {
    // const response = await axios.get(`${API_BASE_URL}/alarms`, { params: { time_range: timeRange } });
    const response = await axios.get(`${API_BASE_URL}/alarms`);
    return response.data;
};

export const saveDefaultTimeRanges = async (timeRanges) => {
    const response = await axios.post(`${API_BASE_URL}/save_default_time_ranges`, timeRanges);
    return response.data;
};

export const getDefaultTimeRanges = async () => {
    const response = await axios.get(`${API_BASE_URL}/get_default_time_ranges`);
    return response.data;
};