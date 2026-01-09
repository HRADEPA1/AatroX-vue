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

    <div class="table-controls mb-4">
      <input 
        v-model="searchQuery" 
        type="text" 
        placeholder="Search programs..."
        class="form-control search-input"
      />
      <div class="view-toggle">
        <button @click="viewMode = 'table'" :class="{ active: viewMode === 'table' }" class="btn-toggle">
          Table
        </button>
        <button @click="viewMode = 'grid'" :class="{ active: viewMode === 'grid' }" class="btn-toggle">
          Grid
        </button>
      </div>
    </div>

    <!-- Table View -->
    <div v-if="viewMode === 'table'" class="table-container">
      <table class="programs-table">
        <thead>
          <tr>
            <th @click="sortBy('name')" class="sortable">
              Name 
              <span class="sort-icon">{{ getSortIcon('name') }}</span>
            </th>
            <th @click="sortBy('machine')" class="sortable">
              Machine
              <span class="sort-icon">{{ getSortIcon('machine') }}</span>
            </th>
            <th @click="sortBy('total_cuts')" class="sortable">
              Total Cuts
              <span class="sort-icon">{{ getSortIcon('total_cuts') }}</span>
            </th>
            <th @click="sortBy('total_length')" class="sortable">
              Total Length (mm)
              <span class="sort-icon">{{ getSortIcon('total_length') }}</span>
            </th>
            <th @click="sortBy('segments_count')" class="sortable">
              Segments
              <span class="sort-icon">{{ getSortIcon('segments_count') }}</span>
            </th>
            <th @click="sortBy('estimation_time')" class="sortable">
              Est. Time (min)
              <span class="sort-icon">{{ getSortIcon('estimation_time') }}</span>
            </th>
            <th @click="sortBy('author')" class="sortable">
              Author
              <span class="sort-icon">{{ getSortIcon('author') }}</span>
            </th>
            <th @click="sortBy('times_used')" class="sortable">
              Uses
              <span class="sort-icon">{{ getSortIcon('times_used') }}</span>
            </th>
            <th>Actions</th>
          </tr>
          <tr class="filter-row">
            <th><input v-model="filters.name" type="text" placeholder="Filter..." class="filter-input" /></th>
            <th><input v-model="filters.machine" type="text" placeholder="Filter..." class="filter-input" /></th>
            <th><input v-model="filters.total_cuts" type="text" placeholder="Filter..." class="filter-input" /></th>
            <th><input v-model="filters.total_length" type="text" placeholder="Filter..." class="filter-input" /></th>
            <th><input v-model="filters.segments_count" type="text" placeholder="Filter..." class="filter-input" /></th>
            <th><input v-model="filters.estimation_time" type="text" placeholder="Filter..." class="filter-input" /></th>
            <th><input v-model="filters.author" type="text" placeholder="Filter..." class="filter-input" /></th>
            <th><input v-model="filters.times_used" type="text" placeholder="Filter..." class="filter-input" /></th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="program in sortedAndFilteredPrograms" 
            :key="program.id"
            @click="editProgram(program.id)"
            class="table-row"
          >
            <td><strong>{{ program.name }}</strong></td>
            <td>{{ program.machine || '-' }}</td>
            <td class="text-center">{{ program.total_cuts }}</td>
            <td class="text-right">{{ formatNumber(program.total_length) }}</td>
            <td class="text-center">{{ program.segments_count }}</td>
            <td class="text-right">{{ formatNumber(program.estimation_time) }}</td>
            <td>{{ program.author || '-' }}</td>
            <td class="text-center">
              <span class="badge">{{ program.times_used }}</span>
            </td>
            <td @click.stop class="action-cell">
              <button @click="exportProgram(program.id)" class="btn-icon" title="Export">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
              </button>
              <button @click="showQRModal(program.id)" class="btn-icon" title="QR Code">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                </svg>
              </button>
              <button @click="deleteProgram(program.id)" class="btn-icon btn-danger" title="Delete">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Grid View (Original) -->
    <div v-else class="programs-grid">
      <div 
        v-for="program in sortedAndFilteredPrograms" 
        :key="program.id"
        class="program-card"
        @click="editProgram(program.id)"
      >
        <div class="program-header">
          <h3>{{ program.name }}</h3>
          <span class="badge">{{ program.times_used }} uses</span>
        </div>
        <div class="program-details">
          <p v-if="program.machine"><strong>Machine:</strong> {{ program.machine }}</p>
          <p><strong>Cuts:</strong> {{ program.total_cuts }} | <strong>Segments:</strong> {{ program.segments_count }}</p>
          <p><strong>Length:</strong> {{ formatNumber(program.total_length) }} mm</p>
          <p><strong>Est. Time:</strong> {{ formatNumber(program.estimation_time) }} min</p>
          <p v-if="program.author"><strong>Author:</strong> {{ program.author }}</p>
        </div>
        <div class="program-actions" @click.stop>
          <button @click="exportProgram(program.id)" class="btn-icon" title="Export">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </button>
          <button @click="showQRModal(program.id)" class="btn-icon" title="QR Code">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
            </svg>
          </button>
          <button @click="deleteProgram(program.id)" class="btn-icon btn-danger" title="Delete">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
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

    <!-- QR Code Modal -->
    <div v-if="showQRCodeModal" class="modal" @click="closeQRModal">
      <div class="modal-content qr-modal" @click.stop>
        <div class="modal-header">
          <h2>Program QR Code</h2>
          <button @click="closeQRModal" class="btn-close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="qr-content">
          <img v-if="qrCodeUrl" :src="qrCodeUrl" alt="QR Code" class="qr-image" />
          <div v-else class="qr-loading">
            <div class="spinner"></div>
            <p>Generating QR Code...</p>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="downloadQRCode" class="btn btn-primary">Download</button>
          <button @click="closeQRModal" class="btn btn-secondary">Close</button>
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
    const programsWithDetails = ref([]);
    const machines = ref([]);
    const searchQuery = ref('');
    const showImportModal = ref(false);
    const showQRCodeModal = ref(false);
    const qrCodeUrl = ref(null);
    const currentQRProgramId = ref(null);
    const selectedFile = ref(null);
    const viewMode = ref('table'); // 'table' or 'grid'
    const sortColumn = ref('name');
    const sortDirection = ref('asc');
    const filters = ref({
      name: '',
      machine: '',
      total_cuts: '',
      total_length: '',
      segments_count: '',
      estimation_time: '',
      author: '',
      times_used: ''
    });

    const calculateProgramSummary = (program) => {
      const segments = program.segments || [];
      let total_cuts = 0;
      let total_length = 0;
      
      segments.forEach(seg => {
        total_cuts += seg.piece_count || 0;
        // Calculate total length based on segment type
        if (seg.segment_type === 'symmetric') {
          total_length += (seg.length_l1 || 0) * (seg.piece_count || 0);
        } else {
          // For asymmetric, sum all lengths
          const segLength = (seg.length_l1 || 0) + (seg.length_l2 || 0) + 
                          (seg.length_l3 || 0) + (seg.length_l4 || 0);
          total_length += segLength * (seg.piece_count || 0);
        }
      });

      // Estimate cutting time (simple formula: length / feed rate + setup time per cut)
      const cutting_feed = program.cutting_feed || 20; // mm/s
      const setup_time_per_cut = 10; // seconds per cut
      const cutting_time = (total_length / cutting_feed) + (total_cuts * setup_time_per_cut);
      const estimation_time = cutting_time / 60; // convert to minutes

      // Get machine model from machines list
      let machineDisplay = '-';
      if (program.user_machine_id && machines.value.length > 0) {
        const machine = machines.value.find(m => m.id === program.user_machine_id);
        if (machine) {
          machineDisplay = machine.machine_name || machine.machine?.model || `Machine ${program.user_machine_id}`;
        }
      }

      return {
        ...program,
        machine: machineDisplay,
        total_cuts,
        total_length,
        segments_count: segments.length,
        estimation_time
      };
    };

    const loadMachines = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/machines`);
        machines.value = response.data;
      } catch (error) {
        console.error('Error loading machines:', error);
      }
    };

    const loadPrograms = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/programs`);
        programs.value = response.data;
        
        // Load details for each program to get segments
        const detailedPrograms = await Promise.all(
          programs.value.map(async (program) => {
            try {
              const detailResponse = await axios.get(`${API_BASE_URL}/api/programs/${program.id}`);
              return calculateProgramSummary(detailResponse.data);
            } catch (error) {
              console.error(`Error loading details for program ${program.id}:`, error);
              return calculateProgramSummary(program);
            }
          })
        );
        
        programsWithDetails.value = detailedPrograms;
      } catch (error) {
        console.error('Error loading programs:', error);
      }
    };

    const sortedAndFilteredPrograms = computed(() => {
      let result = programsWithDetails.value;

      // Apply search query
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        result = result.filter(p => 
          p.name.toLowerCase().includes(query) ||
          (p.author && p.author.toLowerCase().includes(query)) ||
          (p.machine && p.machine.toLowerCase().includes(query))
        );
      }

      // Apply column filters
      Object.keys(filters.value).forEach(key => {
        const filterValue = filters.value[key];
        if (filterValue) {
          const query = filterValue.toLowerCase();
          result = result.filter(p => {
            const value = p[key];
            if (value === null || value === undefined) return false;
            return String(value).toLowerCase().includes(query);
          });
        }
      });

      // Apply sorting
      result.sort((a, b) => {
        let aVal = a[sortColumn.value];
        let bVal = b[sortColumn.value];
        
        // Handle null/undefined
        if (aVal === null || aVal === undefined) aVal = '';
        if (bVal === null || bVal === undefined) bVal = '';
        
        // Convert to comparable values
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
        
        if (aVal < bVal) return sortDirection.value === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection.value === 'asc' ? 1 : -1;
        return 0;
      });

      return result;
    });

    const sortBy = (column) => {
      if (sortColumn.value === column) {
        sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
      } else {
        sortColumn.value = column;
        sortDirection.value = 'asc';
      }
    };

    const getSortIcon = (column) => {
      if (sortColumn.value !== column) return '⇅';
      return sortDirection.value === 'asc' ? '↑' : '↓';
    };

    const formatNumber = (value) => {
      if (value === null || value === undefined) return '-';
      return Number(value).toFixed(2);
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

    const showQRModal = async (id) => {
      showQRCodeModal.value = true;
      currentQRProgramId.value = id;
      qrCodeUrl.value = null;
      
      try {
        const response = await axios.get(`${API_BASE_URL}/api/programs/${id}/qr`, {
          responseType: 'blob'
        });
        qrCodeUrl.value = window.URL.createObjectURL(new Blob([response.data]));
      } catch (error) {
        console.error('Error generating QR code:', error);
        alert('Failed to generate QR code');
        showQRCodeModal.value = false;
      }
    };

    const closeQRModal = () => {
      showQRCodeModal.value = false;
      if (qrCodeUrl.value) {
        window.URL.revokeObjectURL(qrCodeUrl.value);
        qrCodeUrl.value = null;
      }
      currentQRProgramId.value = null;
    };

    const downloadQRCode = () => {
      if (qrCodeUrl.value && currentQRProgramId.value) {
        const link = document.createElement('a');
        link.href = qrCodeUrl.value;
        link.setAttribute('download', `program_${currentQRProgramId.value}_qr.png`);
        document.body.appendChild(link);
        link.click();
        link.remove();
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

    onMounted(async () => {
      await loadMachines();
      await loadPrograms();
    });

    return {
      programs,
      programsWithDetails,
      sortedAndFilteredPrograms,
      searchQuery,
      showImportModal,
      showQRCodeModal,
      qrCodeUrl,
      viewMode,
      sortColumn,
      sortDirection,
      filters,
      createProgram,
      editProgram,
      exportProgram,
      showQRModal,
      closeQRModal,
      downloadQRCode,
      deleteProgram,
      importProgram,
      handleFileUpload,
      uploadFile,
      formatDate,
      sortBy,
      getSortIcon,
      formatNumber,
      loadPrograms
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

.table-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.search-input {
  flex: 1;
  max-width: 400px;
}

.view-toggle {
  display: flex;
  gap: 0;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.btn-toggle {
  padding: 0.5rem 1rem;
  border: none;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  border-right: 1px solid #ddd;
}

.btn-toggle:last-child {
  border-right: none;
}

.btn-toggle:hover {
  background: #f5f5f5;
}

.btn-toggle.active {
  background: #007bff;
  color: white;
}

.table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow-x: auto;
}

.programs-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1000px;
}

.programs-table thead {
  background: #f8f9fa;
  border-bottom: 2px solid #dee2e6;
}

.programs-table th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #495057;
  white-space: nowrap;
}

.programs-table th.sortable {
  cursor: pointer;
  user-select: none;
}

.programs-table th.sortable:hover {
  background: #e9ecef;
}

.sort-icon {
  display: inline-block;
  margin-left: 0.5rem;
  color: #6c757d;
  font-size: 0.875rem;
}

.filter-row th {
  padding: 0.5rem;
  background: white;
}

.filter-input {
  width: 100%;
  padding: 0.375rem 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.875rem;
}

.filter-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0,123,255,0.25);
}

.programs-table tbody tr {
  border-bottom: 1px solid #dee2e6;
  transition: background 0.2s;
}

.programs-table tbody tr:hover {
  background: #f8f9fa;
  cursor: pointer;
}

.programs-table td {
  padding: 1rem;
  color: #212529;
}

.text-center {
  text-align: center;
}

.text-right {
  text-align: right;
}

.action-cell {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
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
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.btn-icon:hover {
  color: #007bff;
  background: #f0f0f0;
}

.btn-icon.btn-danger:hover {
  color: #dc3545;
  background: #fee;
}

.btn-icon svg {
  display: block;
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
  max-width: 90vw;
  max-height: 90vh;
  overflow: auto;
}

.qr-modal {
  min-width: 500px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.modal-header h2 {
  margin: 0;
}

.btn-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-close:hover {
  background: #f0f0f0;
  color: #333;
}

.qr-content {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  background: #f8f9fa;
  border-radius: 8px;
  min-height: 300px;
}

.qr-image {
  max-width: 100%;
  height: auto;
  border: 4px solid white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  background: white;
}

.qr-loading {
  text-align: center;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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
