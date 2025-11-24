<template>
  <div class="program-editor-page">
    <div v-if="loading" class="text-center py-12">
      <div class="spinner"></div>
      <p class="mt-4 text-gray-600">Loading program...</p>
    </div>

    <div v-else>
      <!-- Header -->
      <div class="page-header mb-6">
        <button @click="$router.push('/programs')" class="text-blue-600 hover:text-blue-800 mb-2 flex items-center">
          <i class="i-Arrow-Left mr-2"></i>
          Back to Programs
        </button>
        <div class="flex items-start justify-between">
          <div>
            <h1 class="text-3xl font-bold">{{ isEditMode ? 'Edit Program' : 'New Cutting Program' }}</h1>
            <p class="text-gray-600 mt-2">{{ isEditMode ? program.name : 'Create a new cutting program' }}</p>
          </div>
          <div class="flex gap-2">
            <button @click="editorMode = 'table'" :class="['btn', editorMode === 'table' ? 'btn-primary' : 'btn-secondary']">
              <i class="i-File-Clipboard-File--Text mr-2"></i>
              Table Mode
            </button>
            <button @click="editorMode = 'graphical'" :class="['btn', editorMode === 'graphical' ? 'btn-primary' : 'btn-secondary']">
              <i class="i-Pen-4 mr-2"></i>
              Graphical Mode
            </button>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <!-- Main Editor -->
        <div class="lg:col-span-3 space-y-6">
          <!-- B1: Program Metadata (Name, Author, Comments) -->
          <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-semibold mb-4">
              <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm mr-2">B1</span>
              Program Information
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="form-label">Program Name *</label>
                <input v-model="form.name" type="text" maxlength="20" class="form-input w-full" required placeholder="e.g., Test 01" />
                <p class="text-xs text-gray-500 mt-1">Max 20 characters, no special chars: &lt;&gt;:/|\?*.,();</p>
              </div>
              <div>
                <label class="form-label">Author</label>
                <input v-model="form.author" type="text" maxlength="20" class="form-input w-full" placeholder="Your name" />
                <p class="text-xs text-gray-500 mt-1">Max 20 characters</p>
              </div>
              <div>
                <label class="form-label">Machine</label>
                <select v-model="form.machine_id" class="form-input w-full">
                  <option :value="null">Select machine...</option>
                  <option v-for="machine in machines" :key="machine.id" :value="machine.id">
                    {{ machine.machine_name || machine.machine?.model || 'Unknown Machine' }}
                  </option>
                </select>
              </div>
              <div class="md:col-span-2">
                <label class="form-label">Comments (up to 3 lines, 20 chars each)</label>
                <textarea v-model="form.comments" class="form-input w-full" rows="3" maxlength="60" placeholder="Optional notes about this program"></textarea>
              </div>
            </div>
          </div>

          <!-- C1: Unit System -->
          <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-semibold mb-4">
              <span class="bg-green-100 text-green-800 px-2 py-1 rounded text-sm mr-2">C1</span>
              Unit System
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="form-label">Select Units *</label>
                <select v-model="form.unit_system" class="form-input w-full" required>
                  <option value="metric">Metric (mm, m/min)</option>
                  <option value="imperial">Imperial (inches, ft/min)</option>
                </select>
              </div>
            </div>
          </div>

          <!-- PAR: Operating Parameters (Band Speed & Cutting Feed) -->
          <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-semibold mb-4">
              <span class="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm mr-2">PAR</span>
              Operating Parameters
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="form-label">Band Speed ({{ form.unit_system === 'metric' ? 'm/min' : 'ft/min' }}) *</label>
                <input v-model.number="form.band_speed" type="number" step="0.1" class="form-input w-full" required />
                <p class="text-xs text-gray-500 mt-1">Range: {{ speedRange }}</p>
              </div>
              <div>
                <label class="form-label">Cutting Feed ({{ form.unit_system === 'metric' ? 'mm/min' : 'in/min' }}) *</label>
                <input v-model.number="form.cutting_feed" type="number" step="0.1" class="form-input w-full" required />
                <p class="text-xs text-gray-500 mt-1">Range: {{ feedRange }}</p>
              </div>
              
              <!-- Band Function at End of Cut -->
              <div>
                <label class="form-label">Band Function at End of Cut</label>
                <select v-model="form.band_function_end" class="form-input w-full">
                  <option :value="false">Band Stops</option>
                  <option :value="true">Band Continues Moving</option>
                </select>
                <p class="text-xs text-gray-500 mt-1">What happens to the blade at cut completion</p>
              </div>
              
              <!-- Frame Function at End of Cut -->
              <div>
                <label class="form-label">Frame Function at End of Cut</label>
                <select v-model.number="form.frame_function_end" class="form-input w-full" @change="onFrameFunctionChange">
                  <option :value="0">Frame Stays at End Position</option>
                  <option :value="1">Frame Moves to Upper Position</option>
                  <option :value="2">Wait Time (seconds)</option>
                </select>
                <p class="text-xs text-gray-500 mt-1">Frame behavior after cut completion</p>
              </div>
              
              <!-- Frame Wait Time (only if frame_function_end = 2) -->
              <div v-if="form.frame_function_end === 2">
                <label class="form-label">Frame Wait Time (seconds)</label>
                <input v-model.number="form.frame_wait_time" type="number" step="1" min="2" max="60" class="form-input w-full" />
                <p class="text-xs text-gray-500 mt-1">Time frame waits before moving (2-60 sec)</p>
              </div>
              
              <!-- Upper Frame Position Mode -->
              <div>
                <label class="form-label">Upper Frame Position Mode</label>
                <select v-model.number="form.upper_frame_mode" class="form-input w-full" @change="onUpperFrameModeChange">
                  <option :value="1">Stop at Software Position</option>
                </select>
                <p class="text-xs text-gray-500 mt-1">How upper frame position is determined</p>
              </div>
              
              <!-- Upper Working Position -->
              <div>
                <label class="form-label">Upper Working Position ({{ form.unit_system === 'metric' ? 'mm' : 'in' }})</label>
                <input v-model.number="form.upper_working_position" type="number" step="0.1" :min="form.unit_system === 'metric' ? '-150' : '-5.906'" :max="form.unit_system === 'metric' ? '750' : '29.528'" class="form-input w-full" :readonly="form.upper_frame_mode !== 1" :class="{ 'bg-gray-100': form.upper_frame_mode !== 1 }" />
                <p class="text-xs text-gray-500 mt-1">Upper position: {{ form.unit_system === 'metric' ? '-150 to 750 mm' : '-5.906 to 29.528 in' }}</p>
              </div>
              
              <!-- Lower Frame Position Mode -->
              <div>
                <label class="form-label">Lower Frame Position Mode</label>
                <select v-model="form.lower_frame_mode" class="form-input w-full" @change="onLowerFrameModeChange">
                  <option value="switch">Stop at Switch</option>
                  <option value="software">Stop at Software Position</option>
                </select>
                <p class="text-xs text-gray-500 mt-1">How lower frame position is determined</p>
              </div>
              
              <!-- Lower Working Position -->
              <div>
                <label class="form-label">Lower Working Position ({{ form.unit_system === 'metric' ? 'mm' : 'in' }})</label>
                <input v-model.number="form.lower_working_position" type="number" step="0.1" :min="form.unit_system === 'metric' ? '-150' : '-5.906'" :max="form.unit_system === 'metric' ? '749' : '29.488'" class="form-input w-full" :readonly="form.lower_frame_mode !== 'software'" :class="{ 'bg-gray-100': form.lower_frame_mode !== 'software' }" />
                <p class="text-xs text-gray-500 mt-1">Lower position: {{ form.unit_system === 'metric' ? '-150 to 749 mm' : '-5.906 to 29.488 in' }}</p>
              </div>
            </div>
          </div>

          <!-- C3: Kerf Width, Feeder Speed Limit, CMU, STEP -->
          <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-semibold mb-4">
              <span class="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm mr-2">C3</span>
              Additional Settings
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="form-label">Kerf Width ({{ form.unit_system === 'metric' ? 'mm' : 'in' }})</label>
                <input v-model.number="form.kerf_width" type="number" step="0.01" class="form-input w-full" />
                <p class="text-xs text-gray-500 mt-1">Blade thickness. Range: 0-{{ form.unit_system === 'metric' ? '10 mm' : '0.394 in' }}</p>
              </div>
              <div>
                <label class="form-label">Feeder Speed Limit (%)</label>
                <select v-model.number="form.feeder_speed_limit" class="form-input w-full">
                  <option :value="0">0% (Disabled)</option>
                  <option :value="25">25%</option>
                  <option :value="50">50%</option>
                  <option :value="75">75%</option>
                  <option :value="100">100%</option>
                </select>
                <p class="text-xs text-gray-500 mt-1">Max allowed feed percentage</p>
              </div>
              <div>
                <label class="flex items-center space-x-2 cursor-pointer">
                  <input v-model="form.cmu" type="checkbox" class="form-checkbox" />
                  <span class="form-label mb-0">CMU (Coolant/Chip Unit)</span>
                </label>
                <p class="text-xs text-gray-500 mt-1">Enable cooling/chip conveyor system</p>
              </div>
              <div>
                <label class="flex items-center space-x-2 cursor-pointer">
                  <input v-model="form.step_cut" type="checkbox" class="form-checkbox" />
                  <span class="form-label mb-0">STEP (Stepped Cutting)</span>
                </label>
                <p class="text-xs text-gray-500 mt-1">Enable incremental/step cutting mode</p>
              </div>
            </div>
            <div class="mt-4 p-4 bg-blue-50 rounded-lg">
              <p class="text-sm text-blue-800 mb-2">
                <i class="i-Information mr-1"></i>
                <strong>RZP (Automatic Feeder Speed):</strong> Can be enabled/disabled here via Feeder Speed Limit
              </p>
              <p class="text-sm text-gray-600 mb-1">
                <i class="i-Information mr-1"></i>
                <strong>KKR (Automatic Band Tension):</strong> Set on machine HMI
              </p>
              <p class="text-sm text-gray-600">
                <i class="i-Information mr-1"></i>
                <strong>ARP (Automatic Band Speed):</strong> Set on machine HMI
              </p>
            </div>
          </div>

          <!-- C2: Cutting Segments (Table Mode) -->
          <div v-if="editorMode === 'table'" class="bg-white rounded-lg shadow p-6">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-xl font-semibold">
                <span class="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm mr-2">C2</span>
                Cutting Segments - Lengths and Angles
              </h2>
              <div class="flex gap-2">
                <button @click="addSegment('symmetric')" class="btn btn-primary btn-sm">
                  <i class="i-Add mr-1"></i>
                  Add Symmetric
                </button>
                <button @click="addSegment('asymmetric')" class="btn btn-secondary btn-sm">
                  <i class="i-Add mr-1"></i>
                  Add Asymmetric
                </button>
              </div>
            </div>

            <div class="space-y-4">
              <div v-for="(segment, index) in form.segments" :key="index" class="border rounded-lg p-4 hover:bg-gray-50">
                <div class="flex justify-between items-center mb-3">
                  <h3 class="font-semibold text-lg">Segment {{ index + 1 }}</h3>
                  <div class="flex gap-2 items-center">
                    <span :class="['badge', segment.type === 'symmetric' ? 'badge-blue' : 'badge-purple']">
                      {{ segment.type === 'symmetric' ? 'Symmetric' : 'Asymmetric' }}
                    </span>
                    <button @click="removeSegment(index)" class="btn-icon text-red-600" title="Remove">
                      <i class="i-Remove"></i>
                    </button>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <!-- Material Type Toggle -->
                  <div class="md:col-span-3">
                    <label class="form-label">Material Type</label>
                    <div class="flex gap-4">
                      <label class="flex items-center space-x-2 cursor-pointer">
                        <input type="radio" :name="'type-' + index" value="symmetric" v-model="segment.type" @change="onTypeChange(index)" class="form-radio" />
                        <span>Symmetric (A1 = A2, L1 = L2)</span>
                      </label>
                      <label class="flex items-center space-x-2 cursor-pointer">
                        <input type="radio" :name="'type-' + index" value="asymmetric" v-model="segment.type" class="form-radio" />
                        <span>Asymmetric (A1 ≠ A2, L1 ≠ L2)</span>
                      </label>
                    </div>
                  </div>

                  <!-- Material Width -->
                  <div>
                    <label class="form-label">Material Width ({{ form.unit_system === 'metric' ? 'mm' : 'in' }})</label>
                    <input v-model.number="segment.material_width" type="number" step="0.1" min="0" class="form-input w-full" placeholder="0" />
                    <p class="text-xs text-gray-500 mt-1">Stock thickness perpendicular to blade</p>
                  </div>

                  <!-- Piece Count -->
                  <div>
                    <label class="form-label">Piece Count</label>
                    <input v-model.number="segment.piece_count" type="number" step="1" min="1" max="9999" class="form-input w-full" placeholder="1" />
                    <p class="text-xs text-gray-500 mt-1">Number of pieces to cut (1-9999)</p>
                  </div>

                  <!-- Angles -->
                  <div>
                    <label class="form-label">Angle A1 (°)</label>
                    <input v-model.number="segment.angle_a1" type="number" step="0.1" min="30" max="150" class="form-input w-full" @input="onAngleA1Change(index)" placeholder="90" />
                    <p class="text-xs text-gray-500 mt-1">Entry angle: 30-150°</p>
                  </div>

                  <div>
                    <label class="form-label">Angle A2 (°)</label>
                    <input v-model.number="segment.angle_a2" type="number" step="0.1" min="30" max="150" class="form-input w-full" :readonly="segment.type === 'symmetric'" :class="{ 'bg-gray-100': segment.type === 'symmetric' }" placeholder="90" />
                    <p class="text-xs text-gray-500 mt-1">Exit angle: 30-150° {{ segment.type === 'symmetric' ? '(auto)' : '' }}</p>
                  </div>

                  <!-- Lengths -->
                  <div>
                    <label class="form-label">Length L1 ({{ form.unit_system === 'metric' ? 'mm' : 'in' }})</label>
                    <input v-model.number="segment.length_l1" type="number" step="0.1" min="0" max="20000" class="form-input w-full" @input="onLengthL1Change(index)" placeholder="0" />
                    <p class="text-xs text-gray-500 mt-1">Side 1 length: 0-{{ form.unit_system === 'metric' ? '20000 mm' : '787.4 in' }}</p>
                  </div>

                  <div>
                    <label class="form-label">Length L2 ({{ form.unit_system === 'metric' ? 'mm' : 'in' }})</label>
                    <input v-model.number="segment.length_l2" type="number" step="0.1" min="0" max="20000" class="form-input w-full" :readonly="segment.type === 'symmetric'" :class="{ 'bg-gray-100': segment.type === 'symmetric' }" placeholder="0" />
                    <p class="text-xs text-gray-500 mt-1">Side 2 length {{ segment.type === 'symmetric' ? '(auto)' : '' }}</p>
                  </div>

                  <div class="flex items-end">
                    <button @click="calculateSegment(index)" class="btn btn-secondary w-full">
                      <i class="i-Calculator mr-2"></i>
                      Calculate
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="form.segments.length === 0" class="text-center py-12 text-gray-500">
              <i class="i-File-Clipboard-File--Text text-5xl mb-4"></i>
              <p>No segments added yet</p>
              <p class="text-sm mt-2">Add a symmetric segment (A1 = A2) or asymmetric segment (A1 ≠ A2)</p>
              <div class="flex justify-center gap-2 mt-4">
                <button @click="addSegment('symmetric')" class="btn btn-primary">
                  Add Symmetric Segment
                </button>
                <button @click="addSegment('asymmetric')" class="btn btn-secondary">
                  Add Asymmetric Segment
                </button>
              </div>
            </div>
          </div>

          <!-- Graphical Mode Editor -->
          <div v-if="editorMode === 'graphical'" class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-semibold mb-4">Graphical Editor</h2>
            <div class="graphical-canvas bg-gray-100 rounded-lg" style="height: 500px; position: relative;">
              <canvas ref="canvas" class="w-full h-full"></canvas>
              <div class="absolute top-4 left-4 bg-white p-4 rounded shadow">
                <h3 class="font-semibold mb-2">Drawing Tools</h3>
                <div class="space-y-2">
                  <button class="tool-btn">
                    <i class="i-Line mr-2"></i>Straight Cut
                  </button>
                  <button class="tool-btn">
                    <i class="i-Angle mr-2"></i>Angle Cut
                  </button>
                  <button class="tool-btn">
                    <i class="i-Triangle mr-2"></i>Miter Cut
                  </button>
                </div>
              </div>
              <div class="absolute bottom-4 right-4 text-sm text-gray-600 bg-white p-2 rounded">
                {{ form.segments.length }} segments
              </div>
            </div>
            <p class="text-sm text-gray-600 mt-4">
              <i class="i-Information mr-1"></i>
              Graphical mode is coming soon. Use table mode for now.
            </p>
          </div>

          <!-- Actions -->
          <div class="flex gap-3">
            <button @click="saveProgram" class="btn btn-primary">
              <i class="i-Save mr-2"></i>
              {{ isEditMode ? 'Update Program' : 'Create Program' }}
            </button>
            <button @click="validateProgram" class="btn btn-secondary">
              <i class="i-Check-2 mr-2"></i>
              Validate
            </button>
            <button v-if="isEditMode" @click="deleteProgram" class="btn btn-danger ml-auto">
              <i class="i-Remove mr-2"></i>
              Delete Program
            </button>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Quick Info -->
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="font-semibold mb-4">Program Summary</h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Segments</span>
                <span class="font-medium">{{ form.segments.length }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Total Length</span>
                <span class="font-medium">{{ totalLength.toFixed(2) }} {{ form.unit_system === 'metric' ? 'mm' : 'in' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Est. Time</span>
                <span class="font-medium">{{ estimatedTime }}</span>
              </div>
            </div>
          </div>

          <!-- Validation -->
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="font-semibold mb-4">Validation</h3>
            <div v-if="validationErrors.length === 0" class="text-sm text-green-600">
              <i class="i-Check-2 mr-1"></i>
              No errors found
            </div>
            <div v-else class="space-y-2">
              <div v-for="(error, index) in validationErrors" :key="index" class="text-sm text-red-600">
                <i class="i-Close mr-1"></i>
                {{ error }}
              </div>
            </div>
          </div>

          <!-- Help -->
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="font-semibold mb-4">Help</h3>
            <div class="space-y-3 text-sm text-gray-600">
              <div>
                <strong>Angle Range:</strong> 30° - 150°
              </div>
              <div>
                <strong>Max Length:</strong> 20,000 mm
              </div>
              <div>
                <strong>Calculate:</strong> Enter 2-3 values, click calculate button
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export default {
  name: 'ProgramEditor',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const loading = ref(false);
    const editorMode = ref('table');
    const machines = ref([]);
    const canvas = ref(null);

    const isEditMode = computed(() => route.name === 'EditProgram');

    const form = reactive({
      name: '',
      author: '',
      comments: '',
      unit_system: 'metric',
      machine_id: null,
      band_speed: 50,
      cutting_feed: 50,
      kerf_width: 0,
      feeder_speed_limit: 75,
      cmu: false,
      step_cut: false,
      band_function_end: false,
      frame_function_end: 0,
      frame_wait_time: 2,
      upper_frame_mode: 1,
      upper_working_position: 300,
      lower_frame_mode: 'switch',
      lower_working_position: 0,
      segments: []
    });

    const program = ref({});
    const validationErrors = ref([]);

    const speedRange = computed(() => {
      return form.unit_system === 'metric' ? '15-300 m/min' : '49.2-984.3 ft/min';
    });

    const feedRange = computed(() => {
      return form.unit_system === 'metric' ? '0-150 mm/min' : '0-5.9 in/min';
    });

    const totalLength = computed(() => {
      return form.segments.reduce((sum, seg) => sum + (seg.length_l1 || 0) + (seg.length_l2 || 0), 0);
    });

    const estimatedTime = computed(() => {
      if (form.cutting_feed === 0) return 'N/A';
      const minutes = totalLength.value / form.cutting_feed;
      return `${Math.floor(minutes)}:${String(Math.floor((minutes % 1) * 60)).padStart(2, '0')}`;
    });

    const loadMachines = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/machines`);
        machines.value = response.data;
      } catch (error) {
        console.error('Failed to load machines:', error);
      }
    };

    const loadProgram = async () => {
      if (!isEditMode.value) return;
      
      loading.value = true;
      try {
        const response = await axios.get(`${API_BASE_URL}/api/programs/${route.params.id}`);
        program.value = response.data;
        
        // Map API response to form
        form.name = response.data.name || '';
        form.author = response.data.author || '';
        form.comments = [
          response.data.comment_1,
          response.data.comment_2,
          response.data.comment_3
        ].filter(c => c).join('\n');
        form.unit_system = response.data.unit_system || 'metric';
        form.machine_id = response.data.user_machine_id;
        form.band_speed = response.data.band_speed || 50;
        form.cutting_feed = response.data.cutting_feed || 50;
        form.kerf_width = response.data.kerf_width || 0;
        form.feeder_speed_limit = response.data.feeder_speed_limit || 75;
        form.cmu = response.data.coolant_enabled || false;
        form.step_cut = response.data.step_cut_enabled || false;
        form.band_function_end = response.data.band_function_end || false;
        form.frame_function_end = response.data.frame_function_end || 0;
        form.frame_wait_time = response.data.frame_wait_time || 2;
        form.upper_frame_mode = response.data.upper_frame_mode || 1;
        form.upper_working_position = response.data.upper_working_position || (form.unit_system === 'metric' ? 300 : 11.811);
        form.lower_frame_mode = response.data.lower_frame_mode ? 'software' : 'switch';
        form.lower_working_position = response.data.lower_working_position || 0;
        
        // Map segments with proper field names
        form.segments = (response.data.segments || []).map(seg => ({
          type: seg.segment_type || 'symmetric',  // API uses segment_type, frontend uses type
          material_width: seg.material_width || 0,
          angle_a1: seg.angle_a1 || 90,
          angle_a2: seg.angle_a2 || 90,
          piece_count: seg.piece_count || 1,
          length_l1: seg.length_l1 || 0,
          length_l2: seg.length_l2 || 0,
          order_index: seg.sequence || 0
        }));
      } catch (error) {
        console.error('Failed to load program:', error);
        alert('Failed to load program');
        router.push('/programs');
      } finally {
        loading.value = false;
      }
    };

    const addSegment = (type = 'symmetric') => {
      form.segments.push({
        type: type,
        material_width: 0,
        angle_a1: 90,
        angle_a2: 90,
        piece_count: 1,
        length_l1: 0,
        length_l2: 0,
        order_index: form.segments.length
      });
    };

    const removeSegment = (index) => {
      form.segments.splice(index, 1);
      // Update order indices
      form.segments.forEach((seg, idx) => {
        seg.order_index = idx;
      });
    };

    const onTypeChange = (index) => {
      const segment = form.segments[index];
      if (segment.type === 'symmetric') {
        segment.angle_a2 = segment.angle_a1;
        segment.length_l2 = segment.length_l1;
      }
    };

    const onAngleA1Change = (index) => {
      const segment = form.segments[index];
      if (segment.type === 'symmetric') {
        segment.angle_a2 = segment.angle_a1;
      }
    };

    const onLengthL1Change = (index) => {
      const segment = form.segments[index];
      if (segment.type === 'symmetric') {
        segment.length_l2 = segment.length_l1;
      }
    };

    const onFrameFunctionChange = () => {
      // Reset wait time if not using time-based function
      if (form.frame_function_end !== 2) {
        form.frame_wait_time = 2;
      }
    };

    const onUpperFrameModeChange = () => {
      // Reset position if not using software position mode
      if (form.upper_frame_mode !== 1) {
        form.upper_working_position = form.unit_system === 'metric' ? 300 : 11.811;
      }
    };

    const onLowerFrameModeChange = () => {
      // Reset position if not using software position mode
      if (form.lower_frame_mode !== 'software') {
        form.lower_working_position = 0;
      }
    };

    const calculateSegment = async (index) => {
      const segment = form.segments[index];
      try {
        const response = await axios.post(`${API_BASE_URL}/api/programs/calculate`, {
          unit_system: form.unit_system,
          ...segment
        });
        Object.assign(segment, response.data);
      } catch (error) {
        console.error('Calculation failed:', error);
        alert('Calculation failed. Please check your values.');
      }
    };

    const validateProgram = () => {
      validationErrors.value = [];

      if (!form.name) {
        validationErrors.value.push('Program name is required');
      }

      if (form.segments.length === 0) {
        validationErrors.value.push('At least one segment is required');
      }

      form.segments.forEach((seg, idx) => {
        if (seg.angle < 30 || seg.angle > 150) {
          validationErrors.value.push(`Segment ${idx + 1}: Angle must be between 30° and 150°`);
        }
        if (seg.length && seg.length > 20000) {
          validationErrors.value.push(`Segment ${idx + 1}: Length exceeds maximum (20000mm)`);
        }
      });

      if (validationErrors.value.length === 0) {
        alert('Program validation passed!');
      }

      return validationErrors.value.length === 0;
    };

    const saveProgram = async () => {
      if (!validateProgram()) {
        alert('Please fix validation errors before saving');
        return;
      }

      try {
        // Prepare data for API with correct field names
        const comments = form.comments.split('\n');
        const apiData = {
          name: form.name,
          author: form.author,
          comment_1: comments[0] || null,
          comment_2: comments[1] || null,
          comment_3: comments[2] || null,
          unit_system: form.unit_system,
          user_machine_id: form.machine_id,
          band_speed: form.band_speed,
          cutting_feed: form.cutting_feed,
          kerf_width: form.kerf_width,
          feeder_speed_limit: form.feeder_speed_limit,
          coolant_enabled: form.cmu,
          step_cut_enabled: form.step_cut,
          band_function_end: form.band_function_end,
          frame_function_end: form.frame_function_end,
          frame_wait_time: form.frame_wait_time,
          upper_frame_mode: form.upper_frame_mode,
          upper_working_position: form.upper_working_position,
          lower_frame_mode: form.lower_frame_mode === 'software',
          lower_working_position: form.lower_working_position,
          segments: form.segments.map((seg, index) => ({
            sequence: index,
            segment_type: seg.type,  // Frontend uses type, API uses segment_type
            material_width: seg.material_width,
            angle_a1: seg.angle_a1,
            angle_a2: seg.angle_a2,
            angle_a3: seg.angle_a3 || 90,
            angle_a4: seg.angle_a4 || 90,
            piece_count: seg.piece_count,
            length_l: seg.length_l || 0,
            length_l1: seg.length_l1,
            length_l2: seg.length_l2,
            length_l3: seg.length_l3 || 0,
            length_l4: seg.length_l4 || 0,
            type_head: seg.type_head || 1,
            type_end: seg.type_end || 1
          }))
        };

        if (isEditMode.value) {
          await axios.put(`${API_BASE_URL}/api/programs/${route.params.id}`, apiData);
          alert('Program updated successfully!');
        } else {
          const response = await axios.post(`${API_BASE_URL}/api/programs`, apiData);
          alert('Program created successfully!');
          router.push(`/programs/${response.data.id}`);
        }
      } catch (error) {
        console.error('Failed to save program:', error);
        alert('Failed to save program. Please try again.');
      }
    };

    const deleteProgram = async () => {
      if (!confirm(`Delete program "${form.name}"?`)) return;

      try {
        await axios.delete(`${API_BASE_URL}/api/programs/${route.params.id}`);
        router.push('/programs');
      } catch (error) {
        console.error('Failed to delete program:', error);
        alert('Failed to delete program. Please try again.');
      }
    };

    onMounted(async () => {
      await loadMachines();
      if (isEditMode.value) {
        await loadProgram();
      } else {
        // Add default segment for new programs
        addSegment();
      }
    });

    return {
      loading,
      editorMode,
      isEditMode,
      form,
      program,
      machines,
      validationErrors,
      speedRange,
      feedRange,
      totalLength,
      estimatedTime,
      canvas,
      addSegment,
      removeSegment,
      calculateSegment,
      validateProgram,
      saveProgram,
      deleteProgram,
      onTypeChange,
      onAngleA1Change,
      onLengthL1Change,
      onFrameFunctionChange,
      onUpperFrameModeChange,
      onLowerFrameModeChange
    };
  }
};
</script>

<style scoped>
.program-editor-page {
  padding: 2rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: #374151;
}

.form-input {
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

.form-input-sm {
  padding: 0.25rem 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
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

.btn-icon {
  padding: 0.25rem;
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
}

.btn-icon:hover {
  color: #111827;
}

.tool-btn {
  width: 100%;
  padding: 0.5rem;
  text-align: left;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.tool-btn:hover {
  background: #f9fafb;
  border-color: #007bff;
}

table {
  font-size: 0.875rem;
}

th {
  font-weight: 600;
  color: #374151;
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

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.badge-blue {
  background: #dbeafe;
  color: #1e40af;
}

.badge-purple {
  background: #e9d5ff;
  color: #7c3aed;
}

.form-radio {
  width: 1rem;
  height: 1rem;
  cursor: pointer;
}

.form-checkbox {
  width: 1.25rem;
  height: 1.25rem;
  cursor: pointer;
}
</style>
