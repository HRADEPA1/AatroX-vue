<template>
  <canvas ref="canvas"></canvas>
</template>

<script>
import { ref, onMounted, watch } from 'vue';
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns'; // Import the date adapter plugin
Chart.register(...registerables);

export default {
  props: {
    data: {
      type: Array,
      required: true
    },
    efficiency: {
      type: Array,
      required: true
    }
  },
  setup(props) {
    const canvas = ref(null);
    let chart = null;

    // const createChart = (data, efficiency) => {
    onMounted(() => {
      if (canvas.value) {
        console.log("Creating chart with data: "+props.data.length+" and efficiency: "+props.efficiency.length);
        chart = new Chart(canvas.value, {
          type: 'line',
          data: {
            labels: props.data.map(item => item.date),
            datasets: [ 
              {
                label: 'Cutting',
                data: props.data.map(item => item.count),
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: false
              },
              {
                label: 'Time [h]',
                data: props.data.map(item => item.time),
                borderColor: 'rgba(153, 102, 255, 1)',
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                fill: false
              }
              ,
              {
                label: 'Efficiency [%]',
                data: props.efficiency.map(item => item.efficiency),
                borderColor: 'rgba(255, 159, 64, 1)',
                backgroundColor: 'rgba(255, 159, 64, 0.2)',
                fill: true,
                tension: 0.4,
                yAxisID: 'y-efficiency'
              }
            ]
          },
          options: {
            scales: {
              x: {
                type: 'time',
                time: {
                  unit: 'day'
                },
                title: {
                  display: true,
                  text: 'Date'
                }
              },
              y: {
                title: {
                  display: true,
                  text: 'Values'
                }
              },
              'y-efficiency': {
                type: 'linear',
                position: 'right',
                title: {
                  display: true,
                  text: 'Efficiency'
                }
              }
            }
          }
        });
      }
    });

    // onMounted(() => {
    //   createChart([], []);
    // });

    watch([props.data, props.efficiency], ([newData, newEfficiency]) => {
      if (chart && newData.length && newEfficiency.length) {
        chart.data.labels = newData.map(item => item.date);
        chart.data.datasets[0].data = newData.map(item => item.count);
        chart.data.datasets[1].data = newData.map(item => item.time);
        chart.data.datasets[2].data = newEfficiency.map(item => item.efficiency);
        chart.update();
      }
    });

    return { canvas };
  }
};
</script>

<style scoped>
canvas {
  max-width: 100%;
  height: auto;
}
</style>