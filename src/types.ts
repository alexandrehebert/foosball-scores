export enum MatchType {
  TEAM = 'team',
  INDIVIDUAL = 'individual',
}

export type Match = {
  id: string;
  opponents: { blue: string[]; red: string[] }; // Unified structure for teams or individuals
  winner: string[]; // Array to accommodate team or individual winners
  loser: string[]; // Array to accommodate team or individual losers
  date: Date;
  type: MatchType; // Type to distinguish between team and individual matches
};

export type EloChange = {
  winnerEloChange: number;
  loserEloChange: number;
}

export type MatchWithEloChanges = Match & EloChange;

export enum MatchResult {
  WIN = 'WIN',
  LOSS = 'LOSS',
}

export type LeaderboardItem = {
  rank: number;
  rankVariation: number;
  player: Player;
  last10IndividualResults: MatchResult[];
  last10TeamResults: MatchResult[];
  last10IndividualMatches: MatchWithEloChanges[];
  last10TeamMatches: MatchWithEloChanges[];
}

export type EloChangeEvent = {
  player: string;
  change: number;
  type: "match" | "decay";
  date: Date;
};

export type Player = {
  name: string;
  elo: number;
  color: string;
  rank: number;
}

export type Players = Record<string, Player>;

export type TeamRankingItem = {
  rank: number;
  team: string[];
  wins: number;
  losses: number;
};

export type Round = {
  id: string;
  player1?: Player;
  player2?: Player;
  winProbability: { player1: number; player2: number };
  previousMatches: string[];
  selectedWinner?: Player; // Added selectedWinner to track the winner of the match
};
