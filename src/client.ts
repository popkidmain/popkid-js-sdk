import { APIConfig, APIResponse } from './types';

export class PopkidAPI {
  private apiKey: string;
  private baseURL: string;
  private fullResponse: boolean;
  private timeout: number;

  constructor(config: APIConfig) {
    if (!config.apiKey) {
      throw new Error('API key is required');
    }
    this.apiKey = config.apiKey || 'qasim-dev';
    this.baseURL = config.baseURL || 'https://api.qasimdev.dpdns.org';
    this.fullResponse = config.fullResponse ?? false;
    this.timeout = config.timeout || 45000;
  }

  private buildURL(endpoint: string, params: Record<string, any>): string {
    const url = new URL(`${this.baseURL}${endpoint}`);
    const allParams = { ...params, apiKey: this.apiKey };
    Object.entries(allParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
    return url.toString();
  }

  private async request<T = any>(
    endpoint: string,
    method: string = 'GET',
    params?: Record<string, any>,
    body?: any,
    apiKeyLocation: 'query' | 'body' = 'query'
  ): Promise<T | APIResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      let url: string;
      const fetchOptions: RequestInit = {
        method,
        signal: controller.signal,
        headers: {} as Record<string, string>
      };

      if (method === 'GET') {
        url = this.buildURL(endpoint, params || {});
      } else {
        url = apiKeyLocation === 'query' 
          ? this.buildURL(endpoint, params || {}) 
          : `${this.baseURL}${endpoint}`;

        if (body instanceof FormData) {
          // Native Fetch handles FormData boundaries automatically
          fetchOptions.body = body;
        } else if (body) {
          fetchOptions.headers!['Content-Type'] = 'application/json';
          const bodyData = apiKeyLocation === 'body' ? { ...body, apiKey: this.apiKey } : body;
          fetchOptions.body = JSON.stringify(bodyData);
        }
      }

      const response = await fetch(url, fetchOptions);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        const json: APIResponse<T> = await response.json();
        return this.fullResponse ? json : (json.data ?? json);
      }

      if (contentType.startsWith('image/') || contentType.includes('octet-stream') || contentType.includes('pdf')) {
        const arrayBuffer = await response.arrayBuffer();
        if (typeof window === 'undefined') {
          return `data:${contentType};base64,${Buffer.from(arrayBuffer).toString('base64')}` as any;
        } else {
          const blob = new Blob([arrayBuffer], { type: contentType });
          return URL.createObjectURL(blob) as any;
        }
      }

      return (await response.text()) as any;
    } catch (error: any) {
      if (error.name === 'AbortError') throw new Error('Request timeout');
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // ==================== AI ====================
  KimiAi(params: { prompt: string }) { return this.request('/api/kimi/ai', 'GET', params); }
  MistralAi(params: { text: string }) { return this.request('/api/mistral/ai', 'GET', params); }
  CodestralAi(params: { text: string; model: string }) { return this.request('/api/mistral/advanced', 'GET', params); }
  Deepseek(params: { prompt: string }) { return this.request('/api/openrouter/deepseek', 'GET', params); }
  QwenAi(params: { text: string }) { return this.request('/api/novita/qwen', 'GET', params); }
  CerebrasAi(params: { text: string }) { return this.request('/api/cerebras/ai', 'GET', params); }
  GroqAi(params: { text: string }) { return this.request('/api/groq/ai', 'GET', params); }

  // ==================== APPS ====================
  An1Search(params: { query: string }) { return this.request('/api/an1apk/search', 'GET', params); }
  An1Dl(params: { url: string }) { return this.request('/api/an1apk/download', 'GET', params); }
  ApkpureSearch(params: { query: string }) { return this.request('/api/apkpure/search', 'GET', params); }
  ApkpureDl(params: { query: string }) { return this.request('/api/apkpure/download', 'GET', params); }
  AptoideSearch(params: { query: string }) { return this.request('/api/aptoide/search', 'GET', params); }
  AptoideDl(params: { url: string }) { return this.request('/api/aptoide/download', 'GET', params); }

  // ==================== SHORTENERS ====================
  Reurl(params: { url: string }) { return this.request('/api/shortener/reurl', 'GET', params); }
  Itsl(params: { url: string }) { return this.request('/api/shortener/itsssl', 'GET', params); }
  Vgd(params: { url: string }) { return this.request('/api/shortener/vgd', 'GET', params); }
  Tiny(params: { url: string }) { return this.request('/api/shortener/tiny', 'GET', params); }

  // ==================== DOWNLOADS ====================
  Facebook(params: { url: string }) { return this.request('/api/facebook/download', 'GET', params); }
  Instagram(params: { url: string }) { return this.request('/api/instagram/download', 'GET', params); }
  TikTok(params: { url: string }) { return this.request('/api/tiktok/download', 'GET', params); }
  Threads(params: { url: string }) { return this.request('/api/threads/download', 'GET', params); }
  Twitter(params: { url: string }) { return this.request('/api/twitter/download', 'GET', params); }
  Pinterest(params: { url: string }) { return this.request('/api/download/pinterest', 'GET', params); }
  Spotify(params: { url: string }) { return this.request('/api/spotify/download', 'GET', params); }

  // ==================== SEARCH & STALK ====================
  BingSearch(params: { query: string }) { return this.request('/api/bing/search', 'GET', params); }
  GoogleImage(params: { query: string }) { return this.request('/api/google/image', 'GET', params); }
  GithubUser(params: { username: string }) { return this.request('/api/stalk/github', 'GET', params); }
  TiktokUser(params: { username: string }) { return this.request('/api/stalk/tiktok', 'GET', params); }

  // ==================== TOOLS ====================
  Screenshot(params: { url: string }) { return this.request('/api/screenshot/take', 'GET', params); }
  Translate(params: { text: string; from?: string; to?: string }) { return this.request('/api/translate/google', 'GET', params); }

  // ==================== IMAGE EFFECTS (POST/FORMDATA) ====================
  Blur(body: FormData, params?: { radius?: number }) { return this.request('/api/sharp/blur', 'POST', params, body, 'query'); }
  Grayscale(body: FormData) { return this.request('/api/sharp/grayscale', 'POST', {}, body, 'query'); }
  Resize(body: FormData, params?: { width?: number; height?: number }) { return this.request('/api/sharp/resize', 'POST', params, body, 'query'); }
  Circle(body: FormData) { return this.request('/api/sharp/circle', 'POST', {}, body, 'query'); }

  // ==================== UTILITIES ====================
  setFullResponse(value: boolean): void { this.fullResponse = value; }
  setAPIKey(apiKey: string): void { this.apiKey = apiKey; }
  setTimeout(timeout: number): void { this.timeout = timeout; }
}
