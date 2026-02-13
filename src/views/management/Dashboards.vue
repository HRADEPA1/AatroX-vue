<template>
  <div class="dashboards-page">
    <div class="page-header mb-6">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold mb-2">Dashboard Management</h1>
          <p class="text-gray-600">View and manage custom dashboards with InfluxDB data</p>
        </div>
        <div class="flex gap-3">
          <button @click="showUploadModal = true" class="btn btn-success">
            <i class="i-Upload mr-2"></i>
            Upload JSON
          </button>
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
            <option value="-90d">Last 90 Days</option>
            <option value="-365d">Last 365 Days</option>
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

    <!-- Panel Visibility Controls -->
    <div v-if="!loading && !error && panels.length > 0" class="card p-4 bg-white rounded-lg shadow mb-6">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <i class="i-Eye text-gray-500"></i>
          <h3 class="font-semibold text-gray-700">Panel Visibility</h3>
          <span class="text-sm text-gray-500">({{ visiblePanels.length }}/{{ panels.length }} visible)</span>
        </div>
        <div class="flex gap-2">
          <button @click="showAllPanels" class="btn btn-sm btn-outline">
            Show All
          </button>
          <button @click="hideAllPanels" class="btn btn-sm btn-outline">
            Hide All
          </button>
        </div>
      </div>
      <div class="panel-visibility-grid">
        <label
          v-for="panel in panels"
          :key="'toggle-' + panel.id"
          class="panel-toggle-item"
          :class="{ 'panel-toggle-disabled': !isPanelVisible(panel.id) }"
        >
          <input
            type="checkbox"
            :checked="isPanelVisible(panel.id)"
            @change="togglePanelVisibility(panel.id, $event.target.checked)"
            class="panel-toggle-checkbox"
          />
          <span class="panel-toggle-label">{{ panel.title }}</span>
          <span class="panel-toggle-type">{{ panel.type || 'graph' }}</span>
        </label>
      </div>
    </div>

    <!-- Dashboard Grid -->
    <div v-if="!loading && !error && visiblePanels.length > 0" class="dashboard-grid">
      <div
        v-for="panel in visiblePanels"
        :key="panel.id"
        :class="getPanelClass(panel)"
        class="dashboard-panel-wrapper"
      >
        <DashboardPanel :panel="panel" :time-range="timeRange" />
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && !error && panels.length === 0" class="empty-state">
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
        <div class="flex gap-3">
          <button @click="exportDashboard" class="btn btn-outline">
            <i class="i-Download mr-2"></i>
            Download JSON
          </button>
          <button @click="showEditModalHandler" class="btn btn-primary">
            <i class="i-Edit mr-2"></i>
            Edit JSON
          </button>
          <button @click="duplicateDashboardHandler" class="btn btn-outline">
            <i class="i-Copy mr-2"></i>
            Duplicate
          </button>
          <button @click="confirmDelete" class="btn btn-danger">
            <i class="i-Delete mr-2"></i>
            Delete Dashboard
          </button>
        </div>
      </div>
    </div>

    <!-- Upload Modal -->
    <div v-if="showUploadModal" class="modal-overlay" @click.self="showUploadModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="text-2xl font-bold">Upload Dashboard JSON</h2>
          <button @click="showUploadModal = false" class="modal-close">
            <i class="i-Close"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="mb-4">
            <label class="form-label">Select JSON File</label>
            <input 
              type="file" 
              accept=".json" 
              @change="handleFileSelect" 
              class="form-input w-full"
              ref="fileInput"
            />
            <p class="text-sm text-gray-600 mt-2">
              Upload a Grafana dashboard JSON file
            </p>
          </div>
          <div v-if="uploadError" class="alert alert-error mb-4">
            {{ uploadError }}
          </div>
        </div>
        <div class="modal-footer">
          <button @click="uploadDashboardHandler" class="btn btn-primary" :disabled="!selectedFile || uploading">
            <i class="i-Upload mr-2"></i>
            {{ uploading ? 'Uploading...' : 'Upload' }}
          </button>
          <button @click="showUploadModal = false" class="btn btn-outline">
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Edit JSON Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
      <div class="modal-content modal-large">
        <div class="modal-header">
          <h2 class="text-2xl font-bold">Edit Dashboard JSON</h2>
          <button @click="showEditModal = false" class="modal-close">
            <i class="i-Close"></i>
          </button>
        </div>
        <div class="modal-body modal-body-editor">
          <!-- Search Bar - Fixed at top -->
          <div class="search-bar-fixed">
            <div class="flex items-center gap-2">
              <div class="relative flex-1">
                <i class="i-Search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <input 
                  v-model="searchQuery"
                  @keydown.enter.prevent="performSearch"
                  @keydown.escape="clearSearch"
                  type="text"
                  placeholder="Search in JSON... (Press Enter or click Search)"
                  class="form-input pl-10 pr-3"
                />
              </div>
              <button 
                @click="performSearch" 
                class="btn btn-primary btn-sm"
                :disabled="!searchQuery"
                title="Search"
              >
                <i class="i-Search mr-1"></i>
                Search
              </button>
              <button 
                @click="findPrevious" 
                class="btn btn-outline btn-sm"
                :disabled="!searchMatches.length"
                title="Previous (Shift+Enter)"
              >
                <i class="i-Arrow-Up"></i>
              </button>
              <button 
                @click="findNext" 
                class="btn btn-outline btn-sm"
                :disabled="!searchMatches.length"
                title="Next (Enter)"
              >
                <i class="i-Arrow-Down"></i>
              </button>
              <button 
                @click="clearSearch" 
                class="btn btn-outline btn-sm"
                :disabled="!searchQuery"
                title="Clear search"
              >
                <i class="i-Close"></i>
              </button>
              <div v-if="searchQuery" class="text-sm text-gray-600 whitespace-nowrap">
                <span v-if="searchMatches.length > 0">
                  {{ currentMatchIndex + 1 }} / {{ searchMatches.length }}
                </span>
                <span v-else class="text-gray-400">No matches</span>
              </div>
            </div>
          </div>
          
          <!-- JSON Editor with Line Numbers - Scrollable -->
          <div class="editor-scroll-container">
            <div class="json-editor-container">
              <div class="line-numbers" ref="lineNumbers">
                <div
                  v-for="n in lineCount"
                  :key="n"
                  class="line-number"
                >
                  {{ n }}
                </div>
              </div>
              <textarea 
                ref="jsonEditor"
                v-model="editedJson"
                @input="updateLineNumbers"
                @scroll="syncScroll"
                class="json-editor font-mono text-sm"
                rows="20"
                @keydown.ctrl.f.prevent="focusSearch"
                @keydown.meta.f.prevent="focusSearch"
              ></textarea>
            </div>
            <div v-if="jsonError" class="alert alert-error mt-4">
              {{ jsonError }}
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="saveDashboardHandler" class="btn btn-primary" :disabled="saving">
            <i class="i-Save mr-2"></i>
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
          <button @click="showEditModal = false" class="btn btn-outline">
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="text-2xl font-bold text-red-600">Confirm Delete</h2>
          <button @click="showDeleteModal = false" class="modal-close">
            <i class="i-Close"></i>
          </button>
        </div>
        <div class="modal-body">
          <p class="text-gray-700 mb-4">
            Are you sure you want to delete this dashboard?
          </p>
          <div class="bg-gray-50 p-4 rounded border border-gray-200">
            <p class="font-semibold">{{ dashboard?.title }}</p>
            <p class="text-sm text-gray-600">{{ dashboardInfo.description }}</p>
          </div>
          <p class="text-sm text-gray-600 mt-4">
            A backup will be created before deletion.
          </p>
        </div>
        <div class="modal-footer">
          <button @click="deleteDashboardHandler" class="btn btn-danger" :disabled="deleting">
            <i class="i-Delete mr-2"></i>
            {{ deleting ? 'Deleting...' : 'Delete Dashboard' }}
          </button>
          <button @click="showDeleteModal = false" class="btn btn-outline">
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import DashboardPanel from '@/components/DashboardPanel.vue';
import { 
  getDashboardDefinition, 
  listDashboards, 
  parseDashboardPanels,
  uploadDashboard,
  updateDashboard,
  deleteDashboard,
  duplicateDashboard
} from '@/api/dashboards';

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
        start: '-90d',
        stop: 'now()'
      },
      // Modal states
      showUploadModal: false,
      showEditModal: false,
      showDeleteModal: false,
      // Upload
      selectedFile: null,
      uploading: false,
      uploadError: null,
      // Edit
      editedJson: '',
      jsonError: null,
      saving: false,
      // Delete
      deleting: false,
      // Search in JSON
      searchQuery: '',
      searchMatches: [],
      currentMatchIndex: -1
    };
  },
  computed: {
    dashboardInfo() {
      if (!this.dashboard) return {};
      const info = this.availableDashboards.find(d => d.filename === this.selectedDashboard);
      return info || {};
    },
    visiblePanels() {
      return this.panels.filter(panel => this.isPanelVisible(panel.id));
    },
    lineCount() {
      if (!this.editedJson) return 1;
      return this.editedJson.split('\n').length;
    }
  },
  mounted() {
    this.$store.dispatch('panelVisibility/loadFromBackend');
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

    isPanelVisible(panelId) {
      return this.$store.getters['panelVisibility/isPanelVisible'](this.selectedDashboard, panelId);
    },

    togglePanelVisibility(panelId, visible) {
      this.$store.dispatch('panelVisibility/togglePanel', {
        dashboardId: this.selectedDashboard,
        panelId,
        visible
      });
    },

    showAllPanels() {
      const panelIds = this.panels.map(p => p.id);
      this.$store.dispatch('panelVisibility/showAllPanels', {
        dashboardId: this.selectedDashboard,
        panelIds
      });
    },

    hideAllPanels() {
      const panelIds = this.panels.map(p => p.id);
      this.$store.dispatch('panelVisibility/hideAllPanels', {
        dashboardId: this.selectedDashboard,
        panelIds
      });
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
    },

    // File upload handlers
    handleFileSelect(event) {
      this.selectedFile = event.target.files[0];
      this.uploadError = null;
    },

    async uploadDashboardHandler() {
      if (!this.selectedFile) return;

      this.uploading = true;
      this.uploadError = null;

      try {
        const result = await uploadDashboard(this.selectedFile);
        
        // Reload dashboard list
        await this.loadAvailableDashboards();
        
        // Close modal and show success
        this.showUploadModal = false;
        this.selectedFile = null;
        if (this.$refs.fileInput) {
          this.$refs.fileInput.value = '';
        }
        
        alert(`Dashboard uploaded successfully: ${result.filename}`);
        
        // Optionally switch to the newly uploaded dashboard
        this.selectedDashboard = result.id;
        await this.loadDashboard();
      } catch (err) {
        this.uploadError = err.response?.data?.detail || err.message || 'Failed to upload dashboard';
      } finally {
        this.uploading = false;
      }
    },

    // Edit JSON handlers
    async showEditModalHandler() {
      this.editedJson = JSON.stringify(this.dashboard, null, 2);
      this.jsonError = null;
      this.showEditModal = true;
      this.clearSearch();
    },

    async saveDashboardHandler() {
      this.saving = true;
      this.jsonError = null;

      try {
        // Validate JSON
        let parsedJson;
        try {
          parsedJson = JSON.parse(this.editedJson);
        } catch (e) {
          this.jsonError = 'Invalid JSON format: ' + e.message;
          this.saving = false;
          return;
        }

        // Save to backend
        await updateDashboard(this.selectedDashboard, parsedJson);
        
        // Reload dashboard
        await this.loadDashboard();
        
        // Close modal
        this.showEditModal = false;
        alert('Dashboard updated successfully');
      } catch (err) {
        this.jsonError = err.response?.data?.detail || err.message || 'Failed to save dashboard';
      } finally {
        this.saving = false;
      }
    },

    // Search functionality
    performSearch() {
      if (!this.searchQuery) {
        this.clearSearch();
        return;
      }

      const text = this.editedJson;
      const query = this.searchQuery;
      const matches = [];
      
      let index = text.toLowerCase().indexOf(query.toLowerCase());
      while (index !== -1) {
        matches.push(index);
        index = text.toLowerCase().indexOf(query.toLowerCase(), index + 1);
      }
      
      this.searchMatches = matches;
      this.currentMatchIndex = matches.length > 0 ? 0 : -1;
      
      if (this.currentMatchIndex >= 0) {
        this.highlightMatch();
      }
    },

    findNext() {
      // If no matches yet, perform search first
      if (this.searchMatches.length === 0 && this.searchQuery) {
        this.performSearch();
        return;
      }
      
      if (this.searchMatches.length === 0) return;
      
      this.currentMatchIndex = (this.currentMatchIndex + 1) % this.searchMatches.length;
      this.highlightMatch();
    },

    findPrevious() {
      if (this.searchMatches.length === 0) return;
      
      this.currentMatchIndex = this.currentMatchIndex - 1;
      if (this.currentMatchIndex < 0) {
        this.currentMatchIndex = this.searchMatches.length - 1;
      }
      this.highlightMatch();
    },

    highlightMatch() {
      if (this.currentMatchIndex < 0 || !this.$refs.jsonEditor) return;
      
      const textarea = this.$refs.jsonEditor;
      const matchIndex = this.searchMatches[this.currentMatchIndex];
      
      // Calculate which line the match is on
      const textBeforeMatch = this.editedJson.substring(0, matchIndex);
      const lineNumber = textBeforeMatch.split('\n').length;
      
      // Select the matched text
      textarea.setSelectionRange(matchIndex, matchIndex + this.searchQuery.length);
      textarea.focus();
      
      // Scroll to the line using scrollIntoView on the line number element
      if (this.$refs.lineNumbers) {
        const lineNumberElements = this.$refs.lineNumbers.querySelectorAll('.line-number');
        const targetLineElement = lineNumberElements[lineNumber - 1];
        
        if (targetLineElement) {
          targetLineElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      
      console.log('Match at index:', matchIndex, 'Line:', lineNumber);
    },

    clearSearch() {
      this.searchQuery = '';
      this.searchMatches = [];
      this.currentMatchIndex = -1;
    },

    focusSearch() {
      // Focus on search input when Ctrl+F or Cmd+F is pressed
      this.$nextTick(() => {
        const searchInput = this.$el.querySelector('.search-bar input');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      });
    },

    updateLineNumbers() {
      // Trigger re-render for line count
      this.$forceUpdate();
    },

    syncScroll() {
      // Not needed anymore - parent container handles scrolling for both elements
    },

    // Delete handlers
    confirmDelete() {
      this.showDeleteModal = true;
    },

    async deleteDashboardHandler() {
      this.deleting = true;

      try {
        const result = await deleteDashboard(this.selectedDashboard);
        
        // Reload dashboard list
        await this.loadAvailableDashboards();
        
        // Select first dashboard or clear
        if (this.availableDashboards.length > 0) {
          this.selectedDashboard = this.availableDashboards[0].filename;
          await this.loadDashboard();
        } else {
          this.dashboard = null;
          this.panels = [];
        }
        
        // Close modal
        this.showDeleteModal = false;
        alert(`Dashboard deleted successfully. Backup: ${result.backup}`);
      } catch (err) {
        alert(err.response?.data?.detail || err.message || 'Failed to delete dashboard');
      } finally {
        this.deleting = false;
      }
    },

    // Duplicate handler
    async duplicateDashboardHandler() {
      const newName = prompt('Enter name for the duplicated dashboard:', `${this.dashboard.title} (Copy)`);
      if (!newName) return;

      try {
        const result = await duplicateDashboard(this.selectedDashboard, newName);
        
        // Reload dashboard list
        await this.loadAvailableDashboards();
        
        // Switch to duplicated dashboard
        this.selectedDashboard = result.id;
        await this.loadDashboard();
        
        alert(`Dashboard duplicated successfully: ${result.filename}`);
      } catch (err) {
        alert(err.response?.data?.detail || err.message || 'Failed to duplicate dashboard');
      }
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

.btn-success {
  background-color: #10b981;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background-color: #059669;
}

.btn-danger {
  background-color: #ef4444;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background-color: #dc2626;
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

/* Modal Styles */
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
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 0.5rem;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-large {
  max-width: 900px;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  padding: 0.5rem;
  line-height: 1;
}

.modal-close:hover {
  color: #374151;
}

.modal-body {
  padding: 1.5rem;
}

.modal-body-editor {
  display: flex;
  flex-direction: column;
  padding: 0;
  max-height: calc(90vh - 180px);
  overflow: hidden;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.json-editor-container {
  display: inline-grid;
  grid-template-columns: 3.5rem auto;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background-color: #f9fafb;
  overflow-y: auto;
  max-height: calc(90vh - 300px);
  width: 100%;
}

.line-numbers {
  padding: 1rem 0;
  background-color: #f3f4f6;
  color: #9ca3af;
  text-align: right;
  user-select: none;
  border-right: 1px solid #e5e7eb;
}

.line-number {
  padding: 0 0.75rem;
  line-height: 1.5;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  height: 1.5rem;
}

.json-editor {
  padding: 1rem;
  border: none;
  background-color: #f9fafb;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  line-height: 1.5;
  resize: none;
  overflow: visible;
  min-height: 400px;
}

.json-editor:focus {
  outline: none;
  background-color: white;
}

.json-editor:focus ~ .line-numbers {
  background-color: #fafafa;
}

.form-label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: #374151;
}

.form-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Search Bar - Fixed at top */
.search-bar-fixed {
  background-color: #f9fafb;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.editor-scroll-container {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  padding-top: 1rem;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}

.relative {
  position: relative;
}

.absolute {
  position: absolute;
}

/* Panel Visibility Controls */
.panel-visibility-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 0.5rem;
}

.panel-toggle-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.15s;
  background-color: white;
}

.panel-toggle-item:hover {
  border-color: #3b82f6;
  background-color: #f0f7ff;
}

.panel-toggle-disabled {
  opacity: 0.55;
  background-color: #f9fafb;
}

.panel-toggle-checkbox {
  width: 1rem;
  height: 1rem;
  accent-color: #3b82f6;
  cursor: pointer;
  flex-shrink: 0;
}

.panel-toggle-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.panel-toggle-type {
  font-size: 0.75rem;
  color: #9ca3af;
  flex-shrink: 0;
}
</style>
