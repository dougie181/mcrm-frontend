import React from "react";
import { Button, Container, Typography, Box } from "@mui/material";
import { useNavigate } from 'react-router-dom';

const NetworkErrorPage = () => {
  const navigate = useNavigate();

  const handleRedirect = () => {
    navigate('/'); // Redirects user to the homepage or another safe route
  };

  return (
    <Container maxWidth="sm">
      <Box textAlign="center" my={5}>
        <Typography variant="h4" gutterBottom>
          Network Error
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          Unfortunately, it seems like the backend API has stopped working.
        </Typography>
        <Typography variant="body1" gutterBottom>
          This could be due to a network issue or the server being down. Please
          try restarting the application. If the problem persists, contact
          support.
        </Typography>
        <Box mt={4}>
          <Button variant="contained" color="primary" onClick={handleRedirect}>
            Return to Homepage
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default NetworkErrorPage;
