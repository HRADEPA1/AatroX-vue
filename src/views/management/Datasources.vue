<template>
  <div class="datasources-page">
    <div class="page-header mb-6">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold mb-2">Datasource Management</h1>
          <p class="text-gray-600">Configure and manage InfluxDB datasource connections</p>
        </div>
        <button @click="loadDatasources" class="btn btn-secondary" :disabled="loading">
          <i class="i-Reload mr-2"></i>
          Refresh
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <div class="spinner mb-4"></div>
        <p class="text-gray-600">Loading datasources...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="alert alert-error mb-6">
      <i class="i-Close-Window mr-2"></i>
      <span>{{ error }}</span>
    </div>

    <!-- Datasources Content -->
    <div v-else class="space-y-6">
      <!-- Validation Status -->
      <div class="card p-6 bg-white rounded-lg shadow">
        <div class="flex items-center mb-4">
          <i :class="['text-4xl mr-3', isConfigValid ? 'i-Checked text-green-500' : 'i-Close text-red-500']"></i>
          <div>
            <h2 class="text-xl font-semibold">Configuration Status</h2>
            <p :class="['text-sm', isConfigValid ? 'text-green-600' : 'text-red-600']">
              {{ isConfigValid ? 'All datasources configured and valid' : 'Configuration incomplete or invalid' }}
            </p>
          </div>
        </div>
        <div v-if="validationStatus.datasources" class="mt-4 space-y-2">
          <div v-for="(status, name) in validationStatus.datasources" :key="name" class="flex items-center">
            <i :class="['mr-2', status ? 'i-Checked text-green-500' : 'i-Close text-red-500']"></i>
            <span class="font-medium capitalize">{{ name }}:</span>
            <span :class="['ml-2', status ? 'text-green-600' : 'text-red-600']">
              {{ status ? 'Valid' : 'Invalid' }}
            </span>
          </div>
        </div>
      </div>

      <!-- InfluxDB Datasource -->
      <div class="card p-6 bg-white rounded-lg shadow">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center">
            <i class="i-Data-Storage text-4xl text-blue-500 mr-3"></i>
            <div>
              <h2 class="text-xl font-semibold">{{ influxDBConfig.name || 'InfluxDB' }}</h2>
              <span class="badge badge-blue">Default</span>
            </div>
          </div>
          <button @click="copyConfiguration" class="btn btn-secondary btn-sm">
            <i class="i-File-Copy mr-1"></i>
            Copy Config
          </button>
        </div>

        <!-- Connection Details -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label class="text-sm font-semibold text-gray-700">URL</label>
            <div class="p-2 bg-gray-50 rounded border border-gray-200 font-mono text-sm">
              {{ influxDBConfig.url || 'N/A' }}
            </div>
          </div>
          <div>
            <label class="text-sm font-semibold text-gray-700">Type</label>
            <div class="p-2 bg-gray-50 rounded border border-gray-200 font-mono text-sm">
              {{ influxDBConfig.type || 'N/A' }}
            </div>
          </div>
          <div>
            <label class="text-sm font-semibold text-gray-700">Organization</label>
            <div class="p-2 bg-gray-50 rounded border border-gray-200 font-mono text-sm">
              {{ influxDBConfig.jsonData?.organization || 'N/A' }}
            </div>
          </div>
          <div>
            <label class="text-sm font-semibold text-gray-700">Default Bucket</label>
            <div class="p-2 bg-gray-50 rounded border border-gray-200 font-mono text-sm">
              {{ influxDBConfig.jsonData?.defaultBucket || 'N/A' }}
            </div>
          </div>
        </div>

        <!-- Advanced Settings -->
        <div class="mt-4">
          <button @click="showAdvanced = !showAdvanced" class="text-blue-600 hover:text-blue-800 flex items-center">
            <i :class="['mr-1', showAdvanced ? 'i-Up' : 'i-Down']"></i>
            {{ showAdvanced ? 'Hide' : 'Show' }} Advanced Settings
          </button>
          
          <div v-if="showAdvanced" class="mt-4 space-y-3">
            <div>
              <label class="text-sm font-semibold text-gray-700">Version</label>
              <div class="p-2 bg-gray-50 rounded border border-gray-200 font-mono text-sm">
                {{ influxDBConfig.jsonData?.version || 'N/A' }}
              </div>
            </div>
            <div>
              <label class="text-sm font-semibold text-gray-700">HTTP Mode</label>
              <div class="p-2 bg-gray-50 rounded border border-gray-200 font-mono text-sm">
                {{ influxDBConfig.jsonData?.httpMode || 'N/A' }}
              </div>
            </div>
            <div>
              <label class="text-sm font-semibold text-gray-700">TLS Skip Verify</label>
              <div class="p-2 bg-gray-50 rounded border border-gray-200 font-mono text-sm">
                {{ influxDBConfig.jsonData?.tlsSkipVerify ? 'Enabled' : 'Disabled' }}
              </div>
            </div>
            <div>
              <label class="text-sm font-semibold text-gray-700">Connection String</label>
              <div class="p-2 bg-gray-50 rounded border border-gray-200 font-mono text-sm break-all">
                {{ connectionString || 'Loading...' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Grafana Integration -->
      <div class="card p-6 bg-white rounded-lg shadow">
        <div class="flex items-center mb-4">
          <i class="i-Bar-Chart text-4xl text-orange-500 mr-3"></i>
          <div>
            <h2 class="text-xl font-semibold">Grafana Integration</h2>
            <p class="text-sm text-gray-600">Export configuration for Grafana provisioning</p>
          </div>
        </div>

        <div class="space-y-3">
          <button @click="downloadGrafanaConfig('yaml')" class="btn btn-outline w-full justify-start">
            <i class="i-Download mr-2"></i>
            Download YAML Configuration
          </button>
          <button @click="downloadGrafanaConfig('json')" class="btn btn-outline w-full justify-start">
            <i class="i-Download mr-2"></i>
            Download JSON Configuration
          </button>
          <button @click="viewGrafanaConfig" class="btn btn-outline w-full justify-start">
            <i class="i-Eye mr-2"></i>
            View Configuration
          </button>
        </div>
      </div>

      <!-- Python Client Configuration -->
      <div class="card p-6 bg-white rounded-lg shadow">
        <div class="flex items-center mb-4">
          <i class="i-Code text-4xl text-purple-500 mr-3"></i>
          <div>
            <h2 class="text-xl font-semibold">Python Client Configuration</h2>
            <p class="text-sm text-gray-600">Configuration for influxdb-client library</p>
          </div>
        </div>

        <div v-if="clientConfig" class="bg-gray-900 text-gray-100 p-4 rounded font-mono text-sm overflow-x-auto">
          <pre>{{ formatClientConfig }}</pre>
        </div>
        <button @click="copyClientConfig" class="btn btn-secondary btn-sm mt-3">
          <i class="i-File-Copy mr-1"></i>
          Copy Code
        </button>
      </div>

      <!-- Datasource List -->
      <div class="card p-6 bg-white rounded-lg shadow">
        <h2 class="text-xl font-semibold mb-4">All Datasources</h2>
        <div class="space-y-3">
          <div v-for="ds in datasourcesList" :key="ds.id" 
               class="flex items-center justify-between p-4 border border-gray-200 rounded hover:bg-gray-50">
            <div class="flex items-center">
              <i class="i-Data-Storage text-2xl text-blue-500 mr-3"></i>
              <div>
                <h3 class="font-semibold">{{ ds.name }}</h3>
                <p class="text-sm text-gray-600">{{ ds.type }}</p>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <span v-if="ds.default" class="badge badge-blue">Default</span>
              <span :class="['badge', ds.configured ? 'badge-green' : 'badge-red']">
                {{ ds.configured ? 'Configured' : 'Not Configured' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Grafana Config Modal -->
    <div v-if="showGrafanaModal" class="modal-overlay" @click="showGrafanaModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="text-xl font-semibold">Grafana Provisioning Configuration</h3>
          <button @click="showGrafanaModal = false" class="text-gray-500 hover:text-gray-700">
            <i class="i-Close"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="bg-gray-900 text-gray-100 p-4 rounded font-mono text-sm overflow-auto max-h-96">
            <pre>{{ formatGrafanaConfig }}</pre>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="copyGrafanaConfig" class="btn btn-primary">
            <i class="i-File-Copy mr-1"></i>
            Copy Configuration
          </button>
          <button @click="showGrafanaModal = false" class="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {
  getDatasources,
  getInfluxDBDatasource,
  getInfluxDBClientConfig,
  getGrafanaProvisioningConfig,
  validateDatasources,
  getConnectionString
} from '@/api/datasources';

export default {
  name: 'Datasources',
  data() {
    return {
      loading: true,
      error: null,
      showAdvanced: false,
      showGrafanaModal: false,
      validationStatus: {},
      influxDBConfig: {},
      clientConfig: null,
      grafanaConfig: null,
      datasourcesList: [],
      connectionString: ''
    };
  },
  computed: {
    formatClientConfig() {
      if (!this.clientConfig) return '';
      return `from influxdb_client import InfluxDBClient

client = InfluxDBClient(
    url="${this.clientConfig.url}",
    token="${this.clientConfig.token}",
    org="${this.clientConfig.org}"
)

# Query data
query_api = client.query_api()
bucket = "${this.clientConfig.bucket}"`;
    },
    formatGrafanaConfig() {
      if (!this.grafanaConfig) return '';
      return JSON.stringify(this.grafanaConfig, null, 2);
    },
    isConfigValid() {
      if (!this.validationStatus) return false;
      return this.validationStatus.status === 'valid' && 
             Object.values(this.validationStatus.datasources || {}).every(v => v === true);
    }
  },
  mounted() {
    this.loadDatasources();
  },
  methods: {
    async loadDatasources() {
      this.loading = true;
      this.error = null;
      
      try {
        // Load all datasource information in parallel
        const [
          validation,
          influxDB,
          client,
          grafana,
          dsList,
          connStr
        ] = await Promise.all([
          validateDatasources(),
          getInfluxDBDatasource(),
          getInfluxDBClientConfig(),
          getGrafanaProvisioningConfig(),
          getDatasources(),
          getConnectionString()
        ]);

        this.validationStatus = validation;
        this.influxDBConfig = influxDB;
        this.clientConfig = client;
        this.grafanaConfig = grafana;
        this.datasourcesList = dsList.datasources || [];
        this.connectionString = connStr.connection_string || '';
      } catch (err) {
        console.error('Error loading datasources:', err);
        this.error = err.response?.data?.detail || 'Failed to load datasources';
      } finally {
        this.loading = false;
      }
    },

    copyConfiguration() {
      const config = JSON.stringify(this.influxDBConfig, null, 2);
      navigator.clipboard.writeText(config).then(() => {
        alert('Configuration copied to clipboard!');
      });
    },

    copyClientConfig() {
      navigator.clipboard.writeText(this.formatClientConfig).then(() => {
        alert('Client configuration copied to clipboard!');
      });
    },

    copyGrafanaConfig() {
      navigator.clipboard.writeText(this.formatGrafanaConfig).then(() => {
        alert('Grafana configuration copied to clipboard!');
        this.showGrafanaModal = false;
      });
    },

    viewGrafanaConfig() {
      this.showGrafanaModal = true;
    },

    downloadGrafanaConfig(format) {
      let content, filename, mimeType;
      
      if (format === 'yaml') {
        // Convert JSON to YAML-like format (simple version)
        content = this.convertToYAML(this.grafanaConfig);
        filename = 'influxdb-datasource.yaml';
        mimeType = 'text/yaml';
      } else {
        content = JSON.stringify(this.grafanaConfig, null, 2);
        filename = 'influxdb-datasource.json';
        mimeType = 'application/json';
      }

      const blob = new Blob([content], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    },

    convertToYAML(obj, indent = 0) {
      // Simple JSON to YAML converter
      let yaml = '';
      const spaces = '  '.repeat(indent);
      
      for (const [key, value] of Object.entries(obj)) {
        if (value === null || value === undefined) continue;
        
        if (typeof value === 'object' && !Array.isArray(value)) {
          yaml += `${spaces}${key}:\n${this.convertToYAML(value, indent + 1)}`;
        } else if (Array.isArray(value)) {
          yaml += `${spaces}${key}:\n`;
          value.forEach(item => {
            if (typeof item === 'object') {
              yaml += `${spaces}  -\n${this.convertToYAML(item, indent + 2)}`;
            } else {
              yaml += `${spaces}  - ${item}\n`;
            }
          });
        } else {
          const strValue = typeof value === 'string' ? `"${value}"` : value;
          yaml += `${spaces}${key}: ${strValue}\n`;
        }
      }
      
      return yaml;
    }
  }
};
</script>

<style scoped>
.datasources-page {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.alert {
  padding: 1rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
}

.alert-error {
  background-color: #fee;
  color: #c00;
  border: 1px solid #fcc;
}

.card {
  transition: box-shadow 0.2s;
}

.card:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-block;
}

.badge-blue {
  background-color: #dbeafe;
  color: #1e40af;
}

.badge-green {
  background-color: #d1fae5;
  color: #065f46;
}

.badge-red {
  background-color: #fee2e2;
  color: #991b1b;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  border: none;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2563eb;
}

.btn-secondary {
  background-color: #6b7280;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #4b5563;
}

.btn-outline {
  background-color: white;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-outline:hover {
  background-color: #f9fafb;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 0.5rem;
  max-width: 800px;
  width: 90%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
