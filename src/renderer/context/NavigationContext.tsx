'use client'
import React, { createContext, useContext, useState, ReactNode } from 'react';

type NavigationContextType = {
    currentPage: string;
    setCurrentPage: (page: string) => void;
};

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider = ({ children }: { children: ReactNode }) => {
    const [currentPage, setCurrentPage] = useState('/dashboard');

    return (
        <NavigationContext.Provider value={{ currentPage, setCurrentPage }}>
            {children}
        </NavigationContext.Provider>
    );
};

export const useNavigation = () => {
    const context = useContext(NavigationContext);
    if (context === undefined) {
        throw new Error('useNavigation must be used within a NavigationProvider');
    }
    return context;
};
