'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { PlayerList } from '@/components/rooms/PlayerList';
import { PlayerAssignmentModal } from '@/components/rooms/PlayerAssignmentModal';
import { useRoomState } from '@/hooks/useRoomState';
import { useRoomEvents } from '@/hooks/useRoomEvents';
import { startGame, invitePlayers } from '@/lib/rooms';
import { ROUTES } from '@/lib/constants';
import { usePlayer } from '@/hooks/usePlayer';
import type { PlayerInfo } from '@/ws/types';

export default function RoomLobbyPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;
  const { player } = usePlayer();

  const { room, members, isLoading, error, refetch, actions } = useRoomState(roomId);

  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [activityFeed, setActivityFeed] = useState<Array<{ id: string; message: string; timestamp: number }>>([]);
  const [isStartingGame, setIsStartingGame] = useState(false);

  const isHost = room?.hostId === player?.playerId;
  const canStartGame = room?.player1Id && room?.player2Id && room?.status === 'WAITING';

  useRoomEvents(roomId, {
    onMemberJoined: (payload) => {
      refetch();
      addActivity(`${payload.member.username} joined`);
    },
    onMemberLeft: (payload) => {
      refetch();
      const member = members.find((m) => m.playerId === payload.memberId);
      if (member) {
        addActivity(`${member.player.username} left`);
      }
    },
    onReadyStateChanged: (payload) => {
      refetch();
      const member = members.find((m) => m.playerId === payload.playerId);
      if (member) {
        addActivity(
          `${member.player.username} marked ${payload.isReady ? 'ready' : 'not ready'}`
        );
      }
    },
    onPlayersAssigned: (payload) => {
      refetch();
      addActivity(
        `Host assigned ${payload.player1.username} vs ${payload.player2.username}`
      );
    },
    onGameStarting: (payload) => {
      addActivity('Game started');
      router.push(`/match/${payload.matchId}`);
    },
    onGameEnded: (payload) => {
      refetch();
      const winnerText =
        payload.winner === 'DRAW'
          ? 'Draw!'
          : `${payload.winner === 'PLAYER_1' ? payload.player1.username : payload.player2.username} won!`;
      addActivity(winnerText);
    },
    onRoomClosed: (payload) => {
      const reasonText = {
        host_left: 'Room closed - host left',
        host_closed: 'Room closed by host',
        expired: 'Room closed - inactive too long',
      };
      alert(reasonText[payload.reason]);
      router.push(ROUTES.PLAY_ROOMS);
    },
  });

  useEffect(() => {
    if (room) {
      addActivity('Room created');
    }
  }, [room?.id]);

  const addActivity = (message: string) => {
    setActivityFeed((prev) => [
      { id: Math.random().toString(), message, timestamp: Date.now() },
      ...prev,
    ].slice(0, 20));
  };

  const handleStartGame = async () => {
    if (!canStartGame) return;

    setIsStartingGame(true);
    try {
      const { matchId } = await startGame(roomId);
      router.push(`/match/${matchId}`);
    } catch (error) {
      console.error('Error starting game:', error);
      alert('Failed to start game');
    } finally {
      setIsStartingGame(false);
    }
  };

  const handleLeave = async () => {
    if (isHost) {
      if (confirm('Close this room for everyone?')) {
        await actions.close();
        router.push(ROUTES.PLAY_ROOMS);
      }
    } else {
      if (confirm('Leave this room?')) {
        await actions.leave();
        router.push(ROUTES.PLAY_ROOMS);
      }
    }
  };

  if (isLoading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-text-secondary">Loading room...</p>
      </main>
    );
  }

  if (error || !room) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center">
        <p className="text-critical mb-4">Room not found</p>
        <Link href={ROUTES.PLAY_ROOMS}>
          <Button>Back to Rooms</Button>
        </Link>
      </main>
    );
  }

  const displayName = room.name || `${room.host.username}'s Room`;
  const modeLabel = room.mode === 1 ? 'Sliding' : 'Classic';
  const statusLabel = {
    WAITING: 'Open',
    ACTIVE: 'In Game',
    BETWEEN_GAMES: 'Between Games',
    CLOSED: 'Closed',
  }[room.status];

  return (
    <main className="flex-1 flex flex-col px-4 py-8">
      <div className="w-full max-w-7xl mx-auto">
        {/* Header Bar */}
        <div className="mb-8 p-6 rounded-xl bg-surface-elevated border border-board-grid">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-display font-bold mb-2">
                🏠 {displayName}
              </h1>
              <p className="text-text-secondary">
                Host: {room.host.username} · Mode: {modeLabel} · Status: {statusLabel}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleLeave} variant="secondary" size="sm">
              {isHost ? '❌ Close' : '🚪 Leave'}
            </Button>
          </div>
        </div>

        {/* Three-Section Layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Section A: Players */}
          <div className="lg:col-span-1">
            <PlayerList
              members={members}
              hostId={room.hostId}
              currentPlayerId={player?.playerId || null}
              onToggleReady={actions.toggleReady}
              onInvite={() => {
                /* TODO: implement invite modal */
              }}
            />
          </div>

          {/* Section B: Game Assignment */}
          <div className="lg:col-span-1">
            <div className="p-6 rounded-xl bg-surface-elevated border border-board-grid">
              <h3 className="font-semibold mb-6 text-center">Next Game</h3>

              {room.status === 'ACTIVE' ? (
                <div className="text-center space-y-4">
                  <p className="text-lg font-medium">🎮 Game in Progress</p>
                  <div className="space-y-2">
                    <p>{room.player1?.username} (X)</p>
                    <p className="text-text-muted">vs.</p>
                    <p>{room.player2?.username} (O)</p>
                  </div>
                  {room.currentMatchId && (
                    <Button
                      onClick={() => router.push(`/match/${room.currentMatchId}`)}
                      variant="primary"
                    >
                      Watch Game
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <p className="text-sm text-text-secondary">
                      Player 1 (X): {room.player1?.username || 'Not assigned'}
                    </p>
                    <p className="text-text-muted">vs.</p>
                    <p className="text-sm text-text-secondary">
                      Player 2 (O): {room.player2?.username || 'Not assigned'}
                    </p>
                  </div>

                  {isHost && (
                    <>
                      <Button
                        onClick={() => setIsAssignmentModalOpen(true)}
                        variant="secondary"
                        className="w-full"
                      >
                        {room.player1Id && room.player2Id ? 'Change' : 'Assign Players'}
                      </Button>
                      <Button
                        onClick={handleStartGame}
                        variant="primary"
                        className="w-full"
                        disabled={!canStartGame || isStartingGame}
                      >
                        {isStartingGame ? 'Starting...' : 'Start Game'}
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section C: Activity Feed */}
          <div className="lg:col-span-1">
            <div className="p-6 rounded-xl bg-surface-elevated border border-board-grid">
              <h3 className="font-semibold mb-4">Activity</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {activityFeed.length === 0 ? (
                  <p className="text-sm text-text-muted">No activity yet</p>
                ) : (
                  activityFeed.map((item) => (
                    <div key={item.id} className="text-sm text-text-secondary">
                      • {item.message}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <PlayerAssignmentModal
        isOpen={isAssignmentModalOpen}
        onClose={() => setIsAssignmentModalOpen(false)}
        roomId={roomId}
        members={members}
        currentAssignment={{
          player1Id: room.player1Id,
          player2Id: room.player2Id,
        }}
        onSuccess={() => {
          setIsAssignmentModalOpen(false);
          refetch();
        }}
      />
    </main>
  );
}
