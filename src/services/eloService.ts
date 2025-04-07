import { calculateELO, DEFAULT_ELO } from '../utils/elo';
import { MatchType, Match, LeaderboardItem, EloChangeEvent } from '../types';
import { subDays, format, isSameDay, min } from 'date-fns';
import { groupBy } from 'lodash';

export function processELOData({ individualMatches, teamMatches }: { individualMatches: Match[], teamMatches: Match[] }) {
  const { players, matchResults, eloChanges } = calculateELO([...individualMatches, ...teamMatches]);
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
    console.log(day, dayBefore);
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
      borderColor: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
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
  