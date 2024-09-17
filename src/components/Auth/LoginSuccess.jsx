// LoginSuccess.js
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button, Typography, Container, Paper, Alert, Box } from "@mui/material";

const LoginSuccess = () => {
  const navigate = useNavigate();

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
        <Alert
          severity="success"
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Typography variant="h5" style={{ textAlign: "center" }} gutterBottom>
            You have successfully logged in
          </Typography>
          <Box sx={{ textAlign: "center", width: "100%", mt: 2 }}>
            {" "}
            {/* Wrap the Button */}
            <Button
              onClick={() => navigate("/")}
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
            >
              OK
            </Button>
          </Box>
        </Alert>
      </Paper>
    </Container>
  );
};

export default LoginSuccess;
