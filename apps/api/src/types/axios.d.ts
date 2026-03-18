declare module 'axios' {
  export interface AxiosResponse<T = unknown> {
    data: T;
  }

  interface AxiosInstance {
    post<T = unknown>(
      url: string,
      data?: unknown,
      config?: {
        params?: Record<string, string | number | boolean>;
        headers?: Record<string, string>;
        timeout?: number;
      },
    ): Promise<AxiosResponse<T>>;
  }

  const axios: AxiosInstance;
  export default axios;
}
