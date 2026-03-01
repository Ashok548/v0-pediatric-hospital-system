"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "./use-query";
import { apiClient } from "../lib/api-client";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * The shape of the authenticated user returned by GET /auth/me.
 * Extend this interface as new fields are added to the backend response.
 */
export interface AuthUser {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    // Note: the backend returns role as { id, name } — not a plain string
    role: { id: number; name: UserRole };
    status: "ACTIVE" | "INACTIVE";
    lastLoginAt: string | null;
}

export type UserRole =
    | "ADMIN"
    | "DOCTOR"
    | "NURSE"
    | "PHARMACIST"
    | "RECEPTIONIST"
    | "LAB_TECHNICIAN";

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useAuth — Fetches and caches the current user session.
 *
 * Uses SWR under the hood (via useQuery) so the /auth/me call is:
 *  - Made once on mount and cached for the session lifetime
 *  - Shared across all components that call useAuth() — no duplicate requests
 *  - Automatically re-fetched on window focus (catches expired sessions)
 *
 * On 401, apiClient already redirects to /login — this hook surfaces the
 * current state for UI rendering only.
 *
 * @example
 *   const { user, role, isAuthenticated, logout } = useAuth();
 *   if (!isAuthenticated) return <Spinner />;
 */
export function useAuth() {
    const router = useRouter();

    const { data: user, isLoading, error, mutate } = useQuery<AuthUser>(
        "/auth/me",
        {
            // Cache for 5 minutes — don't refetch on every focus for profile data
            dedupingInterval: 5 * 60 * 1000,
            // If /auth/me 401s, apiClient redirects to /login automatically.
            // We still want the error surfaced here so UI can react.
            shouldRetryOnError: false,
        }
    );

    /**
     * logout — Calls the backend logout endpoint (clears the HttpOnly cookie
     * server-side), then invalidates the local SWR cache and redirects to /login.
     */
    const logout = useCallback(async () => {
        try {
            await apiClient("/auth/logout", { method: "POST" });
        } catch {
            // Ignore errors — we're logging out regardless
        } finally {
            // Bust the local SWR cache so stale user data isn't shown briefly
            await mutate(undefined, { revalidate: false });
            router.push("/login");
        }
    }, [mutate, router]);

    return {
        /** The full authenticated user object, or undefined while loading */
        user,
        /** Shortcut: current user's role name (e.g. "ADMIN"), or undefined if unauthenticated */
        role: user?.role?.name,
        /** True after a successful /auth/me response with a valid user */
        isAuthenticated: !!user && !error,
        /** True while the initial /auth/me request is in flight */
        isLoading,
        /** Clears session cookie and redirects to /login */
        logout,
    };
}
