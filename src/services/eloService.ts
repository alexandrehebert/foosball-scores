import { calculateELO, DEFAULT_ELO } from '../utils/elo';
import { MatchType, Match, LeaderboardItem, EloChangeEvent } from '../types';
import { subDays, format, isSameDay, max } from 'date-fns';

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

  const firstMatchDates: Record<string, Date> = {};
  const lastMatchDate = max(eloChanges.map(({ date }) => date));

  eloChanges.forEach(({ player, date }) => {
    if (!firstMatchDates[player] || date < new Date(firstMatchDates[player])) {
      firstMatchDates[player] = date;
    }
  });

  Object.entries(firstMatchDates).forEach(([player, firstMatchDate]) => {
    const dayBefore = format(subDays(firstMatchDate, 1), 'yyyy-MM-dd');
    if (!eloByDate[dayBefore]) eloByDate[dayBefore] = {};
    eloByDate[dayBefore][player] = DEFAULT_ELO;
  });

  eloChanges.forEach(({ player, change, date }) => {
    const day = format(date, 'yyyy-MM-dd');
    if (isSameDay(date, firstMatchDates[player])) {
      const dayBefore = format(subDays(date, 1), 'yyyy-MM-dd');
      if (!eloByDate[dayBefore]) eloByDate[dayBefore] = {};
      if (!eloByDate[dayBefore][player]) eloByDate[dayBefore][player] = DEFAULT_ELO;
    }
    if (!eloByDate[day]) eloByDate[day] = { ...eloByDate[Object.keys(eloByDate).pop() || day] };
    if (!eloByDate[day][player]) eloByDate[day][player] = eloByDate[Object.keys(eloByDate).pop() || day][player] || DEFAULT_ELO;
    eloByDate[day][player] += change;
  });

  const lastMatchDateFormatted = format(lastMatchDate, 'yyyy-MM-dd');
  eloByDate[lastMatchDateFormatted] = { ...eloByDate[Object.keys(eloByDate).pop() || lastMatchDateFormatted] };
  allPlayers.forEach(player => {
    if (firstMatchDates[player]) {
      eloByDate[lastMatchDateFormatted][player] = players[player];
    }
  });

  const sortedDates = Object.keys(eloByDate).sort();
  const labels = sortedDates;
  const datasets = allPlayers.map(player => {
    let previousElo: number | undefined = undefined;
    return {
      label: player,
      data: sortedDates.map(date => {
        if (eloByDate[date]?.[player] !== undefined) {
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
  