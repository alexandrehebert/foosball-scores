<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <v-toolbar-title>Foosball Leaderboard</v-toolbar-title>
    </v-app-bar>
    <v-main class="v-main">
      <v-container fluid>
        <v-tabs v-model="tab" align-tabs="center" color="primary">
          <v-tab>Leaderboard</v-tab>
          <v-tab>Individual Matches</v-tab>
          <v-tab>Team Matches</v-tab>
          <v-tab>ELO-lution</v-tab>
        </v-tabs>
        <v-card>
          <v-tabs-window v-model="tab">
            <v-tabs-window-item value="0">
              <Leaderboard :players="leaderboard" :matches="matchResults" />
            </v-tabs-window-item>
            <v-tabs-window-item value="1">
              <IndividualMatchTable :matches="individualMatches" />
            </v-tabs-window-item>
            <v-tabs-window-item value="2">
              <TeamMatchTable :matches="teamMatches" />
            </v-tabs-window-item>
            <v-tabs-window-item value="3">
              <LineChart v-if="eloChartData" :data="eloChartData" />
            </v-tabs-window-item>
          </v-tabs-window>
        </v-card>
      </v-container>
    </v-main>
    <v-footer app color="primary" dark>
      <v-col class="text-center white--text">
        © {{ new Date().getFullYear() }} Fairstone Developers
      </v-col>
    </v-footer>
  </v-app>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { VApp, VAppBar, VCard, VToolbar, VToolbarTitle, VMain, VContainer, VRow, VCol, VTabs, VTab, VTabsWindow, VTabsWindowItem, VFooter } from 'vuetify/components';
import Leaderboard from './components/Leaderboard.vue';
import IndividualMatchTable from './components/IndividualMatchTable.vue';
import TeamMatchTable from './components/TeamMatchTable.vue';
import LineChart from './components/LineChart.vue';
import { calculateELO, DEFAULT_ELO, generateLeaderboard } from './utils/elo';
import { parseCSV } from './utils/csv';
import { TEAMS } from './constants';
import { LeaderboardItem, MatchType, MatchWithEloChanges } from './types';
import { parseISO, subDays, format, isSameDay, max } from 'date-fns';

const generateUniqueId = () => Math.random().toString(36).substring(2, 9);

export const loginWithGitHub = () => {
  const clientId = 'Ov23liKXa1Y3s7kuwxH4';
  const redirectUri = encodeURIComponent(window.location.origin);
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=read:user`;
  window.location.href = githubAuthUrl;
};

export default defineComponent({
  name: 'App',
  components: {
    VApp,
    VCard,
    VAppBar,
    VMain,
    VToolbar,
    VToolbarTitle,
    VContainer,
    VRow,
    VCol,
    VTabs,
    VTab,
    VTabsWindow,
    VTabsWindowItem,
    VFooter,
    Leaderboard,
    TeamMatchTable,
    IndividualMatchTable,
    LineChart,
  },
  setup() {
    const tab = ref(0);
    const leaderboard = ref<LeaderboardItem[]>([]);
    const individualMatches = ref<MatchWithEloChanges[]>([]);
    const teamMatches = ref<MatchWithEloChanges[]>([]);
    const matchResults = ref<MatchWithEloChanges[]>([]);
    const eloChartData = ref({});

    onMounted(async () => {
      const matchesResponse = await fetch('/matches.csv');
      const teamMatchesResponse = await fetch('/team-matches.csv');

      const matchesCSV = await matchesResponse.text();
      const teamMatchesCSV = await teamMatchesResponse.text();

      const individualMatchesProcessed = parseCSV(matchesCSV).rows.map(row => ({
        id: generateUniqueId(),
        opponents: { blue: [row[0]], red: [row[1]] },
        winner: [row[2]],
        date: parseISO(row[3]),
        type: MatchType.INDIVIDUAL,
      }));

      const teamMatchesProcessed = parseCSV(teamMatchesCSV).rows.map(row => ({
        id: generateUniqueId(),
        opponents: { blue: row.slice(0, 2), red: row.slice(2, 4) },
        winner: row[4] === TEAMS.BLUE ? row.slice(0, 2) : row.slice(2, 4),
        date: parseISO(row[5]),
        type: MatchType.TEAM,
      }));

      const { players, matchResults: matchesWithElo, eloChanges } = calculateELO([...individualMatchesProcessed, ...teamMatchesProcessed]);

      individualMatches.value = matchesWithElo.filter(({ type }) => type === MatchType.INDIVIDUAL);
      teamMatches.value = matchesWithElo.filter(({ type }) => type === MatchType.TEAM);
      matchResults.value = matchesWithElo;
      leaderboard.value = generateLeaderboard(players);

      // Generate ELO chart data
      const eloByDate: Record<string, Record<string, number>> = {};
      const allPlayers = Object.keys(players);

      // Add default ELO for each player the day before their first match
      const firstMatchDates: Record<string, Date> = {};
      const lastMatchDate = max(eloChanges.map(({ date }) => date));
      eloChanges.forEach(({ player, date }) => {
        if (!firstMatchDates[player] || date < new Date(firstMatchDates[player])) {
          firstMatchDates[player] = date;
        }
      });

      Object.entries(firstMatchDates).forEach(([player, firstMatchDate]) => {
        const dayBefore = format(subDays(firstMatchDate, 1), 'yyyy-MM-dd');
        if (!eloByDate[dayBefore]) eloByDate[dayBefore] = {};
        eloByDate[dayBefore][player] = DEFAULT_ELO;
      });

      // Process ELO changes
      eloChanges.forEach(({ player, change, date }) => {
        const day = format(date, 'yyyy-MM-dd'); // Format date as YYYY-MM-DD
        if (isSameDay(date, firstMatchDates[player])) {
          const dayBefore = format(subDays(date, 1), 'yyyy-MM-dd');
          if (!eloByDate[dayBefore]) eloByDate[dayBefore] = {};
          if (!eloByDate[dayBefore][player]) eloByDate[dayBefore][player] = DEFAULT_ELO;
        }
        if (!eloByDate[day]) eloByDate[day] = { ...eloByDate[Object.keys(eloByDate).pop() || day] }; // Carry forward previous day's ELOs
        if (!eloByDate[day][player]) eloByDate[day][player] = eloByDate[Object.keys(eloByDate).pop() || day][player] || DEFAULT_ELO;
        eloByDate[day][player] += change;
      });

      // Add the current ELO of each player as the last data point
      const lastMatchDateFormatted = format(lastMatchDate, 'yyyy-MM-dd');
      eloByDate[lastMatchDateFormatted] = { ...eloByDate[Object.keys(eloByDate).pop() || lastMatchDateFormatted] };
      allPlayers.forEach(player => {
        if (firstMatchDates[player]) {
          eloByDate[lastMatchDateFormatted][player] = players[player];
        }
      });

      const sortedDates = Object.keys(eloByDate).sort();
      const labels = sortedDates;
      const datasets = allPlayers.map(player => {
        let previousElo: number | undefined = undefined;
        return {
          label: player,
          data: sortedDates.map(date => {
            if (eloByDate[date]?.[player] !== undefined) {
              previousElo = eloByDate[date][player];
            }
            return previousElo;
          }),
          fill: false,
          borderColor: `#${Math.floor(Math.random() * 16777215).toString(16)}`, // Random color
          tension: 0.1,
        };
      });

      eloChartData.value = { labels, datasets };
    });
    return { tab, leaderboard, individualMatches, teamMatches, matchResults, eloChartData };
  },
});
</script>

<style>
.v-main {
  max-width: 720px;
  margin: 0 auto;
  flex: 1 0 auto;
  padding-bottom: 8rem; /* Add padding to the bottom */
}
</style>