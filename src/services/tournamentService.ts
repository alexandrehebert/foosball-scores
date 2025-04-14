import { Player, Round, Tournament } from '../types';
import { parseISO } from 'date-fns';
import { parseCSV } from '../utils/csv';
import { API_ENDPOINT } from '../constants';

export function generateTournamentBracket(players: Player[]) {
  const bracket: Round[][] = [];
  let currentRound: Round[] = [];

  // Sort players by ELO in descending order
  const sortedPlayers = [...players].sort((a, b) => b.elo - a.elo);

  // Handle odd number of players: give a bye to the highest ELO player
  if (sortedPlayers.length % 2 !== 0) {
    const byePlayer = sortedPlayers.shift(); // Remove the highest ELO player for a bye
    if (byePlayer) {
      currentRound.push({
        id: generateMatchId(),
        player1: byePlayer,
        player2: undefined,
        winProbability: { player1: 1, player2: 0 },
        previousMatches: [],
      });
    }
  }

  // Pair remaining players: highest ELO vs lowest ELO
  while (sortedPlayers.length > 1) {
    const player1 = sortedPlayers.shift(); // Highest ELO player
    const player2 = sortedPlayers.pop(); // Lowest ELO player

    currentRound.push({
      id: generateMatchId(),
      player1,
      player2,
      winProbability: calculateWinProbability(player1, player2),
      previousMatches: [],
    });
  }

  // If one player remains (shouldn't happen with the bye logic above, but just in case)
  if (sortedPlayers.length === 1) {
    const lastPlayer = sortedPlayers.pop();
    currentRound.push({
      id: generateMatchId(),
      player1: lastPlayer,
      winProbability: { player1: 1, player2: 0 },
      previousMatches: [],
    });
  }

  // Do not push the first round to the bracket as it will be added by the while loop
  // bracket.push(currentRound);

  // Generate subsequent rounds
  while (currentRound.length > 1) {
    const nextRound = [];
    for (let i = 0; i < currentRound.length; i += 2) {
      const match1 = currentRound[i];
      const match2 = currentRound[i + 1] || null;

      const player1 = match1.player1 && (!match2 || match1.winProbability.player1 > match1.winProbability.player2)
        ? match1.player1
        : match1.player2;

      const player2 = match2 && match2.player1 && (!match2.player2 || match2.winProbability.player1 > match2.winProbability.player2)
        ? match2.player1
        : match2?.player2;
      
      const winProbability = calculateWinProbability(player1, player2);

      nextRound.push({
        id: generateMatchId(),
        player1,
        player2,
        winProbability,
        previousMatches: [match1.id, match2?.id].filter(Boolean),
      });
    }
    bracket.push(currentRound);
    currentRound = nextRound;
  }

  bracket.push(currentRound);
  return bracket;
}

export function calculateWinProbability(player1?: Player, player2?: Player): Round['winProbability'] {
  if (!player2) return { player1: 1, player2: 0 };
  if (!player1) return { player1: 0, player2: 1 };
  const eloDiff = player1.elo - player2.elo;
  const player1WinProb = 1 / (1 + Math.pow(10, -eloDiff / 400));
  return { player1: player1WinProb, player2: 1 - player1WinProb };
}

function* matchIdGenerator(): Generator<string, void, unknown> {
  let matchIdCounter = 1;
  while (true) {
    yield `match-${matchIdCounter++}`;
  }
}

const matchIdGen = matchIdGenerator();
function generateMatchId(): string {
  return matchIdGen.next().value!;
}

export type TournamentMatchRow = {
  round: number;
  id: string;
  player1: string;
  player2: string;
  winner?: string | null;
  date: string;
  previous_match1?: string;
  previous_match2?: string;
};

export async function fetchTournamentData(tournament: Tournament, players: Record<string, Player>): Promise<{ bracket: Round[][], selectedPlayers: Player[] }> {
  const response = await fetch(`${API_ENDPOINT}/${tournament.filePath}`);
  const csvContent = await response.text();
  return parseTournamentCSV(csvContent, players);
}

export async function fetchAvailableTournaments(): Promise<{ name: string; filePath: string }[]> {
  const response = await fetch(`${API_ENDPOINT}/tournaments.json`);
  return response.json();
}

export function parseTournamentCSV(csvContent: string, players: Record<string, Player>): { bracket: Round[][], selectedPlayers: Player[] } {
  const matches = parseCSV<TournamentMatchRow>(csvContent).rows.map((row) => ({
    matchId: row.id,
    tournamentName: 'tournament-' + new Date().getTime(), // Placeholder name
    round: +row.round,
    player1: row.player1,
    player2: row.player2,
    winner: row.winner,
    previousMatches: row.previous_match1 ? [row.previous_match1, row.previous_match2] : [],
    date: parseISO(row.date),
  }));

  const restoredPlayers = new Set<string>();
  const bracket = matches.reduce((acc, match) => {
    const roundIndex = match.round - 1;
    if (!acc[roundIndex]) acc[roundIndex] = [];

    const player1 = players[match.player1] || undefined;
    const player2 = players[match.player2] || undefined;

    if (player1) restoredPlayers.add(player1.name);
    if (player2) restoredPlayers.add(player2.name);

    acc[roundIndex].push({
      id: match.matchId,
      player1,
      player2,
      winProbability: calculateWinProbability(player1, player2),
      previousMatches: [], // Can be populated if needed
      selectedWinner: match.winner ? players[match.winner] : undefined,
    });
    return acc;
  }, [] as Round[][]);

  const selectedPlayers = Array.from(restoredPlayers).map((name) => players[name]);

  return { bracket, selectedPlayers };
}

export function generateTournamentCSV(bracket: Round[][]): string {
  const csvRows = [
    'round,id,player1,player2,winner,date,previous_match1,previous_match2',
  ];

  bracket.forEach((round, roundIndex) => {
    round.forEach((match) => {
      csvRows.push([
        roundIndex + 1,
        match.id,
        match.player1?.name || '',
        match.player2?.name || '',
        match.selectedWinner?.name || '',
        match.player1 && match.player2 ? new Date().toISOString() : '',
        match.previousMatches[0] ?? '',
        match.previousMatches[1] ?? '',
      ].join(','));
    });
  });

  return csvRows.join('\n');
}

export function restoreTournamentCSV(csvContent: string, players: Record<string, Player>): { bracket: Round[][], selectedPlayers: Player[] } {
  const matches = parseCSV<TournamentMatchRow>(csvContent).rows.map((row) => ({
    matchId: row.id,
    tournamentName: 'restored-tournament-' + new Date().getTime(), // Placeholder name
    round: +row.round,
    player1: row.player1,
    player2: row.player2,
    winner: row.winner,
    previousMatches: row.previous_match1 ? [row.previous_match1, row.previous_match2] as string[] : [],
    date: parseISO(row.date),
  }));

  const restoredPlayers = new Set<string>();
  const matchMap: Record<string, Round> = {}; // Map to track matches by ID

  const bracket = matches.reduce((acc, match) => {
    const roundIndex = match.round - 1;
    if (!acc[roundIndex]) acc[roundIndex] = [];

    const player1 = players[match.player1] || undefined;
    const player2 = players[match.player2] || undefined;

    if (player1) restoredPlayers.add(player1.name);
    if (player2) restoredPlayers.add(player2.name);

    const restoredMatch: Round = {
      id: match.matchId,
      player1,
      player2,
      winProbability: calculateWinProbability(player1, player2),
      previousMatches: match.previousMatches, // Restore previous matches directly
      selectedWinner: match.winner ? players[match.winner] : undefined,
    };

    acc[roundIndex].push(restoredMatch);
    matchMap[match.matchId] = restoredMatch; // Add to match map
    return acc;
  }, [] as Round[][]);

  const selectedPlayers = Array.from(restoredPlayers).map((name) => players[name]);

  return { bracket, selectedPlayers };
}