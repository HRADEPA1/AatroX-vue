// src/api/datasources.js

import axios from 'axios';
import { API_BASE_URL } from './api.js';

/**
 * Get list of all datasources
 */
export const getDatasources = async () => {
    const response = await axios.get(`${API_BASE_URL}/api/datasources/`);
    return response.data;
};

/**
 * Get InfluxDB datasource configuration
 */
export const getInfluxDBDatasource = async () => {
    const response = await axios.get(`${API_BASE_URL}/api/datasources/influxdb`);
    return response.data;
};

/**
 * Get InfluxDB client configuration
 */
export const getInfluxDBClientConfig = async () => {
    const response = await axios.get(`${API_BASE_URL}/api/datasources/influxdb/client`);
    return response.data;
};

/**
 * Get Grafana provisioning configuration
 */
export const getGrafanaProvisioningConfig = async () => {
    const response = await axios.get(`${API_BASE_URL}/api/datasources/influxdb/grafana`);
    return response.data;
};

/**
 * Get default datasource
 */
export const getDefaultDatasource = async () => {
    const response = await axios.get(`${API_BASE_URL}/api/datasources/default`);
    return response.data;
};

/**
 * Validate datasource configuration
 */
export const validateDatasources = async () => {
    const response = await axios.get(`${API_BASE_URL}/api/datasources/validate`);
    return response.data;
};

/**
 * Get InfluxDB connection string
 */
export const getConnectionString = async () => {
    const response = await axios.get(`${API_BASE_URL}/api/datasources/connection-string`);
    return response.data;
};
