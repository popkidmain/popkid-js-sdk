export interface APIConfig {
  apiKey: string;
  baseURL?: string;
  fullResponse?: boolean;
  timeout?: number;
}

export interface APIResponse<T = any> {
  data?: T;
  success?: boolean;
  [key: string]: any;
}
