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
            // FIX: FormData-aware body serialization.
            // Passing FormData through JSON.stringify would corrupt it — detect and pass as-is.
            let body: BodyInit | undefined;
            if (["POST", "PATCH", "PUT"].includes(method) && variables !== undefined) {
                body = variables instanceof FormData
                    ? variables
                    : JSON.stringify(variables);
            }

            const data = await apiClient<TData>(url, { method, body });

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

            // FIX: Do NOT re-throw. Components use onSuccess/onError callbacks or
            // check the returned `undefined` value. Re-throwing causes unhandled
            // promise rejections in components that call `await trigger()` without
            // their own try/catch (which is the entire point of this abstraction).
            return undefined;
        } finally {
            setIsMutating(false);
        }
    };

    return { trigger, isMutating, error };
}
