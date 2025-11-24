<template>
  <div class="catalog-page">
    <div class="page-header mb-6">
      <h1 class="text-3xl font-bold">Bandsaw Machine Catalog</h1>
      <p class="text-gray-600 mt-2">Browse and manage bandsaw machines from various manufacturers</p>
    </div>

    <!-- Filters -->
    <div class="filters bg-white p-4 rounded-lg shadow mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium mb-2">Manufacturer</label>
          <select v-model="filters.manufacturer" class="form-select w-full">
            <option value="">All Manufacturers</option>
            <option v-for="mfr in manufacturers" :key="mfr.id" :value="mfr.id">
              {{ mfr.name }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Orientation</label>
          <select v-model="filters.orientation" class="form-select w-full">
            <option value="">All Orientations</option>
            <option value="horizontal">Horizontal</option>
            <option value="vertical">Vertical</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Search</label>
          <input 
            v-model="filters.search" 
            type="text" 
            placeholder="Search by model..." 
            class="form-input w-full"
          />
        </div>
      </div>
    </div>

    <!-- Machine Grid -->
    <div v-if="loading" class="text-center py-12">
      <div class="spinner"></div>
      <p class="mt-4 text-gray-600">Loading machines...</p>
    </div>

    <div v-else-if="filteredMachines.length === 0" class="text-center py-12 bg-white rounded-lg shadow">
      <i class="i-Library text-5xl text-gray-400 mb-4"></i>
      <p class="text-gray-600">No machines found</p>
    </div>

    <div v-else class="machines-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div 
        v-for="machine in filteredMachines" 
        :key="machine.id"
        class="machine-card bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
        @click="viewMachine(machine.id)"
      >
        <div class="machine-image bg-gray-100 h-48 rounded-t-lg flex items-center justify-center">
          <img 
            v-if="machine.image_url" 
            :src="getImageUrl(machine.image_url)" 
            :alt="machine.model"
            class="max-h-full max-w-full object-contain"
          />
          <i v-else class="i-Gears text-6xl text-gray-300"></i>
        </div>
        
        <div class="p-4">
          <div class="flex justify-between items-start mb-2">
            <h3 class="text-lg font-semibold">{{ machine.model }}</h3>
            <span 
              :class="['badge', machine.orientation === 'horizontal' ? 'badge-blue' : 'badge-purple']"
            >
              {{ machine.orientation }}
            </span>
          </div>
          
          <p class="text-sm text-gray-600 mb-3">{{ machine.manufacturer?.name || 'Unknown' }}</p>
          
          <div class="specs text-sm space-y-1">
            <div class="flex justify-between">
              <span class="text-gray-600">Max Cutting:</span>
              <span class="font-medium">{{ machine.max_cutting_width || 'N/A' }} × {{ machine.max_cutting_height || 'N/A' }} mm</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Band Speed:</span>
              <span class="font-medium">{{ machine.band_speed_min || 0 }} - {{ machine.band_speed_max || 0 }} m/min</span>
            </div>
            <div v-if="machine.motor_power" class="flex justify-between">
              <span class="text-gray-600">Motor Power:</span>
              <span class="font-medium">{{ machine.motor_power }} kW</span>
            </div>
          </div>
          
          <div class="mt-4 flex gap-2">
            <button 
              @click.stop="viewMachine(machine.id)" 
              class="btn btn-primary flex-1"
            >
              View Details
            </button>
            <button 
              @click.stop="addToMyMachines(machine)" 
              class="btn btn-secondary"
              title="Add to My Machines"
            >
              <i class="i-Add"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination flex justify-center gap-2 mt-8">
      <button 
        @click="changePage(currentPage - 1)"
        :disabled="currentPage === 1"
        class="btn btn-secondary"
      >
        Previous
      </button>
      <span class="px-4 py-2 bg-white rounded">
        Page {{ currentPage }} of {{ totalPages }}
      </span>
      <button 
        @click="changePage(currentPage + 1)"
        :disabled="currentPage === totalPages"
        class="btn btn-secondary"
      >
        Next
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export default {
  name: 'Catalog',
  setup() {
    const router = useRouter();
    const loading = ref(true);
    const machines = ref([]);
    const manufacturers = ref([]);
    const currentPage = ref(1);
    const totalPages = ref(1);
    const pageSize = 12;

    const filters = ref({
      manufacturer: '',
      orientation: '',
      search: ''
    });

    const filteredMachines = computed(() => {
      let filtered = machines.value;

      if (filters.value.search) {
        const search = filters.value.search.toLowerCase();
        filtered = filtered.filter(m => 
          m.model.toLowerCase().includes(search) ||
          (m.manufacturer?.name || '').toLowerCase().includes(search)
        );
      }

      return filtered;
    });

    const loadManufacturers = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/catalog/manufacturers`);
        manufacturers.value = response.data;
      } catch (error) {
        console.error('Failed to load manufacturers:', error);
      }
    };

    const loadMachines = async () => {
      loading.value = true;
      try {
        const params = {
          page: currentPage.value,
          page_size: pageSize
        };

        if (filters.value.manufacturer) {
          params.manufacturer_id = filters.value.manufacturer;
        }
        if (filters.value.orientation) {
          params.orientation = filters.value.orientation;
        }

        const response = await axios.get(`${API_BASE_URL}/api/catalog/machines`, { params });
        // Check if response is paginated or direct array
        if (Array.isArray(response.data)) {
          machines.value = response.data;
          totalPages.value = 1;
        } else {
          machines.value = response.data.items || [];
          totalPages.value = response.data.pages || 1;
        }
      } catch (error) {
        console.error('Failed to load machines:', error);
        machines.value = [];
      } finally {
        loading.value = false;
      }
    };

    const viewMachine = (id) => {
      router.push(`/catalog/machine/${id}`);
    };

    const addToMyMachines = async (machine) => {
      try {
        await axios.post(`${API_BASE_URL}/api/machines`, {
          machine_id: machine.id,
          custom_name: machine.model,
          location: 'Workshop'
        });
        alert(`${machine.model} added to your machines!`);
      } catch (error) {
        console.error('Failed to add machine:', error);
        alert('Failed to add machine. Please try again.');
      }
    };

    const changePage = (page) => {
      if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page;
        loadMachines();
      }
    };

    onMounted(async () => {
      await Promise.all([
        loadManufacturers(),
        loadMachines()
      ]);
    });

    // Watch filters for changes
    watch(
      () => [filters.value.manufacturer, filters.value.orientation],
      () => {
        currentPage.value = 1;
        loadMachines();
      }
    );

    const getImageUrl = (imagePath) => {
      if (!imagePath) return '';
      // If it's already a full URL, return it
      if (imagePath.startsWith('http')) return imagePath;
      // Otherwise prepend the API base URL
      return `${API_BASE_URL}${imagePath}`;
    };

    return {
      loading,
      machines,
      manufacturers,
      filters,
      filteredMachines,
      currentPage,
      totalPages,
      viewMachine,
      addToMyMachines,
      changePage,
      getImageUrl
    };
  }
};
</script>

<style scoped>
.catalog-page {
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
  overflow: hidden;
  transition: all 0.2s;
}

.machine-card:hover {
  transform: translateY(-4px);
}

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
}

.badge-blue {
  background: #dbeafe;
  color: #1e40af;
}

.badge-purple {
  background: #ede9fe;
  color: #6b21a8;
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

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #545b62;
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
