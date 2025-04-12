<template>
  <v-card class="mb-4">
    <!-- Player Rankings -->
    <v-data-table :headers="headers" :items="players" item-value="rankId" :items-per-page="-1" hide-default-footer>
      <template #item="{ item }">
        <tr :class="getRowClass(item)">
          <td>
            <div class="rank-container">
              <span>{{ item.rank }}</span>
              <v-icon v-if="item.rankVariation !== 0" :class="getRankVariationClass(item.rankVariation)"
                :title="'Rank variation: ' + (item.rankVariation > 0 ? '+' + item.rankVariation : item.rankVariation)"
                size="x-small">
                {{ getRankVariationIcon(item.rankVariation) }}
              </v-icon>
            </div>
          </td>
          <td>
            <div class="player-container">
              <v-btn class="profile-button mr-2" size="x-small" variant="text" icon @click="openPlayerCard(item)"
                :title="'View Profile of ' + item.player.name">
                <v-avatar size="24" :color="getPlayerColor(item.player.name)">
                  <v-icon size="small">mdi-account</v-icon>
                </v-avatar>
              </v-btn>
              <div :style="{ flexGrow: 1 }">
                {{ item.player.name }}
              </div>
              <v-icon v-if="item.rank === 1" class="crown-icon" size="small">
                mdi-trophy-award
              </v-icon>
            </div>
          </td>
          <td>{{ item.player.elo }}</td>
          <!-- Hide or display "Last 10 Matches" columns based on screen size -->
          <td class="last-10-matches">
            <div class="dots-container">
              <DotWithTooltip v-for="(result, i) in paddedResults(item.last10IndividualResults)" :key="i"
                :color="getDotColor(result)" :match="item.last10IndividualMatches[i]" />
            </div>
          </td>
          <td class="last-10-matches">
            <div class="dots-container">
              <DotWithTooltip v-for="(result, i) in paddedResults(item.last10TeamResults)" :key="i"
                :color="getDotColor(result)" :match="item.last10TeamMatches[i]" />
            </div>
          </td>
        </tr>
      </template>
    </v-data-table>
  </v-card>

  <!-- Team Rankings -->
  <v-card>
    <v-data-table :headers="teamsHeaders" :items="teams" item-value="team" :items-per-page="-1" hide-default-footer>
      <template #item="{ item }">
        <tr :class="getRowClass(item)">
          <td>{{ item.rank }}</td>
          <td class="player-container">
            <v-btn class="profile-button mr-2" size="x-small" variant="text" icon @click="openTeamCard(item)"
              :title="'View Profile of ' + item.members.join(' & ')">
              <v-avatar size="24" :color="getTeamColor(item.members)">
                <v-icon size="small">mdi-account-group</v-icon>
              </v-avatar>
            </v-btn>
            <div :style="{ flexGrow: 1 }">
              {{ item.members.join(' & ') }}
            </div>
            <v-icon v-if="item.rank === 1" class="crown-icon" size="small">
              mdi-trophy-award
            </v-icon>
          </td>
          <td class="last-10-matches">
            <div class="dots-container">
              <DotWithTooltip v-for="(result, i) in paddedResults(item.last10Results)" :key="i"
                :color="getDotColor(result)" :match="item.last10Matches[i]" />
            </div>
          </td>
          <td>{{ item.wins }}</td>
          <td>{{ item.losses }}</td>
        </tr>
      </template>
    </v-data-table>
  </v-card>

  <PlayerCard :isOpen="isPlayerCardOpen" :player="selectedPlayer" @update:isOpen="isPlayerCardOpen = $event" />
  <TeamCard :isOpen="isTeamCardOpen" :team="selectedTeam" @update:isOpen="isTeamCardOpen = $event" />
  <MatchSimulationDialog v-model:isDialogOpen="isSimulateMatchDialogOpen" />
  <FloatingButton :onClick="openSimulateMatchDialog" icon="mdi-gamepad-variant" label="Simulate Match" />
</template>

<script lang="ts">
import { defineComponent, computed, ref, onMounted, onUnmounted } from 'vue';
import { useFoosballStore } from '../store';
import DotWithTooltip from '../components/DotWithTooltip.vue';
import PlayerCard from '../components/PlayerCard.vue';
import TeamCard from '../components/TeamCard.vue';
import MatchSimulationDialog from '../components/MatchSimulationDialog.vue';
import FloatingButton from '../components/FloatingButton.vue';
import { LeaderboardItem } from '../types';
import { getPlayerColor } from '../utils/color';
import { generateTeamRankings } from '../services/eloService';

const HEADERS = [
  { title: 'Rank', key: 'rank', width: '40px' },
  { title: 'Player', key: 'player' },
  { title: 'ELO Score', key: 'elo', width: '40px' },
  { title: 'Last 10 Individual Matches', key: 'last10IndividualResults' },
  { title: 'Last 10 Team Matches', key: 'last10TeamResults' },
];

const TEAMS_HEADERS = [
  { title: 'Rank', key: 'rank', width: '40px' },
  { title: 'Team', key: 'team' },
  { title: 'Last 10 Matches', key: 'last10Results' },
  { title: 'Wins', key: 'wins', width: '40px' },
  { title: 'Losses', key: 'losses', width: '40px' },
];

export default defineComponent({
  name: 'Leaderboard',
  setup() {
    const store = useFoosballStore();
    const players = computed(() => store.leaderboard);
    const matches = computed(() => store.matchResults);
    const eloChanges = computed(() => store.eloChanges);
    const teams = computed(() => generateTeamRankings(store.matchResults));

    const isSmallScreen = ref(window.innerWidth < 768);

    const updateScreenSize = () => {
      isSmallScreen.value = window.innerWidth < 768;
    };

    onMounted(() => {
      window.addEventListener('resize', updateScreenSize);
    });

    onUnmounted(() => {
      window.removeEventListener('resize', updateScreenSize);
    });

    const headers = computed(() => {
      return isSmallScreen.value
        ? HEADERS.filter(header => header.key !== 'last10IndividualResults' && header.key !== 'last10TeamResults')
        : HEADERS;
    });

    const teamsHeaders = computed(() => {
      return isSmallScreen.value
        ? TEAMS_HEADERS.filter(header => header.key !== 'last10Results')
        : TEAMS_HEADERS;
    });

    return { players, matches, eloChanges, teams, headers, teamsHeaders };
  },
  components: {
    DotWithTooltip,
    PlayerCard,
    TeamCard,
    MatchSimulationDialog,
    FloatingButton,
  },
  data() {
    return {
      isPlayerCardOpen: false,
      selectedPlayer: { name: '', elo: 0, rank: 0, color: '' },
      isTeamCardOpen: false,
      selectedTeam: { members: [] as string[], rank: 0 },
      isSimulateMatchDialogOpen: false,
    };
  },
  methods: {
    paddedResults(results: string[]) {
      const padding = Array(10 - results.length).fill("EMPTY");
      return [...results, ...padding];
    },
    getDotColor(result: string) {
      if (result === "WIN") return 'green';
      if (result === "LOSS") return 'red';
      return 'rgba(211, 211, 211, 0.5)';
    },
    getRowClass(item: { readonly rank: number }) {
      if (item.rank === 1) return 'gold-row';
      if (item.rank === 2) return 'silver-row';
      if (item.rank === 3) return 'bronze-row';
      return '';
    },
    getRankVariationIcon(variation: number) {
      return variation > 0 ? 'mdi-arrow-up' : 'mdi-arrow-down';
    },
    getRankVariationClass(variation: number) {
      return variation > 0 ? 'rank-up' : 'rank-down';
    },
    openPlayerCard(player: LeaderboardItem) {
      this.selectedPlayer = {
        name: player.player.name,
        elo: player.player.elo,
        rank: player.rank,
        color: player.player.color,
      };
      this.isPlayerCardOpen = true;
    },
    openTeamCard(team: { members: string[]; rank: number }) {
      this.selectedTeam = team;
      this.isTeamCardOpen = true;
    },
    getPlayerColor(playerName: string) {
      return getPlayerColor(playerName);
    },
    getTeamColor(members: string[]) {
      const concatenatedNames = members.join('');
      return getPlayerColor(concatenatedNames);
    },
    openSimulateMatchDialog() {
      this.isSimulateMatchDialogOpen = true;
    },
  },
});
</script>

<style scoped>
.dots-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: left;
  gap: 4px;
}

.rank-container {
  display: flex;
  align-items: center;
  gap: 4px;
}

.player-container {
  display: flex;
  align-items: center;
}

.sub-line {
  margin-top: 8px;
}

.gold-row {
  background-color: #ffd700;
}

.silver-row {
  background-color: #c0c0c0;
}

.bronze-row {
  background-color: #cd7f32;
}

.rank-up {
  color: green;
  font-weight: bold;
}

.rank-down {
  color: red;
  font-weight: bold;
}

.crown-icon {
  margin-left: 4px;
}

.profile-icon {
  cursor: pointer;
  color: #007bff;
}

.profile-button {
  cursor: pointer;
  color: #007bff;
}

/* Hide "Last 10 Matches" columns on smaller screens */
@media (max-width: 768px) {
  .last-10-matches {
    display: none;
  }
}
</style>