<template>
  <v-data-table
    :headers="headers"
    :items="reversedMatches"
    item-value="id"
    class="elevation-1"
  >
    <template #item.blueTeam="{ item }">
      <span :class="{ winner: item.winner.every(w => item.opponents.blue.includes(w)), loser: !item.winner.every(w => item.opponents.blue.includes(w)) }">
        {{ item.opponents.blue.join(', ') }}
      </span>
      <EloDisplay
        :isWinner="item.winner.every(w => item.opponents.blue.includes(w))"
        :eloChange="item.winner.every(w => item.opponents.blue.includes(w)) ? item.winnerEloChange : item.loserEloChange"
      />
    </template>
    <template #item.redTeam="{ item }">
      <span :class="{ winner: item.winner.every(w => item.opponents.red.includes(w)), loser: !item.winner.every(w => item.opponents.red.includes(w)) }">
        {{ item.opponents.red.join(', ') }}
      </span>
      <EloDisplay
        :isWinner="item.winner.every(w => item.opponents.red.includes(w))"
        :eloChange="item.winner.every(w => item.opponents.red.includes(w)) ? item.winnerEloChange : item.loserEloChange"
      />
    </template>
    <template #item.date="{ item }">
      {{ format(item.date, 'dd/MM/yyyy') }}
    </template>
  </v-data-table>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { VDataTable } from 'vuetify/components';
import EloDisplay from './EloDisplay.vue';
import { format } from 'date-fns';
import { MatchWithEloChanges } from '../types';

export default defineComponent({
  name: 'TeamMatchTable',
  components: {
    VDataTable,
    EloDisplay,
  },
  props: {
    matches: {
      type: Array as PropType<MatchWithEloChanges[]>, // Updated to use MatchWithEloChanges
      required: true,
    },
  },
  computed: {
    headers() {
      return [
        { title: 'Blue Team', key: 'blueTeam' },
        { title: 'Red Team', key: 'redTeam' },
        { title: 'Date', key: 'date' },
      ];
    },
    reversedMatches() {
      return [...this.matches].reverse();
    },
  },
  methods: {
    format,
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