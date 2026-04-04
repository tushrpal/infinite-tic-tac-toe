export function isValidMatchResult(body: any): boolean {
  return (
    body &&
    typeof body.matchId === 'string' &&
    Array.isArray(body.games) &&
    typeof body.mode === 'string' &&
    Array.isArray(body.players)
  );
}
