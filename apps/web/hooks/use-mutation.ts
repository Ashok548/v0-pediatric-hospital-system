import { useState } from "react";
import { apiClient, ApiError } from "../lib/api-client";
import { useToast } from "./use-toast";

type HttpMethod = "POST" | "PATCH" | "DELETE" | "PUT";

export function useMutation<TData = any, TVariables = any>(
    endpoint: string | ((vars: TVariables) => string),
    method: HttpMethod = "POST",
    options?: {
        onSuccess?: (data: TData) => void;
        onError?: (error: Error) => void;
        successMessage?: string;
    }
) {
    const [isMutating, setIsMutating] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const { toast } = useToast();

    const trigger = async (variables?: TVariables): Promise<TData | undefined> => {
        setIsMutating(true);
        setError(null);

        // Resolve dynamic endpoints (e.g. DELETE /master/floors/:id)
        const url = typeof endpoint === "function" ? endpoint(variables as TVariables) : endpoint;

        try {
            const data = await apiClient<TData>(url, {
                method,
                // Only attach body for POST/PATCH/PUT
                body: ["POST", "PATCH", "PUT"].includes(method) && variables ? JSON.stringify(variables) : undefined,
            });

            if (options?.successMessage) {
                toast({
                    title: "Success",
                    description: options.successMessage,
                });
            }

            options?.onSuccess?.(data);
            return data;
        } catch (err: any) {
            setError(err);

            // Skip toast for 401 — apiClient already handles logout + redirect to /login
            const is401 = err instanceof ApiError && err.status === 401;
            if (!is401) {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: err.message || "An error occurred during the request.",
                });
            }

            options?.onError?.(err);
            throw err; // Re-throw so caller can await and catch if needed
        } finally {
            setIsMutating(false);
        }
    };

    return { trigger, isMutating, error };
}
