import {
  Match,
  MatchType,
  LeaderboardItem,
  MatchWithEloChanges,
  EloChangeEvent,
} from "../types";

export const DEFAULT_ELO = 1000;
export const DECAY_RATE = 5;
export const DECAY_PERIOD_DAYS = 5;

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

export function calculateELO(matches: Match[]): {
  players: Record<string, number>;
  matchResults: MatchWithEloChanges[];
  decayReport: Record<
    string,
    {
      inactivityDays: number;
      decayApplied: number;
      periods: { start: Date; end: Date; eloLost: number }[];
    }
  >;
  eloChanges: EloChangeEvent[];
} {
  const players: Record<string, number> = {};
  const matchResults: MatchWithEloChanges[] = [];
  const eloChanges: EloChangeEvent[] = [];

  function getELO(player: string) {
    return players[player] ?? DEFAULT_ELO;
  }

  function updateELO({ id, opponents, winner, date, type }: Match) {
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

    matchResults.push({
      id,
      opponents,
      winner,
      date,
      winnerEloChange: winnerChange,
      loserEloChange: loserChange,
      type,
    });
  }

  function applyDecay(matches: Match[]): Record<
    string,
    {
      inactivityDays: number;
      decayApplied: number;
      periods: { start: Date; end: Date; eloLost: number }[];
    }
  > {
    matches.sort((a, b) => a.date.getTime() - b.date.getTime());

    const playerDecayReports: Record<
      string,
      {
        inactivityDays: number;
        periods: { start: Date; end: Date; eloLost: number }[];
      }
    > = {};

    const now = new Date();

    for (const player of Object.keys(players)) {
      const playerMatches = matches.filter(
        (match) =>
          match.opponents.blue.includes(player) ||
          match.opponents.red.includes(player)
      );

      const periods: { start: Date; end: Date; eloLost: number }[] = [];
      let inactivityDays = 0;

      if (playerMatches.length === 0) {
        // If player has no matches at all, decay from "beginning of time"
        continue;
      }

      const matchDates = playerMatches.map((m) => m.date);
      const allDates = [...matchDates, now];

      for (let i = 0; i < allDates.length - 1; i++) {
        const start = allDates[i];
        const end = allDates[i + 1];

        const diffDays = Math.floor(
          (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays > DECAY_PERIOD_DAYS) {
          const inactiveDays = diffDays - DECAY_PERIOD_DAYS;
          const eloLost = inactiveDays * DECAY_RATE;

          players[player] = getELO(player) - eloLost;
          inactivityDays += inactiveDays;

          periods.push({
            start,
            end,
            eloLost,
          });

          // Add individual daily decay events for granularity (optional)
          for (let j = DECAY_PERIOD_DAYS; j < diffDays; j++) {
            const decayDate = new Date(start);
            decayDate.setDate(decayDate.getDate() + j);
            eloChanges.push({
              player,
              change: -DECAY_RATE,
              type: "decay",
              date: decayDate,
            });
          }
        }
      }

      playerDecayReports[player] = {
        inactivityDays,
        periods,
      };
    }

    // Generate final decay report
    return Object.fromEntries(
      Object.entries(playerDecayReports).map(
        ([player, { inactivityDays, periods }]) => [
          player,
          {
            inactivityDays,
            decayApplied: inactivityDays * DECAY_RATE,
            periods,
          },
        ]
      )
    );
  }

  matches.forEach(updateELO);

  const decayReport = applyDecay(matches);

  return {
    players: Object.fromEntries(
      Object.entries(players).map(([player, elo]) => [player, Math.round(elo)])
    ),
    matchResults,
    decayReport,
    eloChanges,
  };
}

export function generateLeaderboard(
  players: Record<string, number>
): LeaderboardItem[] {
  return Object.entries(players)
    .map(([playerName, elo]) => ({ playerName, elo }))
    .sort((a, b) => b.elo - a.elo);
}
