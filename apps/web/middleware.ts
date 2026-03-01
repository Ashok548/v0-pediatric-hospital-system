import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const ROLE_ROUTES: Record<string, string[]> = {
    "/pharmacy": ["PHARMACIST", "ADMIN"],
    "/nursing": ["NURSE", "DOCTOR", "ADMIN"],
    "/reports": ["ADMIN"],
};

const PUBLIC_PATHS = ["/login", "/unauthorized"];

// Cache the secret to avoid re-encoding on every request
let cachedSecret: Uint8Array | null = null;
function getSecret() {
    if (cachedSecret) return cachedSecret;
    const secret = process.env.JWT_SECRET ?? "change-this-to-a-random-64-character-secret-before-going-to-production";
    cachedSecret = new TextEncoder().encode(secret);
    return cachedSecret;
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const startTime = Date.now();

    console.log(`[Proxy] Request: ${pathname}`);

    // 1. Allow public paths
    if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
        console.log(`[Proxy] Public path allowed: ${pathname} (${Date.now() - startTime}ms)`);
        return NextResponse.next();
    }

    // 2. Check token
    const token = request.cookies.get("access_token")?.value;
    if (!token) {
        console.log(`[Proxy] No token, redirecting to /login: ${pathname}`);
        const loginUrl = new URL("/login", request.url);
        return NextResponse.redirect(loginUrl);
    }

    // 3. Verify token
    try {
        const { payload } = await jwtVerify(token, getSecret());
        const userRole = payload.role as string;

        // 4. Role-based protection
        for (const [route, allowedRoles] of Object.entries(ROLE_ROUTES)) {
            if (pathname.startsWith(route) && !allowedRoles.includes(userRole)) {
                console.warn(`[Proxy] Access denied for role ${userRole} to ${pathname}`);
                return NextResponse.redirect(new URL("/unauthorized", request.url));
            }
        }

        console.log(`[Proxy] Authorized: ${userRole} -> ${pathname} (${Date.now() - startTime}ms)`);
        return NextResponse.next();
    } catch (err) {
        console.warn(`[Proxy] JWT Verification failed: ${(err as Error).message}`);
        const response = NextResponse.redirect(new URL("/login", request.url));
        response.cookies.delete("access_token");
        return response;
    }
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};

