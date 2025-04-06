<template>
  <v-data-table
    :headers="headers"
    :items="playersWithStats"
    item-value="rankId"
    class="elevation-1"
    :items-per-page="-1"
    hide-default-footer
  >
    <template #item="{ item }">
      <tr :class="getRowClass(item)">
        <td style="width: 50px;">{{ item.rank }}</td>
        <td>{{ item.playerName }}</td>
        <td style="width: 100px;">{{ item.elo }}</td>
        <td>
          <div class="dots-container">
            <v-icon
              v-for="(result, i) in paddedResults(item.last10IndividualResults)"
              :key="i"
              :color="getDotColor(result)"
              :style="{ fontSize: '0.7rem' }"
            >
              mdi-circle
            </v-icon>
          </div>
        </td>
        <td>
          <div class="dots-container">
            <v-icon
              v-for="(result, i) in paddedResults(item.last10TeamResults)"
              :key="i"
              :color="getDotColor(result)"
              :style="{ fontSize: '0.7rem' }"
            >
              mdi-circle
            </v-icon>
          </div>
        </td>
      </tr>
    </template>
  </v-data-table>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { VDataTable, VIcon } from 'vuetify/components';
import { MATCH_RESULTS } from '../constants';
import { LeaderboardItem, MatchType, MatchWithEloChanges } from '../types';

type LeaderboardRow = {
  rankId: string;
  rank: number;
  playerName: string;
  elo: number;
  last10IndividualResults: string[];
  last10TeamResults: string[];
}

export default defineComponent({
  name: 'Leaderboard',
  components: {
    VDataTable,
    VIcon,
  },
  props: {
    players: {
      type: Array as PropType<LeaderboardItem[]>,
      required: true,
    },
    matches: {
      type: Array as PropType<MatchWithEloChanges[]>,
      required: true,
    },
  },
  computed: {
    headers() {
      return [
        { title: 'Rank', key: 'rank' },
        { title: 'Player', key: 'playerName' },
        { title: 'ELO Score', key: 'elo' },
        { title: 'Last 10 Individual Matches', key: 'last10IndividualResults' },
        { title: 'Last 10 Team Matches', key: 'last10TeamResults' },
      ];
    },
    playersWithStats() {
      return this.players.map((player, index) => {

        // Filter matches for the current player
        const playerMatches = this.matches.filter(
          (match) =>
            (match.opponents.blue.includes(player.playerName) || match.opponents.red.includes(player.playerName))
        );

        const individualMatches = playerMatches.filter((match) => match.type === MatchType.INDIVIDUAL);
        const teamMatches = playerMatches.filter((match) => match.type === MatchType.TEAM);

        const last10IndividualResults = individualMatches
          .map((match) => (match.winner.includes(player.playerName) ? MATCH_RESULTS.WIN : MATCH_RESULTS.LOSS))
          .slice(-10);

        const last10TeamResults = teamMatches
          .map((match) => (match.winner.includes(player.playerName) ? MATCH_RESULTS.WIN : MATCH_RESULTS.LOSS))
          .slice(-10);

        return {
          rankId: player.playerName,
          rank: index + 1,
          playerName: player.playerName,
          elo: player.elo,
          last10IndividualResults,
          last10TeamResults,
        };
      });
    },
  },
  methods: {
    paddedResults(results: string[]) {
      const padding = Array(10 - results.length).fill(MATCH_RESULTS.EMPTY);
      return [...results, ...padding];
    },
    getDotColor(result: string) {
      if (result === MATCH_RESULTS.WIN) return 'green';
      if (result === MATCH_RESULTS.LOSS) return 'red';
      return 'rgba(211, 211, 211, 0.5)'; // Light gray with 0.5 opacity
    },
    getRowClass(item: LeaderboardRow) {
      if (item.rank === 1) return 'gold-row';
      if (item.rank === 2) return 'silver-row';
      if (item.rank === 3) return 'bronze-row';
      return '';
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

/* Ensure table headers are styled correctly */
.v-data-table thead th {
  background-color: #f5f5f5; /* Light gray background */
  color: #000; /* Black text */
  font-weight: bold;
  text-align: center;
}

.gold-row {
  background-color: #ffd700; /* Gold */
}

.silver-row {
  background-color: #c0c0c0; /* Silver */
}

.bronze-row {
  background-color: #cd7f32; /* Bronze */
}
</style>