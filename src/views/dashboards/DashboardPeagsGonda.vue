<template>
    <div class="dashboard-page">
        <div class="page-header mb-6">
            <div class="flex justify-between items-center">
                <div>
                    <h1 class="text-3xl font-bold mb-2">PEGAS-GONDA Cutting Analysis</h1>
                    <p class="text-gray-600">Real-time monitoring and analysis dashboard</p>
                </div>
                <div class="flex gap-3">
                    <button @click="refreshDashboard" class="btn btn-secondary" :disabled="loading">
                        <i class="i-Reload mr-2"></i>
                        Refresh
                    </button>
                    <select v-model="timeRange.start" @change="updateTimeRange" class="form-select">
                        <option value="-1h">Last Hour</option>
                        <option value="-6h">Last 6 Hours</option>
                        <option value="-24h">Last 24 Hours</option>
                        <option value="-7d">Last 7 Days</option>
                        <option value="-30d">Last 30 Days</option>
                    </select>
                </div>
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
    </div>
</template>

<script>
import DashboardPanel from '@/components/DashboardPanel.vue';
import { getDashboardDefinition, parseDashboardPanels } from '@/api/dashboards';

export default {
    name: 'DashboardPeagsGonda',
    components: {
        DashboardPanel
    },
    data() {
        return {
            loading: true,
            error: null,
            dashboard: null,
            panels: [],
            timeRange: {
                start: '-7d',
                stop: 'now()'
            }
        };
    },
    mounted() {
        this.loadDashboard();
    },
    methods: {
        async loadDashboard() {
            this.loading = true;
            this.error = null;

            try {
                // Load dashboard definition from Grafana JSON
                this.dashboard = await getDashboardDefinition('PegasGonda_cutting_analyse_dashboard');
                
                // Parse panels
                this.panels = parseDashboardPanels(this.dashboard);
                
                console.log('Loaded PEGAS-GONDA dashboard:', this.dashboard.title);
                console.log('Parsed panels:', this.panels.length);
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
        }
    }
};
</script>

<style scoped>
.dashboard-page {
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

.btn-secondary {
    background-color: #6b7280;
    color: white;
}

.btn-secondary:hover:not(:disabled) {
    background-color: #4b5563;
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
</style>