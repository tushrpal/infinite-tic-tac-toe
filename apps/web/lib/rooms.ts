import { apiRequest } from './api';
import type { Room, RoomListItem, RoomInvite } from '@/ws/types';

export interface CreateRoomParams {
  name?: string | null;
  mode: 1 | 2;
  maxPlayers?: number;
}

export interface AssignPlayersParams {
  player1Id: string;
  player2Id: string;
}

export interface InvitePlayersParams {
  playerIds: string[];
}

export interface RespondToInviteParams {
  accepted: boolean;
}

/**
 * Create a new room
 */
export async function createRoom(params: CreateRoomParams): Promise<Room> {
  return apiRequest<Room>('/rooms/create', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

/**
 * Get list of my active rooms
 */
export async function getRooms(): Promise<RoomListItem[]> {
  return apiRequest<RoomListItem[]>('/rooms');
}

/**
 * Get list of joinable friend rooms
 */
export async function getAvailableRooms(): Promise<RoomListItem[]> {
  return apiRequest<RoomListItem[]>('/rooms/available');
}

/**
 * Get full room details by ID
 */
export async function getRoom(roomId: string): Promise<Room> {
  return apiRequest<Room>(`/rooms/${roomId}`);
}

/**
 * Join a room
 */
export async function joinRoom(roomId: string): Promise<Room> {
  return apiRequest<Room>(`/rooms/${roomId}/join`, {
    method: 'POST',
  });
}

/**
 * Leave a room
 */
export async function leaveRoom(roomId: string): Promise<void> {
  return apiRequest<void>(`/rooms/${roomId}/leave`, {
    method: 'POST',
  });
}

/**
 * Close a room (host only)
 */
export async function closeRoom(roomId: string): Promise<void> {
  return apiRequest<void>(`/rooms/${roomId}/close`, {
    method: 'POST',
  });
}

/**
 * Toggle ready state
 */
export async function toggleReady(roomId: string): Promise<{ isReady: boolean }> {
  return apiRequest<{ isReady: boolean }>(`/rooms/${roomId}/ready`, {
    method: 'POST',
  });
}

/**
 * Assign players for next game (host only)
 */
export async function assignPlayers(
  roomId: string,
  params: AssignPlayersParams
): Promise<void> {
  return apiRequest<void>(`/rooms/${roomId}/assign-players`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

/**
 * Start game (host only)
 */
export async function startGame(roomId: string): Promise<{ matchId: string }> {
  return apiRequest<{ matchId: string }>(`/rooms/${roomId}/start-game`, {
    method: 'POST',
  });
}

/**
 * Invite players to room
 */
export async function invitePlayers(
  roomId: string,
  params: InvitePlayersParams
): Promise<{ inviteIds: string[] }> {
  return apiRequest<{ inviteIds: string[] }>(`/rooms/${roomId}/invite`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

/**
 * Get pending room invites
 */
export async function getPendingInvites(): Promise<RoomInvite[]> {
  return apiRequest<RoomInvite[]>('/room-invites');
}

/**
 * Respond to a room invite
 */
export async function respondToInvite(
  inviteId: string,
  params: RespondToInviteParams
): Promise<void> {
  return apiRequest<void>(`/room-invites/${inviteId}/respond`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}
