<template>
  <v-tooltip>
    <template v-slot:activator="{ props }">
      <v-btn 
        fab
        icon
        size="large"
        color="primary"
        class="floating-btn"
        v-bind="props"
        @click="onClick"
      >
        <v-icon>{{ icon }}</v-icon>
      </v-btn>
    </template>
    <span>{{ label }}</span>
  </v-tooltip>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'FloatingButton',
  props: {
    onClick: {
      type: Function,
      required: true,
    },
    icon: {
      type: String,
      default: 'mdi-plus', // Default icon
    },
    label: {
      type: String,
      default: 'Add Match', // Default label
    },
  },
});
</script>

<style scoped>
.floating-btn {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 1000;
}
</style>