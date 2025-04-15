<template>
  <v-card class="mb-4">
    <v-data-table :headers="headers" :items="leaderboard" item-value="rankId" :items-per-page="-1" hide-default-footer>
      <template #item="{ item }">
        <tr :class="[getPodiumColor(item), { 'placement-row': item.placement === 'unranked' }]">
          <td>
            <div class="rank-container">
              <span v-if="item.placement === 'ranked'">{{ item.rank }}</span>
              <v-tooltip v-else>
                <template #activator="{ props }">
                  <v-icon class="placement-icon p-0" size="small" v-bind="props">
                    mdi-information
                  </v-icon>
                </template>
                <span>This player is in placement (fewer than 5 matches played).</span>
              </v-tooltip>
              <v-icon v-if="item.rankVariation !== null && item.rankVariation !== 0 && item.placement === 'ranked'" :class="getRankVariationClass(item.rankVariation)"
                :title="'Rank variation: ' + (item.rankVariation > 0 ? '+' + item.rankVariation : item.rankVariation)"
                size="x-small">
                {{ getRankVariationIcon(item.rankVariation) }}
              </v-icon>
            </div>
          </td>
          <td>
            <div class="player-container">
              <PlayerAvatarBtn :player="item.player" />
              <div class="ml-2 flex-grow-1">
                {{ item.player.name }}
              </div>
              <v-icon v-if="isLeader(item)" class="crown-icon" size="small">
                mdi-trophy-award
              </v-icon>
            </div>
          </td>
          <td>{{ item.player.elo }}</td>
          <td class="d-none d-md-table-cell">
            <div class="dots-container">
              <DotWithTooltip v-for="(result, i) in paddedResults(item.last10IndividualResults)" :key="i"
                :color="getDotColor(result)" :match="item.last10IndividualMatches[i]" />
            </div>
          </td>
          <td class="d-none d-md-table-cell">
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
    <v-data-table :headers="teamsHeaders" :items="filteredTeams" item-value="team" :items-per-page="-1" hide-default-footer>
      <template #item="{ item }">
        <tr :class="getTeamPodiumColor(item)">
          <td>{{ item.rank }}</td>
          <td class="player-container">
            <TeamAvatarBtn :team="item" />
            <div class="ml-2 flex-grow-1">
              {{ item.members.join(' & ') }}
            </div>
            <v-icon v-if="item.rank === 1" class="crown-icon" size="small">
              mdi-trophy-award
            </v-icon>
          </td>
          <td>{{ item.elo }}</td>
          <td class="d-none d-md-table-cell">
            <div class="dots-container">
              <DotWithTooltip v-for="(result, i) in paddedResults(item.last10Results)" :key="i"
                :color="getDotColor(result)" :match="item.last10Matches[i]" />
            </div>
          </td>
          <td class="d-none d-md-table-cell">{{ item.wins }}</td>
          <td class="d-none d-md-table-cell">{{ item.losses }}</td>
        </tr>
      </template>
    </v-data-table>
    <v-btn v-if="hasMoreTeams" @click="showMoreTeams" block class="d-flex mt-2" style="justify-self: center;" variant="text">Show More</v-btn>
  </v-card>

  <TeamCard v-if="selectedTeam" :isOpen="isTeamCardOpen" :team="selectedTeam" @update:isOpen="isTeamCardOpen = $event" />
</template>

<script lang="ts">
import { defineComponent, computed, ref, onMounted, onUnmounted } from 'vue';
import { useFoosballStore } from '../store';
import DotWithTooltip from '../components/DotWithTooltip.vue';
import PlayerCard from '../components/PlayerCard.vue';
import TeamCard from '../components/TeamCard.vue';
import PlayerAvatarBtn from '../components/PlayerAvatarBtn.vue';
import TeamAvatarBtn from '../components/TeamAvatarBtn.vue';
import { LeaderboardItem, TeamRankingItem } from '../types';
import { generateTeamRankings } from '../services/eloService';

const HEADERS = [
  { title: 'Rank', key: 'rank', width: '40px' },
  { title: 'Player', key: 'player.name' },
  { title: 'ELO Score', key: 'player.elo', width: '40px' },
  { title: 'Last 10 Individual Matches', key: 'last10IndividualResults', sortable: false },
  { title: 'Last 10 Team Matches', key: 'last10TeamResults', sortable: false },
];

const TEAMS_HEADERS = [
  { title: 'Rank', key: 'rank', width: '40px' },
  { title: 'Team', key: 'team', sortable: false },
  { title: 'ELO Combined', key: 'elo', width: '40px' },
  { title: 'Last 10 Matches', key: 'last10Results', sortable: false },
  { title: 'Wins', key: 'wins', width: '40px' },
  { title: 'Losses', key: 'losses', width: '40px' },
];

export default defineComponent({
  name: 'Leaderboard',
  computed: {
    filteredTeams() {
      return this.teams.slice(0, this.teamsToShow);
    },
    hasMoreTeams() {
      return this.teamsToShow < this.teams.length;
    }
  },
  setup() {
    const store = useFoosballStore();
    const players = computed(() => store.leaderboard);
    const matches = computed(() => store.matchResults);
    const eloChanges = computed(() => store.eloChanges);
    const teams = computed(() => generateTeamRankings(store.matchResults, store.players));

    const leaderboard = computed(() => players.value);

    const isSmallScreen = ref(window.innerWidth < 960);

    const updateScreenSize = () => {
      isSmallScreen.value = window.innerWidth < 960;
    };

    onMounted(() => {
      window.addEventListener('resize', updateScreenSize);
    });

    onUnmounted(() => {
      window.removeEventListener('resize', updateScreenSize);
    });

    const headers = computed(() => {
      return isSmallScreen.value
        ? HEADERS.filter(header => !['last10IndividualResults', 'last10TeamResults'].includes(header.key))
        : HEADERS;
    });

    const teamsHeaders = computed(() => {
      return isSmallScreen.value
        ? TEAMS_HEADERS.filter(header => !['last10Results', 'wins', 'losses'].includes(header.key))
        : TEAMS_HEADERS;
    });

    return { players, leaderboard, matches, eloChanges, teams, headers, teamsHeaders };
  },
  components: {
    DotWithTooltip,
    PlayerCard,
    PlayerAvatarBtn,
    TeamCard,
    TeamAvatarBtn,
  },
  data() {
    return {
      isPlayerCardOpen: false,
      isTeamCardOpen: false,
      selectedTeam: undefined as (TeamRankingItem | undefined),
      isSimulateMatchDialogOpen: false,
      teamsToShow: 5, // Initial number of teams to show
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
    isLeader(item: LeaderboardItem) {
      return item.rank === 1;
    },
    getPodiumColor(item: LeaderboardItem) {
      if (item.placement === 'unranked') return ''; // Placement players should not have podium colors
      switch (item.rank) {
        case 1:
          return 'bg-medal-gold';
        case 2:
          return 'bg-medal-silver';
        case 3:
          return 'bg-medal-bronze';
        default:
          return '';
      }
    },
    getTeamPodiumColor(item: { rank: number }) {
      switch (item.rank) {
        case 1:
          return 'bg-medal-gold';
        case 2:
          return 'bg-medal-silver';
        case 3:
          return 'bg-medal-bronze';
        default:
          return '';
      }
    },
    getRankVariationIcon(variation: number) {
      return variation > 0 ? 'mdi-arrow-up' : 'mdi-arrow-down';
    },
    getRankVariationClass(variation: number) {
      return variation > 0 ? 'rank-up' : 'rank-down';
    },
    openTeamCard(team: TeamRankingItem) {
      this.selectedTeam = team;
      this.isTeamCardOpen = true;
    },
    openSimulateMatchDialog() {
      this.isSimulateMatchDialogOpen = true;
    },
    showMoreTeams() {
      this.teamsToShow += 5;
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

.placement-icon {
  color: orange;
  margin-left: 4px;
}

.placement-row {
  background-color: rgba(211, 211, 211, 0.5); /* Light gray background */
  color: gray;
}
</style>