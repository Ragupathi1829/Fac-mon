import { useEffect, useRef, useCallback } from 'react';
import { TelemetryWebSocketService } from '../services/websocket';
import type { WsMessage } from '../types/machine';

export const useWebSocket = (
  onMessage: (data: WsMessage) => void,
  onConnectionChange?: (connected: boolean) => void
) => {
  const serviceRef = useRef<TelemetryWebSocketService | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage; // keep latest handler without re-subscribing

  useEffect(() => {
    const service = new TelemetryWebSocketService(import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws/telemetry');
    serviceRef.current = service;

    service.connect(
      (data: WsMessage) => {
        onMessageRef.current(data);
      },
      (_err) => {
        onConnectionChange?.(false);
      },
      () => {
        onConnectionChange?.(false);
      }
    );

    onConnectionChange?.(true);

    return () => {
      service.disconnect();
    };
  }, []); // intentionally empty — connect once on mount

  const sendMessage = useCallback((msg: string) => {
    serviceRef.current?.sendMessage(msg);
  }, []);

  return { sendMessage };
};
