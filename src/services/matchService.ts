import { compareAsc, parseISO } from 'date-fns';
import { parseCSV } from '../utils/csv';
import { TEAMS } from '../constants';
import { MatchType } from '../types';

const BASE_HREF = import.meta.env.VITE_BASE_URL || '/';

const generateUniqueId = () => Math.random().toString(36).substring(2, 9);

export async function fetchMatches() {
  const matchesResponse = await fetch(`${BASE_HREF}/matches.csv`);
  const teamMatchesResponse = await fetch(`${BASE_HREF}/team-matches.csv`);

  const matchesCSV = await matchesResponse.text();
  const teamMatchesCSV = await teamMatchesResponse.text();

  const individualMatches = parseCSV(matchesCSV).rows.map(row => ({
    id: generateUniqueId(),
    opponents: { blue: [row[0]], red: [row[1]] },
    winner: [row[2]],
    date: parseISO(row[3]),
    type: MatchType.INDIVIDUAL,
  }));

  individualMatches.sort((a, b) => compareAsc(a.date, b.date));

  const teamMatches = parseCSV(teamMatchesCSV).rows.map(row => ({
    id: generateUniqueId(),
    opponents: { blue: row.slice(0, 2), red: row.slice(2, 4) },
    winner: row[4] === TEAMS.BLUE ? row.slice(0, 2) : row.slice(2, 4),
    date: parseISO(row[5]),
    type: MatchType.TEAM,
  }));

  teamMatches.sort((a, b) => compareAsc(a.date, b.date));

  return { individualMatches, teamMatches };
}
