import React, { useEffect, useState } from "react";
import {
  Button,
  Container,
  Box,
  Typography,
  Paper,
  Divider,
  IconButton,
} from "@mui/material";
import LoginIcon from "@mui/icons-material/Login";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axiosInstance from "../../services/axiosInstance";

const LoginPage = () => {
  const { login } = useAuth();
  const [canLogin, setCanLogin] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if the application setup allows for user login
    const checkIfCanLogin = async () => {
      try {
        const response = await axiosInstance.get("/setup/canlogin");
        setCanLogin(response.data.can_login);
      } catch (error) {
        console.error("Error during login check", error);
        setCanLogin(false);
      }
    };

    checkIfCanLogin();
  }, []);

  // Redirect to your Flask API login route
  const handleLogin = () => {
    login("http://localhost:5001/api/auth/login");
  };

  const handleClose = () => {
    navigate("/"); // Navigates back to root/homepage
  };

  return (
    <Container component="main" maxWidth="md">
      <Paper elevation={6} sx={{ marginTop: 8, padding: 4, position: 'relative', display: "flex", flexDirection: "column", alignItems: "center" }}>
        <IconButton onClick={handleClose} sx={{ position: "absolute", right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
        <Typography component="h1" variant="h4" gutterBottom>
          Welcome to mcrm-frontend
        </Typography>
        <Typography variant="subtitle1" sx={{ mt: 2 }}>
          Please log in with your Microsoft account so that the CRM is able to send emails on behalf of the authenticated user account.
        </Typography>
        <Divider sx={{ my: 3 }} />
        {canLogin === false && (
          <Typography variant="subtitle1" sx={{ mt: 2, color: "red", textAlign: "center" }}>
            Unable to login to Microsoft Office API...
            <br />
            Please check the settings to ensure there is a valid Tenant ID, Client ID, and secret key value.
          </Typography>
        )}
        <Box sx={{ mt: 1, width: "100%" }}>
          <Button
            type="button"
            fullWidth
            variant="contained"
            color="primary"
            disabled={canLogin === false}
            startIcon={<LoginIcon />}
            onClick={handleLogin}
            sx={{ py: 2 }}
          >
            Log In with Microsoft
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default LoginPage;
