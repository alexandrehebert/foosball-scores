<template>
  <div class="heatmap">
    <v-icon
      v-for="(count, day) in activityMap"
      :key="day"
      class="heatmap-icon"
      :style="{
        opacity: count > 0 ? Math.min(count / maxActivity, 1) : 1,
        color: count > 0 ? '#4caf50' : '#e0e0e0', // Green for active days, light gray for inactivity
      }"
      :title="day + '\n' + count + ' matches'"
    >
      mdi-checkbox-blank
    </v-icon>
    <v-icon
      v-for="i in 10 - Object.keys(activityMap).length"
      :key="'placeholder-' + i"
      class="heatmap-icon"
      :style="{ color: '#f0f0f0' }"
      title="No activity"
    >
      mdi-checkbox-blank-outline
    </v-icon>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { MatchWithEloChanges } from '../types';
import { formatDay } from '../utils/dates';

export default defineComponent({
  name: 'ActivityHeatmap',
  props: {
    playerName: {
      type: String,
      required: true,
    },
    allMatches: {
      type: Array as PropType<MatchWithEloChanges[]>,
      required: true,
    },
    maxActivityOverride: {
      type: Number,
      required: false,
      default: null, // Default to null if not provided
    },
  },
  computed: {
    activityMap() {
      const activityMap: Record<string, number> = {};

      // Get unique match days from all matches
      const uniqueMatchDays = Array.from(
        new Set(this.allMatches.map((match) => formatDay(match.date)))
      ).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

      // Filter the last 10 match days
      const last10Days = uniqueMatchDays.slice(-10);

      // Initialize the last 10 days with 0 matches
      last10Days.forEach((day) => {
        activityMap[day] = 0;
      });

      // Count matches for each day
      this.allMatches.forEach((match) => {
        const matchDay = formatDay(match.date);
        if (match.opponents.blue.includes(this.playerName) || match.opponents.red.includes(this.playerName)) {
          activityMap[matchDay]++;
        }
      });

      // Keep only the last 10 days in the activity map
      const last10DaysMap: Record<string, number> = {};
      last10Days.forEach((day) => {
        if (activityMap[day] !== undefined) {
          last10DaysMap[day] = activityMap[day];
        }
      });

      return last10DaysMap; // Return counts in chronological order
    },
    maxActivity() {
      // Use the override if provided, otherwise calculate the max activity
      return this.maxActivityOverride !== null
        ? this.maxActivityOverride
        : Math.max(...Object.values(this.activityMap), 1); // Avoid division by zero
    },
  },
});
</script>

<style scoped>
.heatmap {
  display: flex;
  justify-content: center;
}
.heatmap-icon {
  font-size: 24px; /* Adjust icon size */
  margin: 0 2px;
}
</style>
