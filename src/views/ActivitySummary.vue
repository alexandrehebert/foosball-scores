<template>
  <v-card>
    <v-container>
      <v-row>
        <v-col cols="12">
          <v-banner color="primary" variant="text">
            <v-row class="flex-wrap">
              <v-col cols="12" md="4" class="text-center mb-4 mb-md-0">
                <div class="text-h5">Players of the Month</div>
                <v-icon color="#ffd700">mdi-star-outline</v-icon>
              </v-col>
              <v-col cols="12" md="4" class="text-center mb-4 mb-md-0">
                <div class="text-h6">Highest ELO Gain</div>
                <div>{{ highestEloGainPlayer.name }} ({{ highestEloGainPlayer.eloGain }} ELO)</div>
              </v-col>
              <v-col cols="12" md="4" class="text-center mb-4 mb-md-0">
                <div class="text-h6">Most Active Player</div>
                <div>{{ mostActivePlayer.name }} ({{ mostActivePlayer.matchesPlayed }} matches)</div>
              </v-col>
            </v-row>
          </v-banner>
        </v-col>
      </v-row>
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
            :variant="isPlayerInactive(player) ? 'plain' : 'text'"
            :subtitle="'ELO: ' + player.elo + ' | Rank: ' + player.rank"
            @click="openPlayerCard(player)"
            class="pb-4 position-relative"
          >
            <v-sheet class="elo-sparkline d-flex items-center position-absolute top-0 bottom-0 left-0 right-0" color="transparent">
              <v-sparkline
                :auto-line-width="true"
                :fill="false"
                :gradient="['#f72047', '#ffd200', '#1feaea']"
                gradient-direction="top"
                line-width="3"
                :model-value="getEloChanges(player)"
                padding="2"
                smooth="10"
                stroke-linecap="round"
                type="trend"
                auto-draw
                :color="player.color"
              />
            </v-sheet>
            <template v-slot:title>
              <div class="d-flex align-center">
                {{ player.name }}
                <v-icon
                  v-if="winStreak(player) >= 3"
                  class="ml-2"
                  color="red"
                  size="24"
                  :title="`Win Streak: ${winStreak(player)} matches in a row`"
                >
                  mdi-fire
                </v-icon>
              </div>
            </template>
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
import { startOfMonth, isSameMonth, compareAsc } from 'date-fns';

export default defineComponent({
  name: 'ActivitySummary',
  components: {
    ActivityHeatmap,
    PlayerCard,
  },
  computed: {
    eloChanges() {
      return this.store.eloChanges;
    },
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

    const highestEloGainPlayer = computed(() => {
      const currentMonth = startOfMonth(new Date());
      const eloChanges = store.eloChanges.filter(change => change.type === 'match' && isSameMonth(change.date, currentMonth));
      const playerEloGains = eloChanges.reduce((acc, change) => {
        acc[change.player] = (acc[change.player] || 0) + change.change;
        return acc;
      }, {} as Record<string, number>);
      const [name, eloGain] = Object.entries(playerEloGains).reduce((max, entry) => entry[1] > max[1] ? entry : max, ['', 0]);
      return { name, eloGain };
    });

    const mostActivePlayer = computed(() => {
      const currentMonth = startOfMonth(new Date());
      const matchesThisMonth = allMatches.value.filter(match => isSameMonth(match.date, currentMonth));
      const playerMatchCounts = matchesThisMonth.reduce((acc, match) => {
        match.opponents.blue.concat(match.opponents.red).forEach(player => {
          acc[player] = (acc[player] || 0) + 1;
        });
        return acc;
      }, {} as Record<string, number>);
      const [name, matchesPlayed] = Object.entries(playerMatchCounts).reduce((max, entry) => entry[1] > max[1] ? entry : max, ['', 0]);
      return { name, matchesPlayed };
    });

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

    const isPlayerInactive = (player: Player) => {
      const uniqueMatchDays = Array.from(
        new Set(allMatches.value.map((match) => formatDay(match.date)))
      ).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
      const last3Days = uniqueMatchDays.slice(-DECAY_PERIOD_DAYS);
      const last3DaysMatches = allMatches.value.filter((match) => {
        const matchDay = formatDay(match.date);
        return last3Days.includes(matchDay);
      });
      for (const match of last3DaysMatches) {
        if (match.opponents.blue.includes(player.name) || match.opponents.red.includes(player.name)) {
          return false;
        }
      }
      return true;
    };

    return {
      store,
      players: playersWithRank,
      allMatches,
      highestEloGainPlayer,
      mostActivePlayer,
      maxActivity,
      isPlayerInactive,
    };
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
    getEloChanges(player: Player): number[] {
      return this.eloChanges
        .filter((change) => change.player === player.name)
        .sort((a, b) => compareAsc(a.date, b.date))
        .slice(-10)
        .map(({ change }) => change);
    },
    winStreak(player: Player) {
      return this.eloChanges
        .filter((change) => change.player === player.name && change.type === 'match')
        .sort((a, b) => compareAsc(a.date, b.date))
        .slice(-10)
        .map(({ change }) => change)
        .reduce((streak, change) => {
          if (change > 0) {
            streak++;
          } else {
            streak = 0;
          }
          return streak;
        }, 0);
    }
  },
});
</script>

<style scoped>
.elo-sparkline {
  z-index: -1;
  opacity: 0.2;
}
</style>
