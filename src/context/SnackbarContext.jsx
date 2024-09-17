import React, { createContext, useContext, useState } from 'react';

// Create a context
const SnackbarContext = createContext();

// Provider component
export const SnackbarProvider = ({ children }) => {
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info',
    autoHideDuration: 6000, // Default duration
  });

  const showSnackbar = (message, severity = 'info', autoHideDuration = 6000) => {
    setSnackbar({ open: true, message, severity, autoHideDuration });
  };


  const hideSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <SnackbarContext.Provider value={{ ...snackbar, showSnackbar, hideSnackbar }}>
      {children}
      
    </SnackbarContext.Provider>
  );
};

// Hook to use snackbar
export const useSnackbar = () => useContext(SnackbarContext);