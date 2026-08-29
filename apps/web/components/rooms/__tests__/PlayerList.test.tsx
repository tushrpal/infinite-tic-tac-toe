import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlayerList } from '../PlayerList';
import type { RoomMember } from '@/ws/types';

describe('PlayerList', () => {
  const mockMembers: RoomMember[] = [
    {
      id: 'member-1',
      roomId: 'room-1',
      playerId: 'player-1',
      isReady: true,
      joinedAt: new Date().toISOString(),
      player: {
        id: 'player-1',
        username: 'alice',
        displayName: 'Alice',
        ratingMode1: 1234,
        isConnected: true,
      },
    },
    {
      id: 'member-2',
      roomId: 'room-1',
      playerId: 'player-2',
      isReady: false,
      joinedAt: new Date().toISOString(),
      player: {
        id: 'player-2',
        username: 'bob',
        displayName: 'Bob',
        ratingMode1: 980,
        isConnected: true,
      },
    },
  ];

  it('should render all members', () => {
    render(
      <PlayerList
        members={mockMembers}
        hostId="player-1"
        currentPlayerId="player-1"
        onToggleReady={vi.fn()}
        onInvite={vi.fn()}
      />
    );

    expect(screen.getByText('Alice')).toBeTruthy();
    expect(screen.getByText('Bob')).toBeTruthy();
  });

  it('should show crown icon for host', () => {
    render(
      <PlayerList
        members={mockMembers}
        hostId="player-1"
        currentPlayerId="player-1"
        onToggleReady={vi.fn()}
        onInvite={vi.fn()}
      />
    );

    expect(screen.getByText('👑')).toBeTruthy();
  });

  it('should show ready state badges', () => {
    render(
      <PlayerList
        members={mockMembers}
        hostId="player-1"
        currentPlayerId="player-1"
        onToggleReady={vi.fn()}
        onInvite={vi.fn()}
      />
    );

    expect(screen.getByText('✅ Ready')).toBeTruthy();
    expect(screen.getByText('⏸️ Not Ready')).toBeTruthy();
  });

  it('should show toggle button for current player', () => {
    render(
      <PlayerList
        members={mockMembers}
        hostId="player-1"
        currentPlayerId="player-1"
        onToggleReady={vi.fn()}
        onInvite={vi.fn()}
      />
    );

    expect(screen.getByText('Mark Not Ready')).toBeTruthy();
  });

  it('should call onToggleReady when button clicked', () => {
    const onToggleReady = vi.fn();
    render(
      <PlayerList
        members={mockMembers}
        hostId="player-1"
        currentPlayerId="player-1"
        onToggleReady={onToggleReady}
        onInvite={vi.fn()}
      />
    );

    const toggleButton = screen.getByText('Mark Not Ready');
    fireEvent.click(toggleButton);

    expect(onToggleReady).toHaveBeenCalled();
  });

  it('should show player ratings', () => {
    render(
      <PlayerList
        members={mockMembers}
        hostId="player-1"
        currentPlayerId="player-1"
        onToggleReady={vi.fn()}
        onInvite={vi.fn()}
      />
    );

    expect(screen.getByText('⭐ Rating: 1234')).toBeTruthy();
    expect(screen.getByText('⭐ Rating: 980')).toBeTruthy();
  });
});
