<template>
  <div class="chart-container">
    <Line :data="data" :options="chartOptions" />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
} from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement);

export default defineComponent({
  name: 'LineChart',
  components: { Line },
  props: {
    data: {
      type: Object as PropType<any>,
      required: true,
      default: () => ({
        labels: [],
        datasets: [],
      }),
    },
    chartOptions: {
      type: Object as PropType<any>,
      required: false,
      default: () => ({
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: {
              display: false, // Hide grid for x-axis
            },
          },
          y: {
            grid: {
              display: false, // Hide grid for y-axis
            },
          },
        },
        elements: {
          line: {
            tension: 0.1, // Make lines more curvy
          },
        },
        plugins: {
          legend: {
            position: 'bottom',
            title: { display: true },
          },
        },
      }),
    },
  },
});
</script>

<style scoped>
.chart-container {
  position: relative;
  height: 400px;
  padding: 1rem;
}
</style>
