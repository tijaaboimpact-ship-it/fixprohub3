/**
 * FixPro Hub — Socket.io Client Service
 * 
 * Manages real-time WebSocket connection to the backend.
 * Provides event listeners for live repair request updates.
 */

import { io as ioConnect, type Socket } from 'socket.io-client';
import type { RepairRequest } from './api';
import { getApiBaseUrl } from './api';

// ── Types ───────────────────────────────────────────────────────────────────
type SocketEventCallback = (data: any) => void;

interface SocketService {
  connect: () => void;
  disconnect: () => void;
  isConnected: () => boolean;
  onNewRequest: (cb: (request: RepairRequest) => void) => void;
  onRequestUpdated: (cb: (request: RepairRequest) => void) => void;
  onRequestDeleted: (cb: (data: { id: number }) => void) => void;
  onConnect: (cb: () => void) => void;
  onDisconnect: (cb: () => void) => void;
  removeAllListeners: () => void;
}

// ── Internal State ──────────────────────────────────────────────────────────
let socket: Socket | null = null;
let connected = false;
const listeners: { event: string; cb: SocketEventCallback }[] = [];

// ── Service Implementation ──────────────────────────────────────────────────
const socketService: SocketService = {
  /**
   * Connect to the backend Socket.io server
   */
  connect: () => {
    // Extract base URL (remove /api suffix)
    const apiUrl = getApiBaseUrl();
    const serverUrl = apiUrl.replace(/\/api\/?$/, '');

    try {
      socket = ioConnect(serverUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
      });

      socket.on('connect', () => {
        connected = true;
        console.log('[Socket] Connected:', socket?.id);
      });

      socket.on('disconnect', () => {
        connected = false;
        console.log('[Socket] Disconnected');
      });

      socket.on('connect_error', (err: any) => {
        console.warn('[Socket] Connection error:', err.message);
      });

      // Re-attach any registered listeners
      for (const { event, cb } of listeners) {
        socket.on(event as any, cb);
      }
    } catch (err) {
      console.warn('[Socket] Failed to connect:', err);
    }
  },

  /**
   * Disconnect from the server
   */
  disconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
      connected = false;
    }
  },

  /**
   * Check if currently connected
   */
  isConnected: () => connected,

  /**
   * Listen for new repair requests (broadcast by server)
   */
  onNewRequest: (cb) => {
    const wrapped = (data: any) => cb(data);
    listeners.push({ event: 'new-request', cb: wrapped });
    if (socket) socket.on('new-request' as any, wrapped);
  },

  /**
   * Listen for repair request status updates
   */
  onRequestUpdated: (cb) => {
    const wrapped = (data: any) => cb(data);
    listeners.push({ event: 'request-updated', cb: wrapped });
    if (socket) socket.on('request-updated' as any, wrapped);
  },

  /**
   * Listen for repair request deletions
   */
  onRequestDeleted: (cb) => {
    const wrapped = (data: any) => cb(data);
    listeners.push({ event: 'request-deleted', cb: wrapped });
    if (socket) socket.on('request-deleted' as any, wrapped);
  },

  /**
   * Listen for connection event
   */
  onConnect: (cb) => {
    listeners.push({ event: 'connect', cb });
    if (socket) socket.on('connect', cb);
  },

  /**
   * Listen for disconnection event
   */
  onDisconnect: (cb) => {
    listeners.push({ event: 'disconnect', cb });
    if (socket) socket.on('disconnect', cb);
  },

  /**
   * Remove all listeners and reset
   */
  removeAllListeners: () => {
    if (socket) {
      for (const { event, cb } of listeners) {
        socket.off(event as any, cb);
      }
    }
    listeners.length = 0;
  },
};

export default socketService;
