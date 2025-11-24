<template>
  <div class="machine-details-page">
    <div v-if="loading" class="text-center py-12">
      <div class="spinner"></div>
      <p class="mt-4 text-gray-600">Loading machine details...</p>
    </div>

    <div v-else-if="!machine" class="text-center py-12">
      <i class="i-Close text-5xl text-red-400 mb-4"></i>
      <p class="text-gray-600">Machine not found</p>
      <button @click="$router.back()" class="btn btn-primary mt-4">
        Go Back
      </button>
    </div>

    <div v-else class="machine-details">
      <!-- Header -->
      <div class="page-header mb-6 flex items-start justify-between">
        <div>
          <button @click="$router.back()" class="text-blue-600 hover:text-blue-800 mb-2 flex items-center">
            <i class="i-Arrow-Left mr-2"></i>
            Back to Catalog
          </button>
          <h1 class="text-3xl font-bold">{{ machine.model }}</h1>
          <p class="text-gray-600 mt-2">{{ machine.manufacturer_name }}</p>
        </div>
        <button @click="addToMyMachines" class="btn btn-primary">
          <i class="i-Add mr-2"></i>
          Add to My Machines
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Info -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Image -->
          <div class="bg-white rounded-lg shadow p-6">
            <div class="machine-image bg-gray-100 rounded-lg flex items-center justify-center" style="height: 400px;">
              <img 
                v-if="machine.image_url" 
                :src="machine.image_url" 
                :alt="machine.model"
                class="max-h-full max-w-full object-contain"
              />
              <i v-else class="i-Gears text-9xl text-gray-300"></i>
            </div>
          </div>

          <!-- Description -->
          <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-semibold mb-4">Description</h2>
            <p class="text-gray-700 whitespace-pre-line">
              {{ machine.description || 'No description available.' }}
            </p>
          </div>

          <!-- Technical Specifications -->
          <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-semibold mb-4">Technical Specifications</h2>
            <div class="specs-grid grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="spec-item">
                <span class="spec-label">Model</span>
                <span class="spec-value">{{ machine.model }}</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">Manufacturer</span>
                <span class="spec-value">{{ machine.manufacturer_name }}</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">Orientation</span>
                <span class="spec-value capitalize">{{ machine.orientation }}</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">Max Material Width</span>
                <span class="spec-value">{{ machine.max_material_width }} mm</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">Max Material Height</span>
                <span class="spec-value">{{ machine.max_material_height }} mm</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">Blade Speed Range</span>
                <span class="spec-value">{{ machine.min_blade_speed }} - {{ machine.max_blade_speed }} m/min</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">Feed Rate Range</span>
                <span class="spec-value">{{ machine.min_feed_rate }} - {{ machine.max_feed_rate }} mm/min</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">NC Control</span>
                <span class="spec-value">
                  <span :class="machine.has_nc_control ? 'text-green-600' : 'text-gray-400'">
                    <i :class="machine.has_nc_control ? 'i-Check-2' : 'i-Close'"></i>
                    {{ machine.has_nc_control ? 'Yes' : 'No' }}
                  </span>
                </span>
              </div>
              <div class="spec-item">
                <span class="spec-label">Programmable Angles</span>
                <span class="spec-value">
                  <span :class="machine.supports_angle_cutting ? 'text-green-600' : 'text-gray-400'">
                    <i :class="machine.supports_angle_cutting ? 'i-Check-2' : 'i-Close'"></i>
                    {{ machine.supports_angle_cutting ? 'Yes' : 'No' }}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <!-- Additional Features -->
          <div v-if="machine.features && machine.features.length > 0" class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-semibold mb-4">Features</h2>
            <ul class="space-y-2">
              <li v-for="(feature, index) in machine.features" :key="index" class="flex items-start">
                <i class="i-Check-2 text-green-600 mr-2 mt-1"></i>
                <span class="text-gray-700">{{ feature }}</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Quick Info Card -->
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="font-semibold mb-4">Quick Info</h3>
            <div class="space-y-3 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Status</span>
                <span class="badge badge-green">Available</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Type</span>
                <span :class="['badge', machine.orientation === 'horizontal' ? 'badge-blue' : 'badge-purple']">
                  {{ machine.orientation }}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">NC Control</span>
                <span class="font-medium">{{ machine.has_nc_control ? 'Yes' : 'No' }}</span>
              </div>
            </div>
          </div>

          <!-- Cutting Capacity -->
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="font-semibold mb-4">Cutting Capacity</h3>
            <div class="space-y-4">
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-gray-600">Width</span>
                  <span class="font-medium">{{ machine.max_material_width }} mm</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: 100%"></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-gray-600">Height</span>
                  <span class="font-medium">{{ machine.max_material_height }} mm</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: 100%"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Documentation -->
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="font-semibold mb-4">Documentation</h3>
            <div class="space-y-2">
              <a 
                v-if="machine.manual_url" 
                :href="machine.manual_url" 
                target="_blank"
                class="doc-link"
              >
                <i class="i-File-Word text-blue-500 mr-2"></i>
                <span>User Manual</span>
              </a>
              <a 
                v-if="machine.spec_sheet_url" 
                :href="machine.spec_sheet_url" 
                target="_blank"
                class="doc-link"
              >
                <i class="i-File-Clipboard-Text--Image text-green-500 mr-2"></i>
                <span>Spec Sheet</span>
              </a>
              <div v-if="!machine.manual_url && !machine.spec_sheet_url" class="text-gray-500 text-sm">
                No documentation available
              </div>
            </div>
          </div>

          <!-- Contact Info -->
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="font-semibold mb-4">Need Help?</h3>
            <p class="text-sm text-gray-600 mb-4">
              Contact us for more information about this machine.
            </p>
            <button class="btn btn-secondary w-full">
              <i class="i-Envelope mr-2"></i>
              Contact Sales
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';

export default {
  name: 'MachineDetails',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const loading = ref(true);
    const machine = ref(null);

    const loadMachine = async () => {
      loading.value = true;
      try {
        const response = await axios.get(`/api/catalog/machines/${route.params.id}`);
        machine.value = response.data;
      } catch (error) {
        console.error('Failed to load machine:', error);
        machine.value = null;
      } finally {
        loading.value = false;
      }
    };

    const addToMyMachines = async () => {
      try {
        await axios.post('/api/machines', {
          machine_id: machine.value.id,
          custom_name: machine.value.model,
          location: 'Workshop'
        });
        alert(`${machine.value.model} added to your machines!`);
        router.push('/my-machines');
      } catch (error) {
        console.error('Failed to add machine:', error);
        alert('Failed to add machine. Please try again.');
      }
    };

    onMounted(() => {
      loadMachine();
    });

    return {
      loading,
      machine,
      addToMyMachines
    };
  }
};
</script>

<style scoped>
.machine-details-page {
  padding: 2rem;
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

.badge-green {
  background: #d1fae5;
  color: #065f46;
}

.spec-item {
  display: flex;
  flex-direction: column;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 6px;
}

.spec-label {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.25rem;
}

.spec-value {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
}

.progress-bar {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #007bff, #0056b3);
  transition: width 0.3s;
}

.doc-link {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  text-decoration: none;
  color: #374151;
  transition: all 0.2s;
}

.doc-link:hover {
  background: #f9fafb;
  border-color: #d1d5db;
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
