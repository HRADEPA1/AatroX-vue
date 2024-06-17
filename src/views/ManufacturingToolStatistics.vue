<template>
    <div>
      <div class="card-header">
        <div class="card-title py-3">Manufacturing Tool Statistics</div>
      </div>
      <pie-chart :data="statistics"></pie-chart>
    </div>
  </template>
  
  <script>
  import { ref, onMounted } from 'vue';
  import { getManufacturingToolStatistics } from '../api/api';
  import PieChart from '../views/PieChart.vue';
  
  export default {
    components: { PieChart },
    setup() {
      const statistics = ref({});
  
      onMounted(async () => {
        statistics.value = await getManufacturingToolStatistics();
      });
      console.log("Loaded manufacturing tool statistics from API. Number of statistics: "+statistics.value.length);
      return { statistics };
    },
  };
  </script>