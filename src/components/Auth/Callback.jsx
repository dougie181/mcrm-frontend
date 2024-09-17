import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Alert,
  Typography,
  CircularProgress,
  Container,
  Paper,
  Box,
} from "@mui/material";
import { useAuth } from "../../context/AuthContext";

const Callback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorDetails, setErrorDetails] = useState(null);
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  
  const { handleAuthCallback } = useAuth();

  const hasProcessedCallbackRef = useRef(false);  // Ref to track if the callback has been processed

  useEffect(() => {
    if (!hasProcessedCallbackRef.current) {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      const state = urlParams.get("state");

      if (code) {
        setIsLoading(true);
        handleAuthCallback(code, state)
          .then((response) => {
            // Navigate to home or show success message
            console.log("Callback response: ", response);
            if (response.data.token_data && response.data.token_data.error) {
              const errorDetail =
                response.data.token_data.error_description ||
                "Unknown error in token data";
              setError(`Login failed: ${errorDetail}`);
            } else {
              navigate("/login/success");
            }
          })
          .catch((error) => {
            console.log("Entering catch block with error:", error);
            const errorResponse = error.response?.data || {};
            const errorMessage = errorResponse.error || "Unable to login. Please try again.";
            const errorCode = errorResponse.code || "unknown_error";

            let detailedErrorMessage = errorMessage;
            if (errorCode === "invalid_client") {
              detailedErrorMessage =
                "Your app registration within Azure has expired. Please contact your IT administrator to renew.";
            }

            setError(detailedErrorMessage);
            setErrorDetails(errorMessage);
          })
          .finally(() => {
            setIsLoading(false);
          });
      }
      hasProcessedCallbackRef.current = true;
    }
    // don't need to add hasProcessedCallbackRef to the dependency array because it's a ref
  }, [handleAuthCallback, navigate]);

  const handleRetry = () => {
    navigate("/login");
  };

  const toggleErrorDetails = () => {
    setShowErrorDetails((prev) => !prev);
  };

  return (
    <Container component="main" maxWidth="md">
      <Paper
        elevation={6}
        sx={{
          mt: 8,
          p: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isLoading && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100vh",
            }}
          >
            <CircularProgress />
            <Typography variant="subtitle1" sx={{ mt: 2 }}>
              Loading...
            </Typography>
          </Box>
        )}

        {error && (
          <Alert
            severity="error"
            sx={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Typography
              variant="h5"
              gutterBottom
              style={{ textAlign: "center" }}
            >
              Unable to login
            </Typography>
            <Typography variant="body1" sx={{ textAlign: "center" }}>
              {error}
            </Typography>
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                width: "100%", // Ensure the box takes full width
                mt: 2,
              }}
            >
              <Button
                onClick={toggleErrorDetails}
                variant="text"
                color="secondary"
              >
                {showErrorDetails ? "Hide details" : "More details..."}
              </Button>
            </Box>
            {showErrorDetails && (
              <Typography
                variant="body2"
                sx={{ mt: 1, textAlign: "center", width: "100%" }}
              >
                {errorDetails}
              </Typography>
            )}
            <Box sx={{ textAlign: "center", width: "100%", mt: 2 }}>
              <Button
                onClick={handleRetry}
                variant="outlined"
                color="secondary"
              >
                Retry
              </Button>
            </Box>
          </Alert>
        )}
      </Paper>
    </Container>
  );
};

export default Callback;
