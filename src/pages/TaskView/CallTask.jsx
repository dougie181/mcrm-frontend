import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Box,
  TextField,
  Typography,
  Container,
  Paper,
  Snackbar,
  Alert,
  CircularProgress,
  Backdrop,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const CallTask = () => {
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    severity: "info",
    message: "",
  });

  const [callData, setCallData] = useState({
    datetime: "",
    notes: "",
  });

  //const location = useLocation();
  const navigate = useNavigate();
  //const task = location.state ? location.state.task : null;

  // Function to close the snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false,
    });
  };

  // TODO: Add your useEffect for any data fetching here...
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }
    , 1000);  
  }
  , []);

  return (
    <Container maxWidth="md">
      <Backdrop open={loading} sx={{ zIndex: 1500 }}>
        <CircularProgress color="inherit" />
      </Backdrop>
      <Box p={4} display="flex" flexDirection="column">
        <Box display="flex" alignItems="center" marginBottom={3}>
          <Button
            startIcon={<ArrowBackIcon />}
            variant="contained"
            color="primary"
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
          <Typography variant="h5" style={{ marginLeft: "20px" }}>
            Call Editor
          </Typography>
        </Box>
        <Paper elevation={3} sx={{ p: 2, mt: 4, mb: 2 }}>
          <Box marginBottom={2}>
            <Typography variant="subtitle1">Date/Time:</Typography>
            <TextField
              fullWidth
              variant="outlined"
              type="datetime-local"
              value={callData.datetime}
              onChange={(e) => setCallData({ ...callData, datetime: e.target.value })}
            />
          </Box>
          <Box marginBottom={2}>
            <Typography variant="subtitle1">Call notes:</Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              variant="outlined"
              value={callData.notes}
              onChange={(e) => setCallData({ ...callData, notes: e.target.value })}
            />
          </Box>
          <Box marginTop={2}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              // TODO: Add your call handling logic here...
            >
              Save
            </Button>
          </Box>
        </Paper>
      </Box>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CallTask;
