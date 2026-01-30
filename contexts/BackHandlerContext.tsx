import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { App as CapacitorApp } from '@capacitor/app';

interface BackHandlerContextType {
    register: (id: string, handler: () => boolean | Promise<boolean>) => void;
    unregister: (id: string) => void;
}

const BackHandlerContext = createContext<BackHandlerContextType | null>(null);

export const BackHandlerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Ordered list of handlers. Last one has priority.
    // Using an array of objects to preserve order easily.
    const [handlers, setHandlers] = useState<{ id: string; handler: () => boolean | Promise<boolean> }[]>([]);

    const register = useCallback((id: string, handler: () => boolean | Promise<boolean>) => {
        setHandlers((prev) => {
            // Remove existing if any (to update handler or move to top?)
            // Actually usually we just append. If id exists, remove it first to move to end (LIFO).
            const filtered = prev.filter(h => h.id !== id);
            return [...filtered, { id, handler }];
        });
    }, []);

    const unregister = useCallback((id: string) => {
        setHandlers((prev) => prev.filter(h => h.id !== id));
    }, []);

    // Use a Ref for handlers to avoid listener re-creation loop,
    // but we need the listener to access the *current* handlers.
    // Since 'handlers' state changes, the useEffect dependency will change, re-binding the listener.
    // This is fine as long as handlers don't change too rapidly.
    // Optimization: Use a Ref to hold the current list, so listener doesn't need re-binding.
    const handlersRef = useRef(handlers);
    useEffect(() => {
        handlersRef.current = handlers;
    }, [handlers]);

    useEffect(() => {
        let listener: any;

        const setupListener = async () => {
            listener = await CapacitorApp.addListener('backButton', async () => {
                const currentHandlers = [...handlersRef.current];

                // Iterate from last to first (LIFO)
                let handled = false;
                for (let i = currentHandlers.length - 1; i >= 0; i--) {
                    const result = await currentHandlers[i].handler();
                    if (result) {
                        handled = true;
                        break;
                    }
                }

                if (!handled) {
                    CapacitorApp.exitApp();
                }
            });
        };

        setupListener();

        return () => {
            if (listener) {
                listener.remove();
            }
        };
    }, []); // Bind once. Use ref for latest state.

    return (
        <BackHandlerContext.Provider value={{ register, unregister }}>
            {children}
        </BackHandlerContext.Provider>
    );
};

// Hook for components
export const useBackHandler = (handler: () => boolean | Promise<boolean>, deps: any[] = []) => {
    const context = useContext(BackHandlerContext);
    if (!context) {
        throw new Error('useBackHandler must be used within a BackHandlerProvider');
    }

    const id = useRef(`handler-${Math.random().toString(36).substr(2, 9)}`).current;

    useEffect(() => {
        // Register the handler. 
        // The handler returns 'true' if it consumed the event, 'false' to let it propagate (bubble down).
        // In our LIFO stack, usually "consuming" means "don't call the next one below me".
        context.register(id, handler);

        return () => {
            context.unregister(id);
        };
    }, [...deps, id, context]); // Re-register if deps change (to capture new closure state)
};
