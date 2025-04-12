import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router';
import Leaderboard from '../views/Leaderboard.vue';
import MatchTable from '../views/MatchTable.vue';
import EloEvolution from '../views/EloEvolution.vue';
import ActivitySummary from '../views/ActivitySummary.vue';
import BadgesPage from '../views/BadgesPage.vue';
import { BASE_URL, IS_GH_PAGES } from '../constants';
import Tournament from '../views/Tournament.vue';

const routes = [
  { path: '/', redirect: '/leaderboard' },
  { path: '/leaderboard', component: Leaderboard },
  { path: '/tournament', component: Tournament },
  { path: '/matches', component: MatchTable },
  { path: '/elo-evolution', component: EloEvolution },
  { path: '/activity', component: ActivitySummary },
  { path: '/badges', name: 'Badges', component: BadgesPage },
];

const router = createRouter({
  history: IS_GH_PAGES
  ? createWebHashHistory(BASE_URL)
  : createWebHistory(BASE_URL),
  routes,
});

export default router;
