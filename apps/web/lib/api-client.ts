const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api` : "http://localhost:4000/api";

export class ApiError extends Error {
    constructor(
        public status: number,
        public message: string,
        public data?: any
    ) {
        super(message);
        this.name = "ApiError";
    }
}

/**
 * Core API Client wrapper that automatically handles:
 * 1. Base URL prefixing
 * 2. JWT Cookie injection — the `access_token` HttpOnly cookie is stored by the
 *    login Server Action and automatically sent by the browser via credentials:"include"
 * 3. 401 Unauthorized handling (SSR-safe redirect to /login)
 * 4. Standardized JSON response parsing and error throwing
 * 5. FormData-safe Content-Type (never overrides multipart boundary)
 */
export async function apiClient<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

    const headers = new Headers(options.headers || {});

    // Don't force Content-Type for FormData — browser sets it with correct multipart boundary
    const isFormData = options.body instanceof FormData;
    if (!isFormData && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    const response = await fetch(url, {
        ...options,
        headers,
        // Ensures the `access_token` HttpOnly cookie stored by login/actions.ts is sent
        credentials: "include",
    });

    // Handle 401 globally (token expired or invalid)
    if (response.status === 401) {
        // Guard window for SSR safety (Server Components, middleware, etc.)
        if (typeof window !== "undefined") {
            window.location.href = "/login";
        }
        throw new ApiError(401, "Session expired. Please log in again.");
    }

    // Parse JSON, handle empty responses (204 No Content) gracefully
    let data;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        data = await response.json();
    } else {
        data = await response.text();
    }

    // Throw structured error if not OK
    if (!response.ok) {
        const message = data?.message || data || "An unexpected error occurred";
        throw new ApiError(response.status, Array.isArray(message) ? message.join(", ") : message, data);
    }

    return data as T;
}
