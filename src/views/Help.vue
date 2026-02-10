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

      <!-- User Manual Content -->
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

      <div class="help-section bg-white p-6 rounded-lg shadow mb-6">
        <div class="markdown-content" v-html="userManualHtml"></div>
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
          <p><strong>Version:</strong> {{ version }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { API_BASE_URL } from '@/api/api.js';
import packageInfo from '../../package.json';

export default {
  name: 'Help',
  data() {
    return {
      apiDocsUrl: `${API_BASE_URL}/docs#/`,
      userManualHtml: '',
      version: packageInfo.version
    };
  },
  async mounted() {
    await this.loadUserManual();
  },
  methods: {
    async loadUserManual() {
      try {
        const response = await fetch('/USER_MANUAL.md');
        const markdown = await response.text();
        this.userManualHtml = this.parseMarkdown(markdown);
      } catch (error) {
        console.error('Failed to load user manual:', error);
        this.userManualHtml = '<p class="text-red-500">Failed to load user manual documentation.</p>';
      }
    },
    parseMarkdown(markdown) {
      // Simple markdown to HTML parser
      let html = markdown;
      
      // Headers
      html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-6 mb-3">$1</h3>');
      html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-8 mb-4 text-blue-600">$1</h2>');
      html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-6">$1</h1>');
      
      // Bold and italic
      html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
      html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
      
      // Inline code
      html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-red-600">$1</code>');
      
      // Code blocks
      html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4"><code>$2</code></pre>');
      
      // Links
      html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline" target="_blank">$1</a>');
      
      // Lists
      html = html.replace(/^\d+\.\s+(.*)$/gim, '<li class="ml-6">$1</li>');
      html = html.replace(/^[-*]\s+(.*)$/gim, '<li class="ml-6">$1</li>');
      html = html.replace(/(<li.*<\/li>)/s, '<ul class="list-disc space-y-2 my-3">$1</ul>');
      
      // Paragraphs
      html = html.split('\n\n').map(para => {
        if (para.trim().startsWith('<h') || para.trim().startsWith('<ul') || 
            para.trim().startsWith('<pre') || para.trim().startsWith('<li')) {
          return para;
        }
        return para.trim() ? `<p class="my-3 text-gray-700">${para}</p>` : '';
      }).join('\n');
      
      return html;
    }
  }
};
</script>

<style scoped>
.help-page {
  padding: 2rem;
  max-width: 1200px;
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

.markdown-content {
  line-height: 1.7;
}

.markdown-content :deep(h1) {
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 0.5rem;
}

.markdown-content :deep(h2) {
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.3rem;
}

.markdown-content :deep(code) {
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 0.9em;
}

.markdown-content :deep(pre) {
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
}

.markdown-content :deep(ul) {
  padding-left: 1.5rem;
}

.markdown-content :deep(ol) {
  padding-left: 1.5rem;
  list-style-type: decimal;
}

.markdown-content :deep(li) {
  margin-bottom: 0.5rem;
}

.markdown-content :deep(a) {
  text-decoration: underline;
}

.markdown-content :deep(blockquote) {
  border-left: 4px solid #3b82f6;
  padding-left: 1rem;
  margin: 1rem 0;
  color: #6b7280;
  font-style: italic;
}

.markdown-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 1rem 0;
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  border: 1px solid #e5e7eb;
  padding: 0.5rem;
  text-align: left;
}

.markdown-content :deep(th) {
  background-color: #f9fafb;
  font-weight: 600;
}
</style>
