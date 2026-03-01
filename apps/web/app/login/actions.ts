"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type LoginState = {
    error?: string;
};

export async function loginAction(
    _prevState: LoginState,
    formData: FormData
): Promise<LoginState> {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
        return { error: "Email and password are required" };
    }

    let response: Response;
    try {
        response = await fetch(`${API_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
    } catch {
        return { error: "Unable to connect to server. Please try again." };
    }

    if (!response.ok) {
        let message = "Invalid email or password";
        try {
            const body = await response.json();
            if (body?.message) message = body.message;
        } catch {
            // ignore parse error
        }
        return { error: message };
    }

    const data = await response.json();
    const setCookieHeader = response.headers.get("set-cookie");

    if (setCookieHeader) {
        // Proxy the HttpOnly cookie from NestJS to the Next.js cookie store
        const cookieStore = await cookies();
        // Parse the access_token value from the set-cookie header
        const tokenMatch = setCookieHeader.match(/access_token=([^;]+)/);
        if (tokenMatch) {
            cookieStore.set("access_token", tokenMatch[1], {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 12 * 60 * 60, // 12 hours in seconds
                path: "/",
            });
        }
    }

    redirect("/dashboard");
}

export async function logoutAction() {
    const cookieStore = await cookies();
    cookieStore.delete("access_token");
    redirect("/login");
}
