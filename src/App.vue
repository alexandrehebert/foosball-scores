<template>
  <v-app>
    <v-app-bar app color="primary" class="px-2">
      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn v-bind="props" variant="text" icon="mdi-menu">
          </v-btn>
        </template>
        <v-list density="compact">
          <v-list-item
            v-for="(link, index) in routerLinks"
            :key="index"
            @click="navigateTo(link.route)"
          >
            <template v-slot:prepend>
              <v-icon color="primary">{{ link.icon }}</v-icon>
            </template>
            <v-list-item-title class="px-0">{{ link.label }}</v-list-item-title>
          </v-list-item>
          <v-divider />
          <v-list-item key="badges"
            @click="navigateTo('/badges')"
          >
            <template v-slot:prepend>
              <v-icon color="primary">mdi-shield-star-outline</v-icon>
            </template>
            <v-list-item-title>Badges</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
      <v-toolbar-title>
        <router-link to="/" class="text-decoration-none text-white">
          FairPlay
        </router-link>
      </v-toolbar-title>
      <v-btn-toggle v-model="selectedSport"
        color="primary"
        mandatory
        density="compact"
      >
        <v-btn icon size="small" value="foosball">
          <v-icon>mdi-soccer</v-icon>
        </v-btn>
        <v-btn icon size="small" value="table-tennis">
          <v-icon>mdi-table-tennis</v-icon>
        </v-btn>
      </v-btn-toggle>
      <v-divider vertical class="ml-4 mr-2" />
      <v-select
        v-model="selectedSeason"
        :items="store.availableSeasons"
        label="Season"
        outlined
        variant="outlined"
        density="compact"
        hide-details
        class="mx-2"
        style="max-width: 150px;"
        @change="selectedSeason = $event"
      />
      <v-tooltip location="bottom">
        <template v-slot:activator="{ props }">
          <v-btn variant="text" icon :href="githubRepository" target="_blank"
            v-bind="props">
            <v-icon>mdi-github</v-icon>
          </v-btn>
        </template>
        <span>Leaderboard Repository</span>
      </v-tooltip>
    </v-app-bar>
    <v-main class="v-main">
      <v-container>
        <v-row justify="center" class="d-none d-lg-flex pb-2" style="justify-self: center;">
          <v-col v-for="(link, index) in routerLinks" :key="index" class="align-center">
            <router-link :to="link.route" custom>
              <template v-slot="{ navigate }">
                <v-btn
                  :variant="isActive(link.route) ? 'tonal' : 'text'"
                  :color="isActive(link.route) ? 'primary' : ''"
                  @click="navigate"
                  :prepend-icon="link.icon"
                >
                  {{ link.label }}
                </v-btn>
              </template>
            </router-link>
          </v-col>
        </v-row>
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<script lang="ts">
import { defineComponent, computed, onMounted, watch } from 'vue';
import { useFoosballStore } from './store';
import { useRouter } from 'vue-router';
import { GITHUB_REPOSITORY } from './constants';
import { Sport } from './types';

export default defineComponent({
  name: 'App',
  computed: {
    githubRepository: () => GITHUB_REPOSITORY,
  },
  setup() {
    const store = useFoosballStore();
    const router = useRouter();

    const routerLinks = [
      { label: 'Leaderboard', icon: 'mdi-podium-gold', route: '/leaderboard' },
      { label: 'Tournament', icon: 'mdi-trophy-outline', route: '/tournament' },
      { label: 'Matches', icon: 'mdi-account-group-outline', route: '/matches' },
      { label: 'ELO-lution', icon: 'mdi-chart-line', route: '/elo-evolution' },
      { label: 'Activity', icon: 'mdi-calendar', route: '/activity' },
    ];

    const navigateTo = (route: string) => {
      router.push(route);
    };

    const isActive = (route: string) => {
      return router.currentRoute.value.path === route;
    };

    const selectedSeason = computed({
      get: () => `${store.selectedSeason.year}#Q${store.selectedSeason.quarter}`,
      set: (value: string) => {
        const [year, quarter] = value.split('#Q').map(Number);
        store.setSelectedSeason({ year, quarter });
      },
    });

    const selectedSport = computed({
      get: () => store.selectedSport,
      set: (value: Sport) => {
        store.setSelectedSport(value);
      },
    });

    // Watch for changes in selectedSeason and reload data
    watch(
      () => store.selectedSeason,
      async () => {
        await store.loadData();
      },
      { deep: true }
    );

    // Watch for changes in selectedSeason and reload data
    watch(
      () => store.selectedSport,
      async () => {
        await store.loadData();
      },
      { deep: true }
    );

    onMounted(async () => {
      await store.loadData();
    });

    return { store, routerLinks, navigateTo, isActive, selectedSeason, selectedSport };
  },
});
</script>

<style scoped>
.v-main {
  padding-bottom: 4rem;
}
</style>