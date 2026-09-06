'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { RoomCard } from '@/components/rooms/RoomCard';
import { CreateRoomModal } from '@/components/rooms/CreateRoomModal';
import { JoinByCodeModal } from '@/components/rooms/JoinByCodeModal';
import { AccountRequired } from '@/components/auth/AccountRequired';
import { usePlayer } from '@/components/providers/PlayerProvider';
import { getRooms, getAvailableRooms, getPendingInvites, respondToInvite, joinRoom } from '@/lib/rooms';
import { ROUTES } from '@/lib/constants';
import type { RoomListItem, RoomInvite } from '@/ws/types';

export default function RoomsHubPage() {
  const router = useRouter();
  const { player } = usePlayer();
  const isAuthenticated = !!player && player.isAnonymous === false;
  const [activeTab, setActiveTab] = useState<'my-rooms' | 'available'>('my-rooms');
  const [myRooms, setMyRooms] = useState<RoomListItem[]>([]);
  const [availableRooms, setAvailableRooms] = useState<RoomListItem[]>([]);
  const [pendingInvites, setPendingInvites] = useState<RoomInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinByCodeModalOpen, setIsJoinByCodeModalOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [myRoomsData, availableData, invitesData] = await Promise.all([
        getRooms(),
        getAvailableRooms(),
        getPendingInvites(),
      ]);

      setMyRooms(myRoomsData);
      setAvailableRooms(availableData);
      setPendingInvites(invitesData.filter((i) => i.status === 'PENDING'));
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async (roomId: string) => {
    try {
      await joinRoom(roomId);
      router.push(ROUTES.ROOM(roomId));
    } catch (error) {
      console.error('Error joining room:', error);
    }
  };

  const handleCreateSuccess = (roomId: string) => {
    router.push(ROUTES.ROOM(roomId));
  };

  const handleRespondToInvite = async (inviteId: string, accepted: boolean) => {
    try {
      await respondToInvite(inviteId, { action: accepted ? 'ACCEPT' : 'DECLINE' });
      if (accepted) {
        const invite = pendingInvites.find((i) => i.id === inviteId);
        if (invite) {
          router.push(ROUTES.ROOM(invite.roomId));
        }
      }
      fetchData();
    } catch (error) {
      console.error('Error responding to invite:', error);
    }
  };

  const displayedRooms = activeTab === 'my-rooms' ? myRooms : availableRooms;

  return (
    <main className="flex-1 flex flex-col px-4 py-12">
      <div className="w-full max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={ROUTES.PLAY}
            className="text-sm text-text-secondary hover:text-text-primary transition-colors mb-4 inline-block"
          >
            ← Back to Play Menu
          </Link>
          <h1 className="text-4xl font-display font-bold mb-2">Rooms</h1>
          <p className="text-text-secondary">
            Create a lobby for up to 8 friends to play multiple games
          </p>
        </div>

        <AccountRequired feature="Rooms">
        {/* Pending Invites */}
        {pendingInvites.length > 0 && (
          <div className="mb-8 p-6 rounded-xl bg-surface-elevated border border-accent-primary/30">
            <h2 className="text-xl font-semibold mb-4">
              📨 Room Invites ({pendingInvites.length})
            </h2>
            <div className="space-y-3">
              {pendingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between gap-4 p-4 rounded-lg bg-background border border-board-grid"
                >
                  <div>
                    <p className="font-medium">
                      {invite.inviter?.username} invited you to{' '}
                      {invite.room?.name ? `"${invite.room.name}"` : 'their room'}
                    </p>
                    {invite.room && (
                      <p className="text-sm text-text-secondary mt-1">
                        {invite.room.memberCount}/8 players · Mode:{' '}
                        {invite.room.mode === 1 ? 'Sliding' : 'Classic'}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleRespondToInvite(invite.id, true)}
                      variant="primary"
                      size="sm"
                    >
                      Accept
                    </Button>
                    <Button
                      onClick={() => handleRespondToInvite(invite.id, false)}
                      variant="secondary"
                      size="sm"
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Room Browser */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-board-grid">
              <button
                onClick={() => setActiveTab('my-rooms')}
                className={`pb-3 px-1 font-medium transition-colors ${
                  activeTab === 'my-rooms'
                    ? 'text-accent-primary border-b-2 border-accent-primary'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                My Rooms
              </button>
              <button
                onClick={() => setActiveTab('available')}
                className={`pb-3 px-1 font-medium transition-colors ${
                  activeTab === 'available'
                    ? 'text-accent-primary border-b-2 border-accent-primary'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Available
              </button>
            </div>

            {/* Room List */}
            {isLoading ? (
              <div className="text-center py-12 text-text-secondary">
                Loading rooms...
              </div>
            ) : displayedRooms.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-text-secondary mb-4">
                  {activeTab === 'my-rooms'
                    ? "You're not in any rooms"
                    : 'No rooms available. Create one to get started!'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {displayedRooms.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    onJoin={handleJoinRoom}
                    isMember={activeTab === 'my-rooms'}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Create Room */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-4">
              {/* Create Room Card */}
              <div className="p-6 rounded-xl bg-surface-elevated border border-board-grid">
                <h2 className="text-xl font-semibold mb-4">Create a Room</h2>
                <p className="text-sm text-text-secondary mb-6">
                  Create a lobby for up to 8 friends to play multiple games
                </p>
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  variant="primary"
                  className="w-full"
                >
                  Create Room
                </Button>
              </div>

              {/* Join by Code Card */}
              <div className="p-6 rounded-xl bg-surface-elevated border border-board-grid">
                <h2 className="text-xl font-semibold mb-4">Join by Code</h2>
                <p className="text-sm text-text-secondary mb-6">
                  Have a room code? Enter it to join instantly
                </p>
                <Button
                  onClick={() => setIsJoinByCodeModalOpen(true)}
                  variant="secondary"
                  className="w-full"
                >
                  Enter Code
                </Button>
              </div>
            </div>
          </div>
        </div>
        </AccountRequired>
      </div>

      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <JoinByCodeModal
        isOpen={isJoinByCodeModalOpen}
        onClose={() => setIsJoinByCodeModalOpen(false)}
      />
    </main>
  );
}
