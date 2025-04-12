<template>
  <v-dialog
    v-model="isDialogOpen"
    max-width="500"
    :persistent="false"
    @click:outside="$emit('update:isDialogOpen', false)"
  >
    <v-card>
      <v-card-title>Match Simulation</v-card-title>
      <v-card-text>
        <v-select
          v-model="selectedBluePlayer"
          :items="playerNames"
          label="Blue Player"
          outlined
        />
        <v-select
          v-model="selectedRedPlayer"
          :items="playerNames"
          label="Red Player"
          outlined
        />
        <div v-if="selectedBluePlayer && selectedRedPlayer">
          <v-row cols="12">
            <v-col>
              <SimulationPlayerCard
                key="blue"
                :player="selectedPlayers.blue || undefined"
                color="blue"
                placement="left"
                :win-probability="winProbability.blue"
              />
            </v-col>
            <v-col cols="2" class="d-flex align-center justify-center">
              <v-icon>mdi-sword-cross</v-icon>
            </v-col>
            <v-col>
              <SimulationPlayerCard
                key="red"
                :player="selectedPlayers.red || undefined"
                color="red"
                placement="right"
                :win-probability="winProbability.red"
              />
            </v-col>
          </v-row>
          <div class="d-flex flex-column justify-space-between mb-4">
            <v-progress-linear
              height="20"
              rounded
              :buffer-value="winProbability.blue + 1"
              bg-color="red"
              bg-opacity=".8"
              color="blue"
              opacity=".8"
              :model-value="winProbability.blue"
              buffer-color="white"
              buffer-opacity=".7"
              max="100"
              min="0"
            />
          </div>
          <v-row>
            <v-col
              v-for="(_, color) in selectedPlayers"
              :key="color"
              :class="{ 'text-right': color === 'red' }"
            >
              <v-chip color="green" text-color="white" class="ma-1">
                Win: +{{ eloChange[color].win }}
              </v-chip>
              <v-chip color="red" text-color="white" class="ma-1">
                Loss: {{ eloChange[color].loss }}
              </v-chip>
            </v-col>
          </v-row>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-btn text @click="$emit('update:isDialogOpen', false)">Cancel</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from 'vue';
import { useFoosballStore } from '../store';
import EloDisplay from '../components/EloDisplay.vue';
import FloatingButton from '../components/FloatingButton.vue';
import SimulationPlayerCard from './SimulationPlayerCard.vue'; // Import the new component
import { formatDate } from '../utils/dates';
import { getDynamicKFactor } from '../services/eloService';

export default defineComponent({
  name: 'MatchSimulationDialog',
  props: {
    isDialogOpen: {
      type: Boolean,
      required: true,
    },
  },
  emits: ['update:isDialogOpen'],
  setup() {
    const store = useFoosballStore();
    const matches = computed(() => store.individualMatches);
    const playerNames = computed(() => Object.keys(store.players));

    const selectedBluePlayer = ref<string | null>(null);
    const selectedRedPlayer = ref<string | null>(null);

    const selectedPlayers = computed(() => ({
      blue: selectedBluePlayer.value,
      red: selectedRedPlayer.value,
    }));

    const winProbability = computed(() => {
      if (!selectedBluePlayer.value || !selectedRedPlayer.value) return { blue: 0, red: 0 };

      const blueElo = store.players[selectedBluePlayer.value].elo;
      const redElo = store.players[selectedRedPlayer.value].elo;

      const blueWinProbElo = 1 / (1 + Math.pow(10, (redElo - blueElo) / 400));

      // Historical match results
      const pastMatches = matches.value.filter(
        (match) =>
          (match.opponents.blue.includes(selectedBluePlayer.value!) &&
            match.opponents.red.includes(selectedRedPlayer.value!)) ||
          (match.opponents.blue.includes(selectedRedPlayer.value!) &&
            match.opponents.red.includes(selectedBluePlayer.value!))
      );

      const blueWins = pastMatches.filter((match) =>
        match.winner.includes(selectedBluePlayer.value!)
      ).length;
      const redWins = pastMatches.filter((match) =>
        match.winner.includes(selectedRedPlayer.value!)
      ).length;
      const totalMatches = blueWins + redWins;

      const historicalWinRateBlue = totalMatches > 0 ? blueWins / totalMatches : 0.5;

      // Combine ELO-based probability and historical win rate
      const weightElo = 0.5;
      const weightHistory = 0.5;

      const combinedBlueWinProb =
        weightElo * blueWinProbElo + weightHistory * historicalWinRateBlue;

      return {
        blue: Math.round(combinedBlueWinProb * 100),
        red: Math.round((1 - combinedBlueWinProb) * 100),
      };
    });

    const eloChange = computed(() => {
      if (!selectedBluePlayer.value || !selectedRedPlayer.value) return { blue: { win: 0, loss: 0 }, red: { win: 0, loss: 0 } };
      const blueElo = store.players[selectedBluePlayer.value].elo;
      const redElo = store.players[selectedRedPlayer.value].elo;

      const kFactor = getDynamicKFactor(blueElo, redElo); // Use the dynamic K-factor logic
      const blueWinProb = 1 / (1 + Math.pow(10, (redElo - blueElo) / 400));
      const redWinProb = 1 - blueWinProb;

      return {
        blue: {
          win: Math.round(kFactor * (1 - blueWinProb)),
          loss: Math.round(kFactor * (0 - blueWinProb)),
        },
        red: {
          win: Math.round(kFactor * (1 - redWinProb)),
          loss: Math.round(kFactor * (0 - redWinProb)),
        },
      };
    });

    const redirectToGitHub = () => {
      window.open('https://github.com/Fairstone-Financial-DEV/foosball-frontend/edit/main/public/matches.csv', '_blank');
    };

    const headers = [
      { title: 'Blue Player', key: 'bluePlayer' },
      { title: 'Red Player', key: 'redPlayer' },
      { title: 'Date', key: 'date' },
    ];

    const reversedMatches = computed(() => [...matches.value].reverse());

    return {
      matches,
      playerNames,
      selectedBluePlayer,
      selectedRedPlayer,
      selectedPlayers,
      winProbability,
      eloChange,
      redirectToGitHub,
      headers,
      reversedMatches,
      formatDate,
    };
  },
  components: {
    EloDisplay,
    FloatingButton,
    SimulationPlayerCard, // Register the new component
  },
  watch: {
    isDialogOpen(newVal) {
      if (newVal) {
        this.selectedBluePlayer = null;
        this.selectedRedPlayer = null;
      }
    },
  },
});
</script>

<style scoped>
.v-data-table thead th {
  background-color: #f5f5f5; /* Light gray background */
  color: #000; /* Black text */
  font-weight: bold;
  text-align: center;
}

.winner {
  color: green;
  font-weight: bold;
}
.loser {
  color: red;
}
</style>