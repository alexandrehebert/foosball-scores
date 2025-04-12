import { describe, it, expect, vi } from 'vitest';
import { fetchMatches } from './matchService';
import { API_ENDPOINT } from '../constants';

vi.mock('../utils/csv', () => ({
  parseCSV: vi.fn((name: string) => ({
    rows: name === 'mockMatchesCSV' ? [
      ['player1', 'player2', 'player1', '2023-01-01T12:00-04:00'],
      ['player3', 'player4', 'player4', '2023-01-02T12:00-04:00'],
    ] : [
      ['player1', 'player2', 'player3', 'player4', 'Blue Team', '2023-01-01T12:00-04:00'],
    ],
  })),
}));

describe('fetchMatches', () => {
  it('should fetch and parse matches correctly', async () => {
    global.fetch = vi.fn((url) =>
      Promise.resolve({
        text: () => Promise.resolve(url.includes('team-matches.csv') ? 'mockTeamMatchesCSV' : 'mockMatchesCSV'),
      })
    ) as any;

    const result = await fetchMatches();

    expect(global.fetch).toHaveBeenCalledWith(`${API_ENDPOINT}/matches.csv`);
    expect(global.fetch).toHaveBeenCalledWith(`${API_ENDPOINT}/team-matches.csv`);
    expect(result.individualMatches).toHaveLength(2);
    expect(result.teamMatches).toHaveLength(1);
  });
});
