export const PRIMARY_WORKSPACE_URL = 'https://chatgpt.com/';

export const SUPPORTED_WORKSPACE_HOSTS = ['chatgpt.com', 'chat.openai.com'] as const;

export function isSupportedWorkspaceUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);

    return (
      parsedUrl.protocol === 'https:' &&
      SUPPORTED_WORKSPACE_HOSTS.some(
        (host) => parsedUrl.hostname === host || parsedUrl.hostname.endsWith(`.${host}`),
      )
    );
  } catch {
    return false;
  }
}
