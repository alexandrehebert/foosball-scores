<template>
    <v-btn size="x-small" variant="text" icon @click="openTeamCard()"
        :title="'View Profile of ' + team.members.join(' & ')">
        <v-avatar size="24" :color="getTeamColor(team.members)">
            <v-icon size="small">mdi-account-group</v-icon>
        </v-avatar>
    </v-btn>
    <TeamCard :isOpen="isTeamCardOpen" :team="team" @update:isOpen="isTeamCardOpen = $event" />
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import TeamCard from './TeamCard.vue';
import { type TeamRankingItem } from '../types';
import { getTeamColor } from '../utils/color';

export default defineComponent({
    name: "TeamAvatarBtn",
    components: {
        TeamCard,
    },
    data() {
        return {
            isTeamCardOpen: false,
        }
    },
    props: {
        team: {
            type: Object as PropType<TeamRankingItem>,
            required: true,
        },
    },
    methods: {
        openTeamCard() {
            this.isTeamCardOpen = true;
        },
        getTeamColor,
    },
});
</script>

<style scoped>
.profile-button {
    /* Add custom styles here if needed */
}
</style>