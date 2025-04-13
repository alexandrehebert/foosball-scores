import { defineStore } from 'pinia';
import { fetchMatches } from '../services/matchService';
import { fetchAvailableTournaments } from '../services/tournamentService';
import { processELOData, generateLeaderboard } from '../services/eloService';
import { EloChangeEvent, LeaderboardItem, MatchWithEloChanges, Players, Round } from '../types';

export const useFoosballStore = defineStore('foosball', {
  state: () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    return {
      players: {} as Players,
      individualMatches: [] as MatchWithEloChanges[],
      teamMatches: [] as MatchWithEloChanges[],
      matchResults: [] as MatchWithEloChanges[],
      eloChanges: [] as EloChangeEvent[],
      leaderboard: [] as LeaderboardItem[],
      availableSeasons: [] as string[],
      selectedSeason: {
        year: currentYear,
        quarter: Math.floor(currentMonth / 3) + 1, // Default to current quarter (1-4)
      },
      tournaments: [] as { name: string; rounds: Round[][] }[], // Store tournament data as Round[][]
      selectedTournament: null as { name: string; rounds: Round[][] } | null, // Currently selected tournament
      availableTournaments: [] as { name: string; filePath: string }[], // List of available tournaments
    };
  },
  actions: {
    async loadData() {
      const { individualMatches, teamMatches } = await fetchMatches();

      const { year, quarter } = this.selectedSeason;
      const seasonStart = new Date(year, (quarter - 1) * 3, 1);
      const seasonEnd = new Date(year, quarter * 3, 0);

      // Filter matches based on the selected season
      const filteredIndividualMatches = individualMatches.filter(
        (match) => match.date >= seasonStart && match.date <= seasonEnd
      );
      const filteredTeamMatches = teamMatches.filter(
        (match) => match.date >= seasonStart && match.date <= seasonEnd
      );

      const {
        players,
        individualMatches: processedIndividualMatches,
        teamMatches: processedTeamMatches,
        matchResults,
        eloChanges,
      } = processELOData({
        individualMatches: filteredIndividualMatches,
        teamMatches: filteredTeamMatches,
      });

      this.players = players;
      this.individualMatches = processedIndividualMatches;
      this.teamMatches = processedTeamMatches;
      this.matchResults = matchResults;
      this.eloChanges = eloChanges;
      this.leaderboard = generateLeaderboard(players, matchResults, eloChanges);

      // Compute available seasons based on match data
      const matchDates = [...individualMatches, ...teamMatches].map((match) => new Date(match.date));
      this.availableSeasons = Array.from(matchDates.reduce((seasons, date) => {
        const year = date.getFullYear();
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        seasons.add(`${year}#Q${quarter}`);
        return seasons;
      }, new Set<string>())).sort();
    },
    async loadTournamentsData() {
      try {
        this.availableTournaments = await fetchAvailableTournaments();
      } catch (error) {
        console.error('Error loading tournaments:', error);
      }
    },
    setSelectedTournament(tournamentName: string) {
      this.selectedTournament = this.tournaments.find((t) => t.name === tournamentName) || null;
    },
    setSelectedSeason(season: { year: number; quarter: number }) {
      this.selectedSeason = season;
    },
  },
});
