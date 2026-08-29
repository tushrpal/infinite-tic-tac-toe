import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RoomInviteModal } from '../RoomInviteModal';
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

describe('RoomInviteModal', () => {
  const mockFriends = [
    {
      id: 'friend-1',
      username: 'alice',
      displayName: 'Alice',
      isOnline: true,
      inRoom: false,
    },
    {
      id: 'friend-2',
      username: 'bob',
      displayName: 'Bob',
      isOnline: true,
      inRoom: true,
      roomName: 'Another Room',
    },
    {
      id: 'friend-3',
      username: 'charlie',
      displayName: 'Charlie',
      isOnline: false,
      inRoom: false,
    },
  ];

  it('should render friend list with checkboxes', () => {
    render(
      <RoomInviteModal
        isOpen={true}
        onClose={vi.fn()}
        roomId="room-1"
        friends={mockFriends}
        onSuccess={vi.fn()}
      />
    );

    expect(screen.getByText('Alice')).toBeTruthy();
    expect(screen.getByText('Bob')).toBeTruthy();
    expect(screen.getByText('Charlie')).toBeTruthy();
  });

  it('should show online status indicators', () => {
    render(
      <RoomInviteModal
        isOpen={true}
        onClose={vi.fn()}
        roomId="room-1"
        friends={mockFriends}
        onSuccess={vi.fn()}
      />
    );

    expect(screen.getAllByText('(Online)').length).toBe(2);
    expect(screen.getByText('(Offline)')).toBeTruthy();
  });

  it('should show room indicator for friends in rooms', () => {
    render(
      <RoomInviteModal
        isOpen={true}
        onClose={vi.fn()}
        roomId="room-1"
        friends={mockFriends}
        onSuccess={vi.fn()}
      />
    );

    expect(screen.getByText('🏠 In Another Room')).toBeTruthy();
  });

  it('should send invites to selected friends', async () => {
    vi.mocked(roomsApi.invitePlayers).mockResolvedValue({ inviteIds: ['invite-1'] });

    const onSuccess = vi.fn();
    render(
      <RoomInviteModal
        isOpen={true}
        onClose={vi.fn()}
        roomId="room-1"
        friends={mockFriends}
        onSuccess={onSuccess}
      />
    );

    const aliceCheckbox = screen.getByLabelText(/Alice/);
    fireEvent.click(aliceCheckbox);

    const sendButton = screen.getByText('Send Invites');
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(roomsApi.invitePlayers).toHaveBeenCalledWith('room-1', {
        playerIds: ['friend-1'],
      });
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('should filter friends by search query', () => {
    render(
      <RoomInviteModal
        isOpen={true}
        onClose={vi.fn()}
        roomId="room-1"
        friends={mockFriends}
        onSuccess={vi.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search friends/i);
    fireEvent.change(searchInput, { target: { value: 'ali' } });

    expect(screen.getByText('Alice')).toBeTruthy();
    expect(screen.queryByText('Bob')).not.toBeTruthy();
  });
});
