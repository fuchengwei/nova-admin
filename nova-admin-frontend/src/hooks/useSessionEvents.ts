import { useEffect, useRef } from 'react';
import { getApiBaseUrl, getToken } from '@/utils/request';

const RECONNECT_DELAY_MS = 3_000;

interface UseSessionEventsOptions {
  onSessionRevoked: () => void;
}

export function useSessionEvents({ onSessionRevoked }: UseSessionEventsOptions): void {
  const callbackRef = useRef(onSessionRevoked);
  callbackRef.current = onSessionRevoked;

  useEffect(() => {
    let stopped = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let abortController: AbortController | undefined;

    const handleRevoked = () => {
      if (stopped) return;
      stopped = true;
      callbackRef.current();
    };

    const scheduleReconnect = () => {
      if (stopped || !getToken()) return;
      retryTimer = setTimeout(() => void connect(), RECONNECT_DELAY_MS);
    };

    const consumeEvents = async (response: Response) => {
      if (!response.body) {
        scheduleReconnect();
        return;
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (!stopped) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let boundary = buffer.indexOf('\n\n');
        while (boundary >= 0) {
          const event = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          if (/event:\s*session-revoked/.test(event)) {
            handleRevoked();
            return;
          }
          boundary = buffer.indexOf('\n\n');
        }
      }
      scheduleReconnect();
    };

    const connect = async () => {
      const token = getToken();
      if (stopped || !token) return;
      abortController = new AbortController();
      try {
        const response = await fetch(`${getApiBaseUrl()}/auth/session-events`, {
          headers: {
            Accept: 'text/event-stream',
            Authorization: `Bearer ${token}`,
          },
          signal: abortController.signal,
        });
        const contentType = response.headers.get('content-type') ?? '';
        if (
          response.status === 401 ||
          response.status === 403 ||
          !response.ok ||
          !contentType.includes('text/event-stream')
        ) {
          handleRevoked();
          return;
        }
        await consumeEvents(response);
      } catch (error) {
        if (!stopped && !(error instanceof DOMException && error.name === 'AbortError')) {
          scheduleReconnect();
        }
      }
    };

    void connect();
    return () => {
      stopped = true;
      abortController?.abort();
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, []);
}
