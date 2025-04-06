<template>
  <v-chip
    :color="isWinner ? 'green' : 'red'"
    text-color="white"
    small
    outlined
    class="elo-chip"
  >
    {{ isWinner ? '+' : '-' }}{{ Math.abs(Math.round(eloChange)) }}
  </v-chip>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { VChip } from 'vuetify/components';

export default defineComponent({
  name: 'EloDisplay',
  components: {
    VChip,
  },
  props: {
    isWinner: {
      type: Boolean,
      required: true,
    },
    eloChange: {
      type: Number,
      required: true,
    },
  },
});
</script>

<style scoped>
.elo-chip {
  margin: 0 .5rem;
}
</style>
