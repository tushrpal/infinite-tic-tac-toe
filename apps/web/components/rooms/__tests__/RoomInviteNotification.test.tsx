import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RoomInviteNotification } from '../RoomInviteNotification';
import type { RoomInvite } from '@/ws/types';

describe('RoomInviteNotification', () => {
  const mockInvite: RoomInvite = {
    id: 'invite-1',
    roomId: 'room-1',
    inviterId: 'player-1',
    inviteeId: 'player-2',
    status: 'PENDING',
    expiresAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    room: {
      id: 'room-1',
      name: 'Epic Battles',
      mode: 1,
      status: 'WAITING',
      memberCount: 3,
    },
    inviter: {
      id: 'player-1',
      username: 'alice',
      displayName: 'Alice',
      isConnected: true,
    },
  };

  it('should render invite information', () => {
    render(
      <RoomInviteNotification
        invite={mockInvite}
        onAccept={vi.fn()}
        onDecline={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    expect(screen.getByText(/Alice invited you to "Epic Battles"/i)).toBeTruthy();
    expect(screen.getByText(/Mode: Sliding/i)).toBeTruthy();
    expect(screen.getByText(/3\/8 players/i)).toBeTruthy();
  });

  it('should call onAccept when accept button clicked', () => {
    const onAccept = vi.fn();
    render(
      <RoomInviteNotification
        invite={mockInvite}
        onAccept={onAccept}
        onDecline={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    const acceptButton = screen.getByText('Accept');
    fireEvent.click(acceptButton);

    expect(onAccept).toHaveBeenCalled();
  });

  it('should call onDecline when decline button clicked', () => {
    const onDecline = vi.fn();
    render(
      <RoomInviteNotification
        invite={mockInvite}
        onAccept={vi.fn()}
        onDecline={onDecline}
        onDismiss={vi.fn()}
      />
    );

    const declineButton = screen.getByText('Decline');
    fireEvent.click(declineButton);

    expect(onDecline).toHaveBeenCalled();
  });

  it('should handle room without name', () => {
    const inviteWithoutName = {
      ...mockInvite,
      room: { ...mockInvite.room!, name: null },
    };

    render(
      <RoomInviteNotification
        invite={inviteWithoutName}
        onAccept={vi.fn()}
        onDecline={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    expect(screen.getByText(/Alice invited you to their room/i)).toBeTruthy();
  });
});
