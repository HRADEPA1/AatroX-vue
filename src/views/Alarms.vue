<template>
    <div>
      <div class="card-header">
        <div class="card-title py-3">Alarms</div>
      </div>
      <ul>
        <li v-for="alarm in alarms" :key="alarm.time">
          {{ $date(alarm.time).format('DD.MM.YYYY HH:MM:ss') }} - {{ alarm.msg }}
        </li>
      </ul>
    </div>
  </template>
  
  <script>
  import { ref, onMounted } from 'vue';
  import { getAlarms } from '@/api/api';
  
  export default {
    setup() {
      const alarms = ref([]);
  
      onMounted(async () => {
        // alarms.value = await getAlarms('Month');
        alarms.value = await getAlarms();
      });
      console.log("Loaded alarms from API. Number of alarms: "+alarms.value.length);
      return { alarms };
    },
  };
  </script>