# Foosball Leaderboard

## Matches Files

The project uses two CSV files to store match data:

1. **Individual Matches**:
   - File: `public/matches.csv`
   - Format:
     ```csv
     Blue Player;Red Player;;Winner;Date
     Alexandre;Fanilo;Fanilo;2025-03-25T12:00-04:00
     ```
   - Each row represents a match between two players, specifying the winner and the date.

2. **Team Matches**:
   - File: `public/team-matches.csv`
   - Format:
     ```csv
     Blue Team;;Red Team;;Winner;Date
     Laurence;Alexandre;Gabriel;Fanilo;Blue Team;2025-03-25T12:00-04:00
     ```
   - Each row represents a match between two teams, specifying the winning team and the date.

---

## Folder Structure

The project is organized as follows:

```
/Users/alexandrehebert/Projects/fairstone/foosball-scores
├── public/                # Public assets (e.g., CSV files, robots.txt)
│   ├── matches.csv        # Individual match data
│   ├── team-matches.csv   # Team match data
│   └── robots.txt         # Robots.txt file
├── src/                   # Source code
│   ├── components/        # Vue components
│   ├── services/          # Business logic and data fetching
│   ├── utils/             # Utility functions
│   ├── types.ts           # TypeScript type definitions
│   ├── App.vue            # Main application component
│   └── main.ts            # Application entry point
├── .github/               # GitHub workflows
├── package.json           # Project metadata and dependencies
├── tsconfig.json          # TypeScript configuration
└── vite.config.ts         # Vite configuration
```

---

# ELO Computation System Manual

## Overview
The ELO computation system is designed to calculate and track player ratings based on their performance in matches. It dynamically adjusts player ratings after each match and applies a decay system to account for inactivity.

---

## ELO Changes

### Match Results
ELO changes are calculated after every match based on the following factors:
- **Winner's ELO**: The average ELO of the winning team.
- **Loser's ELO**: The average ELO of the losing team.
- **Dynamic K-Factor**: A scaling factor that adjusts the impact of the match based on the ELO difference between the teams. The larger the ELO difference, the smaller the impact of the match on the higher-rated player and the larger the impact on the lower-rated player.

#### Formula
1. Calculate the expected score for the winner:
   ```
   Expected_Score = 1 / (1 + 10^((Loser_ELO - Winner_ELO) / 400))
   ```
   - If the ELO difference is large, the expected score for the higher-rated player approaches 1, meaning they are heavily favored to win.
   - If the ELO difference is small, the expected score approaches 0.5, meaning the match is more evenly balanced.

2. Adjust the ELO for each player:
   - Winner's ELO increases by:
     ```
     K * (1 - Expected_Score)
     ```
     - A higher expected score results in a smaller ELO gain for the winner, as they were expected to win.
   - Loser's ELO decreases by:
     ```
     K * (0 - Expected_Score)
     ```
     - A lower expected score results in a smaller ELO loss for the loser, as they were expected to lose.

### Individual vs Team Matches
- **Individual Matches**: Full K-factor is applied.
- **Team Matches**: K-factor is halved to account for team dynamics.

---

## Decay System

### Purpose
The decay system ensures that players who remain inactive for extended periods do not retain artificially high ratings. It encourages consistent participation.

### Rules
1. **Inactivity Definition**: A player is considered inactive if they do not participate in matches for 3 consecutive days with matches.
2. **Decay Rate**: Players lose a fixed amount of ELO (e.g., 5 points) for each day of inactivity beyond the threshold.

### Implementation
- **Tracking Inactivity**:
  - The system identifies days with matches and checks if the player participated.
  - If a player does not participate for 3 consecutive match days, they are marked as inactive.
- **Decay Application**:
  - For each day of inactivity beyond the threshold, the player's ELO is reduced by the decay rate.
  - The decay is applied in periods, and each period is recorded with the start and end dates and the total ELO lost.

### Period Tracking
- Each inactivity period is logged with:
  - **Start Date**: The first day of inactivity.
  - **End Date**: The last day of inactivity.
  - **ELO Lost**: The total ELO deducted during the period.
- When an inactivity period ends, an entry is added to the log with zero ELO lost to mark the conclusion of the period.

---

## Example
### Match-Based ELO Change
- **Player A** (ELO: 1200) defeats **Player B** (ELO: 1000).
- Dynamic K-factor: 40.
- Expected Score for Player A: 0.76.
- ELO Change:
  - Player A gains: \( 40 \times (1 - 0.76) = +9.6 \) (rounded to +10).
  - Player B loses: \( 40 \times (0 - 0.76) = -30.4 \) (rounded to -30).

### Decay Example
- **Player C** does not play for 5 consecutive match days.
- Decay starts after 3 days:
  - Day 4: -5 ELO.
  - Day 5: -5 ELO.
- Total ELO lost: 10 points.

---

## Summary
The ELO computation system dynamically adjusts player ratings based on match outcomes and applies a decay system to ensure fairness and encourage participation. By combining these mechanisms, the system maintains a competitive and balanced leaderboard.