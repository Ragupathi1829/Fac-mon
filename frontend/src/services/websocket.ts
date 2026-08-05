export class TelemetryWebSocketService {
  private socket: WebSocket | null = null;
  private url: string;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 3000;

  constructor(url: string = 'ws://localhost:8080/ws/telemetry') {
    this.url = url;
  }

  public connect(
    onMessage: (data: any) => void,
    onError?: (error: Event) => void,
    onClose?: () => void
  ): void {
    try {
      this.socket = new WebSocket(this.url);

      this.socket.onopen = () => {
        console.log('[WS] Connected to:', this.url);
        this.reconnectDelay = 3000; // reset backoff
      };

      this.socket.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch {
          console.warn('[WS] Non-JSON message received:', event.data);
        }
      };

      this.socket.onerror = (error: Event) => {
        console.error('[WS] Error:', error);
        onError?.(error);
      };

      this.socket.onclose = () => {
        console.warn('[WS] Connection closed — reconnecting in', this.reconnectDelay, 'ms');
        onClose?.();
        // Auto-reconnect with exponential backoff (max 30s)
        this.reconnectTimer = setTimeout(() => {
          this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 30000);
          this.connect(onMessage, onError, onClose);
        }, this.reconnectDelay);
      };
    } catch (err) {
      console.error('[WS] Failed to create WebSocket:', err);
    }
  }

  public disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.onclose = null; // prevent reconnect loop
      this.socket.close();
      this.socket = null;
    }
  }

  public sendMessage(message: string): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(message);
    }
  }
}
