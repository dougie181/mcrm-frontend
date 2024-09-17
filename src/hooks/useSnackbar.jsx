import { useState, useCallback } from "react";

const useSnackbar = () => {
  const [snackbar, setSnackbar] = useState({
    open: false,
    severity: "info",
    message: "",
  });

  const showError = useCallback((message) => {
    setSnackbar({ open: true, severity: "error", message });
  }, []);

  const showWarning = useCallback((message) => {
    setSnackbar({
      open: true,
      severity: "warning",
      message,
    });
  }, []);

  const showSuccess = useCallback((message) => {
    setSnackbar({ open: true, severity: "success", message });
  }, []);

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar((prevSnackbar) => ({
      ...prevSnackbar,
      open: false,
    }));
  }, []);

  return {
    snackbar,
    showError,
    showWarning,
    showSuccess,
    handleCloseSnackbar,
  };
};

export default useSnackbar;
