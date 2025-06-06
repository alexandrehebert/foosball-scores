<template>
  <v-card variant="outlined" class="mb-4">
    <v-card-title>Filter Matches</v-card-title>
    <v-card-text>
      <v-row>
        <v-col cols="12" md="4">
          <v-select
            v-model="selectedBlue"
            :items="players"
            label="Select Player"
            clearable
            hide-details="auto"
          >
            <template v-slot:selection="{ item }">
              {{ item.raw.name }}
            </template>
            <template v-slot:item="{ props, item }">
              <v-list-item v-bind="props" :title="''">
                <v-avatar>
                  <v-icon :color="item.raw.color">mdi-account</v-icon>
                </v-avatar>
                {{ item.raw.name }}
              </v-list-item>
            </template>
          </v-select>
        </v-col>
        <v-col cols="12" md="4">
          <v-select
            v-model="selectedRed"
            :items="players"
            label="Select Opponent"
            clearable
            hide-details="auto"
          >
            <template v-slot:selection="{ item }">
              {{ item.raw.name }}
            </template>
            <template v-slot:item="{ props, item }">
              <v-list-item v-bind="props" :title="''">
                <v-avatar>
                  <v-icon :color="item.raw.color">mdi-account</v-icon>
                </v-avatar>
                {{ item.raw.name }}
              </v-list-item>
            </template>
          </v-select>
        </v-col>
        <v-col cols="12" md="4">
          <v-select
            v-model="selectedMatchType"
            :items="MATCH_TYPES"
            item-value="type"
            label="Match Type"
            clearable
            hide-details="auto"
          >
            <template v-slot:selection="{ item }">
              {{ item.raw.label }}
            </template>
            <template v-slot:item="{ props, item }">
              <v-list-item v-bind="props" :title="''">
                <v-icon class="mr-1">{{ item.raw.icon }}</v-icon>
                {{ item.raw.label }}
              </v-list-item>
            </template>
          </v-select>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12" class="d-flex justify-end">
          <v-btn @click="clearFilters" variant="text" color="primary">Clear Filters</v-btn>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
  <v-data-table :headers="headers" :items="filteredMatches" item-value="id" class="elevation-1">
    <template #item.blue="{ item }">
      <EloDisplay :isWinner="isWinner(item, 'blue')"
        :eloChange="isWinner(item, 'blue') ? item.winnerEloChange : item.loserEloChange" />
      <span
        :class="{ winner: isWinner(item, 'blue'), loser: !isWinner(item, 'blue') }">
        {{ item.opponents.blue.join(' & ') }}
      </span>
    </template>
    <template #item.type="{ item }">
      <v-icon>{{ getMatchType(item.type)?.icon }}</v-icon>
    </template>
    <template #item.red="{ item }">
      <span
        :class="{ winner: isWinner(item, 'red'), loser: !isWinner(item, 'red') }">
        {{ item.opponents.red.join(' & ') }}
      </span>
      <EloDisplay :isWinner="isWinner(item, 'red')"
        :eloChange="isWinner(item, 'red') ? item.winnerEloChange : item.loserEloChange" />
    </template>
    <template #item.date="{ item }">
      {{ formatDate(item.date) }}
    </template>
  </v-data-table>

  <v-fab
    icon
    app
    color="primary"
    size="large"
    location="right bottom"
  >
    <v-icon>mdi-sword-cross</v-icon>
    <v-speed-dial
      v-model="open"
      open-on-hover
      open-on-click
      activator="parent"
      location="top center"
    >
      <v-btn key="individual" icon color="secondary" @click="redirectToGitHub(MatchType.INDIVIDUAL)">
        <v-tooltip activator="parent">
          <span>Add Individual Match</span>
        </v-tooltip>
        <v-icon size="24">mdi-account</v-icon>
      </v-btn>
      <v-btn key="team" icon color="secondary" @click="redirectToGitHub(MatchType.TEAM)">
        <v-tooltip activator="parent">
          <span>Add Team Match</span>
        </v-tooltip>
        <v-icon size="24">mdi-account-group</v-icon>
      </v-btn>
      <v-btn key="simulation" icon color="secondary" @click="openSimulateMatchDialog">
        <v-tooltip activator="parent">
          <span>Match Simulation</span>
        </v-tooltip>
        <v-icon size="24">mdi-gamepad-variant</v-icon>
      </v-btn>
    </v-speed-dial>
  </v-fab>

  <MatchSimulationDialog v-model:isDialogOpen="isSimulateMatchDialogOpen" />
</template>

<script lang="ts">
import { defineComponent, computed, ref, shallowRef } from 'vue';
import { useFoosballStore } from '../store';
import EloDisplay from '../components/EloDisplay.vue';
import MatchSimulationDialog from '../components/MatchSimulationDialog.vue';
import { formatDate } from '../utils/dates';
import { MatchType, MatchWithEloChanges, Player } from '../types';
import { compareAsc } from 'date-fns';
import { GITHUB_REPOSITORY_DATA_EDIT } from '../constants';

export default defineComponent({
  name: 'MatchTable',
  computed: {
    MATCH_TYPES() {
      return [
        { type: MatchType.INDIVIDUAL, label: 'Individual', icon: 'mdi-account' },
        { type: MatchType.TEAM, label: 'Team', icon: 'mdi-account-group' },
      ];
    },
    MatchType() {
      return MatchType;
    },
  },
  methods: {
    getMatchType(type: MatchType) {
      return this.MATCH_TYPES.find((matchType) => matchType.type === type);
    },
  },
  setup() {
    const store = useFoosballStore();
    const sport = computed(() => store.selectedSport);
    const allMatches = computed(() => store.matchResults.sort((a, b) => compareAsc(b.date, a.date)));
    const players = computed(() => Object.values(store.players).sort((a, b) => a.name.localeCompare(b.name)));

    const selectedMatchType = ref<string | null>(null);
    const selectedBlue = ref<Player | null>(null);
    const selectedRed = ref<Player | null>(null);

    const redirectToGitHub = (matchType: MatchType) => {
      const url =
        matchType === MatchType.TEAM
          ? GITHUB_REPOSITORY_DATA_EDIT + '/' + sport.value + '/team-matches.csv'
          : GITHUB_REPOSITORY_DATA_EDIT + '/' + sport.value  + '/matches.csv';
      window.open(url, '_blank');
    };

    const headers = [
      { title: 'Blue', key: 'blue', align: 'end' as const, sortable: false },
      { title: 'Vs', key: 'type', align: 'center' as const, sortable: false },
      { title: 'Red', key: 'red', sortable: false },
      { title: 'Date', key: 'date' },
    ];

    const filteredMatches = computed(() => {
      return allMatches.value
      .filter((match) => selectedMatchType.value === null || match.type === selectedMatchType.value)
      .filter((match) => {
        if (selectedBlue.value && selectedRed.value) {
          const blueTeam = match.opponents.blue.includes(selectedBlue.value.name) && match.opponents.blue.includes(selectedRed.value.name);
          const redTeam = match.opponents.red.includes(selectedBlue.value.name) && match.opponents.red.includes(selectedRed.value.name);
          if (blueTeam || redTeam) {
            return false;
          }
        }
        const blueMatches =
          !selectedBlue.value ||
          match.opponents.blue.includes(selectedBlue.value.name) || 
          match.opponents.red.includes(selectedBlue.value.name);
        const redMatches =
          !selectedRed.value ||
          match.opponents.blue.includes(selectedRed.value.name) || 
          match.opponents.red.includes(selectedRed.value.name);
        return blueMatches && redMatches;
      });
    });

    const isWinner = (item: MatchWithEloChanges, team: 'red' | 'blue') => {
      return item.winner.every(w => item.opponents[team].includes(w));
    };

    const clearFilters = () => {
      selectedMatchType.value = null;
      selectedBlue.value = null;
      selectedRed.value = null;
    };
    
    const open = shallowRef(false);

    const isSimulateMatchDialogOpen = ref(false);

    const openSimulateMatchDialog = () => {
      isSimulateMatchDialogOpen.value = true;
    };

    return {
      open,
      selectedMatchType,
      selectedBlue,
      selectedRed,
      players,
      redirectToGitHub,
      headers,
      filteredMatches,
      formatDate,
      isWinner,
      clearFilters,
      isSimulateMatchDialogOpen,
      openSimulateMatchDialog,
    };
  },
  components: {
    EloDisplay,
    MatchSimulationDialog,
  },
});
</script>

<style scoped>
.v-data-table thead th {
  background-color: #f5f5f5; /* Light gray background */
  color: #000; /* Black text */
  font-weight: bold;
  text-align: center;
}
.winner {
  color: green;
  font-weight: bold;
}
.loser {
  color: red;
}
</style>
