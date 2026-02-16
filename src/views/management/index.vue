<template>
  <div class="management-section">
    <div class="page-header mb-6">
      <h1 class="text-3xl font-bold">Management</h1>
    </div>

    <div class="management-grid grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- User Management (service+) -->
      <div v-if="canAccess('users')" class="card p-6 bg-white rounded-lg shadow">
        <div class="flex items-center mb-4">
          <i class="i-Administrator text-4xl text-purple-500 mr-3"></i>
          <h2 class="text-xl font-semibold">User Management</h2>
        </div>
        <p class="text-gray-600 mb-4">Manage users, roles, permissions, and groups</p>
        <router-link to="/management/users" class="btn btn-primary">
          Manage Users
        </router-link>
      </div>

      <!-- Datasource Management (admin) -->
      <div v-if="canAccess('datasources')" class="card p-6 bg-white rounded-lg shadow">
        <div class="flex items-center mb-4">
          <i class="i-Data-Storage text-4xl text-blue-500 mr-3"></i>
          <h2 class="text-xl font-semibold">Datasource</h2>
        </div>
        <p class="text-gray-600 mb-4">Configure InfluxDB connections and data sources</p>
        <router-link to="/management/datasources" class="btn btn-primary">
          Configure
        </router-link>
      </div>

      <!-- Dashboard Management (service+) -->
      <div v-if="canAccess('dashboard.manage')" class="card p-6 bg-white rounded-lg shadow">
        <div class="flex items-center mb-4">
          <i class="i-Bar-Chart text-4xl text-green-500 mr-3"></i>
          <h2 class="text-xl font-semibold">Dashboards</h2>
        </div>
        <p class="text-gray-600 mb-4">Create and manage custom dashboards</p>
        <router-link to="/management/dashboards" class="btn btn-primary">
          Manage Dashboards
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Management',
  methods: {
    canAccess(feature) {
      return this.$store.getters['auth/canAccess'](feature);
    },
  },
};
</script>

<style scoped>
.management-section {
  padding: 2rem;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  text-decoration: none;
  display: inline-block;
  transition: background 0.2s;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
}
</style>
