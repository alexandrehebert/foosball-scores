<template>
  <v-app>
    <v-app-bar app color="primary">
      <div class="d-lg-none">
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" variant="text" icon="mdi-menu">
            </v-btn>
          </template>
          <v-list>
            <v-list-item
              v-for="(link, index) in routerLinks"
              :key="index"
              @click="navigateTo(link.route)"
            >
              <v-icon class="me-2">{{ link.icon }}</v-icon>
              <v-list-item-title>{{ link.label }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
      <v-toolbar-title style="text-align: center;">
        Foosball
        <v-icon size="large">mdi-soccer-field</v-icon>
        Leaderboard
      </v-toolbar-title>
      <v-tooltip>
        <template v-slot:activator="{ props }">
          <v-btn variant="text" icon @click="navigateTo('/badges')" v-bind="props">
            <v-icon>mdi-shield-star-outline</v-icon>
          </v-btn>
        </template>
        <span>All Badges</span>
      </v-tooltip>
      <v-tooltip>
        <template v-slot:activator="{ props }">
          <v-btn variant="text" icon href="https://github.com/Fairstone-Financial-DEV/foosball-frontend" target="_blank"
            v-bind="props">
            <v-icon>mdi-github</v-icon>
          </v-btn>
        </template>
        <span>Foosball Repository</span>
      </v-tooltip>
      <v-select
        v-model="selectedSeason"
        :items="store.availableSeasons"
        label="Season"
        outlined
        density="compact"
        hide-details
        class="mx-2"
        style="max-width: 150px;"
        @change="selectedSeason = $event"
      />
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

export default defineComponent({
  name: 'App',
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
      get: () => `${store.selectedSeason.year}#S${store.selectedSeason.semester}`,
      set: (value: string) => {
        const [year, semester] = value.split('#S').map(Number);
        store.setSelectedSeason({ year, semester });
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

    onMounted(async () => {
      await store.loadData();
    });

    return { store, routerLinks, navigateTo, isActive, selectedSeason };
  },
});
</script>

<style scoped>
.v-main {
  padding-bottom: 4rem;
}
</style>