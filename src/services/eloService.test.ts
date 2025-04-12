import { describe, it, expect } from 'vitest';
import { calculateELO, calculateDecays, getDynamicKFactor } from './eloService';
import { MatchType } from '../types';
import { DEFAULT_ELO } from '../constants';

describe('getDynamicKFactor', () => {
  it('should calculate K-factor based on Elo difference', () => {
    expect(getDynamicKFactor(1200, 1000)).toBeGreaterThan(20);
    expect(getDynamicKFactor(1200, 1000)).toBeLessThan(60);
  });
});

describe('calculateELO', () => {
  it('should update player Elo correctly', () => {
    const matches = [
      {
        id: '1',
        opponents: { blue: ['player1'], red: ['player2'] },
        winner: ['player1'],
        loser: ['player2'],
        date: new Date(),
        type: MatchType.INDIVIDUAL,
      },
    ];
    const result = calculateELO(matches);
    expect(result.players['player1'].elo).toBeGreaterThan(DEFAULT_ELO);
    expect(result.players['player2'].elo).toBeLessThan(DEFAULT_ELO);
  });
});

describe('calculateDecays', () => {
  it('should apply decay to inactive players', () => {
    const matches = [
      {
        id: '1',
        opponents: { blue: ['player1'], red: ['player2'] },
        winner: ['player1'],
        loser: ['player2'],
        date: new Date(),
        type: MatchType.INDIVIDUAL,
      },
    ];
    const players = {
      player1: { name: 'player1', elo: DEFAULT_ELO, rank: 0, color: '' },
      player2: { name: 'player2', elo: DEFAULT_ELO, rank: 0, color: '' },
    };
    const decays = calculateDecays(matches, players);
    expect(decays).toHaveLength(0); // No decay for active players
  });
});
