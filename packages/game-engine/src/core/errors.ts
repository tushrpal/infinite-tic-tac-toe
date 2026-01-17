/**
 * Shared error definitions for the game engine.
 */

export class GameEngineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GameEngineError';
  }
}

export class InvalidMoveError extends GameEngineError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidMoveError';
  }
}
