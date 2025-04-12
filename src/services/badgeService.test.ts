import { describe, it, expect } from 'vitest';
import { calculateBadges } from './badgeService';
import { EloChangeEvent, MatchType, MatchWithEloChanges } from '../types';

describe('calculateBadges', () => {
  it('should assign badges based on criteria', () => {
    const matches: MatchWithEloChanges[] = [
      {
        id: '1',
        opponents: { blue: ['player1'], red: ['player2'] },
        winner: ['player1'],
        loser: ['player2'],
        date: new Date(),
        type: MatchType.INDIVIDUAL,
        winnerEloChange: 20,
        loserEloChange: -20,
      },
    ];
    const eloChanges: EloChangeEvent[] = [];
    const players = ['player1', 'player2'];

    const badges = calculateBadges(players, matches, eloChanges);

    expect(badges['player1']).toContain('rookie');
    expect(badges['player2']).toContain('rookie');
  });
});
