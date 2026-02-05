<template>
  <div class="machine-maintenance-page">
    <div v-if="loading" class="text-center py-12">
      <div class="spinner"></div>
      <p class="mt-4 text-gray-600">Loading maintenance schedule...</p>
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
        <button @click="$router.push(`/my-machines/${$route.params.id}`)" class="text-blue-600 hover:text-blue-800 mb-2 flex items-center">
          <i class="i-Arrow-Left mr-2"></i>
          Back to Configuration
        </button>
        <div class="flex items-start justify-between">
          <div>
            <h1 class="text-3xl font-bold">Maintenance Schedule</h1>
            <p class="text-gray-600 mt-2">{{ machine.custom_name || machine.model }}</p>
          </div>
          <button @click="showAddModal = true" class="btn btn-primary">
            <i class="i-Add mr-2"></i>
            Add Record
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Schedule Overview -->
          <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-semibold mb-4">Schedule Overview</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="stat-card">
                <div class="stat-label">Last Maintenance</div>
                <div class="stat-value">
                  {{ machine.last_maintenance_date ? formatDate(machine.last_maintenance_date) : 'Never' }}
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Next Maintenance</div>
                <div class="stat-value" :class="isOverdue() ? 'text-red-600' : ''">
                  {{ machine.next_maintenance_date ? formatDate(machine.next_maintenance_date) : 'Not scheduled' }}
                </div>
                <div v-if="isOverdue()" class="text-xs text-red-600 mt-1">
                  <i class="i-Warning mr-1"></i>Overdue
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Total Records</div>
                <div class="stat-value">{{ maintenanceRecords.length }}</div>
              </div>
            </div>
          </div>

          <!-- Maintenance Records -->
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-xl font-semibold">Maintenance History</h2>
              <select v-model="filterType" class="form-select">
                <option value="">All Types</option>
                <option value="Routine Inspection">Routine Inspection</option>
                <option value="Blade Replacement">Blade Replacement</option>
                <option value="Lubrication">Lubrication</option>
                <option value="Calibration">Calibration</option>
                <option value="Repair">Repair</option>
                <option value="Upgrade">Upgrade</option>
              </select>
            </div>

            <!-- Records List -->
            <div v-if="filteredRecords.length > 0" class="space-y-3">
              <div 
                v-for="record in filteredRecords" 
                :key="record.id"
                class="maintenance-record p-4 border rounded-lg hover:bg-gray-50 transition"
              >
                <div class="flex justify-between items-start">
                  <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                      <span class="record-type-badge" :class="`type-${record.maintenance_type.toLowerCase().replace(/ /g, '-')}`">
                        {{ record.maintenance_type }}
                      </span>
                      <span class="text-sm text-gray-600">{{ formatDate(record.maintenance_date) }}</span>
                    </div>
                    
                    <p v-if="record.description" class="text-gray-700 mb-2">
                      {{ record.description }}
                    </p>
                    
                    <div class="flex gap-4 text-sm text-gray-600">
                      <span v-if="record.performed_by">
                        <i class="i-Administrator mr-1"></i>{{ record.performed_by }}
                      </span>
                      <span v-if="record.cost">
                        <i class="i-Money mr-1"></i>${{ record.cost.toFixed(2) }}
                      </span>
                      <span v-if="record.next_maintenance_due">
                        <i class="i-Calendar mr-1"></i>Next: {{ formatDate(record.next_maintenance_due) }}
                      </span>
                    </div>
                  </div>
                  
                  <div class="flex gap-2">
                    <button @click="editRecord(record)" class="btn-icon" title="Edit">
                      <i class="i-Pen-2"></i>
                    </button>
                    <button @click="deleteRecord(record.id)" class="btn-icon text-red-600" title="Delete">
                      <i class="i-Remove"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="text-center py-12 text-gray-500">
              <i class="i-Wrench text-5xl mb-4"></i>
              <p>No maintenance records found</p>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Quick Stats -->
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="font-semibold mb-4">Statistics</h3>
            <div class="space-y-3">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Total Cost</span>
                <span class="font-medium">${{ totalCost.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Avg. Cost/Record</span>
                <span class="font-medium">${{ avgCost.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">This Year</span>
                <span class="font-medium">{{ recordsThisYear }} records</span>
              </div>
            </div>
          </div>

          <!-- Maintenance Types -->
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="font-semibold mb-4">By Type</h3>
            <div class="space-y-2">
              <div v-for="(count, type) in recordsByType" :key="type" class="flex justify-between text-sm">
                <span class="text-gray-600">{{ type }}</span>
                <span class="font-medium">{{ count }}</span>
              </div>
            </div>
          </div>

          <!-- Recommendations -->
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="font-semibold mb-4">Recommendations</h3>
            <div class="space-y-3 text-sm">
              <div v-if="isOverdue()" class="recommendation warning">
                <i class="i-Warning text-yellow-600 mr-2"></i>
                <span>Schedule maintenance soon</span>
              </div>
              <div v-if="needsBladeReplacement" class="recommendation info">
                <i class="i-Information text-blue-600 mr-2"></i>
                <span>Consider blade replacement</span>
              </div>
              <div class="recommendation success">
                <i class="i-Check-2 text-green-600 mr-2"></i>
                <span>Regular maintenance on track</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click="showAddModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="text-xl font-semibold">
            {{ editingRecord ? 'Edit' : 'Add' }} Maintenance Record
          </h3>
          <button @click="closeModal" class="text-gray-500 hover:text-gray-700">
            <i class="i-Close text-2xl"></i>
          </button>
        </div>
        <form @submit.prevent="saveRecord" class="modal-body space-y-4">
          <div>
            <label class="form-label">Maintenance Type *</label>
            <select v-model="recordForm.maintenance_type" class="form-input w-full" required>
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
            <input v-model="recordForm.maintenance_date" type="date" class="form-input w-full" required />
          </div>
          <div>
            <label class="form-label">Performed By</label>
            <input v-model="recordForm.performed_by" type="text" class="form-input w-full" placeholder="Technician name" />
          </div>
          <div>
            <label class="form-label">Description</label>
            <textarea v-model="recordForm.description" class="form-input w-full" rows="4" placeholder="Details about the maintenance work..."></textarea>
          </div>
          <div>
            <label class="form-label">Cost ($)</label>
            <input v-model.number="recordForm.cost" type="number" step="0.01" class="form-input w-full" placeholder="0.00" />
          </div>
          <div>
            <label class="form-label">Next Maintenance Due</label>
            <input v-model="recordForm.next_maintenance_due" type="date" class="form-input w-full" />
          </div>
          <div class="flex gap-3 pt-4">
            <button type="submit" class="btn btn-primary flex-1">
              {{ editingRecord ? 'Update' : 'Add' }} Record
            </button>
            <button type="button" @click="closeModal" class="btn btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';

export default {
  name: 'MachineMaintenance',
  setup() {
    const route = useRoute();
    const loading = ref(true);
    const machine = ref(null);
    const maintenanceRecords = ref([]);
    const showAddModal = ref(false);
    const editingRecord = ref(null);
    const filterType = ref('');

    const recordForm = reactive({
      maintenance_type: '',
      maintenance_date: new Date().toISOString().split('T')[0],
      performed_by: '',
      description: '',
      cost: null,
      next_maintenance_due: null
    });

    const filteredRecords = computed(() => {
      if (!filterType.value) return maintenanceRecords.value;
      return maintenanceRecords.value.filter(r => r.maintenance_type === filterType.value);
    });

    const totalCost = computed(() => {
      return maintenanceRecords.value.reduce((sum, r) => sum + (r.cost || 0), 0);
    });

    const avgCost = computed(() => {
      const records = maintenanceRecords.value.filter(r => r.cost);
      return records.length > 0 ? totalCost.value / records.length : 0;
    });

    const recordsThisYear = computed(() => {
      const currentYear = new Date().getFullYear();
      return maintenanceRecords.value.filter(r => {
        const year = new Date(r.maintenance_date).getFullYear();
        return year === currentYear;
      }).length;
    });

    const recordsByType = computed(() => {
      const types = {};
      maintenanceRecords.value.forEach(r => {
        types[r.maintenance_type] = (types[r.maintenance_type] || 0) + 1;
      });
      return types;
    });

    const needsBladeReplacement = computed(() => {
      const lastBlade = maintenanceRecords.value.find(r => r.maintenance_type === 'Blade Replacement');
      if (!lastBlade) return true;
      const daysSince = (new Date() - new Date(lastBlade.maintenance_date)) / (1000 * 60 * 60 * 24);
      return daysSince > 180; // 6 months
    });

    const loadMachine = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/machines/${route.params.id}`);
        machine.value = response.data;
      } catch (error) {
        console.error('Failed to load machine:', error);
        machine.value = null;
      }
    };

    const loadMaintenanceRecords = async () => {
      loading.value = true;
      try {
        const response = await axios.get(`${API_BASE_URL}/api/machines/${route.params.id}/maintenance`);
        maintenanceRecords.value = response.data.sort((a, b) => 
          new Date(b.maintenance_date) - new Date(a.maintenance_date)
        );
      } catch (error) {
        console.error('Failed to load maintenance records:', error);
        maintenanceRecords.value = [];
      } finally {
        loading.value = false;
      }
    };

    const isOverdue = () => {
      if (!machine.value?.next_maintenance_date) return false;
      return new Date(machine.value.next_maintenance_date) < new Date();
    };

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('cs-CZ', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    };

    const editRecord = (record) => {
      editingRecord.value = record;
      Object.keys(recordForm).forEach(key => {
        recordForm[key] = record[key] || null;
      });
      showAddModal.value = true;
    };

    const saveRecord = async () => {
      try {
        if (editingRecord.value) {
          await axios.put(
            `${API_BASE_URL}/api/machines/${route.params.id}/maintenance/${editingRecord.value.id}`,
            recordForm
          );
        } else {
          await axios.post(
            `${API_BASE_URL}/api/machines/${route.params.id}/maintenance`,
            recordForm
          );
        }
        closeModal();
        await Promise.all([loadMachine(), loadMaintenanceRecords()]);
      } catch (error) {
        console.error('Failed to save record:', error);
        alert('Failed to save maintenance record. Please try again.');
      }
    };

    const deleteRecord = async (id) => {
      if (!confirm('Delete this maintenance record?')) return;

      try {
        await axios.delete(`${API_BASE_URL}/api/machines/${route.params.id}/maintenance/${id}`);
        loadMaintenanceRecords();
      } catch (error) {
        console.error('Failed to delete record:', error);
        alert('Failed to delete record. Please try again.');
      }
    };

    const closeModal = () => {
      showAddModal.value = false;
      editingRecord.value = null;
      Object.keys(recordForm).forEach(key => {
        recordForm[key] = key === 'maintenance_date' ? new Date().toISOString().split('T')[0] : null;
      });
      recordForm.maintenance_type = '';
    };

    onMounted(async () => {
      await Promise.all([loadMachine(), loadMaintenanceRecords()]);
    });

    return {
      loading,
      machine,
      maintenanceRecords,
      showAddModal,
      editingRecord,
      filterType,
      recordForm,
      filteredRecords,
      totalCost,
      avgCost,
      recordsThisYear,
      recordsByType,
      needsBladeReplacement,
      isOverdue,
      formatDate,
      editRecord,
      saveRecord,
      deleteRecord,
      closeModal
    };
  }
};
</script>

<style scoped>
.machine-maintenance-page {
  padding: 2rem;
}

.stat-card {
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
}

.stat-label {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
}

.maintenance-record {
  transition: all 0.2s;
}

.record-type-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
}

.type-routine-inspection {
  background: #dbeafe;
  color: #1e40af;
}

.type-blade-replacement {
  background: #fef3c7;
  color: #92400e;
}

.type-lubrication {
  background: #d1fae5;
  color: #065f46;
}

.type-calibration {
  background: #e0e7ff;
  color: #3730a3;
}

.type-repair {
  background: #fee2e2;
  color: #991b1b;
}

.type-upgrade {
  background: #ede9fe;
  color: #6b21a8;
}

.btn-icon {
  padding: 0.5rem;
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  transition: color 0.2s;
}

.btn-icon:hover {
  color: #111827;
}

.recommendation {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border-radius: 6px;
  background: #f9fafb;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: #374151;
}

.form-input,
.form-select {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
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
  max-width: 600px;
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
