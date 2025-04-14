<template>
  <v-row wrap no-gutters class="align-center" :style="{ margin: '1.3rem 0 .7rem 0' }">
    <v-col>
      <v-divider />
    </v-col>
    <v-col class="text-center">
      <span :style="{ fontSize: labelSize }">{{ label }}</span>
    </v-col>
    <v-col>
      <v-divider />
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'LabeledDivider',
  props: {
    label: {
      type: String,
      required: true,
    },
    labelSize: {
      type: String,
      default: '1rem', // Default size for the label
    },
  },
});
</script>

<style scoped>
/* Add any specific styles if needed */
</style>
