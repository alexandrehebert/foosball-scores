<template>
  <v-icon
    v-if="match"
    size="x-small"
    :color="color"
    :title="getMatchSummary(match)"
  >
    mdi-circle
  </v-icon>
  <v-icon v-else size="x-small" :color="'rgba(211, 211, 211, 0.7)'">
    mdi-circle
  </v-icon>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { MatchType, MatchWithEloChanges } from '../types';

export default defineComponent({
  name: 'DotWithTooltip',
  props: {
    color: {
      type: String,
      required: true,
    },
    match: {
      type: Object as () => MatchWithEloChanges | undefined,
      required: false,
    },
  },
  methods: {
    getMatchSummary(match: MatchWithEloChanges) {
      if (match.type === MatchType.INDIVIDUAL) {
        return `Winner: ${match.winner[0]} | Opponent: ${match.loser[0]}`;
      }
      if (match.type === MatchType.TEAM) {
        return `Winners: ${match.winner.join(', ')} | Opponents: ${match.loser.join(', ')}`;
      }
    },
  },
});
</script>
