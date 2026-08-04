import { useEffect, useRef } from 'react';
import { getApiBaseUrl, getToken } from '@/utils/request';

const RECONNECT_DELAY_MS = 3_000;

interface UseSessionEventsOptions {
  /** 返回 true 时执行强制退出，false 表示当前事件由调用方静默处理。 */
  onSessionRevoked: () => boolean;
  /** 权限变更时刷新用户信息和菜单，不影响当前登录会话。 */
  onAuthorizationChanged?: () => void;
}

export function useSessionEvents({ onSessionRevoked, onAuthorizationChanged }: UseSessionEventsOptions): void {
  const revokedCallbackRef = useRef(onSessionRevoked);
  const authorizationCallbackRef = useRef(onAuthorizationChanged);
  revokedCallbackRef.current = onSessionRevoked;
  authorizationCallbackRef.current = onAuthorizationChanged;

  useEffect(() => {
    let stopped = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let abortController: AbortController | undefined;

    const handleRevoked = (): boolean => {
      if (stopped) return true;
      const handled = revokedCallbackRef.current();
      if (handled) stopped = true;
      return handled;
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
          if (/event:\s*authorization-changed/.test(event)) {
            authorizationCallbackRef.current?.();
          } else if (/event:\s*session-revoked/.test(event)) {
            if (!handleRevoked()) scheduleReconnect();
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
        if (response.status === 401 || response.status === 403) {
          if (!handleRevoked()) scheduleReconnect();
          return;
        }
        if (!response.ok) {
          scheduleReconnect();
          return;
        }
        if (!contentType.includes('text/event-stream')) {
          if (!handleRevoked()) scheduleReconnect();
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
