<template>
    <canvas ref="canvas"></canvas>
  </template>
  
  <script>
  import { ref, onMounted, watch } from 'vue';
  import { Chart, registerables } from 'chart.js';
  Chart.register(...registerables);
  
  export default {
    props: {
      data: {
        type: Object,
        required: true
      }
    },
    setup(props) {
      const canvas = ref(null);
      let chart = null;
  
      onMounted(() => {
        if (canvas.value) {
          chart = new Chart(canvas.value, {
            type: 'pie',
            data: {
              labels: Object.keys(props.data),
              datasets: [{
                data: Object.values(props.data),
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
              }]
            }
          });
        }
      });
  
      watch(() => props.data, (newData) => {
        if (chart) {
          chart.data.labels = Object.keys(newData);
          chart.data.datasets[0].data = Object.values(newData);
          chart.update();
        }
      });
  
      return { canvas };
    }
  };
  </script>