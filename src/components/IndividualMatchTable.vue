<template>
  <v-data-table
    :headers="headers"
    :items="reversedMatches"
    item-value="id"
    class="elevation-1"
  >
    <template #item.bluePlayer="{ item }">
      <span :class="{ winner: item.winner.includes(item.opponents.blue[0]), loser: !item.winner.includes(item.opponents.blue[0]) }">
        {{ item.opponents.blue[0] }}
      </span>
      <EloDisplay
        :isWinner="item.winner.includes(item.opponents.blue[0])"
        :eloChange="item.winner.includes(item.opponents.blue[0]) ? item.winnerEloChange : item.loserEloChange"
      />
    </template>
    <template #item.redPlayer="{ item }">
      <span :class="{ winner: item.winner.includes(item.opponents.red[0]), loser: !item.winner.includes(item.opponents.red[0]) }">
        {{ item.opponents.red[0] }}
      </span>
      <EloDisplay
        :isWinner="item.winner.includes(item.opponents.red[0])"
        :eloChange="item.winner.includes(item.opponents.red[0]) ? item.winnerEloChange : item.loserEloChange"
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
  name: 'IndividualMatchTable',
  components: {
    VDataTable,
    EloDisplay,
  },
  props: {
    matches: {
      type: Array as PropType<MatchWithEloChanges[]>,
      required: true,
    },
  },
  computed: {
    headers() {
      return [
        { title: 'Blue Player', key: 'bluePlayer' },
        { title: 'Red Player', key: 'redPlayer' },
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