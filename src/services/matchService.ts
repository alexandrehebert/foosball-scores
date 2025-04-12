import { compareAsc, parseISO } from 'date-fns';
import { parseCSV } from '../utils/csv';
import { API_ENDPOINT, TEAMS } from '../constants';
import { MatchType } from '../types';

const generateUniqueId = () => Math.random().toString(36).substring(2, 9);

type IndividualMatchRow = {
  player1: string;
  player2: string;
  winner: string;
  date: string;
};
type TeamMatchRow = {
  team1player1: string;
  team1player2: string;
  team2player1: string;
  team2player2: string;
  winner: string;
  date: string;
};

export async function fetchMatches() {
  const matchesResponse = await fetch(`${API_ENDPOINT}/matches.csv`);
  const teamMatchesResponse = await fetch(`${API_ENDPOINT}/team-matches.csv`);

  const matchesCSV = await matchesResponse.text();
  const teamMatchesCSV = await teamMatchesResponse.text();

  const individualMatches = parseCSV<IndividualMatchRow>(matchesCSV).rows.map(row => ({
    id: generateUniqueId(),
    opponents: { blue: [row.player1], red: [row.player2] },
    winner: [row.winner],
    loser: [row.player1 === row.player2 ? row.player2 : row.player1],
    date: parseISO(row.date),
    type: MatchType.INDIVIDUAL,
  })).sort((a, b) => compareAsc(a.date, b.date));

  individualMatches.sort((a, b) => compareAsc(a.date, b.date));

  const teamMatches = parseCSV<TeamMatchRow>(teamMatchesCSV).rows.map(row => {
    const team1 = [row.team1player1, row.team1player2];
    const team2 = [row.team2player1, row.team2player2];
    return {
    id: generateUniqueId(),
    opponents: {
      blue: team1,
      red: team2,
    },
    winner: row.winner === TEAMS.BLUE ? team1 : team2,
    loser: row.winner === TEAMS.BLUE ? team2 : team1,
    date: parseISO(row.date),
    type: MatchType.TEAM,
  };
  }).sort((a, b) => compareAsc(a.date, b.date));

  teamMatches.sort((a, b) => compareAsc(a.date, b.date));

  return {
    individualMatches,
    teamMatches
  };
}
