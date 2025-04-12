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
        semester: currentMonth < 6 ? 1 : 2, // Default to the current season
      },
      tournaments: [] as { name: string; rounds: Round[][] }[], // Store tournament data as Round[][]
      selectedTournament: null as { name: string; rounds: Round[][] } | null, // Currently selected tournament
      availableTournaments: [] as { name: string; filePath: string }[], // List of available tournaments
    };
  },
  actions: {
    async loadData() {
      const { individualMatches, teamMatches } = await fetchMatches();

      const { year, semester } = this.selectedSeason;
      const seasonStart = new Date(year, semester === 1 ? 0 : 6, 1);
      const seasonEnd = new Date(seasonStart.getFullYear(), seasonStart.getMonth() + 6, 0);

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
        const semester = date.getMonth() < 6 ? 1 : 2;
        seasons.add(`${year}#S${semester}`);
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
    setSelectedSeason(season: { year: number; semester: number }) {
      this.selectedSeason = season;
    },
  },
});
