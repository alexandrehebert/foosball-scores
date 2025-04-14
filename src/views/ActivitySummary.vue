<template>
  <v-card v-if="isCurrentMonthInSeason" color="secondary">
    <v-container>
      <v-row class="flex-wrap">
        <v-col cols="12" sm="12" md="3" class="text-center mb-4 mb-md-0">
          <div class="text-h5">Players of the Month</div>
          <v-icon color="#ffd700">mdi-star-outline</v-icon>
        </v-col>
        <v-col cols="12" md="3" sm="4" class="d-flex flex-column justify-center text-center mb-4 mb-md-0">
          <div class="text-h6">Highest ELO Gain</div>
          <div>{{ highestEloGainPlayer.name }} ({{ highestEloGainPlayer.eloGain }} ELO)</div>
        </v-col>
        <v-col cols="12" md="3" sm="4" class="d-flex flex-column justify-center text-center mb-4 mb-md-0">
          <div class="text-h6">Most Active Player</div>
          <div>{{ mostActivePlayer.name }} ({{ mostActivePlayer.matchesPlayed }} matches)</div>
        </v-col>
        <v-col cols="12" md="3" sm="4" class="d-flex flex-column justify-center text-center mb-4 mb-md-0">
          <div class="text-h6">Longest Win Streak</div>
          <div>{{ longestWinStreakPlayer.name }} ({{ longestWinStreakPlayer.streak }} wins)</div>
        </v-col>
      </v-row>
    </v-container>
  </v-card>
  <v-card class="mt-4">
    <v-container>
      <v-row>
        <v-col cols="12">
          <v-text-field
            v-model="searchQuery"
            label="Search players"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="comfortable"
            hide-details
            clearable
          />
        </v-col>
      </v-row>
      <v-row>
        <v-col
          v-for="player in filteredPlayers"
          :key="player.name"
          cols="12"
          sm="6"
          md="6"
          lg="4"
        >
          <v-card
            :variant="isPlayerInactive(player) ? 'plain' : 'text'"
            :subtitle="'ELO: ' + player.elo + ' | ' + (player.rank ? 'Rank: ' + player.rank : 'Unranked')"
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
                :model-value="[0, ...getEloChanges(player)]"
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
                <v-icon
                  v-if="loseStreak(player) >= 3"
                  class="ml-2"
                  color="blue"
                  size="24"
                  :title="`Lose Streak: ${loseStreak(player)} matches in a row`"
                >
                  mdi-water
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
  filteredPlayers() {
    return this.players.filter(player => 
      player.name.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  },
  isCurrentMonthInSeason() {
    const store = useFoosballStore();
    const currentDate = new Date();
    const monthsPerPeriod = 3;
    const seasonStart = new Date(store.selectedSeason.year, (store.selectedSeason.quarter - 1) * monthsPerPeriod, 1);
    const seasonEnd = new Date(store.selectedSeason.year, store.selectedSeason.quarter * monthsPerPeriod, 0);
    return currentDate >= seasonStart && currentDate <= seasonEnd;
  }
},
watch: {
  searchQuery(newValue) {
    if (!newValue) {
      this.searchQuery = '';
    }
  }
},
setup() {
  const store = useFoosballStore();
  const playersWithRank = computed(() => {
    const players = Object.values(store.players);
    return players
      .map(player => ({
        ...player,
        color: player.color || 'default',
        rank: store.leaderboard.find(entry => entry.player.name === player.name)?.rank,
      }))
      .sort((a, b) => (a.rank ? a.rank : players.length + 1)
        - (b.rank ? b.rank : players.length + 1));
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

  const longestWinStreakPlayer = computed(() => {
    const currentMonth = startOfMonth(new Date());
    const monthlyChanges = store.eloChanges
      .filter(change => change.type === 'match' && isSameMonth(change.date, currentMonth));

    const playerStreaks = Object.values(store.players).reduce((acc, player) => {
      const changes = monthlyChanges
        .filter(change => change.player === player.name)
        .sort((a, b) => compareAsc(a.date, b.date))
        .map(change => change.change);

      let maxStreak = 0;
      let currentStreak = 0;
      changes.forEach(change => {
        if (change > 0) {
          currentStreak++;
          maxStreak = Math.max(maxStreak, currentStreak);
        } else {
          currentStreak = 0;
        }
      });

      return { ...acc, [player.name]: maxStreak };
    }, {} as Record<string, number>);

    const [name, streak] = Object.entries(playerStreaks).reduce((max, entry) => 
      entry[1] > max[1] ? entry : max, ['', 0]);
    return { name, streak };
  });

  return {
    store,
    players: playersWithRank,
    allMatches,
    highestEloGainPlayer,
    mostActivePlayer,
    maxActivity,
    isPlayerInactive,
    longestWinStreakPlayer,
  };
},
data() {
  return {
    isPlayerCardOpen: false, // Add state for player card
    selectedPlayer: null as (Player | null), // Add state for selected player
    searchQuery: '', // Add search query
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
  },
  loseStreak(player: Player) {
    return this.eloChanges
      .filter((change) => change.player === player.name && change.type === 'match')
      .sort((a, b) => compareAsc(a.date, b.date))
      .slice(-10)
      .map(({ change }) => change)
      .reduce((streak, change) => {
        if (change < 0) {
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
