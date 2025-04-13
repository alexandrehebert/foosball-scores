import groupBy from 'lodash/groupBy';
import { DEFAULT_ELO } from '../constants';
import { MatchType, MatchWithEloChanges, EloChangeEvent } from '../types';
import { formatDay } from '../utils/dates';
import { calculateDecays } from './eloService'; // Import the inactivity logic

export type PlayerBadges = Record<string, string[]>;

export const CATEGORY_COLORS = {
  participation: '#4CAF50', // Green
  performance: '#FF9800', // Orange
  resilience: '#F44336', // Red
  longevity: '#9C27B0', // Purple
};

export const BADGES = [
  {
    id: 'rookie',
    name: 'Rookie',
    icon: 'mdi-sprout-outline',
    description: 'Played at least one match',
    category: 'participation', // Category: Participation
    color: CATEGORY_COLORS.participation,
    criteria: (player: string, matches: MatchWithEloChanges[]) =>
      matches.some(
        match =>
          match.opponents.blue.includes(player) || match.opponents.red.includes(player)
      ),
  },
  {
    id: 'team-player',
    name: 'Team Player',
    icon: 'mdi-account-group-outline',
    description: 'Played at least one team match',
    category: 'participation', // Category: Participation
    color: CATEGORY_COLORS.participation,
    criteria: (player: string, matches: MatchWithEloChanges[]) =>
      matches.some(
        match =>
          match.type === MatchType.TEAM &&
          (match.opponents.blue.includes(player) || match.opponents.red.includes(player))
      ),
  },
  {
    id: 'hot-streak',
    name: 'Hot Streak',
    icon: 'mdi-fire',
    description: 'Won three matches in a row',
    count: 3,
    category: 'performance', // Category: Performance
    color: CATEGORY_COLORS.performance,
    criteria: (player: string, matches: MatchWithEloChanges[]) => {
      let streak = 0;
      for (const match of matches) {
        if (match.winner.includes(player)) {
          streak++;
          if (streak === 3) return true;
        } else if (match.loser.includes(player)) {
          streak = 0;
        }
      }
      return false;
    },
  },
  {
    id: 'blazing-streak',
    name: 'Blazing Streak',
    icon: 'mdi-volcano-outline',
    description: 'Won five matches in a row',
    count: 5,
    category: 'performance', // Category: Performance
    color: CATEGORY_COLORS.performance,
    criteria: (player: string, matches: MatchWithEloChanges[]) => {
      let streak = 0;
      for (const match of matches) {
        if (match.winner.includes(player)) {
          streak++;
          if (streak === 5) return true;
        } else if (match.loser.includes(player)) {
          streak = 0;
        }
      }
      return false;
    },
  },
  {
    id: 'invincible',
    name: 'Invincible',
    icon: 'mdi-volcano',
    description: 'Won ten matches in a row',
    count: 10,
    category: 'performance', // Category: Performance
    color: CATEGORY_COLORS.performance,
    criteria: (player: string, matches: MatchWithEloChanges[]) => {
      let streak = 0;
      for (const match of matches) {
        if (match.winner.includes(player)) {
          streak++;
          if (streak === 10) return true;
        } else if (match.loser.includes(player)) {
          streak = 0;
        }
      }
      return false;
    },
  },
  {
    id: 'streak-breaker',
    name: 'Streak Breaker',
    icon: 'mdi-fire-extinguisher',
    description: 'Stopped a win streak of another player (minimum 3 consecutive wins)',
    category: 'performance', // Category: Performance
    color: CATEGORY_COLORS.performance,
    criteria: (player: string, matches: MatchWithEloChanges[]) => {
      const streaks: Record<string, number> = {};

      for (const match of matches) {
        for (const winner of match.winner) {
          streaks[winner] = (streaks[winner] || 0) + 1;
        }
        for (const loser of match.loser) {
          if (match.winner.includes(player) && streaks[loser] >= 3) {
            return true;
          }
          streaks[loser] = 0;
        }
      }

      return false;
    },
  },
  {
    id: 'marathoner',
    name: 'Marathoner',
    icon: 'mdi-calendar-check',
    description: 'Played matches on 5 consecutive days with matches',
    category: 'longevity', // Category: Longevity
    color: CATEGORY_COLORS.longevity,
    criteria: (player: string, matches: MatchWithEloChanges[]) => {
      const playerMatches = matches.filter(
        match =>
          match.opponents.blue.includes(player) || match.opponents.red.includes(player)
      );

      const matchDays = Array.from(
        new Set(matches.map(match => formatDay(match.date)))
      ).sort();
      const playerMatchDays = Array.from(
        new Set(playerMatches.map(match => formatDay(match.date)))
      ).sort();

      let consecutiveDaysWithMatches = 0;
      for (const matchDay of matchDays) {
        const indexOfMatchDay = playerMatchDays.indexOf(matchDay);
        if (indexOfMatchDay === -1) {
          consecutiveDaysWithMatches = 0;
          continue;
        }
        consecutiveDaysWithMatches++;
        if (consecutiveDaysWithMatches === 5) return true;
      }

      return false;
    },
  },
  {
    id: 'iron-streak',
    name: 'Iron Streak',
    icon: 'mdi-calendar-multiple-check',
    description: 'Played matches on 10 consecutive days',
    category: 'longevity', // Category: Longevity
    color: CATEGORY_COLORS.longevity,
    criteria: (player: string, matches: MatchWithEloChanges[]) => {
      const playerMatches = matches.filter(
        match =>
          match.opponents.blue.includes(player) || match.opponents.red.includes(player)
      );

      const matchDays = Array.from(
        new Set(matches.map(match => formatDay(match.date)))
      ).sort();
      const playerMatchDays = Array.from(
        new Set(playerMatches.map(match => formatDay(match.date)))
      ).sort();

      let consecutiveDaysWithMatches = 0;
      for (const matchDay of matchDays) {
        const indexOfMatchDay = playerMatchDays.indexOf(matchDay);
        if (indexOfMatchDay === -1) {
          consecutiveDaysWithMatches = 0;
          continue;
        }
        consecutiveDaysWithMatches++;
        if (consecutiveDaysWithMatches === 10) return true;
      }

      return false;
    },
  },
  {
    id: 'top-dog',
    name: 'Top Dog',
    icon: 'mdi-trophy-award',
    description: 'Reached the top of the leaderboard at least once',
    category: 'performance', // Category: Performance
    color: CATEGORY_COLORS.performance,
    criteria: (player: string, _: MatchWithEloChanges[], eloChanges: EloChangeEvent[]) => {
      const leaderboardHistory = generateLeaderboardHistory(eloChanges);
      return leaderboardHistory.some(leaderboard => leaderboard[0]?.player === player);
    },
  },
  {
    id: 'king-of-the-hill',
    name: 'King of the Hill',
    icon: 'mdi-crown-outline',
    description: 'Stayed on top of the leaderboard for 5 consecutive days',
    count: 5,
    category: 'performance', // Category: Performance
    color: CATEGORY_COLORS.performance,
    criteria: (player: string, _: MatchWithEloChanges[], eloChanges: EloChangeEvent[]) => {
      const leaderboardHistory = generateLeaderboardHistory(eloChanges);
      let consecutiveDaysOnTop = 0;

      for (const leaderboard of leaderboardHistory) {
        if (leaderboard[0]?.player === player) {
          consecutiveDaysOnTop++;
          if (consecutiveDaysOnTop === 5) return true;
        } else {
          consecutiveDaysOnTop = 0;
        }
      }

      return false;
    },
  },
  {
    id: 'emperor-of-the-hill',
    name: 'Emperor of the Hill',
    icon: 'mdi-crown',
    description: 'Stayed on top of the leaderboard for 10 consecutive days',
    count: 10,
    category: 'performance', // Category: Performance
    color: CATEGORY_COLORS.performance,
    criteria: (player: string, _: MatchWithEloChanges[], eloChanges: EloChangeEvent[]) => {
      const leaderboardHistory = generateLeaderboardHistory(eloChanges);
      let consecutiveDaysOnTop = 0;

      for (const leaderboard of leaderboardHistory) {
        if (leaderboard[0]?.player === player) {
          consecutiveDaysOnTop++;
          if (consecutiveDaysOnTop === 10) return true;
        } else {
          consecutiveDaysOnTop = 0;
        }
      }

      return false;
    },
  },
  {
    id: 'out-of-this-world',
    name: 'Out of This World',
    icon: 'mdi-alien',
    description: 'Maintained the #1 leaderboard position for 30 consecutive days',
    category: 'performance', // Category: Performance
    color: CATEGORY_COLORS.performance,
    criteria: (player: string, _: MatchWithEloChanges[], eloChanges: EloChangeEvent[]) => {
      const leaderboardHistory = generateLeaderboardHistory(eloChanges);
      let consecutiveDaysOnTop = 0;

      for (const leaderboard of leaderboardHistory) {
        if (leaderboard[0]?.player === player) {
          consecutiveDaysOnTop++;
          if (consecutiveDaysOnTop === 30) return true;
        } else {
          consecutiveDaysOnTop = 0;
        }
      }

      return false;
    },
  },
  {
    id: 'never-give-up',
    name: 'Never Give Up',
    icon: 'mdi-coffin',
    description: 'Lost 5 consecutive matches but kept playing',
    category: 'resilience', // Category: Resilience
    color: CATEGORY_COLORS.resilience,
    criteria: (player: string, matches: MatchWithEloChanges[]) => {
      const playerMatches = matches.filter(
        match =>
          match.opponents.blue.includes(player) || match.opponents.red.includes(player)
      );
      let streak = 0;
      for (const match of playerMatches) {
        if (!match.winner.includes(player)) {
          streak++;
          if (streak === 5 && playerMatches.indexOf(match) < playerMatches.length - 1) return true;
        } else {
          streak = 0;
        }
      }
      return false;
    },
  },
  {
    id: 'elo-surge',
    name: 'ELO Surge',
    icon: 'mdi-lightning-bolt',
    description: 'Earned 50 Elo in a single day',
    category: 'performance', // Category: Performance
    color: CATEGORY_COLORS.performance,
    criteria: (player: string, _: MatchWithEloChanges[], eloChanges: EloChangeEvent[]) => {
      const leaderboardHistory = generateLeaderboardHistory(eloChanges);

      for (let i = 1; i < leaderboardHistory.length; i++) {
        const previousDay = leaderboardHistory[i - 1];
        const currentDay = leaderboardHistory[i];

        const previousElo = previousDay.find(entry => entry.player === player)?.elo || 0;
        const currentElo = currentDay.find(entry => entry.player === player)?.elo || 0;

        if (currentElo - previousElo >= 50) {
          return true;
        }
      }

      return false;
    },
  },
  {
    id: 'rocket-man',
    name: 'Rocket Man',
    icon: 'mdi-rocket-launch',
    description: 'Earned 99 Elo in a single day',
    category: 'performance', // Category: Performance
    color: CATEGORY_COLORS.performance,
    criteria: (player: string, _: MatchWithEloChanges[], eloChanges: EloChangeEvent[]) => {
      const leaderboardHistory = generateLeaderboardHistory(eloChanges);

      for (let i = 1; i < leaderboardHistory.length; i++) {
        const previousDay = leaderboardHistory[i - 1];
        const currentDay = leaderboardHistory[i];

        const previousElo = previousDay.find(entry => entry.player === player)?.elo || 0;
        const currentElo = currentDay.find(entry => entry.player === player)?.elo || 0;

        if (currentElo - previousElo >= 99) {
          return true;
        }
      }

      return false;
    },
  },
  {
    id: 'rank-climber',
    name: 'Rank Climber',
    icon: 'mdi-summit',
    description: 'Climbed 3 ranks in a single day',
    category: 'performance', // Category: Performance
    color: CATEGORY_COLORS.performance,
    criteria: (player: string, _: MatchWithEloChanges[], eloChanges: EloChangeEvent[]) => {
      const leaderboardHistory = generateLeaderboardHistory(eloChanges);
      let index = 1;
      for (const leaderboard of leaderboardHistory) {
        const tomorrowLeaderboard = leaderboardHistory[index++];
        if (!tomorrowLeaderboard) break;
        const todayRank = leaderboard.findIndex(item => item.player === player);
        if (todayRank === -1) continue;
        const tomorrowPlayerRank = tomorrowLeaderboard.findIndex(item => item.player === player);
        if ((todayRank - tomorrowPlayerRank) >= 3) {
          return true;
        }
      }
      return false;
    },
  },
  {
    id: 'rank-dropper',
    name: 'Scuba Diver',
    icon: 'mdi-diving-scuba',
    description: 'Lost 3 ranks in a single day',
    category: 'resilience', // Category: Resilience
    color: CATEGORY_COLORS.resilience,
    criteria: (player: string, _: MatchWithEloChanges[], eloChanges: EloChangeEvent[]) => {
      const leaderboardHistory = generateLeaderboardHistory(eloChanges);
      let index = 1;
      for (const leaderboard of leaderboardHistory) {
        const tomorrowLeaderboard = leaderboardHistory[index++];
        if (!tomorrowLeaderboard) break;
        const todayRank = leaderboard.findIndex(item => item.player === player);
        if (todayRank === -1) continue;
        const tomorrowPlayerRank = tomorrowLeaderboard.findIndex(item => item.player === player);
        if ((tomorrowPlayerRank - todayRank) >= 3) {
          return true;
        }
      }
      return false;
    },
  },
  {
    id: 'rank-freefall',
    name: 'Seabed Explorer',
    icon: 'mdi-diving-helmet',
    description: 'Lost 5 ranks in a single day',
    category: 'resilience', // Category: Resilience
    color: CATEGORY_COLORS.resilience,
    criteria: (player: string, _: MatchWithEloChanges[], eloChanges: EloChangeEvent[]) => {
      const leaderboardHistory = generateLeaderboardHistory(eloChanges);
      let index = 1;
      for (const leaderboard of leaderboardHistory) {
        const tomorrowLeaderboard = leaderboardHistory[index++];
        if (!tomorrowLeaderboard) break;
        const todayRank = leaderboard.findIndex(item => item.player === player);
        if (todayRank === -1) continue;
        const tomorrowPlayerRank = tomorrowLeaderboard.findIndex(item => item.player === player);
        if ((tomorrowPlayerRank - todayRank) >= 5) {
          return true;
        }
      }
      return false;
    },
  },
  {
    id: 'comeback-kid',
    name: 'Comeback Kid',
    icon: 'mdi-run-fast',
    description: 'Returned to play after being inactive for 3 days',
    category: 'resilience', // Category: Resilience
    color: CATEGORY_COLORS.resilience,
    criteria: (player: string, matches: MatchWithEloChanges[]) => {
      const decays = calculateDecays(matches, { [player]: { name: player, elo: 0, rank: 0, color: '' } });
      return decays.some(decay => decay.player === player);
    },
  },
  {
    id: 'partners-in-crime',
    name: 'Partners in Crime',
    icon: 'mdi-handshake',
    description: 'Played 5 team matches with the same teammate',
    category: 'participation', // Category: Participation
    color: CATEGORY_COLORS.participation,
    count: 5,
    criteria: (player: string, matches: MatchWithEloChanges[]) => {
      const teammateCounts: Record<string, number> = {};
      for (const match of matches.filter(match => match.type === MatchType.TEAM && (match.opponents.blue.includes(player) || match.opponents.red.includes(player)))) {
        const team = match.opponents.blue.includes(player)
          ? match.opponents.blue
          : match.opponents.red.includes(player)
            ? match.opponents.red
            : null;
        if (team) {
          const teammate = team.find(member => member !== player);
          if (teammate) {
            teammateCounts[teammate] = (teammateCounts[teammate] || 0) + 1;
            if (teammateCounts[teammate] === 5) return true;
          }
        }
      }
      return false;
    },
  },
  {
    id: 'soulmates',
    name: 'Soulmates',
    icon: 'mdi-ring',
    description: 'Played 10 team matches with the same teammate',
    category: 'participation', // Category: Participation
    color: CATEGORY_COLORS.participation,
    count: 10,
    criteria: (player: string, matches: MatchWithEloChanges[]) => {
      const teammateCounts: Record<string, number> = {};
      for (const match of matches.filter(match => match.type === MatchType.TEAM && (match.opponents.blue.includes(player) || match.opponents.red.includes(player)))) {
        const team = match.opponents.blue.includes(player)
          ? match.opponents.blue
          : match.opponents.red.includes(player)
            ? match.opponents.red
            : null;
        if (team) {
          const teammate = team.find(member => member !== player);
          if (teammate) {
            teammateCounts[teammate] = (teammateCounts[teammate] || 0) + 1;
            if (teammateCounts[teammate] === 10) return true;
          }
        }
      }
      return false;
    },
  },
  {
    id: 'veteran',
    name: 'Veteran',
    icon: 'mdi-medal-outline',
    description: 'Played matches on more than 30 different days',
    category: 'longevity', // Category: Longevity
    color: CATEGORY_COLORS.longevity,
    criteria: (player: string, matches: MatchWithEloChanges[]) => {
      const playerMatches = matches.filter(
        match =>
          match.opponents.blue.includes(player) || match.opponents.red.includes(player)
      );

      const uniqueDays = new Set(playerMatches.map(match => formatDay(match.date)));
      return uniqueDays.size > 30;
    },
  },
  {
    id: 'elite-veteran',
    name: 'Centenarian',
    icon: 'mdi-medal',
    description: 'Played matches on more than 100 different days',
    category: 'longevity', // Category: Longevity
    color: CATEGORY_COLORS.longevity,
    criteria: (player: string, matches: MatchWithEloChanges[]) => {
      const playerMatches = matches.filter(
        match =>
          match.opponents.blue.includes(player) || match.opponents.red.includes(player)
      );

      const uniqueDays = new Set(playerMatches.map(match => formatDay(match.date)));
      return uniqueDays.size > 100;
    },
  },
];

export function calculateBadges(players: string[], matches: MatchWithEloChanges[], eloChanges: EloChangeEvent[]): PlayerBadges {
  const badges: PlayerBadges = {};

  players.forEach(player => {
    badges[player] = BADGES.filter(badge => badge.criteria(player, matches, eloChanges)).map(badge => badge.id);
  });

  return badges;
}

// Helper function to generate leaderboard history
function generateLeaderboardHistory(eloChanges: EloChangeEvent[]) {
  const allPlayers = new Set<string>(eloChanges.map(change => change.player));

  const players: Record<string, number> = {};
  const leaderboardHistory: { player: string; elo: number }[][] = [];
  const eloChangesByDay: Record<string, EloChangeEvent[]> = groupBy(eloChanges, (change: EloChangeEvent) => formatDay(change.date));
  const matchDays = Object.keys(eloChangesByDay).sort();

  matchDays.forEach(day => {
    // Initialize Elo for all players to DEFAULT_ELO if not already set
    allPlayers.forEach(player => {
      if (!players[player]) players[player] = DEFAULT_ELO;
    });

    // Apply Elo changes for the day
    eloChangesByDay[day].forEach(({ player, change }) => {
      if (!players[player]) players[player] = DEFAULT_ELO;
      players[player] += change;
    });

    // Generate the leaderboard for the day
    const sortedLeaderboard = Object.entries(players)
      .map(([player, elo]) => ({ player, elo }))
      .sort((a, b) => b.elo - a.elo);

    leaderboardHistory.push(sortedLeaderboard);
  });

  return leaderboardHistory;
}
