const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

class ApiClient {
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("briefen_access_token");
  }

  getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("briefen_refresh_token");
  }

  setTokens(accessToken: string, refreshToken: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem("briefen_access_token", accessToken);
    localStorage.setItem("briefen_refresh_token", refreshToken);
  }

  clearTokens() {
    if (typeof window === "undefined") return;
    localStorage.removeItem("briefen_access_token");
    localStorage.removeItem("briefen_refresh_token");
  }

  private subscribeTokenRefresh(cb: (token: string) => void) {
    this.refreshSubscribers.push(cb);
  }

  private onRefreshed(token: string) {
    this.refreshSubscribers.forEach((cb) => cb(token));
    this.refreshSubscribers = [];
  }

  async request(endpoint: string, options: RequestOptions = {}): Promise<any> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Set headers
    const headers = new Headers(options.headers || {});
    if (!options.skipAuth) {
      const token = this.getAccessToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    }
    
    // Only set Content-Type JSON if we're not sending FormData (e.g. for audio uploads)
    if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 401 && !options.skipAuth) {
        // Try to refresh token
        return this.handle401(url, config);
      }

      if (!response.ok) {
        let errDetail = "API Request failed";
        try {
          const errData = await response.json();
          errDetail = errData.detail || errData.message || errDetail;
        } catch (_) {}
        throw new Error(errDetail);
      }

      if (response.status === 204) {
        return null;
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  private async handle401(url: string, config: RequestInit): Promise<any> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.clearTokens();
      if (typeof window !== "undefined") {
        const publicPaths = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email", "/"];
        const isPublic = publicPaths.includes(window.location.pathname);
        if (!isPublic) {
          window.location.href = "/login";
        }
      }
      throw new Error("Session expired. Please log in again.");
    }

    if (!this.isRefreshing) {
      this.isRefreshing = true;
      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (!refreshResponse.ok) {
          throw new Error("Refresh failed");
        }

        const data = await refreshResponse.json();
        this.setTokens(data.access_token, data.refresh_token);
        this.isRefreshing = false;
        this.onRefreshed(data.access_token);
      } catch (err) {
        this.isRefreshing = false;
        this.clearTokens();
        if (typeof window !== "undefined") {
          const publicPaths = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email", "/"];
          const isPublic = publicPaths.includes(window.location.pathname);
          if (!isPublic) {
            window.location.href = "/login";
          }
        }
        throw new Error("Session expired. Please log in again.");
      }
    }

    // Wait for refresh to complete
    return new Promise((resolve, reject) => {
      this.subscribeTokenRefresh(async (newToken: string) => {
        try {
          const headers = new Headers(config.headers || {});
          headers.set("Authorization", `Bearer ${newToken}`);
          config.headers = headers;
          const retryResponse = await fetch(url, config);
          if (!retryResponse.ok) {
            throw new Error("Retry request failed");
          }
          resolve(await retryResponse.json());
        } catch (retryErr) {
          reject(retryErr);
        }
      });
    });
  }

  async get(endpoint: string, options: RequestOptions = {}): Promise<any> {
    return this.request(endpoint, { ...options, method: "GET" });
  }

  async post(endpoint: string, body: any, options: RequestOptions = {}): Promise<any> {
    const config: RequestOptions = { ...options, method: "POST" };
    if (body !== undefined) {
      config.body = body instanceof FormData ? body : JSON.stringify(body);
    }
    return this.request(endpoint, config);
  }

  async put(endpoint: string, body: any, options: RequestOptions = {}): Promise<any> {
    const config: RequestOptions = { ...options, method: "PUT" };
    if (body !== undefined) {
      config.body = body instanceof FormData ? body : JSON.stringify(body);
    }
    return this.request(endpoint, config);
  }

  async patch(endpoint: string, body: any, options: RequestOptions = {}): Promise<any> {
    const config: RequestOptions = { ...options, method: "PATCH" };
    if (body !== undefined) {
      config.body = body instanceof FormData ? body : JSON.stringify(body);
    }
    return this.request(endpoint, config);
  }

  async delete(endpoint: string, options: RequestOptions = {}): Promise<any> {
    return this.request(endpoint, { ...options, method: "DELETE" });
  }
}

export const apiClient = new ApiClient();
