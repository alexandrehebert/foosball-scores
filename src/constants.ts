export const MATCH_RESULTS = {
  WIN: 'win',
  LOSS: 'loss',
  EMPTY: 'empty',
};

export const TEAMS = {
  BLUE: 'Blue Team',
  RED: 'Red Team',
};

export const DEFAULT_ELO = 1000;
export const DECAY_RATE = 5;
export const DECAY_PERIOD_DAYS = 3;

export const BASE_URL = import.meta.env.VITE_BASE_URL || '.';
export const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || '/';
export const GITHUB_REPOSITORY_DATA_FOLDER = import.meta.env.VITE_DATA_FOLDER || 'https://github.com/alexandrehebert/foosball-scores/edit/main/public';
