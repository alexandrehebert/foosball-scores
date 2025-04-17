import { createRouter, createWebHashHistory, createWebHistory, RouteRecordRaw } from 'vue-router';
import Leaderboard from '../views/Leaderboard.vue';
import MatchTable from '../views/MatchTable.vue';
import EloEvolution from '../views/EloEvolution.vue';
import ActivitySummary from '../views/ActivitySummary.vue';
import BadgesPage from '../views/BadgesPage.vue';
import { BASE_URL, IS_GH_PAGES } from '../constants';
import Tournament from '../views/Tournament.vue';
import { useFoosballStore } from '../store';

const routes: RouteRecordRaw[] = [
  { 
    path: '/', 
    redirect: () => {
      const store = useFoosballStore();
      // const currentYear = new Date().getFullYear();
      // const currentQuarter = Math.floor(new Date().getMonth() / 3) + 1;
      const sport = store.selectedSport ?? 'foosball';
      // const latestSeason = store.availableSeasons?.[0] ?? currentYear + '#Q' + currentQuarter;
      // const [year, quarter] = latestSeason.split('#Q');
      return `/${sport}/leaderboard`;
    }
  },
  { path: '/:sport/', redirect: to => `/${to.params.sport}/leaderboard` },
  { path: '/:sport/leaderboard', component: Leaderboard },
  { path: '/:sport/tournament', component: Tournament },
  { path: '/:sport/matches', component: MatchTable },
  { path: '/:sport/elo-evolution', component: EloEvolution },
  { path: '/:sport/activity', component: ActivitySummary },
  { path: '/:sport/badges', name: 'Badges', component: BadgesPage },
];

const router = createRouter({
  history: IS_GH_PAGES
  ? createWebHashHistory(BASE_URL)
  : createWebHistory(BASE_URL),
  routes,
});

export default router;
