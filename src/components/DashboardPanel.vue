<template>
  <div class="dashboard-panel">
    <div class="panel-header">
      <h3 class="panel-title">{{ panel.title }}</h3>
      <div class="panel-actions">
        <button @click="refresh" class="btn-icon" title="Refresh">
          <i class="i-Reload"></i>
        </button>
      </div>
    </div>
    
    <div class="panel-content">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading data...</p>
      </div>
      
      <div v-else-if="error" class="error-state">
        <i class="i-Close-Window"></i>
        <p>{{ error }}</p>
      </div>
      
      <div v-else-if="chartData" class="chart-container">
        <!-- Bar Chart -->
        <Bar v-if="isBarChart" :data="chartData" :options="barChartOptions" />
        
        <!-- Line Chart -->
        <Line v-else-if="isLineChart" :data="chartData" :options="lineChartOptions" />
        
        <!-- Time Series - Bars -->
        <Bar v-else-if="isTimeSeriesBars" :data="chartData" :options="timeSeriesOptions" />
        
        <!-- Time Series - Line/Points -->
        <Line v-else-if="isTimeSeriesLine" :data="chartData" :options="timeSeriesOptions" />
        
        <!-- Gauge Chart -->
        <div v-else-if="isGaugeChart" class="gauge-panel">
          <svg 
            :width="gaugeSize" 
            :height="gaugeSize" 
            :viewBox="`0 0 ${gaugeSize} ${gaugeSize}`"
            class="gauge-svg"
          >
            <!-- Threshold color zones as background -->
            <path
              v-for="(arc, index) in gaugeThresholdArcs"
              :key="'threshold-' + index"
              :d="arc.path"
              :stroke="arc.color"
              :stroke-width="gaugeStrokeWidth"
              fill="none"
              stroke-linecap="butt"
              class="gauge-threshold-arc"
              opacity="0.3"
            />
            <!-- Value arc (overlays on threshold zones) -->
            <path 
              v-if="gaugeValuePath"
              :d="gaugeValuePath" 
              :stroke="gaugeColor" 
              :stroke-width="gaugeStrokeWidth" 
              fill="none" 
              stroke-linecap="butt"
              class="gauge-value-path"
            />
            <!-- Center text - Value -->
            <text 
              :x="gaugeSize / 2" 
              :y="gaugeSize / 2 - 5" 
              text-anchor="middle" 
              dominant-baseline="middle"
              class="gauge-value-text"
            >
              {{ gaugeDisplayValue }}
            </text>
            <!-- Center text - Label -->
            <text 
              :x="gaugeSize / 2" 
              :y="gaugeSize / 2 + 25" 
              text-anchor="middle" 
              dominant-baseline="middle"
              class="gauge-label-text"
            >
              {{ panel.title }}
            </text>
          </svg>
          <div class="gauge-footer-labels">
            <span class="gauge-min-label">{{ gaugeMin }}</span>
            <span class="gauge-max-label">{{ gaugeMax }}</span>
          </div>
        </div>
        
        <!-- Stat Panel (Single Value) -->
        <div v-else-if="isStatPanel" class="stat-panel">
          <div class="stat-value">{{ statValue }}</div>
          <div class="stat-label">{{ panel.title }}</div>
        </div>
        
        <!-- Status History Panel -->
        <div v-else-if="isStatusHistory" class="status-history-panel">
          <div class="status-history-table">
            <div class="status-history-header">
              <div class="status-row-label"></div>
              <div 
                v-for="(date, index) in statusHistoryDates" 
                :key="'date-' + index"
                class="status-col-header"
              >
                {{ formatStatusDate(date) }}
              </div>
            </div>
            <div 
              v-for="(row, rowIndex) in statusHistoryRows" 
              :key="'row-' + rowIndex"
              class="status-history-row"
            >
              <div class="status-row-label" :title="row.label">
                {{ row.label }}
              </div>
              <div 
                v-for="(date, colIndex) in statusHistoryDates" 
                :key="'cell-' + rowIndex + '-' + colIndex"
                :class="['status-cell', getStatusCellClass(row, date)]"
                :title="getStatusCellTitle(row, date)"
              >
              </div>
            </div>
          </div>
        </div>
        
        <!-- Fallback -->
        <div v-else class="unsupported-panel">
          <p>Panel type "{{ panel.type }}" is not yet supported</p>
          <p class="text-sm mt-2">Type: {{ panel.type }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Bar, Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { executeFluxQuery } from '@/api/dashboards';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler
);

export default {
  name: 'DashboardPanel',
  components: {
    Bar,
    Line
  },
  props: {
    panel: {
      type: Object,
      required: true
    },
    timeRange: {
      type: Object,
      default: () => ({ start: '-90d', stop: 'now()' })
    }
  },
  data() {
    return {
      loading: false,
      error: null,
      chartData: null,
      rawData: null
    };
  },
  computed: {
    isBarChart() {
      return this.panel.type === 'barchart' || this.panel.type === 'bargauge';
    },
    isLineChart() {
      return this.panel.type === 'graph' || !this.panel.type;
    },
    isTimeSeries() {
      return this.panel.type === 'timeseries';
    },
    timeSeriesDrawStyle() {
      if (!this.isTimeSeries) return 'line';
      return this.panel.fieldConfig?.defaults?.custom?.drawStyle || 'line';
    },
    isTimeSeriesBars() {
      return this.isTimeSeries && this.timeSeriesDrawStyle === 'bars';
    },
    isTimeSeriesLine() {
      return this.isTimeSeries && (this.timeSeriesDrawStyle === 'line' || this.timeSeriesDrawStyle === 'points');
    },
    isStatPanel() {
      return this.panel.type === 'stat';
    },
    isStatusHistory() {
      return this.panel.type === 'status-history';
    },
    isGaugeChart() {
      return this.panel.type === 'gauge' || this.panel.type === 'bargauge';
    },
    isStackedPercent() {
      return this.panel.options?.stacking === 'percent';
    },
    isStacked() {
      return this.panel.options?.stacking && this.panel.options?.stacking !== 'none';
    },
    statValue() {
      if (!this.rawData || !this.rawData.length) return 'N/A';
      const lastValue = this.rawData[this.rawData.length - 1]._value;
      return typeof lastValue === 'number' ? lastValue.toFixed(2) : lastValue;
    },
    gaugeValue() {
      if (!this.rawData || !this.rawData.length) return 0;
      const lastValue = this.rawData[this.rawData.length - 1]._value;
      return typeof lastValue === 'number' ? lastValue : 0;
    },
    gaugeMin() {
      return this.panel.fieldConfig?.defaults?.min || 0;
    },
    gaugeMax() {
      return this.panel.fieldConfig?.defaults?.max || 100;
    },
    gaugeUnit() {
      return this.panel.fieldConfig?.defaults?.unit || '';
    },
    statusHistoryDates() {
      if (!this.isStatusHistory || !this.rawData) return [];
      
      // Extract unique dates from the data
      const dates = new Set();
      this.rawData.forEach(record => {
        if (record.error_time || record._time) {
          const time = record.error_time || record._time;
          dates.add(time);
        }
      });
      
      return Array.from(dates).sort();
    },
    statusHistoryRows() {
      if (!this.isStatusHistory || !this.rawData) return [];
      
      // Group data by ID or field
      const rowMap = new Map();
      
      this.rawData.forEach(record => {
        const id = record.id || record._field || 'Unknown';
        const time = record.error_time || record._time;
        const value = record.error_state !== undefined ? record.error_state : record._value;
        
        if (!rowMap.has(id)) {
          rowMap.set(id, {
            label: this.getStatusLabel(id),
            id: id,
            data: new Map()
          });
        }
        
        rowMap.get(id).data.set(time, value);
      });
      
      return Array.from(rowMap.values());
    },
    statusHistoryDates() {
      if (!this.isStatusHistory || !this.rawData) return [];
      
      // Extract unique dates from the data
      const dates = new Set();
      this.rawData.forEach(record => {
        if (record.error_time || record._time) {
          const time = record.error_time || record._time;
          dates.add(time);
        }
      });
      
      return Array.from(dates).sort();
    },
    statusHistoryRows() {
      if (!this.isStatusHistory || !this.rawData) return [];
      
      // Group data by ID or field
      const rowMap = new Map();
      
      this.rawData.forEach(record => {
        const id = record.id || record._field || 'Unknown';
        const time = record.error_time || record._time;
        const value = record.error_state !== undefined ? record.error_state : record._value;
        
        if (!rowMap.has(id)) {
          rowMap.set(id, {
            label: this.getStatusLabel(id),
            id: id,
            data: new Map()
          });
        }
        
        rowMap.get(id).data.set(time, value);
      });
      
      return Array.from(rowMap.values());
    },
    gaugeDisplayValue() {
      const decimals = this.panel.fieldConfig?.defaults?.decimals || 1;
      return this.gaugeValue.toFixed(decimals);
    },
    gaugeSize() {
      return 200;
    },
    gaugeStrokeWidth() {
      return 20;
    },
    gaugeBackgroundColor() {
      return '#e5e7eb';
    },
    gaugeColor() {
      // Get color from thresholds
      const thresholds = this.panel.fieldConfig?.defaults?.thresholds?.steps || [];
      let color = '#3b82f6'; // Default blue
      
      for (let i = thresholds.length - 1; i >= 0; i--) {
        const step = thresholds[i];
        if (step.value === null || this.gaugeValue >= step.value) {
          color = step.color;
          break;
        }
      }
      
      // Map Grafana colors to hex
      const colorMap = {
        'green': '#73BF69',
        'yellow': '#F2CC0C',
        'red': '#E02F44',
        'blue': '#5794F2',
        'orange': '#FF9830'
      };
      
      return colorMap[color] || color;
    },
    gaugePath() {
      // Full circle for background
      const size = this.gaugeSize;
      const strokeWidth = this.gaugeStrokeWidth;
      const radius = (size - strokeWidth) / 2;
      const centerX = size / 2;
      const centerY = size / 2;
      
      // Create a full circle path
      return `M ${centerX},${centerY - radius} A ${radius},${radius} 0 1,1 ${centerX - 0.001},${centerY - radius} Z`;
    },
    gaugeValuePath() {
      const size = this.gaugeSize;
      const strokeWidth = this.gaugeStrokeWidth;
      const radius = (size - strokeWidth) / 2;
      const centerX = size / 2;
      const centerY = size / 2;
      
      // Calculate the percentage
      const percentage = Math.max(0, Math.min(1, (this.gaugeValue - this.gaugeMin) / (this.gaugeMax - this.gaugeMin)));
      
      // Start from bottom (270° or -90°) and go clockwise
      const startAngle = -Math.PI / 2; // -90 degrees (bottom)
      const endAngle = startAngle + (2 * Math.PI * percentage); // Full circle is 2π
      
      const startX = centerX + radius * Math.cos(startAngle);
      const startY = centerY + radius * Math.sin(startAngle);
      const endX = centerX + radius * Math.cos(endAngle);
      const endY = centerY + radius * Math.sin(endAngle);
      
      // Large arc flag if more than 180 degrees (50%)
      const largeArcFlag = percentage > 0.5 ? 1 : 0;
      
      if (percentage === 0) {
        return '';
      }
      
      return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
    },
    gaugeThresholdArcs() {
      // Generate multiple arcs based on thresholds for background color zones
      const thresholds = this.panel.fieldConfig?.defaults?.thresholds?.steps || [];
      if (thresholds.length <= 1) return [];
      
      const size = this.gaugeSize;
      const strokeWidth = this.gaugeStrokeWidth;
      const radius = (size - strokeWidth) / 2;
      const centerX = size / 2;
      const centerY = size / 2;
      
      const arcs = [];
      const range = this.gaugeMax - this.gaugeMin;
      
      for (let i = 0; i < thresholds.length - 1; i++) {
        const currentThreshold = thresholds[i];
        const nextThreshold = thresholds[i + 1];
        
        const startValue = currentThreshold.value || 0;
        const endValue = nextThreshold.value;
        
        const startPercentage = (startValue - this.gaugeMin) / range;
        const endPercentage = (endValue - this.gaugeMin) / range;
        
        const startAngle = -Math.PI / 2 + (2 * Math.PI * startPercentage);
        const endAngle = -Math.PI / 2 + (2 * Math.PI * endPercentage);
        
        const startX = centerX + radius * Math.cos(startAngle);
        const startY = centerY + radius * Math.sin(startAngle);
        const endX = centerX + radius * Math.cos(endAngle);
        const endY = centerY + radius * Math.sin(endAngle);
        
        const largeArcFlag = (endPercentage - startPercentage) > 0.5 ? 1 : 0;
        
        // Map Grafana colors
        const colorMap = {
          'green': '#73BF69',
          'yellow': '#F2CC0C',
          'red': '#E02F44',
          'blue': '#5794F2',
          'orange': '#FF9830'
        };
        
        const color = colorMap[currentThreshold.color] || currentThreshold.color;
        
        arcs.push({
          path: `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
          color: color
        });
      }
      
      return arcs;
    },
    barChartOptions() {
      const panelOptions = this.panel.options || {};
      const legend = panelOptions.legend || {};
      
      const options = {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: panelOptions.orientation === 'horizontal' ? 'y' : 'x',
        plugins: {
          legend: {
            display: legend.showLegend !== false,
            position: legend.placement || 'bottom',
            labels: {
              usePointStyle: true,
              padding: 15,
              boxWidth: 12,
              boxHeight: 12
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {}
          }
        },
        scales: {
          x: {
            stacked: this.isStacked,
            grid: {
              display: true,
              drawBorder: true,
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              autoSkip: true,
              maxRotation: panelOptions.xTickLabelRotation || 45,
              minRotation: 0
            }
          },
          y: {
            stacked: this.isStacked,
            beginAtZero: true,
            grid: {
              display: true,
              color: 'rgba(0, 0, 0, 0.05)'
            }
          }
        }
      };

      // Add percentage formatting for stacked percent charts
      if (this.isStackedPercent) {
        options.scales.y.max = 100;
        options.scales.y.ticks = {
          callback: function(value) {
            return value + '%';
          }
        };
        options.plugins.tooltip.callbacks.label = function(context) {
          let label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }
          label += context.parsed.y.toFixed(1) + '%';
          return label;
        };
      }

      // Show values on bars if configured
      if (panelOptions.showValue === 'always' || panelOptions.showValue === 'auto') {
        options.plugins.datalabels = {
          display: true,
          color: '#000',
          font: {
            weight: 'bold',
            size: 11
          },
          formatter: (value) => {
            return Math.round(value);
          }
        };
      }

      return options;
    },
    lineChartOptions() {
      const panelOptions = this.panel.options || {};
      const legend = panelOptions.legend || {};
      
      return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: legend.showLegend !== false,
            position: legend.placement || 'bottom',
            labels: {
              usePointStyle: true,
              padding: 15,
              boxWidth: 12,
              boxHeight: 12
            }
          },
          tooltip: {
            mode: panelOptions.tooltip?.mode || 'index',
            intersect: false
          }
        },
        scales: {
          x: {
            grid: {
              display: true,
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              display: true,
              color: 'rgba(0, 0, 0, 0.05)'
            }
          }
        }
      };
    },
    timeSeriesOptions() {
      const panelOptions = this.panel.options || {};
      const legend = panelOptions.legend || {};
      const fieldConfig = this.panel.fieldConfig?.defaults?.custom || {};
      const fillOpacity = this.panel.fieldConfig?.defaults?.custom?.fillOpacity || 0;
      const drawStyle = this.timeSeriesDrawStyle;
      
      const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: legend.showLegend !== false,
            position: legend.placement || 'bottom',
            labels: {
              usePointStyle: true,
              padding: 15,
              boxWidth: 12,
              boxHeight: 12
            }
          },
          tooltip: {
            mode: panelOptions.tooltip?.mode || 'index',
            intersect: false
          }
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'day',
              displayFormats: {
                day: 'MMM dd'
              }
            },
            grid: {
              display: true,
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          y: {
            beginAtZero: fieldConfig.axisCenteredZero ? false : true,
            grid: {
              display: true,
              color: 'rgba(0, 0, 0, 0.05)'
            }
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        }
      };
      
      // Configure based on draw style
      if (drawStyle === 'bars') {
        // Bar chart configuration
        options.elements = {
          bar: {
            borderWidth: 0
          }
        };
      } else if (drawStyle === 'points') {
        // Points only - no lines
        options.elements = {
          line: {
            borderWidth: 0,
            tension: 0
          },
          point: {
            radius: fieldConfig.pointSize || 5,
            hitRadius: 10,
            hoverRadius: 6
          }
        };
        options.showLine = false;
      } else {
        // Line chart (default)
        options.elements = {
          line: {
            tension: fieldConfig.lineInterpolation === 'smooth' ? 0.4 : 0,
            borderWidth: fieldConfig.lineWidth || 2
          },
          point: {
            radius: fieldConfig.showPoints === 'always' ? 3 : 0,
            hitRadius: 10,
            hoverRadius: 4
          }
        };
      }
      
      return options;
    }
  },
  mounted() {
    this.loadData();
  },
  watch: {
    timeRange: {
      handler() {
        this.loadData();
      },
      deep: true
    }
  },
  methods: {
    async loadData() {
      this.loading = true;
      this.error = null;
      
      try {
        // Get all targets (queries) from the panel
        const targets = this.panel.targets || [];
        if (targets.length === 0) {
          this.error = 'No queries defined for this panel';
          return;
        }
        
        // Execute all queries (but skip expression/math targets for now)
        const queryTargets = targets.filter(t => t.query && !t.expression);
        
        if (queryTargets.length === 0) {
          this.error = 'No executable queries found';
          return;
        }
        
        const results = await Promise.all(
          queryTargets.map(target => 
            executeFluxQuery(target.query, this.timeRange)
          )
        );
        
        // Merge all results
        let allData = [];
        results.forEach((result, index) => {
          if (result && result.data) {
            // Tag each data point with the refId for proper series identification
            const refId = queryTargets[index].refId;
            result.data.forEach(point => {
              allData.push({
                ...point,
                refId: refId
              });
            });
          }
        });
        
        if (allData.length > 0) {
          this.rawData = allData;
          this.processData(allData);
        } else {
          this.error = 'No data returned';
        }
      } catch (err) {
        console.error('Error loading panel data:', err);
        this.error = 'Failed to load data';
      } finally {
        this.loading = false;
      }
    },
    
    processData(data) {
      if (!data || data.length === 0) {
        this.error = 'No data available';
        return;
      }
      
      // Grafana color palette (classic)
      const grafanaColors = [
        '#73BF69', // Green
        '#F2CC0C', // Yellow  
        '#FF9830', // Orange
        '#E02F44', // Red
        '#5794F2', // Blue
        '#B877D9', // Purple
        '#FFA6B0', // Pink
        '#96D98D'  // Light green
      ];
      
      // Get color configuration from panel
      const colorMode = this.panel.fieldConfig?.defaults?.color?.mode || 'palette-classic';
      const thresholds = this.panel.fieldConfig?.defaults?.thresholds || {};
      const thresholdSteps = thresholds.steps || [];
      const fillOpacity = this.panel.fieldConfig?.defaults?.custom?.fillOpacity || 80;
      const overrides = this.panel.fieldConfig?.overrides || [];
      
      // Map Grafana color names to hex
      const grafanaColorMap = {
        'green': '#73BF69',
        'dark-green': '#37872D',
        'red': '#E02F44',
        'dark-red': '#C4162A',
        'yellow': '#F2CC0C',
        'orange': '#FF9830',
        'blue': '#5794F2',
        'purple': '#B877D9',
        'dark-blue': '#1F60C4',
        'dark-purple': '#8F3BB8'
      };
      
      // Helper to resolve color names
      const resolveColor = (color) => {
        if (!color) return grafanaColors[0];
        if (color.startsWith('#')) return color;
        return grafanaColorMap[color] || color;
      };
      
      // Helper to get color override for a field name
      const getFieldColor = (fieldName) => {
        const override = overrides.find(o => 
          o.matcher?.id === 'byName' && o.matcher?.options === fieldName
        );
        
        if (override) {
          const colorProp = override.properties?.find(p => p.id === 'color');
          if (colorProp?.value) {
            if (colorProp.value.mode === 'fixed' && colorProp.value.fixedColor) {
              return resolveColor(colorProp.value.fixedColor);
            }
          }
        }
        
        return null;
      };
      
      // Check if data has _field property (long format) or multiple value columns (wide format)
      const hasFieldProperty = data.some(d => d._field !== undefined);
      const firstRow = data[0];
      const allKeys = Object.keys(firstRow);
      
      // Identify value columns (exclude metadata like _time, date, _field, _measurement, topic, refId)
      const metadataKeys = ['_time', 'date', '_field', '_measurement', 'topic', 'refId', '_start', '_stop'];
      const valueColumns = allKeys.filter(key => !metadataKeys.includes(key) && typeof firstRow[key] === 'number');
      
      // Determine if this is wide format (multiple value columns) or long format (_field property)
      const isWideFormat = !hasFieldProperty && valueColumns.length > 1;
      
      if (isWideFormat) {
        // Wide format: each row has multiple value columns (e.g., ProductionTime, DownTime, OffTime)
        const labels = data.map(d => {
          const dateValue = d.date || d._time;
          return this.formatDateLabel(dateValue);
        });
        
        const datasets = valueColumns.map((columnName, index) => {
          const values = data.map(d => d[columnName] || 0);
          
          // Convert to percentage if stacking is percent
          let processedValues = values;
          if (this.isStackedPercent) {
            // Calculate percentage for each data point
            processedValues = data.map((row, idx) => {
              const total = valueColumns.reduce((sum, col) => sum + (row[col] || 0), 0);
              return total > 0 ? (values[idx] / total) * 100 : 0;
            });
          }
          
          // Get override color or use palette color
          const overrideColor = getFieldColor(columnName);
          const color = overrideColor || grafanaColors[index % grafanaColors.length];
          const opacity = fillOpacity / 100;
          
          return {
            label: columnName,
            data: processedValues,
            backgroundColor: this.isBarChart || this.isTimeSeriesBars ? color : this.hexToRgba(color, opacity),
            borderColor: color,
            borderWidth: this.isBarChart || this.isTimeSeriesBars ? 0 : 2,
            fill: this.isTimeSeries ? fillOpacity > 0 : !this.isBarChart && !this.isTimeSeriesBars,
            tension: 0.4,
            stack: this.isStacked ? 'stack0' : undefined,
            showLine: this.timeSeriesDrawStyle !== 'points'
          };
        });
        
        this.chartData = { labels, datasets };
        
      } else {
        // Long format: data has _field property indicating series
        const seriesMap = {};
        data.forEach(d => {
          const seriesName = d._field || d._measurement || 'value';
          if (!seriesMap[seriesName]) {
            seriesMap[seriesName] = [];
          }
          seriesMap[seriesName].push(d);
        });
        
        const seriesNames = Object.keys(seriesMap);
        
        // Check if this is a threshold-based chart
        const useThresholds = colorMode === 'thresholds';
        
        // Convert data to Chart.js format
        if (seriesNames.length > 1 && !useThresholds) {
          // Multiple series (stacked chart like Effectivity)
          const labels = [...new Set(data.map(d => this.formatDateLabel(d._time)))];
          
          const datasets = seriesNames.map((seriesName, index) => {
            const seriesData = seriesMap[seriesName];
            const values = labels.map(label => {
              const point = seriesData.find(d => {
                const pointLabel = this.formatDateLabel(d._time);
                return String(pointLabel) === String(label);
              });
              return point ? point._value : 0;
            });
            
            // Get override color or use palette color
            const overrideColor = getFieldColor(seriesName);
            const color = overrideColor || grafanaColors[index % grafanaColors.length];
            const opacity = fillOpacity / 100;
            
            return {
              label: seriesName,
              data: values,
              backgroundColor: this.isBarChart || this.isTimeSeriesBars ? color : this.hexToRgba(color, opacity),
              borderColor: color,
              borderWidth: this.isBarChart || this.isTimeSeriesBars ? 0 : 2,
              fill: this.isTimeSeries ? fillOpacity > 0 : !this.isBarChart && !this.isTimeSeriesBars,
              tension: 0.4,
              stack: this.isStacked ? 'stack0' : undefined,
              showLine: this.timeSeriesDrawStyle !== 'points'
            };
          });
          
          this.chartData = { labels, datasets };
        } else {
          // Single series
          const labels = data.map(d => this.formatDateLabel(d._time));
          
          const values = data.map(d => d._value);
          
          // Apply color based on mode
          let backgroundColor;
          let borderColor;
          
          if (useThresholds && thresholdSteps.length > 0 && this.isTimeSeries) {
            // Threshold-based coloring for timeseries - create segments with different colors
            const datasets = [];
            
            // Helper to get color for a value
            const getColorForValue = (value) => {
              let color = resolveColor(thresholdSteps[0].color);
              for (let i = thresholdSteps.length - 1; i >= 0; i--) {
                const step = thresholdSteps[i];
                if (step.value === null || value >= step.value) {
                  color = resolveColor(step.color);
                  break;
                }
              }
              return color;
            };
            
            // Create segments where color changes
            let segmentData = [];
            let segmentLabels = [];
            let currentColor = null;
            
            for (let i = 0; i < values.length; i++) {
              const value = values[i];
              const color = getColorForValue(value);
              
              // If color changes, start new segment
              if (currentColor !== null && currentColor !== color) {
                // Add overlap point for continuity
                segmentData.push(value);
                segmentLabels.push(labels[i]);
                
                // Save previous segment
                datasets.push({
                  label: seriesNames[0] || this.panel.title,
                  data: segmentData.map((val, idx) => ({ x: segmentLabels[idx], y: val })),
                  borderColor: currentColor,
                  backgroundColor: 'transparent',
                  borderWidth: 2,
                  fill: false,
                  tension: 0,
                  pointRadius: 0,
                  pointHitRadius: 10,
                  showLine: true
                });
                
                // Start new segment with overlap
                segmentData = [value];
                segmentLabels = [labels[i]];
              } else {
                segmentData.push(value);
                segmentLabels.push(labels[i]);
              }
              
              currentColor = color;
            }
            
            // Add final segment
            if (segmentData.length > 0) {
              datasets.push({
                label: seriesNames[0] || this.panel.title,
                data: segmentData.map((val, idx) => ({ x: segmentLabels[idx], y: val })),
                borderColor: currentColor,
                backgroundColor: 'transparent',
                borderWidth: 2,
                fill: false,
                tension: 0,
                pointRadius: 0,
                pointHitRadius: 10,
                showLine: true
              });
            }
            
            this.chartData = { datasets };
            
          } else if (useThresholds && thresholdSteps.length > 0) {
            // Threshold-based coloring for bar charts
            if (thresholds.mode === 'percentage') {
              // Percentage mode - compare to max value
              const maxValue = Math.max(...values);
              backgroundColor = values.map(value => {
                const percentage = (value / maxValue) * 100;
                let color = resolveColor(thresholdSteps[0].color);
                
                for (let i = thresholdSteps.length - 1; i >= 0; i--) {
                  const step = thresholdSteps[i];
                  if (step.value === undefined || percentage >= step.value) {
                    color = resolveColor(step.color);
                    break;
                  }
                }
                return color;
              });
              borderColor = backgroundColor;
            } else {
              // Absolute mode - compare to threshold values
              backgroundColor = values.map(value => {
                let color = resolveColor(thresholdSteps[0].color);
                
                for (let i = thresholdSteps.length - 1; i >= 0; i--) {
                  const step = thresholdSteps[i];
                  if (step.value === undefined || value >= step.value) {
                    color = resolveColor(step.color);
                    break;
                  }
                }
                return color;
              });
              borderColor = backgroundColor;
            }
            
            this.chartData = {
              labels: labels,
              datasets: [{
                label: seriesNames[0] || this.panel.title,
                data: values,
                backgroundColor: backgroundColor,
                borderColor: borderColor,
                borderWidth: this.isBarChart || this.isTimeSeriesBars ? 0 : 2,
                fill: false,
                tension: 0.4,
                showLine: this.timeSeriesDrawStyle !== 'points'
              }]
            };
          } else {
            // Palette-classic mode
            const color = grafanaColors[0];
            const opacity = this.isTimeSeries ? 0 : (fillOpacity / 100);
            backgroundColor = this.isBarChart || this.isTimeSeriesBars ? color : this.hexToRgba(color, opacity);
            borderColor = color;
            
            this.chartData = {
              labels: labels,
              datasets: [{
                label: seriesNames[0] || this.panel.title,
                data: values,
                backgroundColor: backgroundColor,
                borderColor: borderColor,
                borderWidth: this.isBarChart || this.isTimeSeriesBars ? 0 : 2,
                fill: this.isTimeSeries ? false : (!this.isBarChart && !this.isTimeSeriesBars),
                tension: 0.4,
                showLine: this.timeSeriesDrawStyle !== 'points'
              }]
            };
          }
        }
      }
    },
    
    formatDateLabel(dateValue) {
      // Format date label consistently, avoiding timezone issues
      if (!dateValue) return '';
      
      const date = new Date(dateValue);
      
      // For time series charts, return the Date object
      if (this.isTimeSeries) {
        return date;
      }
      
      // For bar charts, format as DD.MM.YYYY to match locale
      // Use UTC date components to avoid timezone shifts
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${day}.${month}.${year}`;
    },
    
    formatStatusDate(date) {
      const d = new Date(date);
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${month}/${day}`;
    },
    
    getStatusLabel(id) {
      // Map IDs to friendly names based on common error codes
      const labelMap = {
        '110': 'Band Actual torque smoothed',
        '111': 'Band Active power actual value smoothed',
        '112': 'Band Energy consumption saved',
        '113': 'Frame Actual torque smoothed',
        '114': 'Frame Active power actual value smoothed',
        '115': 'Band Speed',
        '116': 'Frame Speed',
        '117': 'Band Temperature',
        '118': 'Frame Temperature',
        '119': 'Band Vibration',
        '120': 'Frame Vibration',
        '121': 'Band Pressure',
        '122': 'Frame Pressure'
      };
      
      return labelMap[id] || `Error ${id}`;
    },
    
    getStatusCellClass(row, date) {
      const value = row.data.get(date);
      
      if (value === undefined || value === null) {
        return 'status-empty';
      }
      
      // Value of 1 means error (red), 0 or other means OK (green)
      if (value >= 1) {
        return 'status-error';
      }
      
      return 'status-ok';
    },
    
    getStatusCellTitle(row, date) {
      const value = row.data.get(date);
      
      if (value === undefined || value === null) {
        return 'No data';
      }
      
      const status = value === 1 ? 'Error' : 'OK';
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const dateStr = `${day}.${month}.${year}`;
      return `${row.label} - ${dateStr}: ${status}`;
    },
    
    hexToRgba(hex, alpha = 1) {
      // Convert hex color to rgba
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    },
    
    refresh() {
      this.loadData();
    }
  }
};
</script>

<style scoped>
.dashboard-panel {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.panel-header {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f9fafb;
}

.panel-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.panel-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  color: #6b7280;
  transition: color 0.2s;
}

.btn-icon:hover {
  color: #111827;
}

.panel-content {
  padding: 1rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.chart-container {
  position: relative;
  flex: 1;
  min-height: 250px;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: #6b7280;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 0.5rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-state {
  color: #ef4444;
}

.error-state i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.stat-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
}

.stat-value {
  font-size: 3rem;
  font-weight: 700;
  color: #3b82f6;
  line-height: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.5rem;
}

.unsupported-panel {
  padding: 1rem;
  background: #fef3c7;
  border-radius: 0.375rem;
  color: #92400e;
}

.unsupported-panel pre {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  overflow: auto;
  max-height: 200px;
}

/* Gauge Chart Styles */
.gauge-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 1rem;
  background: #ffffff;
}

.gauge-svg {
  max-width: 100%;
  height: auto;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.05));
}

.gauge-threshold-arc {
  transition: opacity 0.3s ease;
}

.gauge-value-path {
  transition: d 0.6s ease, stroke 0.3s ease;
}

.gauge-value-text {
  font-size: 3rem;
  font-weight: 700;
  fill: #1f2937;
  transition: fill 0.3s ease;
}

.gauge-label-text {
  font-size: 0.875rem;
  font-weight: 500;
  fill: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.gauge-footer-labels {
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: 220px;
  margin-top: -0.5rem;
  padding: 0 1rem;
  font-size: 0.75rem;
  color: #9ca3af;
}

.gauge-min-label,
.gauge-max-label {
  font-weight: 500;
}

/* Status History Panel Styles */
.status-history-panel {
  flex: 1;
  overflow: auto;
  padding: 1rem;
}

.status-history-table {
  display: flex;
  flex-direction: column;
  min-width: fit-content;
}

.status-history-header {
  display: flex;
  margin-bottom: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: #6b7280;
}

.status-history-row {
  display: flex;
  margin-bottom: 0.25rem;
}

.status-row-label {
  min-width: 200px;
  max-width: 200px;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  color: #374151;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-col-header {
  min-width: 60px;
  max-width: 60px;
  padding: 0.25rem;
  text-align: center;
  font-size: 0.75rem;
}

.status-cell {
  min-width: 60px;
  max-width: 60px;
  height: 40px;
  margin-right: 2px;
  cursor: pointer;
  transition: opacity 0.2s;
  border-radius: 2px;
}

.status-cell:hover {
  opacity: 0.8;
}

.status-empty {
  background-color: #f3f4f6;
}

.status-ok {
  background-color: #73BF69;
}

.status-error {
  background-color: #E02F44;
}
</style>
