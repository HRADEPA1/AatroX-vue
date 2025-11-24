<template>
  <div class="programs-list">
    <div class="page-header">
      <h1 class="text-3xl font-bold">Cutting Programs</h1>
      <div class="actions">
        <button @click="importProgram" class="btn btn-secondary">
          <i class="icon-upload"></i> Import CSV
        </button>
        <button @click="createProgram" class="btn btn-primary">
          <i class="icon-plus"></i> New Program
        </button>
      </div>
    </div>

    <div class="search-filter mb-4">
      <input 
        v-model="searchQuery" 
        type="text" 
        placeholder="Search programs..."
        class="form-control"
      />
    </div>

    <div class="programs-grid">
      <div 
        v-for="program in filteredPrograms" 
        :key="program.id"
        class="program-card"
        @click="editProgram(program.id)"
      >
        <div class="program-header">
          <h3>{{ program.name }}</h3>
          <span class="badge">{{ program.times_used }} uses</span>
        </div>
        <div class="program-details">
          <p v-if="program.author"><strong>Author:</strong> {{ program.author }}</p>
          <p v-if="program.material_type"><strong>Material:</strong> {{ program.material_type }}</p>
          <p><strong>Updated:</strong> {{ formatDate(program.updated_at) }}</p>
        </div>
        <div class="program-actions" @click.stop>
          <button @click="exportProgram(program.id)" class="btn-icon" title="Export">
            <i class="icon-download"></i>
          </button>
          <button @click="generateQR(program.id)" class="btn-icon" title="QR Code">
            <i class="icon-qrcode"></i>
          </button>
          <button @click="deleteProgram(program.id)" class="btn-icon btn-danger" title="Delete">
            <i class="icon-trash"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Import Modal -->
    <div v-if="showImportModal" class="modal">
      <div class="modal-content">
        <h2>Import Program from CSV</h2>
        <input type="file" @change="handleFileUpload" accept=".csv" />
        <div class="modal-actions">
          <button @click="showImportModal = false" class="btn btn-secondary">Cancel</button>
          <button @click="uploadFile" class="btn btn-primary">Import</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export default {
  name: 'Programs',
  setup() {
    const router = useRouter();
    const programs = ref([]);
    const searchQuery = ref('');
    const showImportModal = ref(false);
    const selectedFile = ref(null);

    const filteredPrograms = computed(() => {
      if (!searchQuery.value) return programs.value;
      const query = searchQuery.value.toLowerCase();
      return programs.value.filter(p => 
        p.name.toLowerCase().includes(query) ||
        (p.author && p.author.toLowerCase().includes(query)) ||
        (p.material_type && p.material_type.toLowerCase().includes(query))
      );
    });

    const loadPrograms = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/programs`);
        programs.value = response.data;
      } catch (error) {
        console.error('Error loading programs:', error);
      }
    };

    const createProgram = () => {
      router.push('/programs/new');
    };

    const editProgram = (id) => {
      router.push(`/programs/${id}`);
    };

    const exportProgram = async (id) => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/programs/${id}/export`, {
          responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `program_${id}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } catch (error) {
        console.error('Error exporting program:', error);
      }
    };

    const generateQR = async (id) => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/programs/${id}/qr`, {
          responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        window.open(url, '_blank');
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };

    const deleteProgram = async (id) => {
      if (!confirm('Are you sure you want to delete this program?')) return;
      
      try {
        await axios.delete(`${API_BASE_URL}/api/programs/${id}`);
        programs.value = programs.value.filter(p => p.id !== id);
      } catch (error) {
        console.error('Error deleting program:', error);
      }
    };

    const importProgram = () => {
      showImportModal.value = true;
    };

    const handleFileUpload = (event) => {
      selectedFile.value = event.target.files[0];
    };

    const uploadFile = async () => {
      if (!selectedFile.value) return;

      const formData = new FormData();
      formData.append('file', selectedFile.value);

      try {
        await axios.post(`${API_BASE_URL}/api/programs/import`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showImportModal.value = false;
        loadPrograms();
      } catch (error) {
        console.error('Error importing program:', error);
      }
    };

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString();
    };

    onMounted(() => {
      loadPrograms();
    });

    return {
      programs,
      filteredPrograms,
      searchQuery,
      showImportModal,
      createProgram,
      editProgram,
      exportProgram,
      generateQR,
      deleteProgram,
      importProgram,
      handleFileUpload,
      uploadFile,
      formatDate
    };
  }
};
</script>

<style scoped>
.programs-list {
  padding: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.actions {
  display: flex;
  gap: 1rem;
}

.programs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.program-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.program-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.program-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.program-header h3 {
  font-size: 1.25rem;
  margin: 0;
}

.badge {
  background: #e0e0e0;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
}

.program-details p {
  margin: 0.5rem 0;
  font-size: 0.875rem;
  color: #666;
}

.program-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  color: #666;
  transition: color 0.2s;
}

.btn-icon:hover {
  color: #333;
}

.btn-icon.btn-danger:hover {
  color: #dc3545;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  min-width: 400px;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
  justify-content: flex-end;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.2s;
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

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}
</style>
