<template>
  <v-card v-if="player" variant="text" :class="{ 'text-right': placement === 'right' }">
    <v-card-title
      class="text-h6 d-flex align-center justify-space-between px-0"
      :style="{ justifySelf: placement === 'right' ? 'end' : 'start' }"
    >
      {{ player }}
    </v-card-title>
    <v-card-text class="pa-0" :class="{ 'text-right': placement === 'right' }">
      <span :class="`text-${color}`" :style="{ color }">
        {{ winProbability.toFixed(1) }}%
      </span>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'SimulationPlayerCard',
  props: {
    player: {
      type: String,
      required: false,
      default: null,
    },
    color: {
      type: String,
      required: false,
      default: undefined,
    },
    placement: {
      type: String,
      required: false,
      default: 'left',
    },
    winProbability: {
      type: Number,
      required: true,
    },
  },
});
</script>
