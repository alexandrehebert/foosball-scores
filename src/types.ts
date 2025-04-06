export enum MatchType {
  TEAM = 'team',
  INDIVIDUAL = 'individual',
}

export type Match = {
  id: string;
  opponents: { blue: string[]; red: string[] }; // Unified structure for teams or individuals
  winner: string[]; // Array to accommodate team or individual winners
  date: Date;
  type: MatchType; // Type to distinguish between team and individual matches
};

export type EloChange = {
  winnerEloChange: number;
  loserEloChange: number;
}

export type MatchWithEloChanges = Match & EloChange;

export type LeaderboardItem = {
  playerName: string;
  elo: number;
}

export type EloChangeEvent = {
  player: string;
  change: number;
  type: "match" | "decay";
  date: Date;
};