<template>
  <v-dialog v-model="localIsOpen" max-width="400" @update:modelValue="emitClose">
    <v-card>
      <v-card-title>
        <div class="d-flex align-center justify-space-between w-100">
          <div>
            <span class="text-h6">{{ teamName }}</span>
            <div class="text-subtitle-2">Rank: {{ team.rank }}</div>
          </div>
          <div class="d-flex flex-column align-end" style="gap: 0.2rem;">
            <v-progress-circular
              :model-value="winRate"
              :color="winRateColor"
              size="36"
              width="6"
            >
            </v-progress-circular>
            <span class="text-body-2">Win rate: {{ Math.round(winRate) }}%</span>
          </div>
        </div>
      </v-card-title>
      <LabeledDivider label="Match History" />
      <table>
        <tbody>
          <tr v-for="(match, index) in matches.slice(-5)" :key="index">
            <td :style="{ width: '50%', fontWeight: match.opponents.blue.some(player => team.members.includes(player)) ? 'bold' : 'normal', color: match.opponents.blue.includes(match.winner[0]) ? 'green' : 'red', textAlign: 'right' }">
              {{ match.opponents.blue.join(', ') }}
            </td>
            <td :style="{ textAlign: 'center', padding: '0.3rem', color: match.winner.some(player => team.members.includes(player)) ? 'green' : 'red' }">
              <v-icon>mdi-sword-cross</v-icon>
            </td>
            <td :style="{ width: '50%', fontWeight: match.opponents.red.some(player => team.members.includes(player)) ? 'bold' : 'normal', color: match.opponents.red.includes(match.winner[0]) ? 'green' : 'red', textAlign: 'left' }">
              {{ match.opponents.red.join(', ') }}
            </td>
          </tr>
        </tbody>
      </table>
      <v-card-actions>
        <v-btn text @click="emitClose">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue';
import { useFoosballStore } from '../store';
import LabeledDivider from './LabeledDivider.vue';
import ActivityHeatmap from './ActivityHeatmap.vue';
import { compareAsc } from 'date-fns';
import { MatchType } from '../types';

export default defineComponent({
  name: 'TeamCard',
  components: {
    ActivityHeatmap,
    LabeledDivider,
  },
  props: {
    isOpen: {
      type: Boolean,
      required: true,
    },
    team: {
      type: Object as PropType<{ members: string[]; rank: number }>,
      required: true,
    },
  },
  setup() {
    const store = useFoosballStore();
    const allMatches = computed(() => store.matchResults
      .filter(match => match.type === MatchType.TEAM));
    return { allMatches };
  },
  computed: {
    matches() {
      return this.allMatches.filter((match) =>
        match.opponents.blue.every(player => this.team.members.includes(player)) ||
        match.opponents.red.every(player => this.team.members.includes(player))
      ).sort((a, b) => compareAsc(b.date, a.date))
        .slice(-5);
    },
    localIsOpen: {
      get() {
        return this.isOpen;
      },
      set(value: boolean) {
        if (value) {
          this.$emit('update:isOpen', true);
        } else {
          this.emitClose();
        }
      },
    },
    teamName() {
      return this.team.members.join(' & ');
    },
    winRate() {
      const teamMatches = this.allMatches.filter((match) =>
        match.opponents.blue.every(player => this.team.members.includes(player)) ||
        match.opponents.red.every(player => this.team.members.includes(player))
      );
      const wins = teamMatches.filter((match) =>
        match.winner.some(player => this.team.members.includes(player))
      ).length;
      return teamMatches.length > 0 ? (wins / teamMatches.length) * 100 : 0;
    },
    winRateColor() {
      if (this.winRate >= 75) return 'green';
      if (this.winRate >= 50) return 'orange';
      return 'red';
    },
  },
  methods: {
    emitClose() {
      this.$emit('update:isOpen', false);
    },
  },
});
</script>

<style scoped>
.heatmap {
  display: flex;
  justify-content: center;
}
</style>
