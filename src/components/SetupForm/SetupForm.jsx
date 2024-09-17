import React, { useState } from "react";
import {
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Grid,
  Alert,
  Collapse,
} from "@mui/material";
import axiosInstance from "../../services/axiosInstance";

const SetupForm = () => {
  const [errorMessage, setErrorMessage] = useState("");
  const [errorDetails, setErrorDetails] = useState("");
  const [showDetails, setShowDetails] = useState(false);

  const [formData, setFormData] = useState({
    userFirstName: "",
    userEmail: "",
    companyName: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const setupData = {
        userFirstName: formData.userFirstName,
        userEmail: formData.userEmail,
        companyName: formData.companyName,
      };
      setErrorDetails("");
      setErrorMessage("");

      const response = await axiosInstance.post("/setup/initialise", setupData);
      if (response.status === 200) {
        console.log("Setup complete!");
        window.location.reload();
      } else {
        console.error("Setup failed!");
      }
    } catch (error) {
      setErrorMessage(error.message || "An unexpected error occurred."); // Update the errorMessage state
      if (error.response && error.response.data && error.response.data.error) {
        setErrorDetails(error.response.data.error);
      }
      console.error("Error updating client data:", error);
    }
  };

  return (
    <Container
      component="main"
      maxWidth="xs"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <Paper
        elevation={3}
        style={{
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography
          component="h1"
          variant="h5"
          style={{
            textAlign: "center",
            marginBottom: "20px",
          }}
        >
          Initalise and setup application
        </Typography>
        {errorMessage && (
          <>
            <Alert severity="error">
              {errorMessage}
              <Button onClick={() => setShowDetails(!showDetails)}>
                {showDetails ? "Hide Details" : "Show Details"}
              </Button>
            </Alert>
            <Collapse in={showDetails}>
              <Alert severity="info">
                {errorDetails || "No details available."}
              </Alert>
            </Collapse>
          </>
        )}
        <form
          onSubmit={handleSubmit}
          style={{ width: "100%", marginTop: "1rem" }}
        >
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                variant="outlined"
                required
                fullWidth
                label="First name of user"
                name="userFirstName"
                value={formData.userFirstName}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                variant="outlined"
                required
                fullWidth
                label="Email Address of user "
                name="userEmail"
                type="email" 
                value={formData.email}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} style={{ marginBottom: "20px" }}>
              <TextField
                variant="outlined"
                required
                fullWidth
                label="Company name"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            style={{ margin: "1rem 0" }}
          >
            Submit
          </Button>
        </form>
      </Paper>
    </Container>
  );
};

export default SetupForm;
