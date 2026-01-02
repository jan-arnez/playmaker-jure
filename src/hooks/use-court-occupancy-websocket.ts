import { useEffect, useRef, useCallback } from "react";

interface BookingEvent {
  type: "booking:created" | "booking:updated" | "booking:cancelled";
  booking: {
    id: string;
    courtId: string;
    startTime: string;
    endTime: string;
    status: string;
    totalPrice?: number;
  };
}

interface UseCourtOccupancyWebSocketOptions {
  organizationId: string;
  enabled?: boolean;
  onBookingUpdate?: (event: BookingEvent) => void;
}

export function useCourtOccupancyWebSocket({
  organizationId,
  enabled = true,
  onBookingUpdate,
}: UseCourtOccupancyWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (!enabled || !organizationId) return;

    // TODO: Replace with actual WebSocket endpoint
    // For now, this is a placeholder structure
    // When WebSocket server is ready, uncomment and configure:
    /*
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || `ws://localhost:3001/occupancy/${organizationId}`;
    
    try {
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('WebSocket connected for occupancy updates');
        reconnectAttempts.current = 0;
      };
      
      ws.onmessage = (event) => {
        try {
          const data: BookingEvent = JSON.parse(event.data);
          onBookingUpdate?.(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000));
        }
      };
      
      wsRef.current = ws;
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
    }
    */
  }, [enabled, organizationId, onBookingUpdate]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    reconnectAttempts.current = 0;
  }, []);

  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
    reconnect: connect,
    disconnect,
  };
}

