import React from "react";
import { Box, Button, Container, Typography } from "@mui/material";
import { styled } from "@mui/system";
import { useNavigate } from "react-router-dom";

const HeroContent = styled(Container)(({ theme }) => ({
  padding: theme.spacing(8, 0, 6),
  textAlign: "center",
}));

const HeroButtons = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(4),
}));

const HomePage = ({ isChecklistDone }) => {
  const navigate = useNavigate();

  console.log("isChecklistDone", isChecklistDone);
  const onGetStartedHandler = () => {
    navigate("/checklist");
  };

  return (
    <HeroContent maxWidth="md" component="main">
      <Typography
        component="h1"
        variant="h2"
        align="center"
        color="textPrimary"
        gutterBottom
      >
        Welcome to mcrm-frontend
      </Typography>
      <Typography
        variant="h5"
        align="center"
        color="textSecondary"
        component="p"
      >
        Effortlessly perform mail merge operations using data from external
        systems. Update your client data and merge it with HTML templates to
        create personalised emails.
      </Typography>
      <HeroButtons>
        {!isChecklistDone && (
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={onGetStartedHandler}
          >
            Setup
          </Button>
        )}
      </HeroButtons>
    </HeroContent>
  );
};

export default HomePage;
