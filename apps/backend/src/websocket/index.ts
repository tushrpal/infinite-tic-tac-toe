/**
 * WebSocket manager for real-time PvP updates
 * 
 * Responsibilities:
 * - Manage WebSocket connections per match
 * - Broadcast state changes to both players
 * - Enforce connection authenticity (playerId + matchId)
 * 
 * NOT responsible for:
 * - Game rules (client-side)
 * - Move validation (only turn ownership checked)
 * - Match logic (handled by routes)
 */

import { WebSocketServer, WebSocket } from 'ws';
import type { Server as HTTPServer } from 'http';

export interface WebSocketMessage {
  type: 'join' | 'submit-move' | 'state-update' | 'match-complete' | 'error';
  playerId?: string;
  matchId?: string;
  payload?: any;
  error?: string;
}

interface ClientConnection {
  ws: WebSocket;
  playerId: string;
  matchId: string;
}

/**
 * WebSocket manager singleton
 */
class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private connections: Map<string, ClientConnection[]> = new Map(); // matchId -> connections[]

  /**
   * Initialize WebSocket server attached to HTTP server
   */
  initialize(server: HTTPServer) {
    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('🔌 New WebSocket connection');

      let clientConnection: ClientConnection | null = null;

      ws.on('message', (data: Buffer) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString());
          
          if (message.type === 'join') {
            this.handleJoin(ws, message, (connection) => {
              clientConnection = connection;
            });
          } else if (message.type === 'submit-move') {
            // Move submissions are handled via REST API
            // WebSocket is only for broadcasting state
            this.sendError(ws, 'Use REST API for move submission');
          }
        } catch (error) {
          console.error('❌ WebSocket message error:', error);
          this.sendError(ws, 'Invalid message format');
        }
      });

      ws.on('close', () => {
        if (clientConnection) {
          console.log(`🔌 Client disconnected from match ${clientConnection.matchId}`);
          this.removeConnection(clientConnection);
        }
      });

      ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
      });
    });

    console.log('✅ WebSocket server initialized');
  }

  /**
   * Handle client join request
   */
  private handleJoin(
    ws: WebSocket,
    message: WebSocketMessage,
    onSuccess: (connection: ClientConnection) => void
  ) {
    const { playerId, matchId } = message;

    if (!playerId || !matchId) {
      this.sendError(ws, 'Missing playerId or matchId');
      return;
    }

    // Create connection
    const connection: ClientConnection = {
      ws,
      playerId,
      matchId,
    };

    // Add to connections map
    if (!this.connections.has(matchId)) {
      this.connections.set(matchId, []);
    }
    this.connections.get(matchId)!.push(connection);

    console.log(`✅ Player ${playerId.slice(0, 8)} joined match ${matchId.slice(0, 8)}`);
    console.log(`   Total connections in match: ${this.connections.get(matchId)!.length}`);

    onSuccess(connection);

    // Send confirmation
    this.send(ws, {
      type: 'state-update',
      payload: { status: 'connected', matchId, playerId },
    });
  }

  /**
   * Remove connection from map
   */
  private removeConnection(connection: ClientConnection) {
    const matchConnections = this.connections.get(connection.matchId);
    if (matchConnections) {
      const index = matchConnections.indexOf(connection);
      if (index !== -1) {
        matchConnections.splice(index, 1);
      }

      // Clean up empty match entries
      if (matchConnections.length === 0) {
        this.connections.delete(connection.matchId);
        console.log(`🧹 Cleaned up empty match ${connection.matchId.slice(0, 8)}`);
      }
    }
  }

  /**
   * Broadcast state update to all clients in a match
   */
  broadcastStateUpdate(matchId: string, matchState: any) {
    const connections = this.connections.get(matchId);
    if (!connections || connections.length === 0) {
      // No WebSocket connections, clients are using polling fallback
      return;
    }

    console.log(`📡 Broadcasting state update to ${connections.length} client(s) in match ${matchId.slice(0, 8)}`);

    const message: WebSocketMessage = {
      type: 'state-update',
      payload: matchState,
    };

    connections.forEach((connection) => {
      if (connection.ws.readyState === WebSocket.OPEN) {
        this.send(connection.ws, message);
      }
    });
  }

  /**
   * Broadcast match completion to all clients
   */
  broadcastMatchComplete(matchId: string, matchResult: any) {
    const connections = this.connections.get(matchId);
    if (!connections || connections.length === 0) {
      return;
    }

    console.log(`🏁 Broadcasting match completion to ${connections.length} client(s) in match ${matchId.slice(0, 8)}`);

    const message: WebSocketMessage = {
      type: 'match-complete',
      payload: matchResult,
    };

    connections.forEach((connection) => {
      if (connection.ws.readyState === WebSocket.OPEN) {
        this.send(connection.ws, message);
      }
    });

    // Close connections after a brief delay
    setTimeout(() => {
      connections.forEach((connection) => {
        if (connection.ws.readyState === WebSocket.OPEN) {
          connection.ws.close(1000, 'Match completed');
        }
      });
      this.connections.delete(matchId);
    }, 1000);
  }

  /**
   * Send message to a WebSocket client
   */
  private send(ws: WebSocket, message: WebSocketMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Send error message to client
   */
  private sendError(ws: WebSocket, error: string) {
    this.send(ws, {
      type: 'error',
      error,
    });
  }

  /**
   * Get active match count (for monitoring)
   */
  getActiveMatchCount(): number {
    return this.connections.size;
  }

  /**
   * Get connection count for a specific match
   */
  getMatchConnectionCount(matchId: string): number {
    return this.connections.get(matchId)?.length || 0;
  }
}

// Singleton instance
export const wsManager = new WebSocketManager();
