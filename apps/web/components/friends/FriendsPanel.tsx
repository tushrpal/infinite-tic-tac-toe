"use client";

/**
 * FriendsPanel Component
 * Main container for friends system with tabs
 */

import { useState, lazy, Suspense } from "react";
import { useFriends } from "@/components/providers/FriendsProvider";
import { usePlayer } from "@/components/providers/PlayerProvider";
import { AccountRequired } from "@/components/auth/AccountRequired";
import { FriendsList } from "./FriendsList";
import { FriendRequests } from "./FriendRequests";
import { cn } from "@/lib/helpers";
import type { Friend } from "@/types/friends";

// Lazy load modals for code splitting
const PlayerSearchModal = lazy(() => import("./PlayerSearchModal").then(m => ({ default: m.PlayerSearchModal })));
const ChallengeModal = lazy(() => import("@/components/challenges/ChallengeModal").then(m => ({ default: m.ChallengeModal })));

type Tab = 'friends' | 'received' | 'sent';

interface FriendsPanelProps {
  onClose?: () => void;
}

export function FriendsPanel({ onClose }: FriendsPanelProps) {
  const { player } = usePlayer();
  const isAuthenticated = !!player && player.isAnonymous === false;
  const { friends, receivedRequests, sentRequests } = useFriends();
  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);

  const handleChallengeFriend = (playerId: string) => {
    const friend = friends.find(f => f.playerId === playerId);
    if (friend) {
      setSelectedFriend(friend);
      setIsChallengeModalOpen(true);
    }
  };

  const tabs = [
    {
      id: 'friends' as Tab,
      label: 'Friends',
      count: friends.length,
    },
    {
      id: 'received' as Tab,
      label: 'Requests',
      count: receivedRequests.length,
      badge: receivedRequests.length > 0,
    },
    {
      id: 'sent' as Tab,
      label: 'Sent',
      count: sentRequests.length,
    },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-board-grid flex-shrink-0">
        <h2 className="text-lg font-semibold text-text-primary">Friends</h2>
        <div className="flex items-center gap-2">
          {isAuthenticated && (
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium",
                "bg-accent-primary text-white",
                "hover:bg-accent-primary/90",
                "transition-colors duration-150",
                "focus:outline-none focus:ring-2 focus:ring-accent-primary"
              )}
            >
              <SearchIcon />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className={cn(
                "p-1.5 rounded-lg",
                "text-text-secondary hover:text-text-primary",
                "hover:bg-board-grid",
                "transition-colors duration-150",
                "focus:outline-none focus:ring-2 focus:ring-accent-primary"
              )}
              aria-label="Close friends panel"
            >
              <CloseIcon />
            </button>
          )}
        </div>
      </div>

      <AccountRequired feature="Friends">
        {/* Tabs */}
        <div className="flex border-b border-board-grid flex-shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 px-4 py-3 text-sm font-medium",
                "border-b-2 transition-colors duration-150",
                "focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-inset",
                activeTab === tab.id
                  ? "border-accent-primary text-accent-primary"
                  : "border-transparent text-text-secondary hover:text-text-primary hover:bg-board-grid/50"
              )}
            >
              <div className="flex items-center justify-center gap-2">
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className={cn(
                      "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold",
                      activeTab === tab.id
                        ? "bg-accent-primary text-white"
                        : tab.badge
                        ? "bg-critical text-white"
                        : "bg-board-grid text-text-secondary"
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'friends' && <FriendsList onChallenge={handleChallengeFriend} />}
          {activeTab === 'received' && <FriendRequests tab="received" />}
          {activeTab === 'sent' && <FriendRequests tab="sent" />}
        </div>
      </AccountRequired>

      {/* Player Search Modal */}
      {isSearchModalOpen && (
        <Suspense fallback={null}>
          <PlayerSearchModal
            isOpen={isSearchModalOpen}
            onClose={() => setIsSearchModalOpen(false)}
          />
        </Suspense>
      )}

      {/* Challenge Modal */}
      {isChallengeModalOpen && (
        <Suspense fallback={null}>
          <ChallengeModal
            isOpen={isChallengeModalOpen}
            onClose={() => {
              setIsChallengeModalOpen(false);
              setSelectedFriend(null);
            }}
            friend={selectedFriend}
          />
        </Suspense>
      )}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}
