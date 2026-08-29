import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PlayerAssignmentModal } from '../PlayerAssignmentModal';
import type { RoomMember } from '@/ws/types';
import * as roomsApi from '@/lib/rooms';

vi.mock('@/lib/rooms');
vi.mock('@/components/ui/Modal', () => ({
  Modal: ({ children, isOpen, title }: any) => isOpen ? <div data-testid="modal">{title}{children}</div> : null,
}));
vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick, type, disabled, variant }: any) => (
    <button
      onClick={onClick}
      type={type}
      disabled={disabled}
      data-variant={variant}
    >
      {children}
    </button>
  ),
}));

describe('PlayerAssignmentModal', () => {
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
        isConnected: true,
      },
    },
    {
      id: 'member-2',
      roomId: 'room-1',
      playerId: 'player-2',
      isReady: true,
      joinedAt: new Date().toISOString(),
      player: {
        id: 'player-2',
        username: 'bob',
        displayName: 'Bob',
        isConnected: true,
      },
    },
    {
      id: 'member-3',
      roomId: 'room-1',
      playerId: 'player-3',
      isReady: false,
      joinedAt: new Date().toISOString(),
      player: {
        id: 'player-3',
        username: 'charlie',
        displayName: 'Charlie',
        isConnected: true,
      },
    },
  ];

  it('should render player dropdowns', () => {
    render(
      <PlayerAssignmentModal
        isOpen={true}
        onClose={vi.fn()}
        roomId="room-1"
        members={mockMembers}
        onSuccess={vi.fn()}
      />
    );

    expect(screen.getByLabelText(/Player 1 \(X\)/i)).toBeTruthy();
    expect(screen.getByLabelText(/Player 2 \(O\)/i)).toBeTruthy();
  });

  it('should show ready players first in dropdowns', () => {
    render(
      <PlayerAssignmentModal
        isOpen={true}
        onClose={vi.fn()}
        roomId="room-1"
        members={mockMembers}
        onSuccess={vi.fn()}
      />
    );

    const select = screen.getByLabelText(/Player 1 \(X\)/i);
    const options = Array.from(select.querySelectorAll('option'));
    const optionTexts = options.map((o) => o.textContent);

    // Ready players should come before not ready
    const aliceIndex = optionTexts.findIndex((t) => t?.includes('Alice'));
    const charlieIndex = optionTexts.findIndex((t) => t?.includes('Charlie'));
    expect(aliceIndex).toBeLessThan(charlieIndex);
  });

  it('should validate that different players are selected', async () => {
    render(
      <PlayerAssignmentModal
        isOpen={true}
        onClose={vi.fn()}
        roomId="room-1"
        members={mockMembers}
        onSuccess={vi.fn()}
      />
    );

    const player1Select = screen.getByLabelText(/Player 1 \(X\)/i);
    const player2Select = screen.getByLabelText(/Player 2 \(O\)/i);

    fireEvent.change(player1Select, { target: { value: 'player-1' } });
    fireEvent.change(player2Select, { target: { value: 'player-1' } });

    const assignButton = screen.getByText('Assign');
    fireEvent.click(assignButton);

    await waitFor(() => {
      expect(screen.getByText(/cannot select the same player twice/i)).toBeTruthy();
    });
  });

  it('should assign players successfully', async () => {
    vi.mocked(roomsApi.assignPlayers).mockResolvedValue(undefined);

    const onSuccess = vi.fn();
    render(
      <PlayerAssignmentModal
        isOpen={true}
        onClose={vi.fn()}
        roomId="room-1"
        members={mockMembers}
        onSuccess={onSuccess}
      />
    );

    const player1Select = screen.getByLabelText(/Player 1 \(X\)/i);
    const player2Select = screen.getByLabelText(/Player 2 \(O\)/i);

    fireEvent.change(player1Select, { target: { value: 'player-1' } });
    fireEvent.change(player2Select, { target: { value: 'player-2' } });

    const assignButton = screen.getByText('Assign');
    fireEvent.click(assignButton);

    await waitFor(() => {
      expect(roomsApi.assignPlayers).toHaveBeenCalledWith('room-1', {
        player1Id: 'player-1',
        player2Id: 'player-2',
      });
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
