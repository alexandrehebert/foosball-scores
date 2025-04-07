<template>
  <v-tooltip bottom>
    <template  v-slot:activator="{ props }">
      <v-btn
        fab
        color="primary"
        class="floating-btn"
        v-bind="props"
        @click="onClick"
      >
        <v-icon>mdi-plus</v-icon>
      </v-btn>
    </template>
    <span>Add Match</span>
  </v-tooltip>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { VIcon, VBtn, VTooltip } from 'vuetify/components';

export default defineComponent({
  name: 'FloatingButton',
  components: {
    VIcon,
    VBtn,
    VTooltip,
  },
  props: {
    onClick: {
      type: Function,
      required: true,
    },
  },
});
</script>

<style>
.floating-btn {
  position: fixed;
  bottom: 6rem;
  right: 2rem;
  z-index: 1000;
}
</style>