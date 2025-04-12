import { subDays, isSameDay, min, compareAsc } from 'date-fns';
import groupBy from 'lodash/groupBy';
import { getPlayerColor } from '../utils/color';
import {
  Match,
  MatchType,
  MatchWithEloChanges,
  EloChangeEvent,
  LeaderboardItem,
  Players,
  MatchResult,
} from "../types";
import { DEFAULT_ELO, DECAY_PERIOD_DAYS, DECAY_RATE } from '../constants';
import { formatDay, parseDay } from '../utils/dates';

export function getDynamicKFactor(winnerElo: number, loserElo: number): number {
  const eloDiff = Math.abs(winnerElo - loserElo);

  const minK = 20; // Increase the minimum K-factor to make even small differences more impactful
  const maxK = 60; // Increase the max K-factor to allow for larger Elo differences
  const maxDiff = 500; // Allow Elo differences beyond 300

  // Clamp the eloDiff to the range [0, maxDiff]
  const clampedDiff = Math.min(eloDiff, maxDiff);

  // Linearly interpolate K between minK and maxK
  const kFactor = minK + (maxK - minK) * (clampedDiff / maxDiff);

  return Math.round(kFactor) * 1.5;
}

function getPlayer(players: Players, player: string) {
  if (!players[player]) {
    players[player] = {
      rank: 0,
      name: player,
      elo: DEFAULT_ELO,
      color: getPlayerColor(player),
    };
  }
  return players[player];
}

function updateELO({ id, opponents, winner, loser, date, type }: Match, players: Players, eloChanges: EloChangeEvent[]): MatchWithEloChanges {
  const blueTeamELO =
    opponents.blue.map((player) => getPlayer(players, player).elo).reduce((a, b) => a + b, 0) /
    opponents.blue.length;
  const redTeamELO =
    opponents.red.map((player) => getPlayer(players, player).elo).reduce((a, b) => a + b, 0) /
    opponents.red.length;

  const winnerTeam = winner.includes(opponents.blue[0]) ? "blue" : "red";
  const loserTeam = winnerTeam === "blue" ? "red" : "blue";

  const winnerELO = winnerTeam === "blue" ? blueTeamELO : redTeamELO;
  const loserELO = loserTeam === "blue" ? blueTeamELO : redTeamELO;

  const initialKFactor = getDynamicKFactor(winnerELO, loserELO);
  const kFactor = (type === MatchType.INDIVIDUAL ? 1 : .5) * initialKFactor;

  const expectedScoreWinner =
    1 / (1 + Math.pow(10, (loserELO - winnerELO) / 400));
  const expectedScoreLoser = 1 - expectedScoreWinner;

  // Modify Elo change calculation to increase the effect of big Elo differences
  const winnerChange = Math.round(kFactor * (1 - expectedScoreWinner)); // Increase effect on winner
  const loserChange = Math.round(kFactor * (0 - expectedScoreLoser)); // Increase effect on loser

  const matchWithElo: MatchWithEloChanges = {
    id,
    opponents,
    winner,
    loser,
    date,
    winnerEloChange: winnerChange,
    loserEloChange: loserChange,
    type,
  }

  opponents[winnerTeam].forEach((playerName) => {
    const player = getPlayer(players, playerName);
    player.elo = player.elo + winnerChange;
    eloChanges.push({ player: playerName, change: winnerChange, type: "match", date });
  });

  opponents[loserTeam].forEach((playerName) => {
    const player = getPlayer(players, playerName);
    player.elo = player.elo + loserChange;
    eloChanges.push({ player: playerName, change: loserChange, type: "match", date });
  });

  return matchWithElo;
}

export function calculateDecays(
  matches: Match[],
  players: Players
): EloChangeEvent[] {
  const playerDecays: EloChangeEvent[] = [];
  const matchDays = Array.from(new Set(matches.map((m) => formatDay(m.date))));

  for (const player of Object.values(players)) {
    const playerMatches = matches.filter(
      (match) =>
        match.opponents.blue.includes(player.name) ||
        match.opponents.red.includes(player.name)
    );

    const playerMatchDays = [...(new Set(
      playerMatches.map((m) => formatDay(m.date))
    ))].sort();

    let inactivityDays = 0;
    let hasPlayed = false;
    for (const matchDay of matchDays) {
      hasPlayed = hasPlayed || playerMatchDays.includes(matchDay);
      if (!hasPlayed) continue;
      inactivityDays = playerMatchDays.includes(matchDay) ? 0 : inactivityDays + 1;
      if (inactivityDays >= DECAY_PERIOD_DAYS) {
        player.elo -= DECAY_RATE;
        playerDecays.push({
          player: player.name,
          change: -DECAY_RATE,
          type: "decay",
          date: parseDay(matchDay),
        });
      }
    }
  }

  return playerDecays;
}

export function calculateELO(
  matches: Match[],
  players: Players = {},
  matchResults: MatchWithEloChanges[] = [],
  eloChanges: EloChangeEvent[] = []
): {
  players: Players;
  matchResults: MatchWithEloChanges[];
  eloChanges: EloChangeEvent[];
} {
  matchResults.push(...matches.map((match) => updateELO(match, players, eloChanges)));
  eloChanges.push(...calculateDecays(matches, players));
  
  return {
    players,
    matchResults,
    eloChanges: eloChanges.sort((a, b) => compareAsc(a.date, b.date)),
  };
}

export function processELOData({ individualMatches, teamMatches }: { individualMatches: Match[], teamMatches: Match[] }) {
  const matches = [...individualMatches, ...teamMatches].sort((a, b) => compareAsc(a.date, b.date));
  const { players, matchResults, eloChanges } = calculateELO(matches);
  return {
    matchResults,
    individualMatches: matchResults.filter(({ type }) => type === MatchType.INDIVIDUAL),
    teamMatches: matchResults.filter(({ type }) => type === MatchType.TEAM),
    eloChanges,
    players,
  };
}

export function updateELOData(simulatedMatches: Match[], existingPlayers: Players, currentMatchResults: MatchWithEloChanges[], currentEloChanges: EloChangeEvent[]) {
  const matches = simulatedMatches.sort((a, b) => compareAsc(a.date, b.date));
  const { players, matchResults, eloChanges } = calculateELO(matches, existingPlayers, currentMatchResults, currentEloChanges);
  return {
    matchResults,
    individualMatches: matchResults.filter(({ type }) => type === MatchType.INDIVIDUAL),
    teamMatches: matchResults.filter(({ type }) => type === MatchType.TEAM),
    eloChanges,
    players,
  };
}

export function generateELOChartData(players: Players, eloChanges: EloChangeEvent[]) {
  const eloByDate: Record<string, Record<string, number>> = {};
  const allPlayers = Object.keys(players);

  const firstMatchDates: Record<string, Date> = allPlayers.map((player) => min(eloChanges.filter(({ player: p }) => p === player).map(({ date }) => date)))
    .reduce((acc, date, index) => {
      acc[allPlayers[index]] = date;
      return acc;
    }, {} as Record<string, Date>);
  const matchDates: string[] = eloChanges.map(({ date }) => formatDay(date))
    .reduce((acc, date) => {
      if (!acc.includes(date)) acc.push(date);
      return acc;
    }, [] as string[]);
  const eloAcc: Record<string, number> = allPlayers.reduce((acc, player) => {
      acc[player] = DEFAULT_ELO;
      return acc;
    }, {} as Record<string, number>);

  const eloChangesByDate = groupBy(eloChanges, (change) => formatDay(change.date));
  
  Object.entries(eloChangesByDate).forEach(([day, changes]) => {
    const [{ date }] = changes;
    const dayBefore = matchDates[matchDates.indexOf(day) - 1] ?? formatDay(subDays(date, 1));
    if (!eloByDate[dayBefore]) eloByDate[dayBefore] = {};
    if (!eloByDate[day]) eloByDate[day] = { ...(eloByDate[dayBefore] ?? {}) };
    for (const player of allPlayers) {
      if (isSameDay(date, firstMatchDates[player]))
        eloByDate[dayBefore][player] = DEFAULT_ELO;
      eloByDate[day][player] = eloByDate[dayBefore][player];
    }
    for (const { player, change } of changes) {
      eloAcc[player] += change;
      eloByDate[day][player] = eloAcc[player];
    }
  });

  const graphDates = Object.keys(eloByDate).sort();
  const labels = graphDates;
  const datasets = allPlayers.map(player => {
    let previousElo: number | undefined = undefined;
    return {
      label: player,
      data: graphDates.map(date => {
        if (eloByDate[date][player]) {
          previousElo = eloByDate[date][player];
        }
        return previousElo;
      }),
      fill: false,
      borderColor: getPlayerColor(player),
      tension: 0.1,
    };
  });

  return { labels, datasets };
}

function generateLastELOs(
  players: Players,
  eloChanges: EloChangeEvent[]
) {

  const lastCompetitionDay = formatDay(eloChanges[eloChanges.length - 1].date)
  const lastELOs = Object.values(players).map(({ name, elo }) => ({
    name, elo, lastElo: elo,
  })).reduce((acc, { name, elo }) => {
    acc[name] = elo;
    return acc;
  }, {} as Record<string, number>);

  eloChanges
    .filter(({ date }) => formatDay(date) === lastCompetitionDay)
    .forEach(({ player, change }: EloChangeEvent) => {
      lastELOs[player] -= change;
    });
  
  return lastELOs;
}

export function generateLeaderboard(
  players: Players,
  matchResults: MatchWithEloChanges[],
  eloChanges: EloChangeEvent[]
): LeaderboardItem[] {
  const lastELOs = generateLastELOs(players, eloChanges);
  const previousRanking = Object.values(players)
    .sort((a, b) => lastELOs[b.name] - lastELOs[a.name]);

  const leaderboard = Object.values(players)
    .map((player) => {
      const playerMatches = matchResults.filter(
        (match) =>
          match.opponents.blue.includes(player.name) ||
          match.opponents.red.includes(player.name)
      );

      const individualMatches = playerMatches.filter((match) => match.type === MatchType.INDIVIDUAL);
      const teamMatches = playerMatches.filter((match) => match.type === MatchType.TEAM);

      const last10IndividualResults = individualMatches
        .map((match) => (match.winner.includes(player.name) ? MatchResult.WIN : MatchResult.LOSS))
        .slice(-10);

      const last10TeamResults = teamMatches
        .map((match) => (match.winner.includes(player.name) ? MatchResult.WIN : MatchResult.LOSS))
        .slice(-10);

      const last10IndividualMatches = individualMatches.slice(-10);
      const last10TeamMatches = teamMatches.slice(-10);

      const totalMatchesPlayed = playerMatches.length;
      const isInPlacement = totalMatchesPlayed < 5; // Mark players with fewer than 5 matches as in placement

      return {
        player,
        last10IndividualResults,
        last10TeamResults,
        last10IndividualMatches,
        last10TeamMatches,
        isInPlacement,
      };
    })
    .sort((a, b) => b.player.elo - a.player.elo)
    .map((item, index) => ({
      ...item,
      rank: item.isInPlacement ? null : index + 1, // Assign rank only to non-placement players
      potentialRank: index + 1, // Add potential rank for placement players
      rankVariation: item.isInPlacement
        ? null
        : previousRanking.findIndex(({ name }) => name === item.player.name) - index,
    }));

  leaderboard.forEach((item) => {
    if (!item.isInPlacement) {
      players[item.player.name].rank = item.rank;
    }
  });

  return leaderboard;
}

function normalizeTeam(players: string[]): string {
  return players.sort().join(',');
}

export function generateTeamRankings(
  matchResults: MatchWithEloChanges[]
): { rank: number; members: string[]; wins: number; losses: number; last10Results: string[]; last10Matches: MatchWithEloChanges[] }[] {
  const teamStats: Record<string, { wins: number; losses: number; results: string[]; matches: MatchWithEloChanges[] }> = {};

  matchResults
    .filter((match) => match.type === MatchType.TEAM)
    .forEach((match) => {
      const blueTeam = normalizeTeam(match.opponents.blue);
      const redTeam = normalizeTeam(match.opponents.red);

      if (!teamStats[blueTeam]) teamStats[blueTeam] = { wins: 0, losses: 0, results: [], matches: [] };
      if (!teamStats[redTeam]) teamStats[redTeam] = { wins: 0, losses: 0, results: [], matches: [] };

      if (match.winner.includes(match.opponents.blue[0])) {
        teamStats[blueTeam].wins++;
        teamStats[blueTeam].results.push("WIN");
        teamStats[redTeam].losses++;
        teamStats[redTeam].results.push("LOSS");
      } else {
        teamStats[redTeam].wins++;
        teamStats[redTeam].results.push("WIN");
        teamStats[blueTeam].losses++;
        teamStats[blueTeam].results.push("LOSS");
      }

      teamStats[blueTeam].matches.push(match);
      teamStats[redTeam].matches.push(match);
    });

  return Object.entries(teamStats)
    .map(([team, stats]) => ({
      members: team.split(','),
      wins: stats.wins,
      losses: stats.losses,
      last10Results: stats.results.slice(-10),
      last10Matches: stats.matches.slice(-10),
    }))
    .sort((a, b) => (b.wins / (b.wins + b.losses)) - (a.wins / (a.wins + a.losses)) || b.wins - a.wins || a.losses - b.losses)
    .map((item, index) => ({
      rank: index + 1,
      ...item,
    }));
}
