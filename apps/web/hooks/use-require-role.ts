"use client";

import { useAuth, UserRole } from "./use-auth";

/**
 * useRequireRole — Checks whether the logged-in user has one of the required roles.
 *
 * Uses `useAuth` internally — no extra network request is made.
 * The SWR cache from `useAuth` is shared, so this is effectively free to call
 * in any number of components on the same page.
 *
 * @param requiredRoles  A single role or an array of roles that are allowed.
 * @returns              `true` if the current user has one of the required roles,
 *                       `false` otherwise (including while loading).
 *
 * @example
 *   // Single role
 *   const canEdit = useRequireRole("ADMIN");
 *
 *   // Multiple allowed roles
 *   const canView = useRequireRole(["ADMIN", "DOCTOR", "NURSE"]);
 *
 *   return (
 *     <div>
 *       {canEdit && <Button onClick={openEdit}>Edit</Button>}
 *     </div>
 *   );
 */
export function useRequireRole(requiredRoles: UserRole | UserRole[]): boolean {
    const { role, isLoading } = useAuth();

    // While loading, don't show restricted UI prematurely
    if (isLoading || !role) return false;

    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    return roles.includes(role);
}
