import { createContext, useContext, useState, type ReactNode } from 'react';

interface UIContextType {
    showDashboard: boolean;
    setShowDashboard: (show: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
    const [showDashboard, setShowDashboard] = useState(false);

    return (
        <UIContext.Provider value={{ showDashboard, setShowDashboard }}>
            {children}
        </UIContext.Provider>
    );
}

export function useUI() {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
}
