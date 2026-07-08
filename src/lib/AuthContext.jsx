import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { createAxiosClient } from '@base44/sdk/dist/utils/axios-client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null); // Contains only { id, public_settings }

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);
      
      // First, check app public settings (with token if available)
      // This will tell us if auth is required, user not registered, etc.
      const appClient = createAxiosClient({
        baseURL: `/api/apps/public`,
        headers: {
          'X-App-Id': appParams.appId
        },
        token: appParams.token, // Include token if available
        interceptResponses: false // Handle errors ourselves to prevent SDK auto-redirect to /api/apps/auth/login
      });
      
      try {
        const publicSettings = await appClient.get(`/prod/public-settings/by-id/${appParams.appId}`);
        setAppPublicSettings(publicSettings);
        
        // If we got the app public settings successfully, check if user is authenticated
        if (appParams.token) {
          await checkUserAuth();
        } else {
          setIsLoadingAuth(false);
          setIsAuthenticated(false);
          setAuthChecked(true);
        }
        setIsLoadingPublicSettings(false);
      } catch (appError) {
        console.error('App state check failed:', appError);
        
        // If token is expired/invalid, clear it and retry as unauthenticated (public app)
        if (appError.status === 403 && appError.data?.extra_data?.reason === 'auth_required') {
          localStorage.removeItem('base44_access_token');
          localStorage.removeItem('token');
          
          try {
            const publicClient = createAxiosClient({
              baseURL: `/api/apps/public`,
              headers: { 'X-App-Id': appParams.appId },
              interceptResponses: false
            });
            const publicSettings = await publicClient.get(`/prod/public-settings/by-id/${appParams.appId}`);
            setAppPublicSettings(publicSettings);
            setIsAuthenticated(false);
            setAuthChecked(true);
            setIsLoadingAuth(false);
            setIsLoadingPublicSettings(false);
          } catch {
            setAuthError({ type: 'auth_required', message: 'Authentication required' });
            setIsLoadingPublicSettings(false);
            setIsLoadingAuth(false);
          }
        } else if (appError.status === 403 && appError.data?.extra_data?.reason === 'user_not_registered') {
          setAuthError({
            type: 'user_not_registered',
            message: 'User not registered for this app'
          });
          setIsLoadingPublicSettings(false);
          setIsLoadingAuth(false);
        } else {
          setAuthError({
            type: 'unknown',
            message: appError.message || 'Failed to load app'
          });
          setIsLoadingPublicSettings(false);
          setIsLoadingAuth(false);
        }
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setAuthError({
        type: 'unknown',
        message: error.message || 'An unexpected error occurred'
      });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };

  const checkUserAuth = async () => {
    try {
      // Now check if the user is authenticated
      setIsLoadingAuth(true);
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    } catch (error) {
      console.error('User auth check failed:', error);
      // Token is expired/invalid — clear it and proceed as unauthenticated (public app)
      localStorage.removeItem('base44_access_token');
      localStorage.removeItem('token');
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setAuthChecked(true);
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    setAuthChecked(false);
    
    // Clear tokens manually — the SDK's logout() redirects to /api/apps/auth/login
    // which doesn't exist as a client route, causing a 404.
    localStorage.removeItem('base44_access_token');
    localStorage.removeItem('token');
    
    if (shouldRedirect) {
      window.location.href = '/login';
    }
  };

  const navigateToLogin = () => {
    localStorage.removeItem('base44_access_token');
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};