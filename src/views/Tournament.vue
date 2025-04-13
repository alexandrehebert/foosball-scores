<template>
  <v-card variant="outlined" class="mb-4">
    <v-card-title>Select Tournament Players</v-card-title>
    <v-card-text>
      <v-autocomplete
        v-model="selectedPlayers"
        :items="allPlayers"
        item-text="name"
        item-value="name"
        label="Select Players"
        chips
        closable-chips
        hide-details
        clearable
        multiple
        outlined
        :return-object="true"
        :disabled="tournamentStarted"
        @update:model-value="onPlayersCleared"
      >
        <template v-slot:chip="{ props, item }">
          <v-chip v-bind="props" :prepend-icon="'mdi-account'" :color="item.raw.color">
            {{ item.raw.name }}
          </v-chip>
        </template>
        <template v-slot:item="{ props, item }">
          <v-list-item v-bind="props" :title="''">
            <v-avatar>
              <v-icon :color="item.raw.color">mdi-account</v-icon>
            </v-avatar>
            {{ item.raw.name }}
          </v-list-item>
        </template>
      </v-autocomplete>
      <v-row class="mt-2">
        <v-col cols="12" md="4">
          <v-btn 
            v-if="!tournamentStarted" 
            color="success" 
            block 
            @click="startTournament" 
            :disabled="selectedPlayers.length < 2 || bracket.length > 0"
          >
            Start Tournament
          </v-btn>
          <v-btn 
            v-else 
            color="error" 
            block 
            @click="endTournament"
          >
            End Tournament
          </v-btn>
        </v-col>
        <v-col cols="12" md="4">
          <v-btn color="secondary" block @click="generateTournamentCSV" :disabled="bracket.length === 0">
            Generate Tournament
          </v-btn>
        </v-col>
        <v-col cols="12" md="4">
          <v-btn color="secondary" block @click="openRestoreDrawer">
            Restore Tournament
          </v-btn>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>

  <v-card v-if="bracket.length > 0">
    <v-card-title>Tournament Bracket</v-card-title>
    <v-card-text>
      <v-row>
        <v-col
          v-for="(round, roundIndex) in bracket"
          :key="roundIndex"
          cols="12"
          md="4"
        >
          <v-sheet class="pa-2">
            <div class="text-center mb-2">
              <strong>
                {{ getRoundName(roundIndex, bracket.length) }}
              </strong>
            </div>
            <v-row>
              <v-col
                v-for="(match, matchIndex) in round"
                :key="matchIndex"
                cols="12"
              >
                <v-card class="pa-2 mb-2" :variant="hasWinner(match) ? 'text' : 'plain'">
                  <v-row cols="12">
                    <v-col>
                      <SimulationPlayerCard
                        key="blue"
                        :player="match.player1?.name || undefined"
                        :color="match.player1?.color"
                        placement="left"
                        :win-probability="match.winProbability.player1 * 100"
                      />
                    </v-col>
                    <v-col cols="2" class="d-flex align-center justify-center">
                      <v-icon>{{ !match.player2 ? 'mdi-debug-step-over' : 'mdi-sword-cross' }}</v-icon>
                    </v-col>
                    <v-col>
                      <SimulationPlayerCard
                        key="red"
                        :player="match.player2?.name || undefined"
                        :color="match.player2?.color"
                        placement="right"
                        :win-probability="match.winProbability.player2 * 100"
                      />
                    </v-col>
                  </v-row>
                  <div class="d-flex flex-column justify-space-between mb-4">
                    <v-progress-linear
                      height="20"
                      rounded
                      :buffer-value="(match.winProbability.player1 * 100) + 1"
                      :bg-color="match.player2?.color"
                      bg-opacity="1"
                      :color="match.player1?.color"
                      opacity="1"
                      :model-value="match.winProbability.player1 * 100"
                      buffer-color="white"
                      buffer-opacity="1"
                      max="100"
                      min="0"
                    />
                  </div>
                  <div v-if="match.winProbability && !hasWinner(match)" class="mt-2">
                    Predicted Winner: 
                    <strong>
                      {{ match.winProbability.player1 > match.winProbability.player2 ? match.player1?.name : match.player2?.name || 'Bye' }}
                    </strong>
                  </div>
                  <div class="mt-2 d-flex justify-center" v-if="match.player1 && match.player2">
                    <v-btn-toggle
                      rounded="xl"
                      v-model="match.selectedWinner"
                      color="primary"
                      mandatory
                      :disabled="!isMatchPlayable(roundIndex, match)"
                    >
                      <v-btn
                        :value="match.player1"
                        :color="match.player1.color"
                        @click="() => onSelectWinner(match, match.player1)"
                      >
                        {{ match.player1.name }}
                      </v-btn>
                      <v-btn
                        :value="match.player2"
                        :color="match.player2.color"
                        @click="() => onSelectWinner(match, match.player2)"
                      >
                        {{ match.player2.name }}
                      </v-btn>
                    </v-btn-toggle>
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </v-sheet>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>

  <v-card v-if="bracket.length > 0" class="mt-4">
    <v-card-title>Tournament Heatmap</v-card-title>
    <v-card-text>
      <v-sheet>
        <v-row>
          <v-col cols="12">
            <div class="table-container">
              <v-table>
                <thead>
                  <tr>
                    <th style="width: 150px;">Player</th>
                    <th v-for="(_, roundIndex) in bracket" :key="roundIndex">
                      {{ getRoundName(roundIndex, bracket.length) }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="player in selectedPlayers" :key="player.name">
                    <td class="cell-spacing" style="width: 150px;">
                      <div class="player-container">
                        <v-avatar size="24" :color="player.color" class="mr-2">
                          <v-icon size="small">mdi-account</v-icon>
                        </v-avatar>
                        <div>
                          {{ player.name }}
                          <div class="text-caption">
                            {{ calculateWinToEndProbability(player) }}% to win
                          </div>
                        </div>
                      </div>
                    </td>
                    <td
                      v-for="(round, roundIndex) in bracket"
                      :key="roundIndex"
                      class="text-center cell-spacing"
                    >
                      <v-card
                        class="pa-2 ma-0"
                        outlined
                        :color="getMatchCardColor(player, round, roundIndex)"
                      >
                        <div v-if="getPlayerMatch(player, round)">
                          <div class="match-container">
                            <v-icon v-if="!getPlayerMatch(player, round)?.opponent">mdi-debug-step-over</v-icon>
                            <v-icon v-else>mdi-sword-cross</v-icon>
                            {{ getPlayerMatch(player, round)?.opponent?.name || 'BYE' }}
                          </div>
                        </div>
                        <div v-else>-</div>
                      </v-card>
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </div>
          </v-col>
        </v-row>
      </v-sheet>
    </v-card-text>
  </v-card>

  <!-- Drawer for Backup -->
  <v-navigation-drawer
    v-model="backupDrawer"
    right
    temporary
    width="400"
  >
    <v-card variant="text" class="ma-0 d-flex flex-column" style="height: 100%;">
      <v-card-title>Generate Tournament CSV</v-card-title>
      <v-card-text class="flex-grow-1 d-flex">
        <v-textarea
          v-model="tournamentCSV"
          label="Tournament CSV"
          outlined
          hide-details
          class="flex-grow-1"
        />
      </v-card-text>
      <v-card-actions>
        <v-btn color="primary" block @click="copyToClipboard">
          Copy to Clipboard
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-navigation-drawer>

  <!-- Drawer for Restore -->
  <v-navigation-drawer
    v-model="restoreDrawer"
    right
    temporary
    width="400"
  >
    <v-card variant="text" class="ma-0 d-flex flex-column" style="height: 100%;">
      <v-card-title>Restore Tournament</v-card-title>
      <v-card-text class="flex-grow-1 d-flex flex-column">
        <v-tabs v-model="restoreTab" fixed-tabs>
          <v-tab>Paste CSV</v-tab>
          <v-tab>Select Tournament</v-tab>
        </v-tabs>
        <div v-if="restoreTab === 0" class="flex-grow-1">
          <v-textarea
            v-model="tournamentCSV"
            label="Tournament CSV"
            outlined
            hide-details
            style="height: 100%;"
          />
        </div>
        <div v-else class="flex-grow-1">
          <v-select
            v-model="selectedTournament"
            :items="availableTournaments"
            label="Available Tournaments"
            item-title="name"
            item-value="filePath"
            :hint="selectedTournament ? selectedTournament.filePath : ''"
            outlined
            return-object
          >
            <template v-slot:item="{ item, props }">
              <v-list-item v-bind="props" :title="item.raw.name">
              </v-list-item>
            </template>
          </v-select>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-btn
          color="primary"
          block
          @click="restoreTournament"
          :disabled="restoreTab === 0 ? !tournamentCSV.trim() : !selectedTournament"
        >
          Restore Tournament
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-navigation-drawer>
</template>

<script lang="ts">
import { defineComponent, computed, ref, reactive, onMounted } from 'vue';
import { generateTournamentBracket, generateTournamentCSV, restoreTournamentCSV } from '../services/tournamentService';
import SimulationPlayerCard from '../components/SimulationPlayerCard.vue';
import { useFoosballStore } from '../store';
import { Player, Round } from '../types';

export default defineComponent({
  name: 'Tournament',
  components: {
    SimulationPlayerCard,
  },
  setup() {
    const store = useFoosballStore();
    const allPlayers = computed(() => Object.values(store.players));
    const selectedPlayers = ref<Player[]>([]);
    const bracket = reactive<Round[][]>([]);
    const backupDrawer = ref(false);
    const restoreDrawer = ref(false);
    const restoreTab = ref(0); // 0 for Paste CSV, 1 for Select Tournament
    const tournamentCSV = ref('');
    const selectedTournament = ref<{ filePath: string; name: string; } | null>(null);
    const tournamentStarted = ref(false);

    onMounted(async () => {
      await store.loadTournamentsData();
    });

    const availableTournaments = computed(() => store.availableTournaments);

    const startTournament = () => {
      if (selectedPlayers.value.length >= 2) {
        const newBracket = generateTournamentBracket(selectedPlayers.value).map(round =>
          round.map(match => reactive(match))
        );
        bracket.splice(0, bracket.length, ...newBracket);
        tournamentStarted.value = true;
      }
    };

    const endTournament = () => {
      bracket.splice(0, bracket.length); // Reset the tournament bracket
      tournamentStarted.value = false;
    };

    const onPlayersCleared = (newValue: Player[]) => {
      if (newValue.length === 0) {
        bracket.splice(0, bracket.length); // Reset the tournament bracket
      }
    };

    const getWinProbabilityColor = (probability: number, isBlue: boolean) => {
      // Blue gradient for left player (player1)
      if (isBlue) {
        if (probability > 0.95) return 'blue'; // True blue
        if (probability > 0.9) return 'blue-lighten-1';
        if (probability > 0.85) return 'blue-lighten-2';
        if (probability > 0.8) return 'blue-lighten-3';
        if (probability > 0.75) return 'blue-lighten-4';
        if (probability > 0.7) return 'light-blue';
        if (probability > 0.65) return 'light-blue-lighten-1';
        if (probability > 0.6) return 'light-blue-lighten-2';
        if (probability > 0.55) return 'cyan';
        return 'cyan-lighten-3'; // Light cyan
      }

      // Red gradient for right player (player2)
      if (probability > 0.95) return 'red'; // True red
      if (probability > 0.9) return 'red-lighten-1';
      if (probability > 0.85) return 'red-lighten-2';
      if (probability > 0.8) return 'red-lighten-3';
      if (probability > 0.75) return 'red-lighten-4';
      if (probability > 0.7) return 'deep-orange';
      if (probability > 0.65) return 'deep-orange-lighten-1';
      if (probability > 0.6) return 'deep-orange-lighten-2';
      if (probability > 0.55) return 'orange';
      return 'orange-lighten-3'; // Light orange
    };

    const getRoundName = (roundIndex: number, totalRounds: number) => {
      if (roundIndex === totalRounds - 1) return 'Final';
      if (roundIndex === totalRounds - 2) return 'Semi-Final';
      return `Round ${roundIndex + 1}`;
    };

    const onSelectWinner = (match: Round, winner?: Player) => {
      match.selectedWinner = winner;
      updateBracket();
    };

    const hasWinner = (match: Round) => {
      console.log(match, match.previousMatches);
      return match.selectedWinner || (!match.previousMatches.length && (!match.player1 || !match.player2));
    };

    const getWinner = (match: Round) => {
      return match.selectedWinner || (match.winProbability.player1 > match.winProbability.player2 ? match.player1 : match.player2);
    };

    const updateBracket = () => {
      const updateNextRounds = (roundIndex: number) => {
        if (roundIndex >= bracket.length - 1) return;

        const currentRound = bracket[roundIndex];
        const nextRound = bracket[roundIndex + 1];

        nextRound.forEach((nextMatch: Round, matchIndex: number) => {
          const previousMatch1 = currentRound[matchIndex * 2];
          const previousMatch2 = currentRound[matchIndex * 2 + 1];

          if (previousMatch1) {
            nextMatch.player1 = getWinner(previousMatch1);
          }
          if (previousMatch2) {
            nextMatch.player2 = getWinner(previousMatch2);
          }
          if (!nextMatch.player2 || !nextMatch.player1) {
            nextMatch.selectedWinner = nextMatch.player1; // Bye match
          }
          if (nextMatch.selectedWinner && ![nextMatch.player1, nextMatch.player2].includes(nextMatch.selectedWinner)) {
            delete nextMatch.selectedWinner;
          }

          nextMatch.winProbability = calculateWinProbability(
            nextMatch.player1,
            nextMatch.player2
          );
        });

        updateNextRounds(roundIndex + 1);
      };

      updateNextRounds(0);
    };

    const calculateWinProbability = (player1: any, player2: any) => {
      if (!player2) return { player1: 1, player2: 0 };
      if (!player1) return { player1: 0, player2: 1 };
      const eloDiff = player1.elo - player2.elo;
      const player1WinProb = 1 / (1 + Math.pow(10, -eloDiff / 400));
      return { player1: player1WinProb, player2: 1 - player1WinProb };
    };

    const calculateWinToEndProbability = (player: Player) => {
      const remainingPlayers = selectedPlayers.value.filter((p) => 
        bracket.flat()
          // Filter matches where the player is involved
          .filter((match) => match.selectedWinner && (match.player1 === p || match.player2 === p))
          // a remaining player is a player that has not lost a match yet
          .every((match) => match.selectedWinner?.name === p.name)
      );

      // Check if the player is eliminated
      const isEliminated = !remainingPlayers.some((p) => p.name === player.name);

      if (isEliminated) {
        return "0.0"; // Eliminated players have 0% chance
      }

      // Calculate probabilities for all remaining players
      const probabilities = remainingPlayers.map((p) => {
        let probability = 1;
        bracket.forEach((round) => {
          const match = round.find(
            (match) => match.player1?.name === p.name || match.player2?.name === p.name
          );
          if (match) {
            if (match.player1?.name === p.name) {
              probability *= match.winProbability.player1;
            } else if (match.player2?.name === p.name) {
              probability *= match.winProbability.player2;
            }
          }
        });
        return { player: p, probability };
      });

      // Normalize probabilities to ensure they sum to 100%
      const totalProbability = probabilities.reduce((sum, p) => sum + p.probability, 0);
      const normalizedProbabilities = probabilities.map((p) => ({
        player: p.player,
        probability: (p.probability / totalProbability) * 100,
      }));

      // Find the current player's normalized probability
      const playerProbability = normalizedProbabilities.find((p) => p.player.name === player.name);

      return playerProbability ? playerProbability.probability.toFixed(1) : "0.0";
    };

    const getPlayerMatch = (player: Player, round: Round[]) => {
      const match = round.find(
        (match) => match.player1?.name === player.name || match.player2?.name === player.name
      );
      if (!match) return null;

      const opponent =
        match.player1?.name === player.name ? match.player2 : match.player1;
      const result = match.selectedWinner
        ? match.selectedWinner.name === player.name
          ? 'win'
          : 'loss'
        : null;

      return { opponent, result };
    };

    const getMatchCardColor = (player: Player, round: Round[], roundIndex: number) => {
      const match = getPlayerMatch(player, round);
      if (!match) return 'white'; // No match

      // Check if the match is a bye
      if (!match.opponent || match.opponent === player) {
        // Ensure the bye is not after a planned match that hasn't been won yet
        if (roundIndex > 0) {
          const previousRound = bracket[roundIndex - 1];
          const hasUnresolvedMatch = previousRound.some(
            (prevMatch) =>
              (prevMatch.player1?.name === player.name || prevMatch.player2?.name === player.name) &&
              !prevMatch.selectedWinner
          );
          if (hasUnresolvedMatch) return 'grey'; // Bye after unresolved match
        }
        return 'green'; // Valid bye
      }

      if (match.result === 'win') return 'green'; // Win
      if (match.result === 'loss') return 'red'; // Loss

      // Check if the match is playable (previous matches have selectedWinner)
      if (roundIndex === 0) return 'blue'; // First round matches are always playable
      const previousRound = bracket[roundIndex - 1];
      const isPlayable = previousRound.some(
        (prevMatch) =>
          prevMatch.player1?.name === prevMatch.player2?.name ||
          prevMatch.selectedWinner
      );
      return isPlayable ? 'blue' : 'grey'; // Blue if playable, otherwise grey
    };

    const isMatchPlayable = (_: number, match: Round) => {
      return match.previousMatches.every((prevMatchId) => {
        const previousMatch = bracket.flat().find((m) => m.id === prevMatchId);
        return previousMatch?.selectedWinner || previousMatch?.player1 === undefined || previousMatch?.player2 === undefined;
      });
    };

    const _generateTournamentCSV = () => {
      tournamentCSV.value = generateTournamentCSV(bracket);
      backupDrawer.value = true; // Open the drawer after generating
    };

    const restoreTournament = async () => {
      if (restoreTab.value === 0) {
        // Restore from pasted CSV
        const { bracket: restoredBracket, selectedPlayers: restoredPlayers } = restoreTournamentCSV(
          tournamentCSV.value,
          store.players
        );
        bracket.splice(0, bracket.length, ...restoredBracket);
        selectedPlayers.value = restoredPlayers;
      } else if (restoreTab.value === 1 && selectedTournament.value) {
        // Restore from selected tournament
        const response = await fetch(selectedTournament.value.filePath);
        const csvContent = await response.text();
        const { bracket: restoredBracket, selectedPlayers: restoredPlayers } = restoreTournamentCSV(
          csvContent,
          store.players
        );
        bracket.splice(0, bracket.length, ...restoredBracket);
        selectedPlayers.value = restoredPlayers;
      }
      restoreDrawer.value = false; // Close the drawer after restoring
    };

    const openRestoreDrawer = () => {
      tournamentCSV.value = ''; // Clear the textarea
      restoreDrawer.value = true; // Open the drawer after generating
    };

    const copyToClipboard = () => {
      if (tournamentCSV.value.trim()) {
        navigator.clipboard.writeText(tournamentCSV.value);
      }
    };

    return {
      allPlayers,
      selectedPlayers,
      bracket,
      startTournament,
      endTournament,
      onPlayersCleared,
      getWinProbabilityColor,
      getRoundName,
      onSelectWinner,
      hasWinner,
      calculateWinToEndProbability,
      getPlayerMatch,
      getMatchCardColor,
      isMatchPlayable,
      backupDrawer,
      restoreDrawer,
      restoreTab,
      tournamentCSV,
      selectedTournament,
      availableTournaments,
      generateTournamentCSV: _generateTournamentCSV,
      restoreTournament,
      openRestoreDrawer,
      copyToClipboard,
      tournamentStarted,
    };
  },
});
</script>

<style scoped>
.v-card {
  margin-bottom: 16px;
}
.v-sheet {
  border-radius: 8px;
}
.text-caption {
  font-size: .75rem;
}
.cell-spacing {
  padding: 8px;
}
.table-container {
  width: 100%;
  overflow-x: auto;
}
.player-container {
  display: flex;
  align-items: center;
}
.match-container {
  display: flex;
  align-items: center;
  gap: .5rem;
}
.v-navigation-drawer {
  z-index: 2000;
}
</style>
