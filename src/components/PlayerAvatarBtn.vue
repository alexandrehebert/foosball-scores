<template>
    <v-btn
        class="profile-button"
        size="x-small"
        variant="text"
        icon
        @click="openPlayerCard()"
        :title="'View Profile of ' + player.name"
    >
        <v-avatar size="24" :color="player.color">
            <v-icon size="small">mdi-account</v-icon>
        </v-avatar>
    </v-btn>
    <PlayerCard :isOpen="isPlayerCardOpen" :player="player" @update:isOpen="isPlayerCardOpen = $event" />
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import PlayerCard from './PlayerCard.vue';
import { type Player } from '../types';

export default defineComponent({
    name: "PlayerAvatarBtn",
    components: {
        PlayerCard,
    },
    data() {
        return {
            isPlayerCardOpen: false,
        }
    },
    props: {
        player: {
            type: Object as PropType<Player>,
            required: true,
        },
    },
    methods: {
        openPlayerCard() {
            this.isPlayerCardOpen = true;
        },
    },
});
</script>

<style scoped>
.profile-button {
    /* Add custom styles here if needed */
}
</style>