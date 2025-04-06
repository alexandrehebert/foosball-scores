<template>
  <div class="chart-container">
    <Line :data="processedData" :options="chartOptions" />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue';
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
import { getPlayerColor } from '../utils/color';

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
  setup(props) {
    const processedData = computed(() => {
      return {
        ...props.data,
        datasets: props.data.datasets.map((dataset: any) => ({
          ...dataset,
          borderColor: getPlayerColor(dataset.label), // Set line color based on player name
          backgroundColor: getPlayerColor(dataset.label), // Set fill color if applicable
        })),
      };
    });

    return { processedData };
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
