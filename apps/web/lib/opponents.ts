/**
 * Recent Opponents API Client
 */

import { apiRequest } from './api';
import type { RecentOpponentsResponse } from '@/types/opponents';

/**
 * Get authentication headers with session token
 */
function getAuthHeaders(): HeadersInit {
  const sessionToken = typeof window !== 'undefined'
    ? localStorage.getItem('infinite-ttt-session-token')
    : null;

  return sessionToken
    ? { 'Authorization': `Bearer ${sessionToken}` }
    : {};
}

/**
 * Get list of recent opponents
 */
export async function getRecentOpponents(): Promise<RecentOpponentsResponse> {
  return apiRequest<RecentOpponentsResponse>('/recent-opponents', {
    method: 'GET',
    headers: getAuthHeaders(),
  });
}
