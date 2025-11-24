<template>
  <div class="notifications-page">
    <div class="page-header mb-6">
      <h1 class="text-3xl font-bold">Notifications</h1>
    </div>

    <div class="notifications-list">
      <div 
        v-for="notification in notifications" 
        :key="notification.id"
        :class="['notification-item', notification.type]"
        class="bg-white p-4 mb-3 rounded-lg shadow"
      >
        <div class="flex items-start">
          <div class="notification-icon mr-4">
            <i :class="getIconClass(notification.type)" class="text-2xl"></i>
          </div>
          <div class="flex-1">
            <div class="flex justify-between items-start">
              <h3 class="font-semibold">{{ notification.title }}</h3>
              <span class="text-sm text-gray-500">{{ notification.time }}</span>
            </div>
            <p class="text-gray-600 mt-1">{{ notification.message }}</p>
          </div>
          <button @click="dismissNotification(notification.id)" class="ml-4 text-gray-400 hover:text-gray-600">
            <i class="i-Close text-xl"></i>
          </button>
        </div>
      </div>

      <div v-if="notifications.length === 0" class="text-center py-12 text-gray-500">
        <i class="i-Bell text-5xl mb-4"></i>
        <p>No notifications</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';

export default {
  name: 'Notifications',
  setup() {
    const notifications = ref([
      {
        id: 1,
        type: 'info',
        title: 'System Update',
        message: 'New version available for PEGAS-GONDA system',
        time: '5 min ago'
      },
      {
        id: 2,
        type: 'warning',
        title: 'Maintenance Due',
        message: 'Machine #3 requires maintenance check',
        time: '1 hour ago'
      },
      {
        id: 3,
        type: 'success',
        title: 'Program Exported',
        message: 'Cutting program "Steel-90" exported successfully',
        time: '2 hours ago'
      }
    ]);

    const getIconClass = (type) => {
      const icons = {
        info: 'i-Information text-blue-500',
        warning: 'i-Warning text-yellow-500',
        success: 'i-Check text-green-500',
        error: 'i-Close text-red-500'
      };
      return icons[type] || icons.info;
    };

    const dismissNotification = (id) => {
      notifications.value = notifications.value.filter(n => n.id !== id);
    };

    return {
      notifications,
      getIconClass,
      dismissNotification
    };
  }
};
</script>

<style scoped>
.notifications-page {
  padding: 2rem;
  max-width: 800px;
}

.notification-item {
  transition: transform 0.2s, box-shadow 0.2s;
}

.notification-item:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
</style>
