<template>
  <div class="p-4">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-semibold text-gray-800">User Management</h2>
      <button
        @click="openCreateModal"
        class="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
      >
        <i class="i-Add-User mr-1"></i> Add User
      </button>
    </div>

    <!-- Roles overview -->
    <div class="mb-6 bg-white rounded-lg shadow p-4">
      <h3 class="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Available Roles</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div v-for="role in roles" :key="role.value" class="border rounded-lg p-3">
          <div class="flex items-center mb-1">
            <span :class="roleBadgeClass(role.value)" class="px-2 py-0.5 text-xs font-semibold rounded-full">
              {{ role.label }}
            </span>
          </div>
          <p class="text-xs text-gray-500">{{ role.description }}</p>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-10 text-gray-500">Loading users...</div>

    <!-- Error -->
    <div v-if="error" class="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
      {{ error }}
    </div>

    <!-- Users table -->
    <div v-if="!loading" class="bg-white rounded-lg shadow overflow-hidden">
      <table class="w-full text-left">
        <thead class="bg-gray-50 border-b">
          <tr>
            <th class="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Username</th>
            <th class="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Full Name</th>
            <th class="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
            <th class="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Role</th>
            <th class="px-4 py-3 text-xs font-medium text-gray-500 uppercase">PIN</th>
            <th class="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Active</th>
            <th class="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="user in users" :key="user.id" class="hover:bg-gray-50">
            <td class="px-4 py-3 font-medium text-gray-900">{{ user.username }}</td>
            <td class="px-4 py-3 text-gray-600">{{ user.full_name || '-' }}</td>
            <td class="px-4 py-3 text-gray-600">{{ user.email || '-' }}</td>
            <td class="px-4 py-3">
              <span :class="roleBadgeClass(user.role)" class="px-2 py-1 text-xs font-semibold rounded-full">
                {{ roleLabel(user.role) }}
              </span>
            </td>
            <td class="px-4 py-3">
              <template v-if="user.role === 'operator'">
                <span v-if="user.has_pin" class="text-green-600 text-xs font-medium">Set</span>
                <span v-else class="text-gray-400 text-xs">Not set</span>
              </template>
              <span v-else class="text-gray-300 text-xs">—</span>
            </td>
            <td class="px-4 py-3">
              <span v-if="user.is_active" class="text-green-600">Active</span>
              <span v-else class="text-red-500">Disabled</span>
            </td>
            <td class="px-4 py-3 space-x-2">
              <button @click="openEditModal(user)" class="text-blue-600 hover:text-blue-800 text-sm" title="Edit">
                <i class="i-Pen-2"></i>
              </button>
              <button v-if="user.role === 'operator'" @click="openSetPinModal(user)" class="text-purple-600 hover:text-purple-800 text-sm" :title="user.has_pin ? 'Change PIN' : 'Set PIN'">
                <i class="i-Key"></i>
              </button>
              <button v-if="user.role === 'operator' && user.has_pin" @click="confirmClearPin(user)" class="text-orange-500 hover:text-orange-700 text-sm" title="Clear PIN">
                <i class="i-Remove"></i>
              </button>
              <button @click="openResetPasswordModal(user)" class="text-yellow-600 hover:text-yellow-800 text-sm" title="Reset Password">
                <i class="i-Reload"></i>
              </button>
              <button
                v-if="canDeleteUser(user)"
                @click="confirmDelete(user)"
                class="text-red-600 hover:text-red-800 text-sm"
                title="Delete"
              >
                <i class="i-Close"></i>
              </button>
            </td>
          </tr>
          <tr v-if="users.length === 0">
            <td colspan="7" class="px-4 py-8 text-center text-gray-400">No users found</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        <h3 class="text-lg font-semibold mb-4">{{ editingUser ? 'Edit User' : 'Create User' }}</h3>

        <div v-if="modalError" class="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {{ modalError }}
        </div>

        <form @submit.prevent="saveUser">
          <div class="mb-3">
            <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              v-model="form.username"
              type="text"
              required
              :disabled="!!editingUser"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:bg-gray-100"
            />
          </div>
          <div class="mb-3">
            <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              v-model="form.full_name"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>
          <div class="mb-3">
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              v-model="form.email"
              type="email"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>
          <div class="mb-3">
            <label class="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              v-model="form.role"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option v-for="r in availableRoles" :key="r.value" :value="r.value">{{ r.label }}</option>
            </select>
            <p v-if="selectedRoleDescription" class="mt-1 text-xs text-gray-500">{{ selectedRoleDescription }}</p>
          </div>
          <div v-if="!editingUser" class="mb-3">
            <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              v-model="form.password"
              type="password"
              required
              minlength="6"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>
          <div v-if="editingUser" class="mb-3 flex items-center">
            <input v-model="form.is_active" type="checkbox" id="is_active" class="mr-2" />
            <label for="is_active" class="text-sm text-gray-700">Active</label>
          </div>

          <div class="flex justify-end space-x-3 mt-4">
            <button type="button" @click="closeModal" class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" :disabled="saving" class="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg disabled:opacity-50">
              {{ saving ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Reset Password Modal -->
    <div v-if="showResetModal" class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 p-6">
        <h3 class="text-lg font-semibold mb-4">Reset Password for {{ resetUser?.username }}</h3>

        <div v-if="resetError" class="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {{ resetError }}
        </div>

        <form @submit.prevent="doResetPassword">
          <div class="mb-3">
            <label class="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              v-model="newPassword"
              type="password"
              required
              minlength="6"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>
          <div class="flex justify-end space-x-3 mt-4">
            <button type="button" @click="closeResetModal" class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" :disabled="saving" class="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg disabled:opacity-50">
              {{ saving ? 'Resetting...' : 'Reset Password' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 p-6">
        <h3 class="text-lg font-semibold mb-2 text-red-600">Delete User</h3>
        <p class="text-gray-600 mb-4">
          Are you sure you want to delete <strong>{{ deleteTarget?.username }}</strong>? This action cannot be undone.
        </p>
        <div class="flex justify-end space-x-3">
          <button @click="closeDeleteModal" class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button @click="doDelete" :disabled="saving" class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg disabled:opacity-50">
            {{ saving ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Set PIN Modal -->
    <div v-if="showPinModal" class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 p-6">
        <h3 class="text-lg font-semibold mb-4">{{ pinUser?.has_pin ? 'Change' : 'Set' }} PIN for {{ pinUser?.username }}</h3>

        <div v-if="pinError" class="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {{ pinError }}
        </div>

        <form @submit.prevent="doSetPin">
          <div class="mb-3">
            <label class="block text-sm font-medium text-gray-700 mb-1">PIN Code (4-6 digits)</label>
            <input
              v-model="pinCode"
              type="password"
              inputmode="numeric"
              pattern="[0-9]*"
              maxlength="6"
              required
              class="w-full px-3 py-3 text-center text-xl tracking-widest border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="****"
              @input="pinCode = pinCode.replace(/[^0-9]/g, '')"
            />
          </div>
          <div class="flex justify-end space-x-3 mt-4">
            <button type="button" @click="closePinModal" class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" :disabled="saving || pinCode.length < 4" class="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg disabled:opacity-50">
              {{ saving ? 'Saving...' : 'Set PIN' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Clear PIN Confirmation -->
    <div v-if="showClearPinModal" class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 p-6">
        <h3 class="text-lg font-semibold mb-2 text-orange-600">Clear PIN</h3>
        <p class="text-gray-600 mb-4">
          Remove PIN code for <strong>{{ clearPinTarget?.username }}</strong>? They will need to use password login.
        </p>
        <div class="flex justify-end space-x-3">
          <button @click="closeClearPinModal" class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button @click="doClearPin" :disabled="saving" class="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg disabled:opacity-50">
            {{ saving ? 'Clearing...' : 'Clear PIN' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { listUsers, listRoles, createUser, updateUser, resetUserPassword, deleteUser, setUserPin, clearUserPin } from '@/api/auth';

export default {
  name: 'UsersManagement',
  data() {
    return {
      users: [],
      roles: [],
      loading: true,
      error: null,
      // Create/Edit modal
      showModal: false,
      editingUser: null,
      form: { username: '', full_name: '', email: '', role: 'operator', password: '', is_active: true },
      modalError: null,
      saving: false,
      // Reset password modal
      showResetModal: false,
      resetUser: null,
      newPassword: '',
      resetError: null,
      // Delete modal
      showDeleteModal: false,
      deleteTarget: null,
      // PIN modal
      showPinModal: false,
      pinUser: null,
      pinCode: '',
      pinError: null,
      // Clear PIN modal
      showClearPinModal: false,
      clearPinTarget: null,
    };
  },
  computed: {
    currentUserRole() {
      return this.$store.getters['auth/userRole'];
    },
    isAdmin() {
      return this.currentUserRole === 'admin';
    },
    availableRoles() {
      // Service users can only assign operator/user/service; Admin can assign all
      if (this.isAdmin) return this.roles;
      return this.roles.filter(r => r.value !== 'admin');
    },
    selectedRoleDescription() {
      const role = this.roles.find(r => r.value === this.form.role);
      return role ? role.description : '';
    },
  },
  methods: {
    async fetchUsers() {
      this.loading = true;
      this.error = null;
      try {
        this.users = await listUsers();
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to load users';
      } finally {
        this.loading = false;
      }
    },
    async fetchRoles() {
      try {
        const data = await listRoles();
        // Backend returns [{value, label, description}, ...]
        this.roles = Array.isArray(data) ? data : (data.roles || []);
      } catch {
        this.roles = [
          { value: 'operator', label: 'Operator', description: 'Read-only: Dashboard charts, Programs' },
          { value: 'user', label: 'User', description: 'Read: Dashboard, Catalog, Machines; Programs (list & add)' },
          { value: 'service', label: 'Service', description: 'All of User + manage users + dashboard management' },
          { value: 'admin', label: 'Admin', description: 'Full access to everything' },
        ];
      }
    },
    roleLabel(roleValue) {
      const role = this.roles.find(r => r.value === roleValue);
      return role ? role.label : roleValue;
    },
    roleBadgeClass(role) {
      const map = {
        admin: 'bg-red-100 text-red-800',
        service: 'bg-yellow-100 text-yellow-800',
        user: 'bg-blue-100 text-blue-800',
        operator: 'bg-green-100 text-green-800',
      };
      return map[role] || 'bg-gray-100 text-gray-800';
    },
    canDeleteUser(user) {
      // Only admin can delete; can't delete yourself
      if (!this.isAdmin) return false;
      const currentUser = this.$store.getters['auth/currentUser'];
      return currentUser && currentUser.id !== user.id;
    },
    // Create/Edit modal
    openCreateModal() {
      this.editingUser = null;
      this.form = { username: '', full_name: '', email: '', role: 'operator', password: '', is_active: true };
      this.modalError = null;
      this.showModal = true;
    },
    openEditModal(user) {
      this.editingUser = user;
      this.form = {
        username: user.username,
        full_name: user.full_name || '',
        email: user.email || '',
        role: user.role,
        password: '',
        is_active: user.is_active,
      };
      this.modalError = null;
      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
      this.editingUser = null;
      this.modalError = null;
    },
    async saveUser() {
      this.saving = true;
      this.modalError = null;
      try {
        if (this.editingUser) {
          await updateUser(this.editingUser.id, {
            full_name: this.form.full_name,
            email: this.form.email,
            role: this.form.role,
            is_active: this.form.is_active,
          });
        } else {
          await createUser({
            username: this.form.username,
            full_name: this.form.full_name,
            email: this.form.email,
            role: this.form.role,
            password: this.form.password,
          });
        }
        this.closeModal();
        await this.fetchUsers();
      } catch (err) {
        this.modalError = err.response?.data?.detail || 'Failed to save user';
      } finally {
        this.saving = false;
      }
    },
    // Reset password modal
    openResetPasswordModal(user) {
      this.resetUser = user;
      this.newPassword = '';
      this.resetError = null;
      this.showResetModal = true;
    },
    closeResetModal() {
      this.showResetModal = false;
      this.resetUser = null;
      this.resetError = null;
    },
    async doResetPassword() {
      this.saving = true;
      this.resetError = null;
      try {
        await resetUserPassword(this.resetUser.id, this.newPassword);
        this.closeResetModal();
      } catch (err) {
        this.resetError = err.response?.data?.detail || 'Failed to reset password';
      } finally {
        this.saving = false;
      }
    },
    // Delete modal
    confirmDelete(user) {
      this.deleteTarget = user;
      this.showDeleteModal = true;
    },
    closeDeleteModal() {
      this.showDeleteModal = false;
      this.deleteTarget = null;
    },
    async doDelete() {
      this.saving = true;
      try {
        await deleteUser(this.deleteTarget.id);
        this.closeDeleteModal();
        await this.fetchUsers();
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to delete user';
        this.closeDeleteModal();
      } finally {
        this.saving = false;
      }
    },
    // PIN modal
    openSetPinModal(user) {
      this.pinUser = user;
      this.pinCode = '';
      this.pinError = null;
      this.showPinModal = true;
    },
    closePinModal() {
      this.showPinModal = false;
      this.pinUser = null;
      this.pinError = null;
    },
    async doSetPin() {
      this.saving = true;
      this.pinError = null;
      try {
        await setUserPin(this.pinUser.id, this.pinCode);
        this.closePinModal();
        await this.fetchUsers();
      } catch (err) {
        this.pinError = err.response?.data?.detail || 'Failed to set PIN';
      } finally {
        this.saving = false;
      }
    },
    // Clear PIN
    confirmClearPin(user) {
      this.clearPinTarget = user;
      this.showClearPinModal = true;
    },
    closeClearPinModal() {
      this.showClearPinModal = false;
      this.clearPinTarget = null;
    },
    async doClearPin() {
      this.saving = true;
      try {
        await clearUserPin(this.clearPinTarget.id);
        this.closeClearPinModal();
        await this.fetchUsers();
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to clear PIN';
        this.closeClearPinModal();
      } finally {
        this.saving = false;
      }
    },
  },
  async mounted() {
    await Promise.all([this.fetchUsers(), this.fetchRoles()]);
  },
};
</script>
