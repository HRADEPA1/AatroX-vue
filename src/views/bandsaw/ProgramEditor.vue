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
                <label class="form-label">Vf - Band Speed ({{ form.unit_system === 'metric' ? 'm/min' : 'ft/min' }}) *</label>
                <input v-model.number="form.band_speed" type="number" step="0.1" class="form-input w-full" required />
                <p class="text-xs text-gray-500 mt-1">Range: {{ speedRange }}</p>
              </div>
              <div>
                <label class="form-label">Vc - Cutting Feed ({{ form.unit_system === 'metric' ? 'mm/min' : 'in/min' }}) *</label>
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
              <div class="flex items-start mb-3">
                <img :src="RZPIcon" alt="RZP" class="w-12 h-12 mr-3 object-contain" />
                <p class="text-sm text-blue-800">
                  <strong>RZP (Cutting Zone Settings):</strong> The RZP system allows to set the optimal cutting speed depending on material band position.
                </p>
              </div>
              <div class="flex items-start mb-3">
                <img :src="KKRIcon" alt="KKR" class="w-12 h-12 mr-3 object-contain" />
                <p class="text-sm text-gray-600">
                  <strong>KKR (Cut perpendicularity Check):</strong> Set on machine HMI
                </p>
              </div>
              <div class="flex items-start">
                <img :src="ARPIcon" alt="ARP" class="w-12 h-12 mr-3 object-contain" />
                <p class="text-sm text-gray-600">
                  <strong>ARP (Automatic Cutting Feed Adjustment):</strong> The ARP system limits the cutting feed when the actual current of motor M1 exceeds the optimal
value. The motor M1 returns cutting feed stops immediately when the maximum value is exceeded. If the current of below optimal value, the system reduces gradually the limitation.
                </p>
              </div>
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

                <!-- Visual Shape Preview - Production Drawing Style -->
                <div class="mb-4 p-4 bg-white rounded-lg border-2 border-gray-200">
                  <div class="flex items-center justify-center">
                    <svg :width="500" :height="360" class="segment-shape">
                      <defs>
                        <!-- Arrow marker for dimension lines -->
                        <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                          <polygon points="0 0, 10 3, 0 6" fill="#333" />
                        </marker>
                        <marker id="arrowhead-reverse" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto-start-reverse">
                          <polygon points="0 0, 10 3, 0 6" fill="#333" />
                        </marker>
                      </defs>
                      
                      <!-- Main shape outline (polygon ABCD) -->
                      <g id="shape">
                        <!-- 
                          Default polygon vertices:
                          D (top left) - - - - A (top right)
                          |                              |
                          |                              |
                          C (bottom left) - - B (bottom right)
                          
                          - Line DA = L1 (horizontal top edge)
                          - Line AB = vertical (right edge)
                          - Line BC = horizontal (bottom edge)
                          - Line CD = W (vertical left edge)
                          
                          Inner angles:
                          - Vertex A (top right): α (alpha/A1)
                          - Vertex B (bottom right): β (beta/A2)
                          - Vertex C (bottom left): γ (gamma/A3)
                          - Vertex D (top left): δ (delta/A4)
                        -->
                        <path 
                          :d="(() => {
                            // Calculate dynamic scale based on polygon size to fit in canvas
                            const svgWidth = 500;
                            const svgHeight = 360;
                            const margin = 5; // margin for dimension lines and labels
                            const availableWidth = svgWidth - margin * 2;
                            const availableHeight = svgHeight - margin * 2;
                            
                            const L1_raw = segment.length_l1 || 100;
                            const W_raw = segment.material_width || 40;
                            
                            // Calculate scale to fit both width and height
                            const scaleX = availableWidth / L1_raw;
                            const scaleY = availableHeight / W_raw;
                            const scale = Math.min(scaleX, scaleY, 3); // Cap at 3 for small polygons
                            
                            const L1 = L1_raw * scale;  // Line DA (top edge)
                            const W = W_raw * scale;  // Line CD (left edge)
                            
                            // Center the drawing
                            const baseX = (svgWidth - L1) / 2;
                            const baseY = (svgHeight + W) / 2;
                            
                            // Get inner angles (all default to 90°)
                            const alpha = segment.angle_a1 || 90;  // A (top right)
                            const beta = segment.angle_a2 || 90;   // B (bottom right)
                            const gamma = segment.angle_a3 || 90;  // C (bottom left)
                            const delta = segment.angle_a4 || 90;  // D (top left)
                            
                            // Define default rectangle vertices:
                            // D: top left
                            const D = { x: baseX, y: baseY - W };
                            // A: top right (D + L1 horizontally)
                            const A = { x: baseX + L1, y: baseY - W };
                            // B: bottom right (A + W vertically down)
                            const B = { x: baseX + L1, y: baseY };
                            // C: bottom left (origin)
                            const C = { x: baseX, y: baseY };
                            
                            // Build polygon path starting from D and going clockwise: D -> A -> B -> C -> D
                            let points = [];
                            
                            // // Start at D (top left)
                            // points.push(D);

                            
                            // Vertex A (top right) - handle angle alpha (A)
                            if (alpha > 90) {
                              // Obtuse angle at A: cut off corner from polygon
                              // Define cut off area like triangle at A vertex
                              if (segment.length_l2 > 0) {
                                // Short right edge AB with L2
                                points.push({ x: A.x - segment.length_l2 * scale, y: A.y }); 
                                const cutAlphaRad = (180 - alpha) * Math.PI / 180;
                                console.log('cutAlpha =', 180 - alpha);
                                const cutDist = segment.length_l2 * scale / Math.tan(cutAlphaRad);
                                console.log('Obtuse angle at A with L2:', alpha, 'cutDist =', cutDist);
                                // Add vertical point
                                points.push({ x: A.x, y: B.y - W + cutDist });
                              } else {
                                // calculate L2 based on angle
                                const alphaRad = (alpha - 90) * Math.PI / 180;
                                const cutDist = W / Math.tan(alphaRad);
                                console.log('Obtuse angle at A:', alpha, 'cutDist =', cutDist);
                                points.push({ x: A.x - cutDist, y: B.y });
                              }
                            } else if (alpha < 90) {
                              // Acute angle at A: short bottom edge CD
                              const alphaRad = alpha * Math.PI / 180;
                              const inset = W / Math.tan(alphaRad);
                              points.push({ x: A.x, y: A.y });
                              points.push({ x: A.x - inset, y: B.y });
                            } else {
                              // Right angle at A
                              points.push(A);
                            }

                            // Vertex B (bottom right) - handle angle beta (B)
                            if (beta > 90) {
                              // Obtuse angle at B: cut off corner from polygon
                              // Define cut off area like triangle at B vertex
                              if (segment.length_l2 > 0) {
                                const cutBetaRad = (180 - beta) * Math.PI / 180;
                                console.log('cutBeta =', 180 - beta);
                                const cutDist = segment.length_l2 * scale / Math.tan(cutBetaRad);
                                console.log('Obtuse angle at B with L2:', beta, 'cutDist =', cutDist);
                                // Add vertical point
                                points.push({ x: B.x, y: B.y - cutDist });
                                // Short right edge CD with L2
                                points.push({ x: B.x - segment.length_l2 * scale, y: B.y }); 
                              } else {
                                // calculate L2 based on angle
                                const betaRad = (beta - 90) * Math.PI / 180;
                                const cutDist = W / Math.tan(betaRad);
                                console.log('Obtuse angle at B:', beta, 'cutDist =', cutDist);
                                points.push({ x: A.x - cutDist, y: B.y });
                              }
                            } else if (beta < 90) {
                              // Acute angle at B: short bottom edge BC
                              const betaRad = beta * Math.PI / 180;
                              const inset = W / Math.tan(betaRad);
                              points.push({ x: B.x, y: B.y });
                              points.push({ x: B.x - inset, y: C.y });
                            } else {
                              // Right angle at B
                              points.push(B);
                            }
                            
                            // Vertex C (bottom left) - handle angle gamma (C)
                            if (gamma > 90) {
                              // Obtuse angle at C: cut off corner from polygon
                              // Define cut off area like triangle at C vertex
                              if (segment.length_l4 > 0) {
                                // Short left edge BC with L4
                                points.push({ x: C.x + segment.length_l4  * scale, y: B.y });
                                const cutGammaRad = (180 - gamma) * Math.PI / 180;
                                console.log('cutGamma =', 180 - gamma);
                                const cutDist = segment.length_l4 * scale / Math.tan(cutGammaRad);
                                console.log('Obtuse angle at C with L4:', gamma, 'cutDist =', cutDist);
                                // Add vertical point
                                points.push({ x: C.x, y: C.y - cutDist });
                              } else {
                                // calculate L4 based on angle
                                const gammaRad = (gamma - 90) * Math.PI / 180;
                                const cutDist = W / Math.tan(gammaRad);
                                console.log('Obtuse angle at C:', gamma, 'cutDist =', cutDist);
                                points.push({ x: C.x + cutDist, y: C.y });
                              }
                            } else if (gamma < 90) {
                              // Acute angle at C: short bottom edge DA
                              const gammaRad = gamma * Math.PI / 180;
                              const inset = W / Math.tan(gammaRad);
                              points.push({ x: C.x, y: C.y });
                              points.push({ x: C.x + inset, y: D.y });
                            } else {
                              if (delta >= 90) {
                                // Right angle at C
                                points.push(C);
                              }
                            }

                            // Vertex D (top left) - handle angle delta (D)
                            if (delta > 90) {
                              if (segment.length_l4 > 0) {
                                const cutDeltaRad = (180 - delta) * Math.PI / 180;
                                console.log('cutDelta =', 180 - delta);
                                const cutDist = segment.length_l4 * scale / Math.tan(cutDeltaRad);
                                console.log('Obtuse angle at D with L4:', delta, 'cutDist =', cutDist);
                                // Add vertical point
                                points.push({ x: D.x, y: D.y + cutDist });
                                // Short left edge DA with L4
                                points.push({ x: D.x + segment.length_l4  * scale, y: D.y });
                              } else {
                                // calculate L4 based on angle
                                const deltaRad = (delta - 90) * Math.PI / 180;
                                const cutDist = W / Math.tan(deltaRad);
                                console.log('Obtuse angle at D:', delta, 'cutDist =', cutDist);
                                points.push({ x: D.x + cutDist, y: D.y });
                              }
                            } else if (delta < 90) {
                              // Acute angle at D: short bottom edge DA
                              const deltaRad = delta * Math.PI / 180;
                              const inset = W / Math.tan(deltaRad);
                              points.push({ x: C.x + inset, y: C.y });
                              points.push({ x: D.x, y: D.y });
                            } else {
                              if (gamma >= 90) {
                                // Right angle at D
                                points.push(D);
                              }
                            }
                            
                            // Build path
                            if (points.length < 3) {
                              return `M ${D.x},${D.y} L ${A.x},${A.y} L ${B.x},${B.y} L ${C.x},${C.y} Z`;
                            }
                            
                            const pathSegments = points.map((p, idx) => {
                              return idx === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`;
                            });
                            return pathSegments.join(' ') + ' Z';
                          })()" 
                          fill="rgba(240, 240, 240, 0.3)" 
                          stroke="#000" 
                          stroke-width="2.5"
                        />
                        
                        <!-- Section divider lines (dashed) for L4, L3, L2 -->
                        <line 
                          :x1="90 + (segment.length_l4 || 0) * 2.5"
                          y1="220" 
                          :x2="90 + (segment.length_l4 || 0) * 2.5"
                          y2="233" 
                          stroke="#666" 
                          stroke-width="0.5" 
                          stroke-dasharray="2,2"
                          v-if="segment.length_l4 > 0"
                        />
                        <line 
                          :x1="90 + ((segment.length_l4 || 0) + (segment.length_l3 || 100)) * 2.5"
                          y1="220" 
                          :x2="90 + ((segment.length_l4 || 0) + (segment.length_l3 || 100)) * 2.5"
                          y2="233" 
                          stroke="#666" 
                          stroke-width="0.5" 
                          stroke-dasharray="2,2"
                          v-if="segment.length_l2 > 0"
                        />
                      </g>
                      
                      <!-- Dimension line for W (material width) - left side -->
                      <g id="dim-width">
                        <line 
                          :x1="getDrawingParams(segment).baseX - 30" 
                          :y1="getDrawingParams(segment).baseY - getDrawingParams(segment).W" 
                          :x2="getDrawingParams(segment).baseX - 30" 
                          :y2="getDrawingParams(segment).baseY" 
                          stroke="#2563eb" 
                          stroke-width="1.5" 
                          marker-start="url(#arrowhead-reverse)" 
                          marker-end="url(#arrowhead)" 
                        />
                        
                        <text 
                          :x="getDrawingParams(segment).baseX - 45" 
                          :y="getDrawingParams(segment).baseY - getDrawingParams(segment).W / 2" 
                          font-size="12" 
                          font-weight="700" 
                          fill="#2563eb" 
                          text-anchor="middle" 
                          :transform="`rotate(-90, ${getDrawingParams(segment).baseX - 45}, ${getDrawingParams(segment).baseY - getDrawingParams(segment).W / 2})`"
                        >
                          W = {{ segment.material_width || 0 }}
                        </text>
                      </g>
                      
                      <!-- Dimension line for L1 (total bottom) - Blue -->
                      <g id="dim-l1">
                        <!-- Extension lines -->
                        <line 
                          :x1="getDrawingParams(segment).baseX" 
                          :y1="getDrawingParams(segment).baseY" 
                          :x2="getDrawingParams(segment).baseX" 
                          :y2="getDrawingParams(segment).baseY + 50"
                          stroke="#666" 
                          stroke-width="0.5" 
                          stroke-dasharray="2,2"
                        />
                        <line 
                          :x1="getDrawingParams(segment).baseX + getDrawingParams(segment).L1" 
                          :y1="getDrawingParams(segment).baseY" 
                          :x2="getDrawingParams(segment).baseX + getDrawingParams(segment).L1" 
                          :y2="getDrawingParams(segment).baseY + 50"
                          stroke="#666" 
                          stroke-width="0.5" 
                          stroke-dasharray="2,2"
                        />
                        <line 
                          :x1="getDrawingParams(segment).baseX" 
                          :y1="getDrawingParams(segment).baseY + 45"
                          :x2="getDrawingParams(segment).baseX + getDrawingParams(segment).L1" 
                          :y2="getDrawingParams(segment).baseY + 45"
                          stroke="#2563eb" 
                          stroke-width="1.5" 
                          marker-start="url(#arrowhead-reverse)" 
                          marker-end="url(#arrowhead)" 
                        />
                        <text 
                          :x="getDrawingParams(segment).baseX + getDrawingParams(segment).L1 / 2" 
                          :y="getDrawingParams(segment).baseY + 40"
                          font-size="11" 
                          font-weight="700"
                          fill="#2563eb" 
                          text-anchor="middle"
                        >L1 = {{ (segment.length_l1 || 0).toFixed(2) }}</text>
                      </g>
                      
                      <!-- L4 (left section) - Orange -->
                      <g id="dim-l4" v-if="segment.length_l4 > 0">
                        <line 
                          :x1="getDrawingParams(segment).baseX" 
                          :y1="getDrawingParams(segment).baseY + 25"
                          :x2="getDrawingParams(segment).baseX + (segment.length_l4 || 0) * getDrawingParams(segment).scale" 
                          :y2="getDrawingParams(segment).baseY + 25"
                          stroke="#ea580c" 
                          stroke-width="1" 
                          marker-start="url(#arrowhead-reverse)" 
                          marker-end="url(#arrowhead)" 
                        />
                        
                        <text 
                          :x="getDrawingParams(segment).baseX + (segment.length_l4 || 0) * getDrawingParams(segment).scale / 2" 
                          :y="getDrawingParams(segment).baseY + 20"
                          font-size="10" 
                          font-weight="600"
                          fill="#ea580c" 
                          text-anchor="middle"
                        >L4 = {{ (segment.length_l4 || 0).toFixed(2) }}</text>
                      </g>
                      
                      <!-- L3 (middle section) - Green -->
                      <g id="dim-l3">
                        <line 
                          :x1="getDrawingParams(segment).baseX + (segment.length_l4 || 0) * getDrawingParams(segment).scale" 
                          :y1="getDrawingParams(segment).baseY + 25"
                          :x2="getDrawingParams(segment).baseX + ((segment.length_l4 || 0) + (segment.length_l3 || 100)) * getDrawingParams(segment).scale" 
                          :y2="getDrawingParams(segment).baseY + 25"
                          stroke="#059669" 
                          stroke-width="1" 
                          marker-start="url(#arrowhead-reverse)" 
                          marker-end="url(#arrowhead)" 
                        />
                        
                        <text 
                          :x="getDrawingParams(segment).baseX + (segment.length_l4 || 0) * getDrawingParams(segment).scale + (segment.length_l3 || 100) * getDrawingParams(segment).scale / 2" 
                          :y="getDrawingParams(segment).baseY + 20"
                          font-size="10" 
                          font-weight="600"
                          fill="#059669" 
                          text-anchor="middle"
                        >L3 = {{ (segment.length_l3 || 0).toFixed(2) }}</text>
                      </g>
                      
                      <!-- L2 (right section) - Purple -->
                      <g id="dim-l2" v-if="segment.length_l2 > 0">
                        <line 
                          :x1="getDrawingParams(segment).baseX + ((segment.length_l4 || 0) + (segment.length_l3 || 100)) * getDrawingParams(segment).scale" 
                          :y1="getDrawingParams(segment).baseY + 25"
                          :x2="getDrawingParams(segment).baseX + ((segment.length_l4 || 0) + (segment.length_l3 || 100) + (segment.length_l2 || 0)) * getDrawingParams(segment).scale" 
                          :y2="getDrawingParams(segment).baseY + 25"
                          stroke="#7c3aed" 
                          stroke-width="1" 
                          marker-start="url(#arrowhead-reverse)" 
                          marker-end="url(#arrowhead)" 
                        />
                        
                        <text 
                          :x="getDrawingParams(segment).baseX + ((segment.length_l4 || 0) + (segment.length_l3 || 100)) * getDrawingParams(segment).scale + (segment.length_l2 || 0) * getDrawingParams(segment).scale / 2" 
                          :y="getDrawingParams(segment).baseY + 20"
                          font-size="10" 
                          font-weight="600"
                          fill="#7c3aed" 
                          text-anchor="middle"
                        >L2 = {{ (segment.length_l2 || 0).toFixed(2) }}</text>
                      </g>
                      
                      <!-- Angle α (alpha) - Top Right -->
                      <g id="angle-alpha">
                        <!-- <path 
                          :d="(() => {
                            const scale = 2.5;
                            const l1 = (segment.length_l1 || 100) * scale;
                            const w = (segment.material_width || 40) * scale;
                            const baseX = 90;
                            const baseY = 220;
                            
                            // Get angle
                            const alpha = segment.angle_a1 || 90;
                            const alphaRad = alpha * Math.PI / 180;
                            
                            // Top right corner
                            const topRightX = baseX + l1;
                            const topRightY = baseY - w;
                            
                            // Bottom right corner (may be inset if alpha < 90)
                            const rightBottomInset = alpha < 90 ? w / Math.tan(alphaRad) : 0;
                            const bottomRightX = baseX + l1 - rightBottomInset;
                            const bottomRightY = baseY;
                            
                            const r = 42;  // Arc radius
                            
                            if (alpha > 90) {
                              // Obtuse angle: arc at cut corner
                              const cutAngleRad = (alpha - 90) * Math.PI / 180;
                              const cutDistance = w / Math.tan(cutAngleRad);
                              const cutPointX = topRightX - cutDistance;
                              
                              // Start: along top edge from cut point
                              const startX = cutPointX - r;
                              const startY = topRightY;
                              
                              // End: along vertical edge from top
                              const endX = bottomRightX;
                              const endY = topRightY + r;
                              
                              return `M ${startX} ${startY} A ${r} ${r} 0 0 0 ${endX} ${endY}`;
                            } else {
                              // Acute or right angle: arc at corner
                              // Start: along top edge
                              const startX = topRightX - r;
                              const startY = topRightY;
                              
                              // End: along edge toward bottom right
                              const dx = bottomRightX - topRightX;
                              const dy = bottomRightY - topRightY;
                              const edgeLength = Math.sqrt(dx * dx + dy * dy);
                              
                              const endX = topRightX + (dx / edgeLength) * r;
                              const endY = topRightY + (dy / edgeLength) * r;
                              
                              return `M ${startX} ${startY} A ${r} ${r} 0 0 1 ${endX} ${endY}`;
                            }
                          })()" 
                          fill="none" 
                          stroke="#2563eb" 
                          stroke-width="1.5"
                        /> -->
                        <text 
                          :x="(() => {
                            const scale = getDrawingParams(segment).scale;
                            const l1 = (segment.length_l1 || 100) * scale;
                            const w = (segment.material_width || 40) * scale;
                            const baseX = getDrawingParams(segment).baseX;
                            const alpha = segment.angle_a1 || 90;
                            
                            const topRightX = baseX + l1;
                            
                            if (alpha > 90) {
                              const cutAngleRad = (alpha - 90) * Math.PI / 180;
                              const cutDistance = w / Math.tan(cutAngleRad);
                              return topRightX - cutDistance / 2 - 10;
                            } else {
                              return topRightX - 20;
                            }
                          })()" 
                          :y="(() => {
                            const scale = getDrawingParams(segment).scale;
                            const w = (segment.material_width || 40) * scale;
                            const baseY = getDrawingParams(segment).baseY;
                            const font_size = 11;
                            return baseY - w + font_size + 4;
                          })()"
                          font-size="11" 
                          font-weight="700"
                          fill="#2563eb" 
                          text-anchor="middle"
                        >α={{ segment.angle_a1 || 0 }}°</text>
                      </g>
                      
                      <!-- Angle β (beta) - Bottom Right -->
                      <g id="angle-beta">
                        <!-- <path 
                          :d="(() => {
                            const scale = getDrawingParams(segment).scale;
                            const l1 = (segment.length_l1 || 100) * scale;
                            const w = (segment.material_width || 40) * scale;
                            const baseX = getDrawingParams(segment).baseX;
                            const baseY = getDrawingParams(segment).baseY;
                            
                            // Get angles
                            const alpha = segment.angle_a1 || 90;
                            const alphaRad = alpha * Math.PI / 180;
                            
                            // Bottom right corner (may be inset if alpha < 90)
                            const rightBottomInset = alpha < 90 ? w / Math.tan(alphaRad) : 0;
                            const bottomRightX = baseX + l1 - rightBottomInset;
                            const bottomRightY = baseY;
                            
                            // Top right corner
                            const topRightX = baseX + l1;
                            const topRightY = baseY - w;
                            
                            const r = 42;  // Arc radius
                            
                            // Direction from bottom-right to top-right
                            const dx = topRightX - bottomRightX;
                            const dy = topRightY - bottomRightY;
                            const edgeLength = Math.sqrt(dx * dx + dy * dy);
                            
                            // Start point: along the right edge upward from corner
                            const startX = bottomRightX + (dx / edgeLength) * r;
                            const startY = bottomRightY + (dy / edgeLength) * r;
                            
                            // End point: along the bottom edge leftward from corner
                            const endX = bottomRightX - r;
                            const endY = bottomRightY;
                            
                            return `M ${startX} ${startY} A ${r} ${r} 0 0 0 ${endX} ${endY}`;
                          })()" 
                          fill="none" 
                          stroke="#7c3aed" 
                          stroke-width="1.5"
                        /> -->
                        <text 
                          :x="(() => {
                            const scale = getDrawingParams(segment).scale;
                            const l1 = (segment.length_l1 || 100) * scale;
                            const w = (segment.material_width || 40) * scale;
                            const baseX = getDrawingParams(segment).baseX;
                            const alpha = segment.angle_a1 || 90;
                            const alphaRad = alpha * Math.PI / 180;
                            const rightBottomInset = alpha < 90 ? w / Math.tan(alphaRad) : 0;
                            const bottomRightX = baseX + l1 - rightBottomInset;
                            return bottomRightX - 20;
                          })()" 
                          :y="(() => {
                            const scale = getDrawingParams(segment).scale;
                            const baseY = getDrawingParams(segment).baseY;
                            const font_size = 11;
                            return baseY - font_size + 4;
                          })()"
                          font-size="11" 
                          font-weight="700"
                          fill="#7c3aed" 
                          text-anchor="middle"
                        >β={{ segment.angle_a2 || 0 }}°</text>
                      </g>
                      
                      <!-- Angle γ (gamma) - Bottom Left -->
                      <g id="angle-gamma">
                        <!-- <path 
                          :d="(() => {
                            const scale = 2.5;
                            const w = (segment.material_width || 40) * scale;
                            const baseX = 90;
                            const baseY = 220;
                            
                            // Get angles
                            const delta = segment.angle_a4 || 90;
                            const deltaRad = delta * Math.PI / 180;
                            
                            // Bottom left corner (may be inset if delta < 90)
                            const leftBottomInset = delta < 90 ? w / Math.tan(deltaRad) : 0;
                            const bottomLeftX = baseX + leftBottomInset;
                            const bottomLeftY = baseY;
                            
                            // Top left corner
                            const topLeftX = baseX;
                            const topLeftY = baseY - w;
                            
                            const r = 42;  // Arc radius
                            
                            // Start point: along the bottom edge rightward from corner
                            const startX = bottomLeftX + r;
                            const startY = bottomLeftY;
                            
                            // End point: along the left edge upward from corner
                            // Direction from bottom-left to top-left
                            const dx = topLeftX - bottomLeftX;
                            const dy = topLeftY - bottomLeftY;
                            const edgeLength = Math.sqrt(dx * dx + dy * dy);
                            
                            const endX = bottomLeftX + (dx / edgeLength) * r;
                            const endY = bottomLeftY + (dy / edgeLength) * r;
                            
                            return `M ${startX} ${startY} A ${r} ${r} 0 0 0 ${endX} ${endY}`;
                          })()" 
                          fill="none" 
                          stroke="#059669" 
                          stroke-width="1.5"
                        /> -->
                        <text 
                          :x="(() => {
                            const scale = getDrawingParams(segment).scale;
                            const w = (segment.material_width || 40) * scale;
                            const baseX = getDrawingParams(segment).baseX;
                            const delta = segment.angle_a4 || 90;
                            const deltaRad = delta * Math.PI / 180;
                            const leftBottomInset = delta < 90 ? w / Math.tan(deltaRad) : 0;
                            const bottomLeftX = baseX + leftBottomInset;
                            return bottomLeftX + 20;
                          })()" 
                          :y="(() => {
                            const scale = getDrawingParams(segment).scale;
                            const baseY = getDrawingParams(segment).baseY;
                            const font_size = 11;
                            return baseY - font_size + 4;
                          })()"
                          font-size="11" 
                          font-weight="700"
                          fill="#059669" 
                          text-anchor="middle"
                        >γ={{ segment.angle_a3 || 0 }}°</text>
                      </g>
                      
                      <!-- Angle δ (delta) - Top Left -->
                      <g id="angle-delta">
                        <!-- <path 
                          :d="(() => {
                            const scale = 2.5;
                            const w = (segment.material_width || 40) * scale;
                            const baseX = 90;
                            const baseY = 220;
                            
                            // Get angles
                            const delta = segment.angle_a4 || 90;
                            const deltaRad = delta * Math.PI / 180;
                            
                            // Top left corner
                            const topLeftX = baseX;
                            const topLeftY = baseY - w;
                            
                            // Bottom left corner (may be inset if delta < 90)
                            const leftBottomInset = delta < 90 ? w / Math.tan(deltaRad) : 0;
                            const bottomLeftX = baseX + leftBottomInset;
                            const bottomLeftY = baseY;
                            
                            const r = 42;  // Arc radius
                            
                            if (delta > 90) {
                              // Obtuse angle: arc at cut corner
                              const cutAngleRad = (delta - 90) * Math.PI / 180;
                              const cutDistance = w / Math.tan(cutAngleRad);
                              const cutPointX = topLeftX + cutDistance;
                              
                              // Start: along vertical edge from bottom
                              const startX = bottomLeftX;
                              const startY = topLeftY + r;
                              
                              // End: along top edge from cut point
                              const endX = cutPointX + r;
                              const endY = topLeftY;
                              
                              return `M ${startX} ${startY} A ${r} ${r} 0 0 0 ${endX} ${endY}`;
                            } else {
                              // Acute or right angle: arc at corner
                              // Direction from top-left to bottom-left
                              const dx = bottomLeftX - topLeftX;
                              const dy = bottomLeftY - topLeftY;
                              const edgeLength = Math.sqrt(dx * dx + dy * dy);
                              
                              // Start: along the left edge downward from corner
                              const startX = topLeftX + (dx / edgeLength) * r;
                              const startY = topLeftY + (dy / edgeLength) * r;
                              
                              // End: along the top edge rightward from corner
                              const endX = topLeftX + r;
                              const endY = topLeftY;
                              
                              return `M ${startX} ${startY} A ${r} ${r} 0 0 1 ${endX} ${endY}`;
                            }
                          })()" 
                          fill="none" 
                          stroke="#ea580c" 
                          stroke-width="1.5"
                        /> -->
                        <text 
                          :x="(() => {
                            const scale = getDrawingParams(segment).scale;
                            const w = (segment.material_width || 40) * scale;
                            const baseX = getDrawingParams(segment).baseX;
                            const delta = segment.angle_a4 || 90;
                            
                            if (delta > 90) {
                              const cutAngleRad = (delta - 90) * Math.PI / 180;
                              const cutDistance = w / Math.tan(cutAngleRad);
                              return baseX + cutDistance / 2 + 10;
                            } else {
                              return baseX + 20;
                            }
                          })()" 
                          :y="(() => {
                            const scale = getDrawingParams(segment).scale;
                            const w = (segment.material_width || 40) * scale;
                            const baseY = getDrawingParams(segment).baseY;
                            const font_size = 11;
                            return baseY - w + font_size + 4;
                          })()"
                          font-size="11" 
                          font-weight="700"
                          fill="#ea580c" 
                          text-anchor="middle"
                        >δ={{ segment.angle_a4 || 0 }}°</text>
                      </g>
                      
                      <!-- Title block - piece count -->
                      <!-- <g id="title-block">
                        <rect x="280" y="230" width="110" height="40" fill="white" stroke="#333" stroke-width="1.5" rx="3" />
                        <line x1="280" y1="250" x2="390" y2="250" stroke="#333" stroke-width="0.5" />
                        <text x="335" y="244" font-size="10" fill="#666" text-anchor="middle" font-weight="500">QUANTITY</text>
                        <text x="335" y="264" font-size="16" fill="#059669" text-anchor="middle" font-weight="bold" font-family="monospace">
                          {{ segment.piece_count || 0 }} pcs
                        </text>
                      </g> -->
                    </svg>
                  </div>
                  <div class="text-center text-xs text-gray-600 mt-2 font-medium">
                    Technical Drawing Preview • Units: {{ form.unit_system === 'metric' ? 'mm / degrees' : 'in / degrees' }}
                  </div>
                </div>

                <!-- Warning: Set Material Width and Length L1 First -->
                <div v-if="!isSegmentBasicInfoSet(segment)" class="mb-4 p-4 bg-orange-50 border-l-4 border-orange-500 rounded">
                  <div class="flex items-start">
                    <div class="flex-shrink-0">
                      <svg class="h-5 w-5 text-orange-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                      </svg>
                    </div>
                    <div class="ml-3">
                      <h3 class="text-sm font-semibold text-orange-800">Required: Set Material Width (W) and Length L1 First</h3>
                      <p class="mt-1 text-sm text-orange-700">
                        Before entering angles and other lengths, you must first set:
                      </p>
                      <ul class="mt-2 text-sm text-orange-700 list-disc list-inside">
                        <li><strong>Material Width (W)</strong> - The stock height in {{ form.unit_system === 'metric' ? 'mm' : 'in' }}</li>
                        <li><strong>Length L1</strong> - The total bottom length in {{ form.unit_system === 'metric' ? 'mm' : 'in' }}</li>
                      </ul>
                      <p class="mt-2 text-sm text-orange-600 italic">
                        Other fields will be enabled after W and L1 are set.
                      </p>
                    </div>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <!-- Calculation Variant Selector -->
                  <div class="md:col-span-3">
                    <label class="form-label">Calculation Variant</label>
                    <select v-model="segment.calculation_variant" @change="onCalculationVariantChange(index)" class="form-input w-full">
                      <option value="manual">Manual - Define all angles and lengths</option>
                      <option value="auto_angles">Auto from Angles - Define all angles, L2/L3/L4 calculated</option>
                      <option value="auto_l3">Auto L3 - Define L2+α+β and L4+γ+δ, L3 calculated</option>
                      <option value="auto_l4">Auto L4 - Define L2+α+β and L3+γ+δ, L4 calculated</option>
                    </select>
                    <p class="text-xs text-gray-500 mt-1">
                      <span v-if="segment.calculation_variant === 'manual'">Enter all values manually</span>
                      <span v-if="segment.calculation_variant === 'auto_angles'">Lengths calculated from angles and material width W</span>
                      <span v-if="segment.calculation_variant === 'auto_l3'">L3 = L1 - L2 - L4</span>
                      <span v-if="segment.calculation_variant === 'auto_l4'">L4 = L1 - L2 - L3</span>
                    </p>
                  </div>

                  <!-- Material Type Toggle -->
                  <div class="md:col-span-3">
                    <label class="form-label">Material Type</label>
                    <div class="flex gap-4">
                      <label class="flex items-center space-x-2 cursor-pointer">
                        <input type="radio" :name="'type-' + index" value="symmetric" v-model="segment.type" @change="onTypeChange(index)" class="form-radio" />
                        <span>Symmetric (L2 = L4, α = δ, β = γ)</span>
                      </label>
                      <label class="flex items-center space-x-2 cursor-pointer">
                        <input type="radio" :name="'type-' + index" value="asymmetric" v-model="segment.type" class="form-radio" />
                        <span>Asymmetric (All independent)</span>
                      </label>
                    </div>
                  </div>

                  <!-- Material Width (W) - Required -->
                  <div>
                    <label class="form-label">Material Width W ({{ form.unit_system === 'metric' ? 'mm' : 'in' }}) *</label>
                    <input v-model.number="segment.material_width" type="number" step="0.1" min="0" class="form-input w-full" @change="onMaterialWidthChange(index)" placeholder="0" required />
                    <p class="text-xs text-gray-500 mt-1">Stock height (required)</p>
                  </div>

                  <!-- Length L1 - Required -->
                  <div>
                    <label class="form-label">Length L1 - Total Bottom ({{ form.unit_system === 'metric' ? 'mm' : 'in' }}) *</label>
                    <input v-model.number="segment.length_l1" type="number" step="0.1" min="0" max="20000" class="form-input w-full" @change="onLengthL1Change(index)" placeholder="0" required />
                    <p class="text-xs text-gray-500 mt-1">Total bottom length (required)</p>
                  </div>

                  <!-- Piece Count -->
                  <div>
                    <label class="form-label">Piece Count</label>
                    <input 
                      v-model.number="segment.piece_count" 
                      type="number" 
                      step="1" 
                      min="1" 
                      max="9999" 
                      class="form-input w-full" 
                      placeholder="1" 
                      :disabled="!isSegmentBasicInfoSet(segment)"
                      :class="{ 'bg-gray-100 cursor-not-allowed': !isSegmentBasicInfoSet(segment) }"
                    />
                    <p class="text-xs mt-1" :class="isSegmentBasicInfoSet(segment) ? 'text-gray-500' : 'text-orange-600 font-semibold'">
                      <span v-if="!isSegmentBasicInfoSet(segment)">Set Material Width (W) and Length L1 first</span>
                      <span v-else>Number of pieces to cut (1-9999)</span>
                    </p>
                  </div>

                  <!-- Angles -->
                  <div>
                    <label class="form-label">Angle α (alpha) - Top Right (°)</label>
                    <input 
                      v-model.number="segment.angle_a1" 
                      type="number" 
                      step="0.1" 
                      min="30" 
                      max="150" 
                      class="form-input w-full" 
                      @change="onAngleA1Change(index)" 
                      placeholder="90" 
                      :disabled="!isSegmentBasicInfoSet(segment)"
                      :class="{ 'bg-gray-100 cursor-not-allowed': !isSegmentBasicInfoSet(segment) }"
                    />
                    <p class="text-xs mt-1" :class="isSegmentBasicInfoSet(segment) ? 'text-gray-500' : 'text-orange-600 font-semibold'">
                      <span v-if="!isSegmentBasicInfoSet(segment)">Set Material Width (W) and Length L1 first</span>
                      <span v-else>Top right angle: 30-150°</span>
                    </p>
                  </div>

                  <div>
                    <label class="form-label">Angle β (beta) - Bottom Right (°)</label>
                    <input 
                      v-model.number="segment.angle_a2" 
                      type="number" 
                      step="0.1" 
                      min="30" 
                      max="150" 
                      class="form-input w-full" 
                      @change="onAngleA2Change(index)" 
                      placeholder="90" 
                      :disabled="!isSegmentBasicInfoSet(segment)"
                      :class="{ 'bg-gray-100 cursor-not-allowed': !isSegmentBasicInfoSet(segment) }"
                    />
                    <p class="text-xs mt-1" :class="isSegmentBasicInfoSet(segment) ? 'text-gray-500' : 'text-orange-600 font-semibold'">
                      <span v-if="!isSegmentBasicInfoSet(segment)">Set Material Width (W) and Length L1 first</span>
                      <span v-else>Bottom right angle: 30-150°</span>
                    </p>
                  </div>

                  <div>
                    <label class="form-label">Angle γ (gamma) - Bottom Left (°)</label>
                    <input 
                      v-model.number="segment.angle_a3" 
                      type="number" 
                      step="0.1" 
                      min="30" 
                      max="150" 
                      class="form-input w-full" 
                      :readonly="segment.type === 'symmetric'" 
                      :disabled="!isSegmentBasicInfoSet(segment)"
                      :class="{ 'bg-gray-100': segment.type === 'symmetric' || !isSegmentBasicInfoSet(segment), 'cursor-not-allowed': !isSegmentBasicInfoSet(segment) }" 
                      @change="onAngleA3Change(index)" 
                      placeholder="90" 
                    />
                    <p class="text-xs mt-1" :class="isSegmentBasicInfoSet(segment) ? 'text-gray-500' : 'text-orange-600 font-semibold'">
                      <span v-if="!isSegmentBasicInfoSet(segment)">Set Material Width (W) and Length L1 first</span>
                      <span v-else>Bottom left angle: 30-150° {{ segment.type === 'symmetric' ? '(auto = β)' : '' }}</span>
                    </p>
                  </div>

                  <div>
                    <label class="form-label">Angle δ (delta) - Top Left (°)</label>
                    <input 
                      v-model.number="segment.angle_a4" 
                      type="number" 
                      step="0.1" 
                      min="30" 
                      max="150" 
                      class="form-input w-full" 
                      :readonly="segment.type === 'symmetric'" 
                      :disabled="!isSegmentBasicInfoSet(segment)"
                      :class="{ 'bg-gray-100': segment.type === 'symmetric' || !isSegmentBasicInfoSet(segment), 'cursor-not-allowed': !isSegmentBasicInfoSet(segment) }" 
                      @change="onAngleA4Change(index)" 
                      placeholder="90" 
                    />
                    <p class="text-xs mt-1" :class="isSegmentBasicInfoSet(segment) ? 'text-gray-500' : 'text-orange-600 font-semibold'">
                      <span v-if="!isSegmentBasicInfoSet(segment)">Set Material Width (W) and Length L1 first</span>
                      <span v-else>Top left angle: 30-150° {{ segment.type === 'symmetric' ? '(auto = α)' : '' }}</span>
                    </p>
                  </div>

                  <!-- Lengths -->
                  <div>
                    <label class="form-label">Length L2 - Right Section ({{ form.unit_system === 'metric' ? 'mm' : 'in' }})</label>
                    <input 
                      v-model.number="segment.length_l2" 
                      type="number" 
                      step="0.1" 
                      min="0" 
                      max="20000" 
                      class="form-input w-full" 
                      :readonly="segment.calculation_variant === 'auto_angles'" 
                      :disabled="!isSegmentBasicInfoSet(segment)"
                      :class="{ 'bg-gray-100': segment.calculation_variant === 'auto_angles' || !isSegmentBasicInfoSet(segment), 'cursor-not-allowed': !isSegmentBasicInfoSet(segment) }" 
                      @change="onLengthL2Change(index)" 
                      placeholder="0" 
                    />
                    <p class="text-xs mt-1" :class="isSegmentBasicInfoSet(segment) ? 'text-gray-500' : 'text-orange-600 font-semibold'">
                      <span v-if="!isSegmentBasicInfoSet(segment)">Set Material Width (W) and Length L1 first</span>
                      <span v-else>
                        Bottom right section
                        <span v-if="segment.calculation_variant === 'auto_angles'"> (auto calculated)</span>
                      </span>
                    </p>
                  </div>

                  <div>
                    <label class="form-label">Length L3 - Middle Section ({{ form.unit_system === 'metric' ? 'mm' : 'in' }})</label>
                    <input 
                      v-model.number="segment.length_l3" 
                      type="number" 
                      step="0.1" 
                      min="0" 
                      max="20000" 
                      class="form-input w-full" 
                      :readonly="segment.calculation_variant === 'auto_angles' || segment.calculation_variant === 'auto_l3'" 
                      :disabled="!isSegmentBasicInfoSet(segment)"
                      :class="{ 'bg-gray-100': segment.calculation_variant === 'auto_angles' || segment.calculation_variant === 'auto_l3' || !isSegmentBasicInfoSet(segment), 'cursor-not-allowed': !isSegmentBasicInfoSet(segment) }" 
                      @change="onLengthL3Change(index)" 
                      placeholder="0" 
                    />
                    <p class="text-xs mt-1" :class="isSegmentBasicInfoSet(segment) ? 'text-gray-500' : 'text-orange-600 font-semibold'">
                      <span v-if="!isSegmentBasicInfoSet(segment)">Set Material Width (W) and Length L1 first</span>
                      <span v-else>
                        Middle section
                        <span v-if="segment.calculation_variant === 'auto_angles' || segment.calculation_variant === 'auto_l3'"> (auto calculated)</span>
                      </span>
                    </p>
                  </div>

                  <div>
                    <label class="form-label">Length L4 - Left Section ({{ form.unit_system === 'metric' ? 'mm' : 'in' }})</label>
                    <input 
                      v-model.number="segment.length_l4" 
                      type="number" 
                      step="0.1" 
                      min="0" 
                      max="20000" 
                      class="form-input w-full" 
                      :readonly="segment.type === 'symmetric' || segment.calculation_variant === 'auto_angles' || segment.calculation_variant === 'auto_l4'" 
                      :class="{ 'bg-gray-100': segment.type === 'symmetric' || segment.calculation_variant === 'auto_angles' || segment.calculation_variant === 'auto_l4' }" 
                      @change="onLengthL4Change(index)" 
                      placeholder="0" 
                    />
                    <p class="text-xs text-gray-500 mt-1">
                      Bottom left section 
                      {{ segment.type === 'symmetric' ? '(auto = L2)' : '' }}
                      <span v-if="segment.calculation_variant === 'auto_angles' || segment.calculation_variant === 'auto_l4'"> (auto calculated)</span>
                    </p>
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
import { API_BASE_URL } from '@/api/api.js';
import RZPIcon from '@/assets/images/RZP.png';
import KKRIcon from '@/assets/images/KKR.png';
import ARPIcon from '@/assets/images/ARP.png';

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
    
    // Debounce timers for input changes
    const debounceTimers = ref({});

    const speedRange = computed(() => {
      return form.unit_system === 'metric' ? '15-300 m/min' : '49.2-984.3 ft/min';
    });

    const feedRange = computed(() => {
      return form.unit_system === 'metric' ? '0-150 mm/min' : '0-5.9 in/min';
    });

    const totalLength = computed(() => {
      return form.segments.reduce((sum, seg) => sum + (seg.length_l1 || 0), 0);
    });

    const estimatedTime = computed(() => {
      if (form.cutting_feed === 0) return 'N/A';
      const minutes = totalLength.value / form.cutting_feed;
      return `${Math.floor(minutes)}:${String(Math.floor((minutes % 1) * 60)).padStart(2, '0')}`;
    });

    // Helper function to calculate dynamic scale and positioning for SVG drawings
    const getDrawingParams = (segment) => {
      const svgWidth = 500;
      const svgHeight = 360;
      const margin = 5; // margin for dimension lines and labels
      const availableWidth = svgWidth - margin * 2;
      const availableHeight = svgHeight - margin * 2;
      
      const L1_raw = segment.length_l1 || 100;
      const W_raw = segment.material_width || 40;
      
      // Calculate scale to fit both width and height
      const scaleX = availableWidth / L1_raw;
      const scaleY = availableHeight / W_raw;
      const scale = Math.min(scaleX, scaleY, 3); // Cap at 3 for small polygons
      
      const L1 = L1_raw * scale;
      const W = W_raw * scale;
      
      // Center the drawing
      const baseX = (svgWidth - L1) / 2;
      const baseY = (svgHeight + W) / 2;
      
      return { scale, L1, W, baseX, baseY, svgWidth, svgHeight };
    };

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
          calculation_variant: seg.calculation_variant || 'manual',
          material_width: seg.material_width || 0,
          angle_a1: seg.angle_a1 || 90,  // alpha
          angle_a2: seg.angle_a2 || 90,  // beta
          angle_a3: seg.angle_a3 || 90,  // gamma
          angle_a4: seg.angle_a4 || 90,  // delta
          piece_count: seg.piece_count || 1,
          length_l1: seg.length_l1 || 0,
          length_l2: seg.length_l2 || 0,
          length_l3: seg.length_l3 || 0,
          length_l4: seg.length_l4 || 0,
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
        calculation_variant: 'manual',  // Default to manual
        material_width: 0,
        angle_a1: 90,  // alpha (α)
        angle_a2: 90,  // beta (β)
        angle_a3: 90,  // gamma (γ)
        angle_a4: 90,  // delta (δ)
        piece_count: 1,
        length_l1: 0,  // Total bottom length
        length_l2: 0,  // Bottom right section
        length_l3: 0,  // Middle section
        length_l4: 0,  // Bottom left section
        order_index: form.segments.length
      });
    };

    const removeSegment = (index) => {
      console.log('Removing segment at index', index);
      form.segments.splice(index, 1);
      // Update order indices
      form.segments.forEach((seg, idx) => {
        seg.order_index = idx;
      });
    };

    // Debounce helper function
    const debounceCalculation = (key, callback, delay = 300) => {
      if (debounceTimers.value[key]) {
        clearTimeout(debounceTimers.value[key]);
      }
      debounceTimers.value[key] = setTimeout(callback, delay);
    };

    const onTypeChange = (index) => {
      const segment = form.segments[index];
      if (segment.type === 'symmetric') {
        // For symmetric: L2=L4, alpha=delta, beta=gamma
        segment.angle_a4 = segment.angle_a1;  // delta = alpha
        segment.angle_a3 = segment.angle_a2;  // gamma = beta
        segment.length_l4 = segment.length_l2;  // L4 = L2
      }
    };

    const onAngleA1Change = (index) => {
      const segment = form.segments[index];
      debounceCalculation(`angle_a1_${index}`, () => {
        console.log('Angle α (alpha) - Top Right (°) changed.  A1 = ', segment.angle_a1);
        if (segment.type === 'symmetric') {
          segment.angle_a4 = segment.angle_a1;  // delta = alpha
        }
        applyCalculationVariant(index);
      });
    };

    const onAngleA2Change = (index) => {
      const segment = form.segments[index];
      debounceCalculation(`angle_a2_${index}`, () => {
        console.log('Angle β (beta) - Bottom Right (°) changed.  A2 = ', segment.angle_a2);
        if (segment.type === 'symmetric') {
          segment.angle_a3 = segment.angle_a2;  // gamma = beta
        }
        applyCalculationVariant(index);
      });
    };

    const onLengthL1Change = (index) => {
      const segment = form.segments[index]; 
      // Apply calculation variant logic (respects manual mode)
      debounceCalculation(`length_l1_${index}`, () => {
        console.log('Length L1 - Total Bottom changed. L1 = ', segment.length_l1);
        
        // Initialize defaults if L2, L3, L4 are not yet defined
        if (segment.length_l3 === 0 && segment.length_l2 === 0 && segment.length_l4 === 0) {
          segment.length_l3 = segment.length_l1 || 0;  // L3 = L1 by default
          segment.length_l2 = 0;
          segment.length_l4 = 0;
        }
        
        applyCalculationVariant(index);
      });
    };

    const onLengthL2Change = (index) => {
      const segment = form.segments[index];
      // Auto calculate based on variant
      debounceCalculation(`length_l2_${index}`, () => {
        console.log('Length L2 - Right Section changed. L2 = ', segment.length_l2);
        if (segment.type === 'symmetric') {
          segment.length_l4 = segment.length_l2;  // L4 = L2
        }
        applyCalculationVariant(index);
      });
    };

    const onLengthL3Change = (index) => {
      const segment = form.segments[index];
      debounceCalculation(`length_l3_${index}`, () => {
        console.log('Length L3 - Middle Section changed. L3 = ', segment.length_l3);
        applyCalculationVariant(index);
      });
    };

    const onLengthL4Change = (index) => {
      const segment = form.segments[index];
      debounceCalculation(`length_l4_${index}`, () => {
        console.log('Length L4 - Left Section changed. L4 = ', segment.length_l4);
        applyCalculationVariant(index);
      });
    };

    const onAngleA3Change = (index) => {
      const segment = form.segments[index];
      debounceCalculation(`angle_a3_${index}`, () => {
        console.log('Angle γ (gamma) - Bottom Left (°) changed.  A3 = ', segment.angle_a3);
        applyCalculationVariant(index);
      });
    };

    const onAngleA4Change = (index) => {
      const segment = form.segments[index];
      
      debounceCalculation(`angle_a4_${index}`, () => {
        console.log('Angle δ (delta) - Bottom Right (°) changed.  A4 = ', segment.angle_a4);
        applyCalculationVariant(index);
      });
    };

    const onMaterialWidthChange = (index) => {
      const segment = form.segments[index];
      debounceCalculation(`material_width_${index}`, () => {
        console.log('Material width changed. W = ', segment.material_width);
        applyCalculationVariant(index);
      });
    };

    const isSegmentBasicInfoSet = (segment) => {
      return segment && segment.material_width > 0 && segment.length_l1 > 0;
    };

    const onCalculationVariantChange = (index) => {
      const segment = form.segments[index];
      // Initialize default values based on variant
      if (segment.calculation_variant === 'manual') {
        // No auto calculations
      } else if (segment.calculation_variant === 'auto_angles') {
        // Set L2=0, L4=0, L3=L1 as default
        segment.length_l2 = 0;
        segment.length_l4 = 0;
        segment.length_l3 = segment.length_l1 || 0;
      } else if (segment.calculation_variant === 'auto_l3') {
        // L3 will be calculated from L1 - L2 - L4
      } else if (segment.calculation_variant === 'auto_l4') {
        // L4 will be calculated from L1 - L2 - L3
      }
      applyCalculationVariant(index);
    };

    const applyCalculationVariant = (index) => {
      const segment = form.segments[index];
      console.log('Applying calculation variant for segment', index);
      const W = segment.material_width || 0;
      const L1 = segment.length_l1 || 0;
      const alpha = (segment.angle_a1 || 90) * Math.PI / 180;
      const beta = (segment.angle_a2 || 90) * Math.PI / 180;
      const gamma = (segment.angle_a3 || 90) * Math.PI / 180;
      const delta = (segment.angle_a4 || 90) * Math.PI / 180;

      if (segment.calculation_variant === 'auto_angles') {
        // Calculate L2, L3, L4 from angles
        // L2 = W / tan(β) - right section calculated from bottom right angle
        // L4 = W / tan(γ) - left section calculated from bottom left angle  
        // L3 = L1 - L2 - L4
        if (W > 0) {
          segment.length_l2 = Math.abs(W / Math.tan(beta));
          segment.length_l4 = Math.abs(W / Math.tan(gamma));
          segment.length_l3 = Math.max(0, L1 - segment.length_l2 - segment.length_l4);
        }
      } else if (segment.calculation_variant === 'auto_l3') {
        // L3 = L1 - L2 - L4
        const L2 = segment.length_l2 || 0;
        const L4 = segment.length_l4 || 0;
        segment.length_l3 = Math.max(0, L1 - L2 - L4);
      } else if (segment.calculation_variant === 'auto_l4') {
        // L4 = L1 - L2 - L3
        const L2 = segment.length_l2 || 0;
        const L3 = segment.length_l3 || 0;
        segment.length_l4 = Math.max(0, L1 - L2 - L3);
      } else {
        // manual mode: calculate L2/L4 from angles if they depend on angles
        // Calculate L2 if angle alpha or beta is not 90 and L2 is 0 or should be recalculated
        if (W > 0 && L1 > 0) {
          const alphaAngle = segment.angle_a1 || 90;
          const betaAngle = segment.angle_a2 || 90;
          const gammaAngle = segment.angle_a3 || 90;
          const deltaAngle = segment.angle_a4 || 90;

          // Angle A1 (alpha) < 90 => auto calculate beta and L3 and L2
          if (alphaAngle < 90) {
            console.log('Alpha angle < 90 detected, calculating beta and L2/L3');
            const alphaRad = alphaAngle * Math.PI / 180; // Convert to radians
            // Calculate A2 (beta) angle
            segment.angle_a2 = 180 - 90 + 90 - alphaAngle;
            console.log('Calculated beta. 180 - 90 - + 90', alphaAngle, '=', segment.angle_a2);
            // Calculate L2 length
            segment.length_l2 = W / Math.tan(alphaRad);
            // Calculate L3 length
            segment.length_l3 = segment.length_l1 - segment.length_l4 - segment.length_l2;
            console.log('Calculated L2:', segment.length_l2, 'L3:', segment.length_l3);
          } else if (alphaAngle > 90) {
             if (segment.length_l2 === 0 || segment.length_l2 >= segment.material_width) {
              console.log('Alpha angle > 90 detected, calculating L2');
              const alphaRad = (alphaAngle - 90) * Math.PI / 180; // Convert to radians
              // Calculate L2 length
              segment.length_l2 = Math.abs(W / Math.tan(alphaRad));
             }
             // Calculate L3 length
            segment.length_l3 = segment.length_l1 - segment.length_l4 - segment.length_l2;
            console.log('Calculated L2:', segment.length_l2, 'L3:', segment.length_l3);
          }

          // if (alpha > 90) {
          //                     // Obtuse angle at A: cut off corner
          //                     const alphaRad = (alpha - 90) * Math.PI / 180;
          //                     const cutDist = W / Math.tan(alphaRad);
          //                     points.push({ x: A.x - cutDist, y: A.y });
          //                     // Add vertical segment down
          //                     points.push({ x: A.x, y: A.y });

          
          // Auto-calculate L2 if beta angle is not 90 and (alpha > 90 or beta != 90)
          // if ((alphaAngle !== 90 || betaAngle !== 90) && segment.length_l2 === 0) {
          //   segment.length_l2 = Math.abs(W / Math.tan(beta));
          // }
          
          // // Auto-calculate L4 if gamma angle is not 90 and (delta > 90 or gamma != 90)
          // if ((deltaAngle !== 90 || gammaAngle !== 90) && segment.length_l4 === 0) {
          //   segment.length_l4 = Math.abs(W / Math.tan(gamma));
          // }
          
          // Recalculate L3 if L2 or L4 were calculated
          if (segment.length_l2 > 0 || segment.length_l4 > 0) {
            segment.length_l3 = Math.max(0, L1 - segment.length_l2 - segment.length_l4);
          }
        }
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

    const calculateSegment = (index) => {
      // Use frontend calculation logic
      console.log('Manual calculate button clicked for segment', index);
      applyCalculationVariant(index);
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
        // Check if Material Width and Length L1 are set
        if (!seg.material_width || seg.material_width <= 0) {
          validationErrors.value.push(`Segment ${idx + 1}: Material Width (W) is required and must be greater than 0`);
        }
        if (!seg.length_l1 || seg.length_l1 <= 0) {
          validationErrors.value.push(`Segment ${idx + 1}: Length L1 is required and must be greater than 0`);
        }
        
        // Validate angles
        if (seg.angle_a1 && (seg.angle_a1 < 30 || seg.angle_a1 > 150)) {
          validationErrors.value.push(`Segment ${idx + 1}: Angle α (alpha) must be between 30° and 150°`);
        }
        if (seg.angle_a2 && (seg.angle_a2 < 30 || seg.angle_a2 > 150)) {
          validationErrors.value.push(`Segment ${idx + 1}: Angle β (beta) must be between 30° and 150°`);
        }
        if (seg.angle_a3 && (seg.angle_a3 < 30 || seg.angle_a3 > 150)) {
          validationErrors.value.push(`Segment ${idx + 1}: Angle γ (gamma) must be between 30° and 150°`);
        }
        if (seg.angle_a4 && (seg.angle_a4 < 30 || seg.angle_a4 > 150)) {
          validationErrors.value.push(`Segment ${idx + 1}: Angle δ (delta) must be between 30° and 150°`);
        }
        
        // Validate lengths
        if (seg.length_l1 && seg.length_l1 > 20000) {
          validationErrors.value.push(`Segment ${idx + 1}: Length L1 exceeds maximum (20000${form.unit_system === 'metric' ? 'mm' : 'in'})`);
        }
        if (seg.length_l2 && seg.length_l2 > 20000) {
          validationErrors.value.push(`Segment ${idx + 1}: Length L2 exceeds maximum (20000${form.unit_system === 'metric' ? 'mm' : 'in'})`);
        }
        if (seg.length_l3 && seg.length_l3 > 20000) {
          validationErrors.value.push(`Segment ${idx + 1}: Length L3 exceeds maximum (20000${form.unit_system === 'metric' ? 'mm' : 'in'})`);
        }
        if (seg.length_l4 && seg.length_l4 > 20000) {
          validationErrors.value.push(`Segment ${idx + 1}: Length L4 exceeds maximum (20000${form.unit_system === 'metric' ? 'mm' : 'in'})`);
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
      isSegmentBasicInfoSet,
      getDrawingParams,
      addSegment,
      removeSegment,
      calculateSegment,
      validateProgram,
      saveProgram,
      deleteProgram,
      onTypeChange,
      onAngleA1Change,
      onAngleA2Change,
      onAngleA3Change,
      onAngleA4Change,
      onLengthL1Change,
      onLengthL2Change,
      onLengthL3Change,
      onLengthL4Change,
      onMaterialWidthChange,
      onCalculationVariantChange,
      onFrameFunctionChange,
      onUpperFrameModeChange,
      onLowerFrameModeChange,
      RZPIcon,
      KKRIcon,
      ARPIcon
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

.segment-shape {
  max-width: 100%;
  height: auto;
}

.segment-shape text {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
</style>
