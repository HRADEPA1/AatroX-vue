<template>
  <div class="dashboards-page">
    <div class="page-header mb-6">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold mb-2">Dashboard Management</h1>
          <p class="text-gray-600">View and manage custom dashboards with InfluxDB data</p>
        </div>
        <div class="flex gap-3">
          <button @click="refreshDashboard" class="btn btn-secondary" :disabled="loading">
            <i class="i-Reload mr-2"></i>
            Refresh
          </button>
          <button @click="toggleEditMode" class="btn btn-primary">
            <i :class="['mr-2', editMode ? 'i-Save' : 'i-Edit']"></i>
            {{ editMode ? 'View Mode' : 'Edit Mode' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Dashboard Selector -->
    <div class="card p-4 bg-white rounded-lg shadow mb-6">
      <div class="flex items-center gap-4">
        <label class="font-semibold text-gray-700">Dashboard:</label>
        <select v-model="selectedDashboard" @change="loadDashboard" class="form-select flex-1 max-w-md">
          <option v-for="dash in availableDashboards" :key="dash.id" :value="dash.filename">
            {{ dash.name }}
          </option>
        </select>
        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-600">Time Range:</label>
          <select v-model="timeRange.start" @change="updateTimeRange" class="form-select text-sm">
            <option value="-1h">Last Hour</option>
            <option value="-6h">Last 6 Hours</option>
            <option value="-24h">Last 24 Hours</option>
            <option value="-7d">Last 7 Days</option>
            <option value="-30d">Last 30 Days</option>
          </select>
        </div>
      </div>
      <div v-if="dashboard" class="mt-3 text-sm text-gray-600">
        <p>{{ dashboardInfo.description }}</p>
        <p class="mt-1">
          <span class="font-medium">Panels:</span> {{ panels.length }} | 
          <span class="font-medium">Datasource:</span> InfluxDB
        </p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <div class="spinner mb-4"></div>
        <p class="text-gray-600">Loading dashboard...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="alert alert-error mb-6">
      <i class="i-Close-Window mr-2"></i>
      <span>{{ error }}</span>
    </div>

    <!-- Dashboard Grid -->
    <div v-else-if="panels.length > 0" class="dashboard-grid">
      <div
        v-for="panel in panels"
        :key="panel.id"
        :class="getPanelClass(panel)"
        class="dashboard-panel-wrapper"
      >
        <DashboardPanel :panel="panel" :time-range="timeRange" />
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <i class="i-Bar-Chart text-6xl text-gray-300 mb-4"></i>
      <h3 class="text-xl font-semibold text-gray-700 mb-2">No Dashboard Selected</h3>
      <p class="text-gray-600">Select a dashboard from the dropdown above to view its panels</p>
    </div>

    <!-- Dashboard Info Panel (Edit Mode) -->
    <div v-if="editMode && dashboard" class="card p-6 bg-white rounded-lg shadow mt-6">
      <h2 class="text-xl font-semibold mb-4">Dashboard Configuration</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="text-sm font-semibold text-gray-700">Dashboard ID</label>
          <div class="p-2 bg-gray-50 rounded border border-gray-200 font-mono text-sm">
            {{ dashboard.id }}
          </div>
        </div>
        <div>
          <label class="text-sm font-semibold text-gray-700">Title</label>
          <div class="p-2 bg-gray-50 rounded border border-gray-200 font-mono text-sm">
            {{ dashboard.title }}
          </div>
        </div>
        <div>
          <label class="text-sm font-semibold text-gray-700">Total Panels</label>
          <div class="p-2 bg-gray-50 rounded border border-gray-200 font-mono text-sm">
            {{ panels.length }}
          </div>
        </div>
        <div>
          <label class="text-sm font-semibold text-gray-700">Editable</label>
          <div class="p-2 bg-gray-50 rounded border border-gray-200 font-mono text-sm">
            {{ dashboard.editable ? 'Yes' : 'No' }}
          </div>
        </div>
      </div>

      <div class="mt-6">
        <h3 class="text-lg font-semibold mb-3">Panel Details</h3>
        <div class="space-y-2">
          <div v-for="panel in panels" :key="panel.id" class="p-3 bg-gray-50 rounded border border-gray-200">
            <div class="flex justify-between items-start">
              <div>
                <h4 class="font-medium">{{ panel.title }}</h4>
                <p class="text-sm text-gray-600">Type: {{ panel.type || 'graph' }} | Queries: {{ panel.targets.length }}</p>
              </div>
              <span class="text-xs text-gray-500">
                {{ panel.gridPos.w }}x{{ panel.gridPos.h }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-6">
        <button @click="exportDashboard" class="btn btn-outline">
          <i class="i-Download mr-2"></i>
          Export Dashboard JSON
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import DashboardPanel from '@/components/DashboardPanel.vue';
import { getDashboardDefinition, listDashboards, parseDashboardPanels } from '@/api/dashboards';

export default {
  name: 'Dashboards',
  components: {
    DashboardPanel
  },
  data() {
    return {
      loading: true,
      error: null,
      editMode: false,
      selectedDashboard: 'PegasGonda_cutting_analyse_dashboard',
      availableDashboards: [],
      dashboard: null,
      panels: [],
      timeRange: {
        start: '-7d',
        stop: 'now()'
      }
    };
  },
  computed: {
    dashboardInfo() {
      if (!this.dashboard) return {};
      const info = this.availableDashboards.find(d => d.filename === this.selectedDashboard);
      return info || {};
    }
  },
  mounted() {
    this.loadAvailableDashboards();
    this.loadDashboard();
  },
  methods: {
    async loadAvailableDashboards() {
      try {
        this.availableDashboards = await listDashboards();
      } catch (err) {
        console.error('Error loading dashboard list:', err);
      }
    },

    async loadDashboard() {
      this.loading = true;
      this.error = null;

      try {
        // Load dashboard definition
        this.dashboard = await getDashboardDefinition(this.selectedDashboard);
        
        // Parse panels
        this.panels = parseDashboardPanels(this.dashboard);
        
        console.log('Loaded dashboard:', this.dashboard);
        console.log('Parsed panels:', this.panels);
      } catch (err) {
        console.error('Error loading dashboard:', err);
        this.error = 'Failed to load dashboard: ' + err.message;
      } finally {
        this.loading = false;
      }
    },

    refreshDashboard() {
      this.loadDashboard();
    },

    toggleEditMode() {
      this.editMode = !this.editMode;
    },

    updateTimeRange() {
      // Force re-render of all panels with new time range
      this.$forceUpdate();
    },

    getPanelClass(panel) {
      const pos = panel.gridPos || { w: 12, h: 8 };
      
      // Convert Grafana grid (24 columns) to CSS grid classes
      const widthClass = pos.w >= 18 ? 'col-span-full' : 
                        pos.w >= 12 ? 'col-span-2' : 
                        'col-span-1';
      
      const heightClass = pos.h >= 12 ? 'row-span-2' : 'row-span-1';
      
      return `${widthClass} ${heightClass}`;
    },

    exportDashboard() {
      const dataStr = JSON.stringify(this.dashboard, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = window.URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${this.selectedDashboard}_${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
  }
};
</script>

<style scoped>
.dashboards-page {
  padding: 2rem;
  max-width: 1600px;
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

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

@media (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

.dashboard-panel-wrapper {
  min-height: 300px;
}

.col-span-1 {
  grid-column: span 1;
}

.col-span-2 {
  grid-column: span 2;
}

.col-span-full {
  grid-column: 1 / -1;
}

.row-span-1 {
  min-height: 300px;
}

.row-span-2 {
  min-height: 600px;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
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

.form-select {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background-color: white;
  font-size: 0.875rem;
}

.form-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.card {
  transition: box-shadow 0.2s;
}

.card:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}
</style>
