import React, { useCallback, useEffect, useState } from "react";
import { Box, Typography, Container, Paper } from "@mui/material";
import CampaignWizardNavigation from "./CampaignWizardNavigation";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";


const CampaignSamplePage = ({ stepsData, setCurrentStep, id, stepNumber }) => {
	const navigate = useNavigate();

	const saveCampaign = useCallback(async () => {
    const campaignData = {
      // include whatever data that needs to be saved
			status: "draft",
			step: stepNumber + 1 ,
    };
    try {
      await axiosInstance.put(`/campaigns/${id}`, campaignData);
    } catch (error) {
      console.error(error);
    }
  }, [id, stepNumber]);

  const handleSave = () => {
    // Save the campaign configuration
  };

  const handleProceed = () => {
		// similar to handleNext, but without saving the campaign
    setCurrentStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
		// go back to previous step.. currently does not save the campaign
    setCurrentStep((prevStep) => prevStep - 1);
  };

	const handleNext = async () => {
		// save the campaign and go to the next step
    try {
			// perform whatever action is required in addition to saving the campaign
      await saveCampaign();
      setCurrentStep((prevStep) => prevStep + 1);
    } catch (error) {
      console.error("Failed to save campaign:", error);
    }
  };

	const handleCancel = () => {
		// cancel the campaign and go back to the campaigns page - no saving
    navigate('/campaigns');
  };

  const handleStepButtonClick = (step) => {
		//console.log("click", step);
    setCurrentStep(step);
  };
  
  return (
    <Container maxWidth="md">
      <Box textAlign="center" my={4}>
        <CampaignWizardNavigation
          stepsData={stepsData}
          stepNumber={stepNumber}
					// choose what methods are required for the navigation
					onClickCancel={handleCancel}
          onClickBack={handleBack}
					onClickNext={handleNext}
          onClickSave={handleSave}
          onClickProceed={handleProceed}
          onStepClick={handleStepButtonClick}
        />

        <Box mt={4}>
          <Paper>
            <Box p={2}>
              {/* Add the necessary content for this page  here */}
              <Typography variant="body1">
                This is a sample of what content could be displayed on this page.
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Container>
  );
};

export default CampaignSamplePage;
