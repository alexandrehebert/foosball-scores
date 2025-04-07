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
              <LineChart v-if="eloChart" :data="eloChart" />
            </v-tabs-window-item>
          </v-tabs-window>
        </v-card>
      </v-container>
      <FloatingButton :onClick="redirectToGitHub" />
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
import { VApp, VAppBar, VCard, VToolbar, VToolbarTitle, VMain, VContainer, VRow, VCol, VTabs, VTab, VTabsWindow, VTabsWindowItem, VFooter, VIcon, VBtn } from 'vuetify/components';
import Leaderboard from './components/Leaderboard.vue';
import IndividualMatchTable from './components/IndividualMatchTable.vue';
import TeamMatchTable from './components/TeamMatchTable.vue';
import LineChart from './components/LineChart.vue';
import FloatingButton from './components/FloatingButton.vue';
import { fetchMatches } from './services/matchService';
import { processELOData, generateELOChartData, generateLeaderboard } from './services/eloService';
import { LeaderboardItem, MatchWithEloChanges } from './types';

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
    VIcon,
    VBtn,
    VFooter,
    Leaderboard,
    TeamMatchTable,
    IndividualMatchTable,
    LineChart,
    FloatingButton,
  },
  setup() {
    const tab = ref(0);
    const leaderboard = ref<LeaderboardItem[]>([]);
    const individualMatches = ref<MatchWithEloChanges[]>([]);
    const teamMatches = ref<MatchWithEloChanges[]>([]);
    const matchResults = ref<MatchWithEloChanges[]>([]);
    const eloChart = ref<{ labels?: string[]; datasets?: any }>({ labels: [], datasets: {} });

    onMounted(async () => {
      const {
        players,
        individualMatches: individualMatchesData,
        teamMatches: teamMatchesData,
        matchResults: matchResultsData,
        eloChanges,
      } = processELOData(await fetchMatches());

      const leaderboardData = generateLeaderboard(players);
      const eloChartData = generateELOChartData(players, eloChanges);

      leaderboard.value = leaderboardData;
      individualMatches.value = individualMatchesData;
      teamMatches.value = teamMatchesData;
      matchResults.value = matchResultsData;
      eloChart.value = eloChartData;
    });

    const redirectToGitHub = () => {
      window.open('https://github.com/alexandrehebert/foosball-scores', '_blank');
    };

    return { tab, leaderboard, individualMatches, teamMatches, matchResults, eloChart, redirectToGitHub };
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