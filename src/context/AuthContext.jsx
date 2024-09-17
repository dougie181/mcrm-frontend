import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import axiosInstance from "../services/axiosInstance";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [authError, setAuthError] = useState(null);

  // Listen for online/offline changes
  useEffect(() => {
    const setOnline = () => setIsOnline(true);
    const setOffline = () => setIsOnline(false);

    window.addEventListener("online", setOnline);
    window.addEventListener("offline", setOffline);

    return () => {
      window.removeEventListener("online", setOnline);
      window.removeEventListener("offline", setOffline);
    };
  }, []);

  const retrieveUserInfo = useCallback(async () => {
    if (!isOnline) {
      setAuthError("Cannot retrieve user info while offline.");
      return;
    }
    console.log("Retrieving user info...");
    try {
      const response = await axiosInstance.get("/auth/me", {
        withCredentials: true,
      });
      const { mail, displayName, userPrincipalName } = response.data;
      const simplifiedUserInfo = {
        mail,
        displayName,
        userPrincipalName,
      };
      setUserInfo(simplifiedUserInfo);
      //console.log("User info:", simplifiedUserInfo);
      setAuthError(null); // Clear any previous error
    } catch (error) {
      console.error("Failed to retrieve user info:", error);
      setUserInfo(null);
      setAuthError("Failed to retrieve user info. Please check your connection and try again.");
    }
  }, [isOnline]);

  useEffect(() => {
    // Initial check for login status
    const checkLoggedIn = async () => {
      if (!isOnline) {
        // Assume logged in status is unchanged if offline
        return;
      }
      try {
        const response = await axiosInstance.get("/auth/user", {
          withCredentials: true,
        });
        setIsLoggedIn(response.data.isLoggedIn);
        if (response.data.isLoggedIn) {
          retrieveUserInfo();
        }
      } catch (error) {
        console.error("Failed to check login:", error);
        setIsLoggedIn(false);
        setUserInfo(null);
        setAuthError("Failed to check login status. Please check your connection.");
      }
    };

    checkLoggedIn();
  }, [isOnline, retrieveUserInfo]); // Re-check when going online

  const handleAuthCallback = async (code, state) => {
    try {
      const response = await axiosInstance.post(
        "/auth/callback",
        { code, state },
        { withCredentials: true }
      );
      //console.log("Auth callback response:", response.data);
      if (response.data.token_data && response.data.token_data.error) {
        throw new Error(
          response.data.token_data.error_description || "Authentication failed."
        );
      } else {
        setIsLoggedIn(true);
        await retrieveUserInfo(); // Ensure this completes before returning
        return response; // Resolve with success data
      }
    } catch (error) {
      setUserInfo(null); // Clear user info on error
      throw error; // Reject the promise with the caught error
    }
  };

  const login = (url) => {
    // Redirect to login URL
    window.location.href = url;
  };

  const logout = async () => {
    try {
      await axiosInstance.get("/auth/logout-full", { withCredentials: true });
      setIsLoggedIn(false);
      setUserInfo(null); // Clear user info on logout
    } catch (error) {
      console.error("Error during logout", error);
    }
  };

  const logoutFull = async () => {
    try {
      const response = await axiosInstance.get("/auth/logout-full", { withCredentials: true });
      const logoutUrl = response.data; // Assuming the response body directly contains the logout URL string

      //console.log("Logout URL:", logoutUrl);

      setIsLoggedIn(false);
      setUserInfo(null); // Clear user info on logout

      // Redirect the browser to the logout URL
      window.location.href = logoutUrl;
    } catch (error) {
      console.error("Error during logout", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ isLoggedIn, userInfo, handleAuthCallback, login, logout, logoutFull, isOnline, authError }}
    >
      {children}
    </AuthContext.Provider>
  );
};
