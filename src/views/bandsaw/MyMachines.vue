<template>
  <div class="my-machines-page">
    <div class="page-header mb-6 flex items-start justify-between">
      <div>
        <h1 class="text-3xl font-bold">My Machines</h1>
        <p class="text-gray-600 mt-2">Manage your bandsaw machine fleet</p>
      </div>
      <router-link to="/catalog" class="btn btn-primary">
        <i class="i-Add mr-2"></i>
        Add Machine
      </router-link>
    </div>

    <!-- Filters -->
    <div class="filters bg-white p-4 rounded-lg shadow mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium mb-2">Location</label>
          <select v-model="filters.location" class="form-select w-full">
            <option value="">All Locations</option>
            <option v-for="loc in locations" :key="loc" :value="loc">{{ loc }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Status</label>
          <select v-model="filters.status" class="form-select w-full">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="maintenance">Maintenance</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Search</label>
          <input 
            v-model="filters.search" 
            type="text" 
            placeholder="Search by name..." 
            class="form-input w-full"
          />
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <div class="spinner"></div>
      <p class="mt-4 text-gray-600">Loading machines...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredMachines.length === 0" class="text-center py-12 bg-white rounded-lg shadow">
      <i class="i-Gears text-5xl text-gray-400 mb-4"></i>
      <p class="text-gray-600 mb-4">No machines found</p>
      <router-link to="/catalog" class="btn btn-primary">
        Browse Catalog
      </router-link>
    </div>

    <!-- Machines Grid -->
    <div v-else class="machines-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div 
        v-for="machine in filteredMachines" 
        :key="machine.id"
        class="machine-card bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
      >
        <div class="p-6">
          <div class="flex justify-between items-start mb-4">
            <div class="flex-1">
              <h3 class="text-lg font-semibold">{{ machine.custom_name || machine.model }}</h3>
              <p class="text-sm text-gray-600">{{ machine.model }}</p>
            </div>
            <span 
              :class="['status-badge', `status-${getStatus(machine)}`]"
            >
              {{ getStatus(machine) }}
            </span>
          </div>

          <div class="machine-info space-y-2 mb-4">
            <div class="flex items-center text-sm">
              <i class="i-Location text-gray-400 mr-2"></i>
              <span>{{ machine.location || 'Not specified' }}</span>
            </div>
            <div v-if="machine.plc_ip_address" class="flex items-center text-sm">
              <i class="i-Network text-gray-400 mr-2"></i>
              <span>{{ machine.plc_ip_address }}</span>
            </div>
            <div v-if="machine.mqtt_topic" class="flex items-center text-sm">
              <i class="i-Satelite text-gray-400 mr-2"></i>
              <span class="truncate">{{ machine.mqtt_topic }}</span>
            </div>
          </div>

          <!-- Maintenance Info -->
          <div v-if="machine.last_maintenance_date || machine.next_maintenance_date" class="maintenance-info p-3 bg-gray-50 rounded mb-4">
            <div class="text-xs text-gray-600 mb-1">Maintenance</div>
            <div v-if="machine.last_maintenance_date" class="text-sm">
              <span class="text-gray-600">Last:</span> {{ formatDate(machine.last_maintenance_date) }}
            </div>
            <div v-if="machine.next_maintenance_date" class="text-sm">
              <span class="text-gray-600">Next:</span> 
              <span :class="isMaintenanceDue(machine.next_maintenance_date) ? 'text-red-600 font-semibold' : ''">
                {{ formatDate(machine.next_maintenance_date) }}
              </span>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-2">
            <button 
              @click="viewMachine(machine.id)" 
              class="btn btn-primary flex-1"
            >
              <i class="i-Settings mr-1"></i>
              Configure
            </button>
            <button 
              @click="deleteMachine(machine.id)" 
              class="btn btn-danger"
              title="Remove Machine"
            >
              <i class="i-Remove"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

export default {
  name: 'MyMachines',
  setup() {
    const router = useRouter();
    const loading = ref(true);
    const machines = ref([]);
    const locations = ref([]);

    const filters = ref({
      location: '',
      status: '',
      search: ''
    });

    const filteredMachines = computed(() => {
      let filtered = machines.value;

      if (filters.value.location) {
        filtered = filtered.filter(m => m.location === filters.value.location);
      }

      if (filters.value.status) {
        filtered = filtered.filter(m => getStatus(m) === filters.value.status);
      }

      if (filters.value.search) {
        const search = filters.value.search.toLowerCase();
        filtered = filtered.filter(m => 
          (m.custom_name && m.custom_name.toLowerCase().includes(search)) ||
          (m.model && m.model.toLowerCase().includes(search)) ||
          (m.location && m.location.toLowerCase().includes(search))
        );
      }

      return filtered;
    });

    const loadMachines = async () => {
      loading.value = true;
      try {
        const response = await axios.get('/api/machines');
        machines.value = response.data;
        
        // Extract unique locations
        const locs = new Set();
        machines.value.forEach(m => {
          if (m.location) locs.add(m.location);
        });
        locations.value = Array.from(locs).sort();
      } catch (error) {
        console.error('Failed to load machines:', error);
        machines.value = [];
      } finally {
        loading.value = false;
      }
    };

    const getStatus = (machine) => {
      if (!machine.is_active) return 'inactive';
      
      if (machine.next_maintenance_date) {
        const nextDate = new Date(machine.next_maintenance_date);
        const today = new Date();
        if (nextDate < today) return 'maintenance';
      }
      
      return 'active';
    };

    const isMaintenanceDue = (dateString) => {
      const date = new Date(dateString);
      const today = new Date();
      return date < today;
    };

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('cs-CZ', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    };

    const viewMachine = (id) => {
      router.push(`/my-machines/${id}`);
    };

    const deleteMachine = async (id) => {
      const machine = machines.value.find(m => m.id === id);
      if (!confirm(`Are you sure you want to remove ${machine.custom_name || machine.model}?`)) {
        return;
      }

      try {
        await axios.delete(`/api/machines/${id}`);
        machines.value = machines.value.filter(m => m.id !== id);
      } catch (error) {
        console.error('Failed to delete machine:', error);
        alert('Failed to remove machine. Please try again.');
      }
    };

    onMounted(() => {
      loadMachines();
    });

    return {
      loading,
      machines,
      locations,
      filters,
      filteredMachines,
      getStatus,
      isMaintenanceDue,
      formatDate,
      viewMachine,
      deleteMachine
    };
  }
};
</script>

<style scoped>
.my-machines-page {
  padding: 2rem;
}

.form-select,
.form-input {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
}

.form-select:focus,
.form-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.machine-card {
  transition: all 0.2s;
}

.machine-card:hover {
  transform: translateY(-2px);
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
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

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-danger {
  background: #dc3545;
  color: white;
  padding: 0.5rem 0.75rem;
}

.btn-danger:hover {
  background: #c82333;
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
