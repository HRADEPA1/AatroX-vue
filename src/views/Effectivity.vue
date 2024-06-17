<template>
    <div>
      <div class="card-header">
        <div class="card-title py-3">Effectivity cutting Summary per Day</div>
      </div>
      <!-- <div class="dataTable-wrapper dataTable-loading no-footer fixed-columns">
        <table class="table-3 dataTable-table max-w-full w-full">
          <thead>
            <tr>
              <th>Date</th>
              <th>Count</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="effectivity in effectivityData" :key="effectivity.date">
              <td>{{ $date(effectivity.date).format('DD.MM.YYYY') }}</td>
              <td>{{ effectivity.count }}</td>
              <td>{{ effectivity.time }}</td>
            </tr>
          </tbody>
        </table>
      </div> -->
      <div v-if="loaded">
        <line-chart :data="effectivityData" :efficiency="efficiencyData"></line-chart>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, onMounted, onUnmounted } from 'vue';
  import { getEffectivity } from '@/api/api';
  import LineChart from '../views/LineChart.vue';
  
  export default {
    // data() {
    //   return {
    //     loaded: false
    //   }
    // },
    components: { LineChart },
    setup() {
      const effectivityData = ref([]); // Initialize as an empty array
      const efficiencyData = ref([]); // Initialize efficiency data as an empty array
      const loaded = ref(false);

      // const fetchEffectivityData = async () => {
      //   const response = await getEffectivity();
      //   effectivityData.value = response.map(item => ({
      //     count: item.count,
      //     time: item.time,
      //     date: new Date(item.date) // Ensure date is a Date object
      //   }));

      //   // Calculate efficiency based on count and time
      //   efficiencyData.value = effectivityData.value.map(item => ({
      //     efficiency: item.count / item.time,
      //     date: item.date
      //   }));
      // };

      // const intervalId = ref(null);

      // onMounted(async () => {
      //   await fetchEffectivityData(); // Fetch data initially

      //   // Set up interval to fetch data periodically
      //   intervalId.value = setInterval(async () => {
      //     await fetchEffectivityData();
      //   }, 60000); // Fetch data every 60 seconds
      // });

      // onUnmounted(() => {
      //   clearInterval(intervalId.value);
      // });

      onMounted(async () => {
        const response = await getEffectivity();
        effectivityData.value = response.map(item => ({
          count: item.count,
          time: item.time,
          date: new Date(item.date) // Ensure date is a Date object
        }));
        console.log("Loaded effectivity from API:"+effectivityData.value.length)
        // Calculate efficiency based on count and time
        efficiencyData.value = effectivityData.value.map(item => ({
          efficiency: item.count / item.time,
          date: item.date
        }));
        loaded.value = true;
        console.log("Calculated efficiency based on count and time. Number of efficiency data: "+efficiencyData.value.length);
      });
      
      return { effectivityData, efficiencyData, loaded };
    },
  };
  </script>