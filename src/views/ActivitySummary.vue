<template>
  <v-card>
    <v-container>
      <v-row>
        <v-col
          v-for="player in players"
          :key="player.name"
          cols="12"
          sm="6"
          md="6"
          lg="4"
        >
          <v-card
            :variant="isPlayerInactive(player.name) ? 'plain' : 'text'"
            :title="player.name"
            :subtitle="'ELO: ' + player.elo + ' | Rank: ' + player.rank"
            @click="openPlayerCard(player)"
            class="pb-4"
          >
            <template v-slot:prepend>
              <v-avatar size="40" class="mr-3" :color="player.color">
                <v-icon>mdi-account</v-icon>
              </v-avatar>
            </template>
            <ActivityHeatmap :playerName="player.name" :allMatches="allMatches" :maxActivityOverride="maxActivity" />
          </v-card>
        </v-col>
      </v-row>
      <PlayerCard v-if="selectedPlayer" :isOpen="isPlayerCardOpen" :player="selectedPlayer" @update:isOpen="isPlayerCardOpen = $event" />
    </v-container>
  </v-card>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { useFoosballStore } from '../store';
import ActivityHeatmap from '../components/ActivityHeatmap.vue';
import PlayerCard from '../components/PlayerCard.vue'; // Import PlayerCard component
import { DECAY_PERIOD_DAYS } from '../constants';
import { formatDay } from '../utils/dates';
import { Player } from '../types';

export default defineComponent({
  name: 'ActivitySummary',
  components: {
    ActivityHeatmap,
    PlayerCard,
  },
  setup() {
    const store = useFoosballStore();
    const playersWithRank = computed(() => {
      return Object.values(store.players)
        .sort((a, b) => b.elo - a.elo)
        .map((player, index) => ({
          ...player,
          rank: index + 1,
          color: player.color || 'default',
        }));
    });
    const allMatches = computed(() => store.matchResults);

    const maxActivity = computed(() => {
      const activityMap: Record<string, number> = {};
      const uniqueMatchDays = Array.from(
        new Set(allMatches.value.map((match) => formatDay(match.date)))
      ).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
      const last10Days = uniqueMatchDays.slice(-10);
      last10Days.forEach((day) => {
        activityMap[day] = 0;
      });
      allMatches.value.forEach((match) => {
        const matchDay = formatDay(match.date);
        if (last10Days.includes(matchDay)) {
          activityMap[matchDay]++;
        }
      });
      const maxActivity = Math.max(...Object.values(activityMap));
      return maxActivity > 0 ? maxActivity : 1;
    });

    const isPlayerInactive = (playerName: string) => {
      const uniqueMatchDays = Array.from(
        new Set(allMatches.value.map((match) => formatDay(match.date)))
      ).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
      const last3Days = uniqueMatchDays.slice(-DECAY_PERIOD_DAYS);
      const last3DaysMatches = allMatches.value.filter((match) => {
        const matchDay = formatDay(match.date);
        return last3Days.includes(matchDay);
      });
      for (const match of last3DaysMatches) {
        if (match.opponents.blue.includes(playerName) || match.opponents.red.includes(playerName)) {
          return false;
        }
      }
      return true;
    };

    return { players: playersWithRank, allMatches, maxActivity, isPlayerInactive };
  },
  data() {
    return {
      isPlayerCardOpen: false, // Add state for player card
      selectedPlayer: null as (Player | null), // Add state for selected player
    };
  },
  methods: {
    openPlayerCard(player: Player) {
      this.selectedPlayer = player; // Set selected player
      this.isPlayerCardOpen = true; // Open player card
    },
  },
});
</script>

<style scoped>
.heatmap {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}
</style>
