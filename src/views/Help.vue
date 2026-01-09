<template>
  <div class="help-page">
    <div class="page-header mb-6">
      <h1 class="text-3xl font-bold">Help & Documentation</h1>
    </div>

    <div class="help-content">
      <!-- Quick Links -->
      <div class="help-section bg-white p-6 rounded-lg shadow mb-6">
        <h2 class="text-xl font-semibold mb-4">Quick Links</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a :href="apiDocsUrl" target="_blank" class="help-link">
            <i class="i-File-Word text-2xl text-blue-500 mr-3"></i>
            <div>
              <h3 class="font-semibold">API Documentation</h3>
              <p class="text-sm text-gray-600">Complete API reference</p>
            </div>
          </a>
          <router-link to="/programs" class="help-link">
            <i class="i-File-Clipboard-File--Text text-2xl text-purple-500 mr-3"></i>
            <div>
              <h3 class="font-semibold">Program Editor Guide</h3>
              <p class="text-sm text-gray-600">Learn to create cutting programs</p>
            </div>
          </router-link>
        </div>
      </div>

      <!-- User Guide -->
      <div class="help-section bg-white p-6 rounded-lg shadow mb-6">
        <h2 class="text-xl font-semibold mb-4">User Guide</h2>
        <div class="space-y-4">
          <div class="guide-item">
            <h3 class="font-semibold mb-2">Creating a Cutting Program</h3>
            <ol class="list-decimal list-inside text-gray-600 space-y-1">
              <li>Navigate to Programs section</li>
              <li>Click "New Program" button</li>
              <li>Fill in program metadata (name, author, comments)</li>
              <li>Select unit system (metric/imperial)</li>
              <li>Set band speed and cutting feed</li>
              <li>Add cutting segments with angles and lengths</li>
              <li>Save the program</li>
            </ol>
          </div>

          <div class="guide-item">
            <h3 class="font-semibold mb-2">Managing Machines</h3>
            <ol class="list-decimal list-inside text-gray-600 space-y-1">
              <li>Go to "My Machines" section</li>
              <li>Add machine from catalog or create custom</li>
              <li>Configure network settings (PLC IP, MQTT topics)</li>
              <li>Set custom operating limits if needed</li>
              <li>Schedule maintenance</li>
            </ol>
          </div>

          <div class="guide-item">
            <h3 class="font-semibold mb-2">Importing/Exporting Programs</h3>
            <ul class="list-disc list-inside text-gray-600 space-y-1">
              <li>CSV format compatible with bandsaw machines</li>
              <li>Use semicolon delimiter (;)</li>
              <li>Export generates QR code for easy identification</li>
              <li>Import validates all parameters automatically</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Technical Specifications -->
      <div class="help-section bg-white p-6 rounded-lg shadow mb-6">
        <h2 class="text-xl font-semibold mb-4">Technical Specifications</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 class="font-semibold mb-2">Angle Limits</h4>
            <p class="text-gray-600">30° - 150°</p>
          </div>
          <div>
            <h4 class="font-semibold mb-2">Max Length</h4>
            <p class="text-gray-600">20,000 mm (20 m)</p>
          </div>
          <div>
            <h4 class="font-semibold mb-2">Band Speed (Metric)</h4>
            <p class="text-gray-600">15 - 300 m/min</p>
          </div>
          <div>
            <h4 class="font-semibold mb-2">Band Speed (Imperial)</h4>
            <p class="text-gray-600">49.213 - 984.252 ft/min</p>
          </div>
          <div>
            <h4 class="font-semibold mb-2">Cutting Feed (Metric)</h4>
            <p class="text-gray-600">0 - 150 mm/min</p>
          </div>
          <div>
            <h4 class="font-semibold mb-2">Cutting Feed (Imperial)</h4>
            <p class="text-gray-600">0 - 5.906 in/min</p>
          </div>
        </div>
      </div>

      <!-- Support Contact -->
      <div class="help-section bg-white p-6 rounded-lg shadow">
        <h2 class="text-xl font-semibold mb-4">Support Contact</h2>
        <div class="space-y-2 text-gray-600">
          <p><strong>Email:</strong> support@pegasgonda.local</p>
          <p><strong>Documentation:</strong> README_BANDSAW.md</p>
          <p><strong>Version:</strong> 2.0.0</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Help',
  data() {
    return {
      apiDocsUrl: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/docs#/`
    };
  }
};
</script>

<style scoped>
.help-page {
  padding: 2rem;
  max-width: 1000px;
}

.help-link {
  display: flex;
  align-items: center;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.2s;
}

.help-link:hover {
  background: #f9fafb;
  border-color: #d1d5db;
  transform: translateY(-2px);
}

.guide-item {
  padding: 1rem;
  background: #f9fafb;
  border-radius: 6px;
}
</style>
