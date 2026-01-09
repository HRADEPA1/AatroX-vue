<template>
  <div class="machine-configuration-page">
    <div v-if="loading" class="text-center py-12">
      <div class="spinner"></div>
      <p class="mt-4 text-gray-600">Loading machine configuration...</p>
    </div>

    <div v-else-if="!machine" class="text-center py-12">
      <i class="i-Close text-5xl text-red-400 mb-4"></i>
      <p class="text-gray-600">Machine not found</p>
      <button @click="$router.push('/my-machines')" class="btn btn-primary mt-4">
        Back to My Machines
      </button>
    </div>

    <div v-else>
      <!-- Header -->
      <div class="page-header mb-6">
        <button @click="$router.push('/my-machines')" class="text-blue-600 hover:text-blue-800 mb-2 flex items-center">
          <i class="i-Arrow-Left mr-2"></i>
          Back to My Machines
        </button>
        <div class="flex items-start justify-between">
          <div>
            <h1 class="text-3xl font-bold">{{ machine.machine_name || machine.machine?.model }}</h1>
            <p class="text-gray-600 mt-2">{{ machine.machine?.model }} - {{ machine.machine?.manufacturer?.name }}</p>
          </div>
          <span :class="['status-badge', `status-${getStatus()}`]">
            {{ getStatus() }}
          </span>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Configuration -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Basic Information -->
          <div class="config-section bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-semibold mb-4">Basic Information</h2>
            <form @submit.prevent="saveConfiguration">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="form-label">Machine Name</label>
                  <input 
                    v-model="form.machine_name" 
                    type="text" 
                    class="form-input w-full"
                    placeholder="e.g., Workshop Machine #1"
                  />
                </div>
                <div>
                  <label class="form-label">Location</label>
                  <input 
                    v-model="form.location" 
                    type="text" 
                    class="form-input w-full"
                    placeholder="e.g., Workshop A"
                  />
                </div>
                <div class="md:col-span-2">
                  <label class="form-label">Description</label>
                  <textarea 
                    v-model="form.description" 
                    class="form-input w-full"
                    rows="3"
                    placeholder="Additional notes about this machine..."
                  ></textarea>
                </div>
                <div>
                  <label class="form-label flex items-center">
                    <input 
                      v-model="form.is_active" 
                      type="checkbox" 
                      class="form-checkbox mr-2"
                    />
                    Machine is Active
                  </label>
                </div>
              </div>
            </form>
          </div>

          <!-- Network Configuration -->
          <div class="config-section bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-semibold mb-4">Network Configuration</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="form-label">PLC IP Address</label>
                <input 
                  v-model="form.plc_ip_address" 
                  type="text" 
                  class="form-input w-full"
                  placeholder="192.168.1.100"
                />
                <p class="text-xs text-gray-500 mt-1">IP address of the machine's PLC</p>
              </div>
              <div>
                <label class="form-label">PLC Port</label>
                <input 
                  v-model.number="form.plc_port" 
                  type="number" 
                  class="form-input w-full"
                  placeholder="502"
                />
              </div>
              <div class="md:col-span-2">
                <label class="form-label">MQTT Topic</label>
                <input 
                  v-model="form.mqtt_topic" 
                  type="text" 
                  class="form-input w-full"
                  placeholder="pegas-gonda-data/machine-1"
                />
                <p class="text-xs text-gray-500 mt-1">MQTT topic for real-time data streaming</p>
              </div>
            </div>
          </div>

          <!-- Operating Limits (Custom Overrides) -->
          <div class="config-section bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-semibold mb-4">Custom Operating Limits</h2>
            <p class="text-sm text-gray-600 mb-4">Override default machine limits if needed</p>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="form-label">Max Material Width (mm)</label>
                <input 
                  v-model.number="form.custom_max_material_width" 
                  type="number" 
                  class="form-input w-full"
                  :placeholder="machine.machine?.max_cutting_width"
                />
              </div>
              <div>
                <label class="form-label">Max Material Height (mm)</label>
                <input 
                  v-model.number="form.custom_max_material_height" 
                  type="number" 
                  class="form-input w-full"
                  :placeholder="machine.machine?.max_cutting_height"
                />
              </div>
              <div>
                <label class="form-label">Max Blade Speed (m/min)</label>
                <input 
                  v-model.number="form.custom_max_blade_speed" 
                  type="number" 
                  class="form-input w-full"
                  step="0.1"
                  :placeholder="machine.machine?.band_speed_max"
                />
              </div>
              <div>
                <label class="form-label">Max Feed Rate (mm/min)</label>
                <input 
                  v-model.number="form.custom_max_feed_rate" 
                  type="number" 
                  class="form-input w-full"
                  step="0.1"
                  :placeholder="machine.machine?.cutting_feed_max"
                />
              </div>
            </div>
          </div>

          <!-- Maintenance Schedule -->
          <div class="config-section bg-white rounded-lg shadow p-6">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-xl font-semibold">Maintenance Schedule</h2>
              <button @click="showMaintenanceModal = true" class="btn btn-secondary btn-sm">
                <i class="i-Add mr-1"></i>
                Add Record
              </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label class="form-label">Last Maintenance</label>
                <input 
                  v-model="form.last_maintenance_date" 
                  type="date" 
                  class="form-input w-full"
                />
              </div>
              <div>
                <label class="form-label">Next Maintenance</label>
                <input 
                  v-model="form.next_maintenance_date" 
                  type="date" 
                  class="form-input w-full"
                />
              </div>
            </div>

            <!-- Maintenance History -->
            <div v-if="maintenanceHistory.length > 0">
              <h3 class="font-semibold mb-3">Maintenance History</h3>
              <div class="space-y-2 max-h-64 overflow-y-auto">
                <div 
                  v-for="record in maintenanceHistory" 
                  :key="record.id"
                  class="maintenance-record p-3 bg-gray-50 rounded"
                >
                  <div class="flex justify-between items-start">
                    <div>
                      <div class="font-medium">{{ record.maintenance_type }}</div>
                      <div class="text-sm text-gray-600">{{ formatDate(record.maintenance_date) }}</div>
                      <div v-if="record.description" class="text-sm text-gray-700 mt-1">
                        {{ record.description }}
                      </div>
                      <div v-if="record.performed_by" class="text-xs text-gray-500 mt-1">
                        By: {{ record.performed_by }}
                      </div>
                    </div>
                    <span v-if="record.cost" class="text-sm font-medium">
                      ${{ record.cost.toFixed(2) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-8 text-gray-500">
              <i class="i-Wrench text-3xl mb-2"></i>
              <p class="text-sm">No maintenance records yet</p>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-3">
            <button @click="saveConfiguration" class="btn btn-primary">
              <i class="i-Save mr-2"></i>
              Save Configuration
            </button>
            <button @click="resetForm" class="btn btn-secondary">
              <i class="i-Reload mr-2"></i>
              Reset
            </button>
            <button @click="deleteMachine" class="btn btn-danger ml-auto">
              <i class="i-Remove mr-2"></i>
              Remove Machine
            </button>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Machine Specs -->
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="font-semibold mb-4">Machine Specifications</h3>
            <div class="space-y-3 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Model</span>
                <span class="font-medium">{{ machine.machine?.model }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Manufacturer</span>
                <span class="font-medium">{{ machine.machine?.manufacturer?.name }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Orientation</span>
                <span class="font-medium capitalize">{{ machine.machine?.orientation }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">NC Control</span>
                <span :class="machine.machine?.nc_control_type ? 'text-green-600' : 'text-gray-400'">
                  {{ machine.machine?.nc_control_type || 'No' }}
                </span>
              </div>
              <div v-if="machine.machine?.max_cutting_width" class="flex justify-between">
                <span class="text-gray-600">Max Width</span>
                <span class="font-medium">{{ machine.machine.max_cutting_width }} mm</span>
              </div>
              <div v-if="machine.machine?.max_cutting_height" class="flex justify-between">
                <span class="text-gray-600">Max Height</span>
                <span class="font-medium">{{ machine.machine.max_cutting_height }} mm</span>
              </div>
              <div v-if="machine.machine?.band_speed_min && machine.machine?.band_speed_max" class="flex justify-between">
                <span class="text-gray-600">Band Speed</span>
                <span class="font-medium">{{ machine.machine.band_speed_min }}-{{ machine.machine.band_speed_max }} m/min</span>
              </div>
              <div v-if="machine.machine?.cutting_feed_max" class="flex justify-between">
                <span class="text-gray-600">Cutting Feed</span>
                <span class="font-medium">0-{{ machine.machine.cutting_feed_max }} mm/min</span>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="font-semibold mb-4">Quick Actions</h3>
            <div class="space-y-2">
              <button @click="testConnection" class="action-btn w-full">
                <i class="i-Network mr-2"></i>
                Test PLC Connection
              </button>
              <button @click="viewLiveData" class="action-btn w-full">
                <i class="i-Bar-Chart mr-2"></i>
                View Live Data
              </button>
              <button @click="exportConfig" class="action-btn w-full">
                <i class="i-Download mr-2"></i>
                Export Config
              </button>
            </div>
          </div>

          <!-- Status -->
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="font-semibold mb-4">Status</h3>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Connection</span>
                <span class="flex items-center text-sm">
                  <span class="status-dot bg-gray-400 mr-2"></span>
                  Unknown
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Last Sync</span>
                <span class="text-sm">Never</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Maintenance Modal -->
    <div v-if="showMaintenanceModal" class="modal-overlay" @click="showMaintenanceModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="text-xl font-semibold">Add Maintenance Record</h3>
          <button @click="showMaintenanceModal = false" class="text-gray-500 hover:text-gray-700">
            <i class="i-Close text-2xl"></i>
          </button>
        </div>
        <form @submit.prevent="addMaintenanceRecord" class="modal-body space-y-4">
          <div>
            <label class="form-label">Maintenance Type *</label>
            <select v-model="maintenanceForm.maintenance_type" class="form-input w-full" required>
              <option value="">Select type...</option>
              <option value="Routine Inspection">Routine Inspection</option>
              <option value="Blade Replacement">Blade Replacement</option>
              <option value="Lubrication">Lubrication</option>
              <option value="Calibration">Calibration</option>
              <option value="Repair">Repair</option>
              <option value="Upgrade">Upgrade</option>
            </select>
          </div>
          <div>
            <label class="form-label">Date *</label>
            <input v-model="maintenanceForm.maintenance_date" type="date" class="form-input w-full" required />
          </div>
          <div>
            <label class="form-label">Performed By</label>
            <input v-model="maintenanceForm.performed_by" type="text" class="form-input w-full" />
          </div>
          <div>
            <label class="form-label">Description</label>
            <textarea v-model="maintenanceForm.description" class="form-input w-full" rows="3"></textarea>
          </div>
          <div>
            <label class="form-label">Cost</label>
            <input v-model.number="maintenanceForm.cost" type="number" step="0.01" class="form-input w-full" />
          </div>
          <div class="flex gap-3 pt-4">
            <button type="submit" class="btn btn-primary flex-1">Add Record</button>
            <button type="button" @click="showMaintenanceModal = false" class="btn btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';

export default {
  name: 'MachineConfiguration',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const loading = ref(true);
    const machine = ref(null);
    const maintenanceHistory = ref([]);
    const showMaintenanceModal = ref(false);

    const form = reactive({
      machine_name: '',
      location: '',
      description: '',
      is_active: true,
      plc_ip_address: '',
      plc_port: null,
      mqtt_topic: '',
      custom_max_material_width: null,
      custom_max_material_height: null,
      custom_max_blade_speed: null,
      custom_max_feed_rate: null,
      last_maintenance_date: null,
      next_maintenance_date: null
    });

    const maintenanceForm = reactive({
      maintenance_type: '',
      maintenance_date: new Date().toISOString().split('T')[0],
      performed_by: '',
      description: '',
      cost: null
    });

    const loadMachine = async () => {
      loading.value = true;
      try {
        const response = await axios.get(`/api/machines/${route.params.id}`);
        machine.value = response.data;
        
        // Populate form
        Object.keys(form).forEach(key => {
          if (machine.value[key] !== undefined) {
            form[key] = machine.value[key];
          }
        });

        // Load maintenance history
        loadMaintenanceHistory();
      } catch (error) {
        console.error('Failed to load machine:', error);
        machine.value = null;
      } finally {
        loading.value = false;
      }
    };

    const loadMaintenanceHistory = async () => {
      try {
        const response = await axios.get(`/api/machines/${route.params.id}/maintenance`);
        maintenanceHistory.value = response.data;
      } catch (error) {
        console.error('Failed to load maintenance history:', error);
      }
    };

    const saveConfiguration = async () => {
      try {
        await axios.put(`/api/machines/${route.params.id}`, form);
        alert('Configuration saved successfully!');
        loadMachine();
      } catch (error) {
        console.error('Failed to save configuration:', error);
        alert('Failed to save configuration. Please try again.');
      }
    };

    const addMaintenanceRecord = async () => {
      try {
        await axios.post(
          `/api/machines/${route.params.id}/maintenance`,
          maintenanceForm
        );
        showMaintenanceModal.value = false;
        loadMaintenanceHistory();
        
        // Reset form
        maintenanceForm.maintenance_type = '';
        maintenanceForm.description = '';
        maintenanceForm.performed_by = '';
        maintenanceForm.cost = null;
      } catch (error) {
        console.error('Failed to add maintenance record:', error);
        alert('Failed to add maintenance record. Please try again.');
      }
    };

    const resetForm = () => {
      if (confirm('Reset all changes?')) {
        loadMachine();
      }
    };

    const deleteMachine = async () => {
      if (!confirm(`Remove ${machine.value.machine_name || machine.value.machine?.model}?`)) {
        return;
      }

      try {
        await axios.delete(`/api/machines/${route.params.id}`);
        router.push('/my-machines');
      } catch (error) {
        console.error('Failed to delete machine:', error);
        alert('Failed to remove machine. Please try again.');
      }
    };

    const getStatus = () => {
      if (!machine.value.is_active) return 'inactive';
      if (machine.value.next_maintenance_date) {
        const nextDate = new Date(machine.value.next_maintenance_date);
        if (nextDate < new Date()) return 'maintenance';
      }
      return 'active';
    };

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('cs-CZ', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    };

    const testConnection = () => {
      alert('PLC connection test - Not implemented yet');
    };

    const viewLiveData = () => {
      router.push('/dashboard');
    };

    const exportConfig = () => {
      const config = { machine: machine.value, form: form };
      const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `machine-${route.params.id}-config.json`;
      a.click();
    };

    onMounted(() => {
      loadMachine();
    });

    return {
      loading,
      machine,
      form,
      maintenanceHistory,
      showMaintenanceModal,
      maintenanceForm,
      saveConfiguration,
      addMaintenanceRecord,
      resetForm,
      deleteMachine,
      getStatus,
      formatDate,
      testConnection,
      viewLiveData,
      exportConfig
    };
  }
};
</script>

<style scoped>
.machine-configuration-page {
  padding: 2rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: #374151;
}

.form-input,
.form-checkbox {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
}

.form-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: capitalize;
}

.status-active {
  background: #d1fae5;
  color: #065f46;
}

.status-maintenance {
  background: #fef3c7;
  color: #92400e;
}

.status-inactive {
  background: #f3f4f6;
  color: #6b7280;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
}

.action-btn {
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: white;
  text-align: left;
  display: flex;
  align-items: center;
  transition: all 0.2s;
  cursor: pointer;
}

.action-btn:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
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
}

.spinner {
  border: 4px solid #f3f4f6;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
