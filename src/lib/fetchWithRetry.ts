// Utility for fetch with 30s timeout and exponential backoff retry (2s, 4s, 8s)
export interface FetchRetryOptions extends RequestInit {
  timeoutMs?: number;
  maxRetries?: number;
  backoffMs?: number[];
}

export async function fetchWithRetry(url: string, options: FetchRetryOptions = {}): Promise<Response> {
  const timeoutMs = options.timeoutMs ?? 30000;
  const maxRetries = options.maxRetries ?? 3;
  const delays = options.backoffMs ?? [2000, 4000, 8000];

  let lastError: Error | null = null;
  let lastResponse: Response | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timer);

      // Transmit HTTP rate limits, service unavailable, or server errors for retry
      if (response.ok) {
        return response;
      }

      lastResponse = response;
      // Status codes worth retrying (429 Rate Limit, 502/503/504 Bad Gateway/Unavailable/Timeout)
      if ([429, 502, 503, 504].includes(response.status)) {
        if (attempt < maxRetries - 1) {
          const delay = delays[attempt] || 2000;
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      } else {
        // Non-retriable error (e.g., 400 Bad Request, 401 Unauthorized), return response immediately
        return response;
      }
    } catch (err: any) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        lastError = new Error(`节点请求超时 (${timeoutMs / 1000}秒无响应)`);
      } else {
        lastError = err;
      }

      if (attempt < maxRetries - 1) {
        const delay = delays[attempt] || 2000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  if (lastResponse) {
    return lastResponse;
  }
  throw lastError || new Error('多次重试后仍无法连接算力节点');
}

export async function parseErrorResponse(res: Response, defaultPrefix: string = '算力节点响应异常'): Promise<string> {
  const status = res.status;
  let detail = '';

  try {
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      detail = json.error?.message || json.error || json.message || json.detail || JSON.stringify(json);
    } catch {
      detail = text.slice(0, 200);
    }
  } catch {
    detail = '无法读取响应内容';
  }

  if (status === 429) {
    return `${defaultPrefix} [429]: 接口请求过于频繁或达到并发上限，建议稍后重试。(${detail})`;
  }
  if (status === 503) {
    return `${defaultPrefix} [503]: 算力节点暂时维护或服务不可用。(${detail})`;
  }
  if (status === 401 || status === 403) {
    return `${defaultPrefix} [${status}]: 鉴权失败或 API Token 无效，请检查配置。(${detail})`;
  }
  return `${defaultPrefix} [${status}]: ${detail}`;
}
