import type { MessageInstance } from 'antd/es/message/interface';

let messageApi: MessageInstance | null = null;

export function setMessageApi(api: MessageInstance | null): void {
  messageApi = api;
}

export const message = {
  success: (...args: Parameters<MessageInstance['success']>) => messageApi?.success(...args),
  error: (...args: Parameters<MessageInstance['error']>) => messageApi?.error(...args),
};
