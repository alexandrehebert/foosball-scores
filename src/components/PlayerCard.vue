<template>
  <v-dialog v-model="localIsOpen" max-width="400" @update:modelValue="emitClose">
    <v-card>
      <v-card-title>
        <div class="d-flex align-center justify-space-between w-100">
          <div>
            <v-avatar size="40" class="mr-3" :color="playerColor">
              <v-icon>mdi-account</v-icon>
            </v-avatar>
            <span class="text-h6">{{ player.name }}</span>
            <div class="text-subtitle-2">ELO: {{ player.elo }} | Rank: {{ player.rank }}</div>
          </div>
          <div class="d-flex flex-column align-end">
            <v-progress-circular
              :model-value="winRate"
              color="green"
              bg-color="red"
              size="40"
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
            <td :style="{ width: '50%', fontWeight: match.opponents.blue.includes(player.name) ? 'bold' : 'normal', color: match.opponents.blue.includes(match.winner[0]) ? 'green' : 'red', textAlign: 'right' }">
              {{ match.opponents.blue.join(', ') }}
            </td>
            <td :style="{ textAlign: 'center', padding: '0.3rem', color: match.winner.includes(player.name) ? 'green' : 'red' }">
              <v-icon>mdi-sword-cross</v-icon>
            </td>
            <td :style="{ width: '50%', fontWeight: match.opponents.red.includes(player.name) ? 'bold' : 'normal', color: match.opponents.red.includes(match.winner[0]) ? 'green' : 'red', textAlign: 'left' }">
              {{ match.opponents.red.join(', ') }}
            </td>
          </tr>
        </tbody>
      </table>
      <LabeledDivider label="Badges" />
      <div class="badges mx-4 mt-4 mb-2 d-flex flex-wrap justify-center">
        <v-tooltip
          v-for="badge in sortedBadges"
          :key="badge.id"
          location="top"
        >
          <template v-slot:activator="{ props }">
            <v-badge
              v-if="!!badge.count"
              :content="badge.count"
              color="secondary"
              overlap
            >
              <v-chip
                class="text-center px-2 py-2"
                v-bind="props"
                :color="playerBadges.includes(badge.id) ? badge.color : 'grey lighten-2'"
                :variant="playerBadges.includes(badge.id) ? 'flat' : 'tonal'"
                outlined
              >
                <v-icon>{{ badge.icon }}</v-icon>
              </v-chip>
            </v-badge>
            <v-chip
              v-else
              class="text-center px-2 py-2"
              v-bind="props"
              :color="playerBadges.includes(badge.id) ? badge.color : 'grey lighten-2'"
              :variant="playerBadges.includes(badge.id) ? 'flat' : 'tonal'"
              outlined
            >
              <v-icon>{{ badge.icon }}</v-icon>
            </v-chip>
          </template>
          <span>{{ badge.name }}: </span>
          <span>{{ badge.description }}</span>
        </v-tooltip>
      </div>
      <LabeledDivider label="Activity Heatmap" />
      <ActivityHeatmap :playerName="player.name" :allMatches="allMatches" />
      <v-card-actions>
        <v-btn text @click="emitClose">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue';
import { useFoosballStore } from '../store';
import { type Player } from '../types';
import { getPlayerColor } from '../utils/color';
import { calculateBadges, BADGES, CATEGORY_COLORS } from '../services/badgeService';
import LabeledDivider from './LabeledDivider.vue';
import ActivityHeatmap from './ActivityHeatmap.vue';
import { compareAsc } from 'date-fns';

export default defineComponent({
  name: 'PlayerCard',
  components: {
    ActivityHeatmap,
    LabeledDivider,
  },
  props: {
    isOpen: {
      type: Boolean,
      required: true,
    },
    player: {
      type: Object as PropType<Player>,
      required: true,
    },
  },
  setup() {
    const store = useFoosballStore();
    const allMatches = computed(() => store.matchResults);
    const allEloChanges = computed(() => store.eloChanges);

    return { allMatches, allEloChanges };
  },
  computed: {
    matches() {
      return this.allMatches.filter((match) => match.opponents.blue.includes(this.player.name) || match.opponents.red.includes(this.player.name))
        .slice(-5)
        .sort((a, b) => compareAsc(b.date, a.date));
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
    playerColor() {
      return getPlayerColor(this.player.name);
    },
    playerBadges() {
      return calculateBadges([this.player.name], this.allMatches, this.allEloChanges)[this.player.name];
    },
    BADGES() {
      return BADGES;
    },
    sortedBadges() {
      const categoryOrder = Object.keys(CATEGORY_COLORS);
      return this.BADGES.sort(
        (a, b) => categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category)
      );
    },
    winRate() {
      const playerMatches = this.allMatches.filter(
        (match) =>
          match.opponents.blue.includes(this.player.name) || match.opponents.red.includes(this.player.name)
      );
      const wins = playerMatches.filter((match) => match.winner.includes(this.player.name)).length;
      return playerMatches.length > 0 ? (wins / playerMatches.length) * 100 : 0;
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
.badges {
  gap: .8rem;
}
</style>