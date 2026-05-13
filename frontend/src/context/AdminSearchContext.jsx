import React, { createContext, useState, useContext } from 'react';

const AdminSearchContext = createContext();

export const AdminSearchProvider = ({ children }) => {
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <AdminSearchContext.Provider value={{ searchQuery, setSearchQuery }}>
            {children}
        </AdminSearchContext.Provider>
    );
};

export const useAdminSearch = () => {
    const context = useContext(AdminSearchContext);
    if (!context) {
        throw new Error('useAdminSearch must be used within an AdminSearchProvider');
    }
    return context;
};
