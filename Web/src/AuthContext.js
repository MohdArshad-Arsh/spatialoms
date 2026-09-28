import React, { createContext, useState, useContext, useEffect } from 'react';
import { properties } from './Properties/Properties';
// Create Auth Context
const AuthContext = createContext(null);

// Auth Provider Component
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Validate token with backend
    const validateToken = async (authToken) => {
        try {
            // const response = await fetch('http://localhost:8080/auth/validate', {
            //     method: 'GET',
            //     headers: {
            //         'Authorization': `Bearer ${authToken}`,
            //         'Content-Type': 'application/json'
            //     }
            // });

            const response = await fetch(properties.Port + properties.validateToken, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                return true;
            } else {
                return false;
            }
        } catch (error) {
            console.error('Token validation failed:', error);
            return false;
        }
    };

    // Load and validate token from sessionStorage on mount
    useEffect(() => {
        const checkAuth = async () => {
            // Use sessionStorage instead of localStorage
            const savedToken = sessionStorage.getItem('jwtToken');
            const savedUser = sessionStorage.getItem('username');

            if (savedToken && savedUser) {
                // Validate token with backend
                const isValid = await validateToken(savedToken);

                if (isValid) {
                    setToken(savedToken);
                    setUser(savedUser);
                    setIsAuthenticated(true);
                    console.log('Token validated and loaded from sessionStorage:', savedToken);
                } else {
                    // Token is invalid, clear everything
                    sessionStorage.removeItem('jwtToken');
                    sessionStorage.removeItem('username');
                    console.log('Invalid token, cleared from storage');
                }
            }

            setIsLoading(false);
        };

        checkAuth();
    }, []);

    // Login function
    const login = (username, authToken) => {
        // Save to sessionStorage instead of localStorage
        sessionStorage.setItem('jwtToken', authToken);
        sessionStorage.setItem('username', username);

        setUser(username);
        setToken(authToken);
        setIsAuthenticated(true);
        console.log('User logged in:', username);
        console.log('Token saved:', authToken);
    };

    // Logout function
    const logout = () => {
        // Remove from sessionStorage
        sessionStorage.removeItem('jwtToken');
        sessionStorage.removeItem('username');

        setUser(null);
        setToken('');
        setIsAuthenticated(false);
        console.log('User logged out');
    };

    // Get token for API calls
    const getAuthHeader = () => {
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    };

    // API call with token
    const authenticatedFetch = async (url, options = {}) => {
        const headers = {
            ...getAuthHeader(),
            ...options.headers
        };

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            // If 401 Unauthorized, logout user
            if (response.status === 401) {
                logout();
                console.log('Session expired, logging out');
            }

            return response;
        } catch (error) {
            console.error('API call failed:', error);
            throw error;
        }
    };

    const value = {
        user,
        token,
        isAuthenticated,
        isLoading,
        login,
        logout,
        getAuthHeader,
        authenticatedFetch
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};