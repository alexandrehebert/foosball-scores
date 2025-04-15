<template>
  <v-card>
    <v-select
      v-model="selectedPlayers"
      :items="playerNames"
      label="Highlight Players"
      outlined
      dense
      multiple
      clearable
    />
    <div class="chart-container">
      <Line :data="processedData" :options="chartOptions" />
    </div>
    <div class="custom-legend">
      <div
        v-for="player in playerNames"
        :key="player"
        class="legend-item"
        :style="{ opacity: selectedPlayers.length === 0 || selectedPlayers.includes(player) ? 1 : 0.5 }"
        @click="togglePlayerHighlight(player)"
      >
        <v-avatar :color="getPlayerColor(player)" size="24" class="mr-2">
          <v-icon size="x-small">mdi-account</v-icon>
        </v-avatar>
        <span>{{ player }}</span>
      </div>
    </div>
  </v-card>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from 'vue';
import { Line } from 'vue-chartjs';
import { useFoosballStore } from '../store';
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
import { generateELOChartData } from '../services/eloService';

ChartJS.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement);

export default defineComponent({
  name: 'EloEvolution',
  components: { Line },
  setup() {
    const store = useFoosballStore();
    const players = computed(() => store.players);
    const eloChanges = computed(() => store.eloChanges);
    const selectedPlayers = ref<string[]>([]);

    const playerNames = computed(() => Object.keys(players.value)
      .sort((a, b) => a.localeCompare(b)));

    const chartData = computed(() =>
      generateELOChartData(players.value, eloChanges.value)
    );

    const processedData = computed(() => {
      const highlightAll = selectedPlayers.value.length === 0; // Highlight all if none selected
      return {
        ...chartData.value,
        datasets: chartData.value.datasets.map((dataset: any) => {
          const isHighlighted =
            highlightAll || selectedPlayers.value.includes(dataset.label);
          return {
            ...dataset,
            borderColor: isHighlighted
              ? getPlayerColor(dataset.label)
              : 'rgba(200, 200, 200, 0.5)', // Dim other players
            borderWidth: isHighlighted ? 3 : 1, // Thicker line for highlighted players
            backgroundColor: isHighlighted
              ? getPlayerColor(dataset.label)
              : 'rgba(200, 200, 200, 0.2)', // Dim other players
          };
        }),
      };
    });

    const togglePlayerHighlight = (player: string) => {
      if (selectedPlayers.value.includes(player)) {
        selectedPlayers.value = selectedPlayers.value.filter((p) => p !== player);
      } else {
        selectedPlayers.value.push(player);
      }
    };

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: {
            display: false,
          },
        },
        y: {
          grid: {
            display: false,
          },
        },
      },
      elements: {
        line: {
          tension: 0.1,
        },
      },
      plugins: {
        legend: {
          display: false, // Disable default legend
        },
        tooltip: {
          callbacks: {
            label: (tooltipItem: any) => {
              const playerName = tooltipItem.dataset.label;
              const eloChange = tooltipItem.raw; // Assuming raw contains Elo change
              return ` ${playerName}: ${eloChange}`;
            },
          },
        },
      },
    };

    return {
      processedData,
      chartOptions,
      playerNames,
      selectedPlayers,
      getPlayerColor,
      togglePlayerHighlight,
    };
  },
});
</script>

<style scoped>
.chart-container {
  margin: auto;
  min-height: 500px;
  max-height: 800px;
  max-width: 800px;
  width: 100%;
  padding: 0;
}

.custom-legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  margin: 2rem 0 2rem 0;
  gap: 1rem;
}

.legend-item {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
}
</style>
