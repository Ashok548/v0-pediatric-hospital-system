import { useState, useEffect } from "react";

/**
 * Delays updating a value until after a specified wait time has passed
 * without any further updates. Perfect for search inputs to prevent
 * hitting the API on every single keystroke.
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        // Set a timeout to update the debounced value
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // If value changes before delay finishes, this cleanup function runs
        // clearing the timeout and preventing the update, restarting the timer
        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
}
