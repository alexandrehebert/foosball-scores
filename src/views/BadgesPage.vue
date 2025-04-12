<template>
  <v-card>
    <v-container>
      <v-row>
        <v-col cols="12">
          <h1>All Badges</h1>
        </v-col>
        <template v-for="(categoryBadges, category) in groupedBadges" :key="category">
          <v-col cols="12">
            <LabeledDivider :label="capitalize(category)" label-size="1.5rem" />
          </v-col>
          <v-col v-for="badge in categoryBadges" :key="badge.id" cols="12" md="6" lg="4">
            <v-card variant="text">
              <v-card-title>
                <v-icon :color="badge.color" class="me-2">{{ badge.icon }}</v-icon>
                {{ badge.name }}
              </v-card-title>
              <v-card-subtitle>{{ badge.category }}</v-card-subtitle>
              <v-card-text>{{ badge.description }}</v-card-text>
            </v-card>
          </v-col>
        </template>
      </v-row>
    </v-container>
  </v-card>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { BADGES } from '../services/badgeService';
import LabeledDivider from '../components/LabeledDivider.vue';

export default defineComponent({
  name: 'BadgesPage',
  components: { LabeledDivider },
  setup() {
    const groupedBadges = computed(() => {
      return BADGES.reduce((groups, badge) => {
        if (!groups[badge.category]) {
          groups[badge.category] = [];
        }
        groups[badge.category].push(badge);
        return groups;
      }, {} as Record<string, typeof BADGES>);
    });

    const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

    return { groupedBadges, capitalize };
  },
});
</script>
