import React from 'react';
import { Container, Box, Typography, Button } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate } from 'react-router-dom';

const Completed = ({ stepsData, stepNumber, handleStartOver }) => {
	const navigate = useNavigate();
	
	const viewCampaigns = () => {
    navigate('/campaigns');
  };

  return (
    <Container maxWidth="lg">
      <Box textAlign="center" my={4}>
        <CheckCircleIcon sx={{ fontSize: 80, color: 'green' }} />
        <Typography variant="h4" mt={2}>
          Campaign Created Successfully!
        </Typography>
        <Typography variant="body1" mt={2}>
          Your campaign has been created and is now live.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={viewCampaigns}
          sx={{ mt: 4 }}
        >
          View Campaigns
        </Button>
      </Box>
    </Container>
  );
};

export default Completed;
