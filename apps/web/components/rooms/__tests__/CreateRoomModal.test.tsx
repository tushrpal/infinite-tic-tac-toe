import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateRoomModal } from '../CreateRoomModal';
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

describe('CreateRoomModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render form fields', () => {
    render(<CreateRoomModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />);

    expect(screen.getByLabelText(/Room Name/i)).toBeTruthy();
    expect(screen.getByLabelText(/Sliding/i)).toBeTruthy();
    expect(screen.getByLabelText(/Classic/i)).toBeTruthy();
    expect(screen.getByLabelText(/Max Players/i)).toBeTruthy();
  });

  it('should validate room name length', async () => {
    render(<CreateRoomModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />);

    const nameInput = screen.getByLabelText(/Room Name/i) as HTMLInputElement;
    // Set name to exactly 50 chars (max allowed)
    fireEvent.change(nameInput, { target: { value: 'a'.repeat(50) } });

    // Verify it accepts 50 chars
    expect(nameInput.value.length).toBe(50);

    const slidingRadio = screen.getByLabelText(/Sliding/i);
    fireEvent.click(slidingRadio);

    const createButton = screen.getByRole('button', { name: /Create Room/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(roomsApi.createRoom).toHaveBeenCalledWith({
        name: 'a'.repeat(50),
        mode: 1,
        maxPlayers: 4,
      });
    });
  });

  it('should require game mode selection', async () => {
    render(<CreateRoomModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />);

    const createButton = screen.getByRole('button', { name: /Create Room/i }) as HTMLButtonElement;

    // Button should be disabled when no mode is selected
    expect(createButton.disabled).toBe(true);
  });

  it('should create room with valid data', async () => {
    const mockRoom = { id: 'room-1', name: 'Test Room' };
    vi.mocked(roomsApi.createRoom).mockResolvedValue(mockRoom as any);

    const onSuccess = vi.fn();
    render(<CreateRoomModal isOpen={true} onClose={vi.fn()} onSuccess={onSuccess} />);

    const nameInput = screen.getByLabelText(/Room Name/i);
    fireEvent.change(nameInput, { target: { value: 'Test Room' } });

    const slidingRadio = screen.getByLabelText(/Sliding/i);
    fireEvent.click(slidingRadio);

    const createButton = screen.getByRole('button', { name: /Create Room/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(roomsApi.createRoom).toHaveBeenCalledWith({
        name: 'Test Room',
        mode: 1,
        maxPlayers: 4,
      });
      expect(onSuccess).toHaveBeenCalledWith('room-1');
    });
  });

  it('should handle empty name as null', async () => {
    const mockRoom = { id: 'room-1', name: null };
    vi.mocked(roomsApi.createRoom).mockResolvedValue(mockRoom as any);

    render(<CreateRoomModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />);

    const slidingRadio = screen.getByLabelText(/Sliding/i);
    fireEvent.click(slidingRadio);

    const createButton = screen.getByRole('button', { name: /Create Room/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(roomsApi.createRoom).toHaveBeenCalledWith({
        name: null,
        mode: 1,
        maxPlayers: 4,
      });
    });
  });
});




