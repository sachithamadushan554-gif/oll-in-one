import { useState, useEffect, useCallback } from 'react';

// Use the provided Client ID. The API Key is not needed for this type of client-side auth.
const CLIENT_ID = '893251871268-5akt344cfmgrrm0i6irmqmm8ofs51i7j.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata';
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest", "https://www.googleapis.com/discovery/v1/apis/people/v1/rest"];
const FILENAME = 'saman-mobile-billing-data.json';

// Define interfaces for GAPI and GIS since types are not easily available
declare global {
  interface Window {
    gapi: any;
    google: any;
    tokenClient: any;
    gapiLoaded: boolean;
    gisLoaded: boolean;
  }
}

export const useGoogleDrive = () => {
  const [isGapiReady, setIsGapiReady] = useState(false);
  const [isGisReady, setIsGisReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [signInError, setSignInError] = useState<string | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleInitializationError = useCallback((message: string, error?: any) => {
    if (error) {
      console.error(message, error);
    } else {
      console.error(message);
    }
    setInitializationError(message);
    setIsInitializing(false);
  }, []);

  const fetchUserProfile = useCallback(async () => {
    try {
      const profile = await window.gapi.client.people.people.get({
        resourceName: 'people/me',
        personFields: 'names,emailAddresses,photos',
      });
      setUserProfile(profile.result);
    } catch (error) {
      console.error("Error fetching user profile", error);
    }
  }, []);

  const gapiInit = useCallback(async () => {
    try {
      await window.gapi.client.init({
        discoveryDocs: DISCOVERY_DOCS,
      });
      setIsGapiReady(true);
    } catch (error) {
      handleInitializationError('Error initializing Google API client.', error);
    }
  }, [handleInitializationError]);

  const gisInit = useCallback(() => {
    try {
      window.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: async (tokenResponse: any) => {
          if (tokenResponse && tokenResponse.access_token) {
            setSignInError(null); // Clear errors on success
            window.gapi.client.setToken(tokenResponse);
            setIsSignedIn(true);
            await fetchUserProfile();
          }
        },
        error_callback: (error: any) => {
           console.error("Sign-in error", error);
           if (error && (error.type === 'popup_closed' || error.type === 'popup_failed_to_open')) {
                setSignInError(
                    'Sign-in pop-up was blocked or closed. Please try again. If it continues, check your browser for pop-up blockers and ensure third-party cookies are enabled.'
                );
            } else if (error && (error.error_subtype === 'access_denied' || error.type === 'access_denied')) {
                setSignInError('Access denied. You need to grant permission to continue.');
            } else {
                setSignInError("An unknown sign-in error occurred. Please try again.");
            }
        },
      });
      setIsGisReady(true);
    } catch (error) {
      handleInitializationError('Error initializing Google Sign-In.', error);
    }
  }, [fetchUserProfile, handleInitializationError]);

  useEffect(() => {
    if (isGapiReady && isGisReady) {
      setIsInitializing(false);
    }
  }, [isGapiReady, isGisReady]);
  
  useEffect(() => {
    const pollTimer = setInterval(() => {
      if (window.gapiLoaded && window.gisLoaded) {
        clearInterval(pollTimer);
        window.gapi.load('client', gapiInit);
        gisInit();
      }
    }, 200);

    const timeout = setTimeout(() => {
        clearInterval(pollTimer);
        if (!window.gapiLoaded || !window.gisLoaded) {
            handleInitializationError("Could not connect to Google services. Please check your internet connection and refresh the page.");
        }
    }, 10000); // Stop polling after 10 seconds

    return () => {
        clearInterval(pollTimer);
        clearTimeout(timeout);
    };
  }, [gapiInit, gisInit, handleInitializationError]);

  const findFile = useCallback(async () => {
    if (!isSignedIn) return null;
    try {
      const response = await window.gapi.client.drive.files.list({
        spaces: 'appDataFolder',
        fields: 'files(id, name)',
        q: `name='${FILENAME}'`
      });
      const files = response.result.files;
      if (files && files.length > 0) {
        setFileId(files[0].id);
        return files[0].id;
      }
      setFileId(null);
      return null;
    } catch (error) {
      console.error('Error finding file:', error);
      return null;
    }
  }, [isSignedIn]);

  useEffect(() => {
    if (isGapiReady && isSignedIn) {
      findFile();
    }
  }, [isGapiReady, isSignedIn, findFile]);


  const signIn = () => {
    if (!isGisReady) {
      alert('Google Auth is not ready yet.');
      return;
    }
    setSignInError(null); // Clear previous errors before trying again
    window.tokenClient.requestAccessToken({ prompt: 'consent select_account' });
  };

  const signOut = () => {
    const token = window.gapi.client.getToken();
    if (token) {
      window.google.accounts.oauth2.revoke(token.access_token, () => {
        window.gapi.client.setToken(null);
        setIsSignedIn(false);
        setUserProfile(null);
      });
    }
  };

  const backupData = async (data: string): Promise<boolean> => {
    if (!isSignedIn) {
      return false;
    }

    setIsBackingUp(true);
    try {
      const metadata = {
        'name': FILENAME,
        'mimeType': 'application/json',
        parents: ['appDataFolder']
      };

      const media = {
        mimeType: 'application/json',
        body: data
      };

      const currentFileId = fileId || await findFile();

      let request;
      if (currentFileId) {
        // Update existing file
        request = window.gapi.client.request({
          path: `/upload/drive/v3/files/${currentFileId}`,
          method: 'PATCH',
          params: { uploadType: 'media' },
          body: media.body
        });
      } else {
        // Create new file
        request = window.gapi.client.drive.files.create({
          resource: metadata,
          media: media,
          fields: 'id'
        });
      }

      await request;
      if (!currentFileId) {
        await findFile();
      }
      return true;
    } catch (e) {
      console.error("Error backing up data", e);
      return false;
    } finally {
      setIsBackingUp(false);
    }
  };

  const restoreData = async (): Promise<string | null> => {
    if (!isSignedIn) {
      return null;
    }
    
    setIsRestoring(true);
    try {
      const currentFileId = fileId || await findFile();
      if (!currentFileId) {
        return null;
      }

      const response = await window.gapi.client.drive.files.get({
        fileId: currentFileId,
        alt: 'media'
      });
      return response.body;
    } catch (e) {
      console.error("Error restoring data", e);
      return null;
    } finally {
      setIsRestoring(false);
    }
  };

  return { 
    isApiReady: isGapiReady && isGisReady, 
    isInitializing, 
    isSignedIn, 
    userProfile, 
    signIn, 
    signOut, 
    backupData, 
    restoreData, 
    initializationError, 
    signInError,
    isBackingUp,
    isRestoring
  };
};
