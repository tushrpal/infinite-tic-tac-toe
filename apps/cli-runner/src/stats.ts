/**
 * Match statistics tracker
 * 
 * Optional utility for tracking multiple games
 */

export interface GameResult {
  winner: 'X' | 'O' | null;
  turns: number;
  gameNumber: number;
  /** Which player (1 or 2) won this game */
  playerWinner: 1 | 2 | null;
  /** Which player started as X in this game */
  player1StartedAsX: boolean;
}

export interface MatchStats {
  totalGames: number;
  xWins: number;
  oWins: number;
  draws: number;
  averageTurns: number;
  shortestGame: number;
  longestGame: number;
  // Match-level fairness statistics
  player1Wins: number;
  player2Wins: number;
  winsAsX: number;  // Games won by whoever played X
  winsAsO: number;  // Games won by whoever played O
}

/**
 * Track statistics across multiple games
 */
export class StatsTracker {
  private results: GameResult[] = [];

  /**
   * Record a game result
   * 
   * @param winner - Game winner (X or O)
   * @param turns - Number of turns
   * @param playerWinner - Which player (1 or 2) won
   * @param player1StartedAsX - Whether player 1 started as X
   */
  recordGame(
    winner: 'X' | 'O' | null,
    turns: number,
    playerWinner: 1 | 2 | null = null,
    player1StartedAsX: boolean = true
  ): void {
    this.results.push({
      winner,
      turns,
      gameNumber: this.results.length + 1,
      playerWinner,
      player1StartedAsX,
    });
  }

  /**
   * Calculate aggregate statistics
   */
  getStats(): MatchStats {
    if (this.results.length === 0) {
      return {
        totalGames: 0,
        xWins: 0,
        oWins: 0,
        draws: 0,
        averageTurns: 0,
        shortestGame: 0,
        longestGame: 0,
      };
    }

    const xWins = this.results.filter((r) => r.winner === 'X').length;
    const oWins = this.results.filter((r) => r.winner === 'O').length;
    const draws = this.results.filter((r) => r.winner === null).length;
    
    const totalTurns = this.results.reduce((sum, r) => sum + r.turns, 0);
    const turns = this.results.map((r) => r.turns);
    
    // Match-level statistics
    const player1Wins = this.results.filter((r) => r.playerWinner === 1).length;
    const player2Wins = this.results.filter((r) => r.playerWinner === 2).length;
    const winsAsX = xWins; // Games won by whoever played X
    const winsAsO = oWins; // Games won by whoever played O
    
    return {
      totalGames: this.results.length,
      xWins,
      oWins,
      draws,
      averageTurns: totalTurns / this.results.length,
      shortestGame: Math.min(...turns),
      longestGame: Math.max(...turns),
      player1Wins,
      player2Wins,
      winsAsX,
      winsAsO,
    };
  }

  /**
   * Print statistics summary
   */
  /**
   * Print statistics summary
   * 
   * @param showMatchLevel - Whether to show match-level fairness stats
   */
  printSummary(showMatchLevel: boolean = false): void {
    const stats = this.getStats();
    
    console.log('\n' + '='.repeat(50));
    console.log('  MATCH STATISTICS');
    console.log('='.repeat(50));
    console.log(`  Total games:    ${stats.totalGames}`);
    
    if (showMatchLevel && stats.player1Wins + stats.player2Wins > 0) {
      // Show match-level player wins (accounts for alternating starts)
      console.log('\n  Match Score (with alternating starts):');
      console.log(`  Player 1 wins:  ${stats.player1Wins} (${((stats.player1Wins / stats.totalGames) * 100).toFixed(1)}%)`);
      console.log(`  Player 2 wins:  ${stats.player2Wins} (${((stats.player2Wins / stats.totalGames) * 100).toFixed(1)}%)`);
      
      console.log('\n  Starting Position Analysis:');
      console.log(`  Wins as X:      ${stats.winsAsX} (${((stats.winsAsX / stats.totalGames) * 100).toFixed(1)}%)`);
      console.log(`  Wins as O:      ${stats.winsAsO} (${((stats.winsAsO / stats.totalGames) * 100).toFixed(1)}%)`);
    } else {
      // Show traditional X/O wins
      console.log(`  X wins:         ${stats.xWins} (${((stats.xWins / stats.totalGames) * 100).toFixed(1)}%)`);
      console.log(`  O wins:         ${stats.oWins} (${((stats.oWins / stats.totalGames) * 100).toFixed(1)}%)`);
    }
    
    console.log(`  Draws:          ${stats.draws}`);
    console.log(`  Average turns:  ${stats.averageTurns.toFixed(1)}`);
    console.log(`  Shortest game:  ${stats.shortestGame} turns`);
    console.log(`  Longest game:   ${stats.longestGame} turns`);
    console.log('='.repeat(50) + '\n');
  }
}
