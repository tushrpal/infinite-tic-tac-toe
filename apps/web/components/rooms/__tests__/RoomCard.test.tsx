import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RoomCard } from '../RoomCard';
import type { RoomListItem } from '@/ws/types';

describe('RoomCard', () => {
  const mockRoom: RoomListItem = {
    id: 'room-1',
    hostId: 'player-1',
    name: 'Epic Battles',
    mode: 1,
    status: 'WAITING',
    memberCount: 3,
    maxPlayers: 8,
    host: {
      username: 'alice',
      displayName: 'Alice',
    },
    createdAt: new Date().toISOString(),
  };

  it('should render room information', () => {
    render(<RoomCard room={mockRoom} onJoin={vi.fn()} />);

    expect(screen.getByText((content, element) => content.includes('Epic Battles'))).toBeTruthy();
    expect(screen.getByText(/Host: alice/i)).toBeTruthy();
    expect(screen.getByText(/3.*8 players/i)).toBeTruthy();
  });

  it('should display "Open" badge for WAITING status', () => {
    render(<RoomCard room={mockRoom} onJoin={vi.fn()} />);

    expect(screen.getByText('Open')).toBeTruthy();
  });

  it('should display "In Game" badge for ACTIVE status', () => {
    const activeRoom = { ...mockRoom, status: 'ACTIVE' as const };
    render(<RoomCard room={activeRoom} onJoin={vi.fn()} />);

    expect(screen.getByText('In Game')).toBeTruthy();
  });

  it('should call onJoin when join button is clicked', () => {
    const onJoin = vi.fn();
    render(<RoomCard room={mockRoom} onJoin={onJoin} />);

    const joinButton = screen.getByText('Join Room');
    fireEvent.click(joinButton);

    expect(onJoin).toHaveBeenCalledWith('room-1');
  });

  it('should show "Open Room" button when isMember is true', () => {
    render(<RoomCard room={mockRoom} onJoin={vi.fn()} isMember={true} />);

    expect(screen.getByText('Open Room')).toBeTruthy();
  });

  it('should display host name as room name when name is null', () => {
    const roomWithoutName = { ...mockRoom, name: null };
    render(<RoomCard room={roomWithoutName} onJoin={vi.fn()} />);

    expect(screen.getByText((content, element) => content.includes("Alice's Room"))).toBeTruthy();
  });
});
