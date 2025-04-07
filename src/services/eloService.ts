import { subDays, format, isSameDay, min, parse } from 'date-fns';
import { groupBy } from 'lodash';
import { getPlayerColor } from '../utils/color';

import { compareAsc } from "date-fns";
import {
  Match,
  MatchType,
  MatchWithEloChanges,
  EloChangeEvent,
  LeaderboardItem,
  DecayItem,
} from "../types";
import { de } from 'date-fns/locale';

export const DEFAULT_ELO = 1000;
export const DECAY_RATE = 5;
export const DECAY_PERIOD_DAYS = 3;

function getDynamicKFactor(winnerElo: number, loserElo: number): number {
  const eloDiff = Math.abs(winnerElo - loserElo);

  const minK = 20; // Increase the minimum K-factor to make even small differences more impactful
  const maxK = 60; // Increase the max K-factor to allow for larger Elo differences
  const maxDiff = 500; // Allow Elo differences beyond 300

  // Clamp the eloDiff to the range [0, maxDiff]
  const clampedDiff = Math.min(eloDiff, maxDiff);

  // Linearly interpolate K between minK and maxK
  const kFactor = minK + (maxK - minK) * (clampedDiff / maxDiff);

  return Math.round(kFactor);
}

function calculateELO(matches: Match[]): {
  players: Record<string, number>;
  matchResults: MatchWithEloChanges[];
  eloChanges: EloChangeEvent[];
} {
  const players: Record<string, number> = {};

  function getELO(player: string) {
    return players[player] ?? DEFAULT_ELO;
  }

  function updateELO({ id, opponents, winner, date, type }: Match, eloChanges: EloChangeEvent[]): MatchWithEloChanges {
    const blueTeamELO =
      opponents.blue.map(getELO).reduce((a, b) => a + b, 0) /
      opponents.blue.length;
    const redTeamELO =
      opponents.red.map(getELO).reduce((a, b) => a + b, 0) /
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
    const winnerChange = Math.round(kFactor * (1 - expectedScoreWinner) * 1.5); // Increase effect on winner
    const loserChange = Math.round(kFactor * (0 - expectedScoreLoser) * 1.5); // Increase effect on loser

    opponents[winnerTeam].forEach((player) => {
      players[player] = getELO(player) + winnerChange;
      eloChanges.push({ player, change: winnerChange, type: "match", date });
    });

    opponents[loserTeam].forEach((player) => {
      players[player] = getELO(player) + loserChange;
      eloChanges.push({ player, change: loserChange, type: "match", date });
    });

    return {
      id,
      opponents,
      winner,
      date,
      winnerEloChange: winnerChange,
      loserEloChange: loserChange,
      type,
    };
  }

  function calculateDecays(matches: Match[]): EloChangeEvent[] {
    const playerDecays: EloChangeEvent[] = [];
    const matchDays = Array.from(new Set(matches.map((m) => format(m.date, 'yyyy-MM-dd'))));

    for (const player of Object.keys(players)) {
      const playerMatches = matches.filter(
        (match) =>
          match.opponents.blue.includes(player) ||
          match.opponents.red.includes(player)
      );

      const playerMatchDays = [...(new Set(
        playerMatches.map((m) => format(m.date, 'yyyy-MM-dd'))
      ))].sort();

      let inactivityDays = 0;
      let hasPlayed = false;
      for (const matchDay of matchDays) {
        hasPlayed = hasPlayed || playerMatchDays.includes(matchDay);
        if (!hasPlayed) continue;
        inactivityDays = playerMatchDays.includes(matchDay) ? 0 : inactivityDays + 1;
        if (inactivityDays >= DECAY_PERIOD_DAYS) {
          console.log(`Decay applied to ${player} on ${matchDay}`);
          playerDecays.push({
            player,
            change: -DECAY_RATE,
            type: "decay",
            date: parse(matchDay, 'yyyy-MM-dd', new Date()),
          });
        }
      }
    }

    return playerDecays;
  }

  const eloMatchChanges: EloChangeEvent[] = [];
  const matchResults = matches.map((match) => updateELO(match, eloMatchChanges));
  const eloChanges: EloChangeEvent[] = [...eloMatchChanges, ...calculateDecays(matches)].sort((a, b) => compareAsc(a.date, b.date));

  return {
    players,
    matchResults,
    eloChanges,
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

export function generateELOChartData(players: Record<string, number>, eloChanges: EloChangeEvent[]) {
  const eloByDate: Record<string, Record<string, number>> = {};
  const allPlayers = Object.keys(players);

  const firstMatchDates: Record<string, Date> = allPlayers.map((player) => min(eloChanges.filter(({ player: p }) => p === player).map(({ date }) => date)))
    .reduce((acc, date, index) => {
      acc[allPlayers[index]] = date;
      return acc;
    }, {} as Record<string, Date>);
  const matchDates: string[] = eloChanges.map(({ date }) => format(date, 'yyyy-MM-dd'))
    .reduce((acc, date) => {
      if (!acc.includes(date)) acc.push(date);
      return acc;
    }, [] as string[]);
  const eloAcc: Record<string, number> = allPlayers.reduce((acc, player) => {
      acc[player] = DEFAULT_ELO;
      return acc;
    }, {} as Record<string, number>);

  const eloChangesByDate = groupBy(eloChanges, (change) => format(change.date, 'yyyy-MM-dd'));
  
  Object.entries(eloChangesByDate).forEach(([day, changes]) => {
    const [{ date }] = changes;
    const dayBefore = matchDates[matchDates.indexOf(day) - 1] ?? format(subDays(date, 1), 'yyyy-MM-dd');
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

export function generateLeaderboard(
    players: Record<string, number>
  ): LeaderboardItem[] {
    return Object.entries(players)
      .map(([playerName, elo]) => ({ playerName, elo }))
      .sort((a, b) => b.elo - a.elo);
  }
