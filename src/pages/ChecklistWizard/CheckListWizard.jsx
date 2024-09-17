import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Container,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Link as MuiLink,
  Checkbox,
  FormControlLabel,
  Divider,
} from "@mui/material";
import { styled } from "@mui/system";
import { useNavigate , Link as RouterLink } from "react-router-dom";
import SubSteps from "./SubSteps";

import axiosInstance from "../../services/axiosInstance";

const HeroContent = styled(Container)(({ theme }) => ({
  padding: theme.spacing(8, 0, 6),
  textAlign: "center",
}));

const ActionButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(1, 0),
}));

const InlineContent = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "1fr auto", // One column for the description, one for the checkbox
  alignItems: "flex-start", // Align items to the start of the container
  gap: theme.spacing(2), // Adjust the gap between the columns
}));

const ChecklistWizard = ({ forceRefresh }) => {
  const [steps, setSteps] = useState([]);
  const [activeStep, setActiveStep] = useState(0);
  const [activeSubStep, setActiveSubStep] = useState(0);
  const [showSubStepsForStep, setShowSubStepsForStep] = useState({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const allStepsCompleted = steps.every((step) => step.completed);

  const handleCompletionToggle = async (index, subIndex = null) => {
    console.log("HandleCompletionToggle");

    const updateStepStatus = async (stepId, completed) => {
      try {
        await axiosInstance.patch(`/checklist/${stepId}`, { completed });
        console.log("Successfully updated step status.");
      } catch (error) {
        console.error("Failed to update step status:", error);
      }
    };

    const updatedSteps = [...steps];

    if (subIndex !== null) {
      updatedSteps[index].substeps[subIndex].completed =
        !updatedSteps[index].substeps[subIndex].completed;

      // Check if all substeps are completed to mark the main step as completed
      updatedSteps[index].completed = updatedSteps[index].substeps.every(
        (sub) => sub.completed
      );

      if (!updatedSteps[index].completed) {
        await updateStepStatus(
          updatedSteps[index].id,
          updatedSteps[index].completed
        );
      }

      // set the next uncompleted substep as active
      const nextUncompletedSubStepIndex = updatedSteps[
        index
      ].substeps.findIndex((substep) => !substep.completed);
      setActiveSubStep(nextUncompletedSubStepIndex);

      setSteps(updatedSteps);

      // If all sub-steps are completed, hide them and increment the activeStep
      if (updatedSteps[index].completed) {
        setShowSubStepsForStep((prevState) => ({
          ...prevState,
          [index]: false,
        }));
        // Increment the activeStep
        setActiveStep((prevActiveStep) => prevActiveStep + 1);

        await updateStepStatus(
          updatedSteps[index].id,
          updatedSteps[index].completed
        );

        // Reset the activeSubStep to 0
        setActiveSubStep(0);
      }
      // Update backend status for the sub-step
      await updateStepStatus(
        updatedSteps[index].substeps[subIndex].id,
        updatedSteps[index].substeps[subIndex].completed
      );
    } else {
      // Handle the main task's completion toggle
      updatedSteps[index].completed = !updatedSteps[index].completed;
      setSteps(updatedSteps);

      // Update backend status for the main step
      await updateStepStatus(
        updatedSteps[index].id,
        updatedSteps[index].completed
      );
    }
  };

  const hideSubTasks = (index, subIndex = null) => {
    const updatedSteps = [...steps];

    // check if all the substeps are completed for this index
    updatedSteps[index].completed = updatedSteps[index].substeps.every(
      (sub) => sub.completed
    );
    setSteps(updatedSteps);
    // If all sub-steps are completed, hide them and increment the activeStep
    if (updatedSteps[index].completed) {
      setShowSubStepsForStep((prevState) => ({
        ...prevState,
        [index]: false,
      }));

      // if a previous step is not completed, set it as the active step
      const previousUncompletedStepIndex = updatedSteps.findIndex(
        (step) => !step.completed
      );
      if (previousUncompletedStepIndex !== -1) {
        setActiveStep(previousUncompletedStepIndex);
      } else {
        // Increment the activeStep
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
        // Reset the activeSubStep to 0
        setActiveSubStep(0);
      }
    }
  };

  const showSubTasks = (index, subIndex = null) => {
    setActiveStep(index);
    setActiveSubStep(0);

    // clear all substeps for this index
    setShowSubStepsForStep((prevState) => ({
      ...prevState,
      [index]: !prevState[index],
    }));
  };

  const handleNavigateHome = () => {
    forceRefresh();
    navigate("/");
  };

  useEffect(() => {
    const retrieveStepList = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get("checklist");
        const data = response.data;
        setSteps(data);

        const initialShowSubSteps = data.reduce((acc, step, index) => {
          if (step.substeps && step.substeps.length) {
            acc[index] = true;
          }
          return acc;
        }, {});

        setShowSubStepsForStep(initialShowSubSteps);

        // Set activeStep to the first uncompleted step
        const firstUncompletedStepIndex = data.findIndex(
          (step) => !step.completed
        );
        if (firstUncompletedStepIndex !== -1) {
          setActiveStep(firstUncompletedStepIndex);
        }

        setLoading(false);
      } catch (error) {
        console.error("Failed to retrieve steps data:", error);
        setError(error);
        setLoading(false);
      }
    };

    retrieveStepList();
  }, []);

  return (
    <HeroContent maxWidth="md" component="main">
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div>Error: {error.message}</div>
      ) : (
        <>
          <Typography
            component="h1"
            variant="h2"
            align="center"
            color="textPrimary"
            gutterBottom
          >
            Setup Checklist
          </Typography>
          <Typography
            variant="h5"
            align="center"
            color="textSecondary"
            component="p"
          >
            Follow these steps to set up the mcrm-frontend application
          </Typography>
          <Divider />
          <Container>
            <Stepper activeStep={activeStep} orientation="vertical">
              {steps.map((step, index) => (
                <Step key={index} completed={step.completed}>
                  <StepLabel>
                    <InlineContent>
                      <Box sx={{ overflow: "hidden" }}>
                        {" "}
                        {/* Ensure text wraps */}
                        <Typography variant="body1" gutterBottom>
                          {step.link ? (
                            <MuiLink component={RouterLink} to={step.link} color="primary">
                              {step.title}
                            </MuiLink>
                          ) : (
                            step.title
                          )}
                        </Typography>
                        {step.description && (
                          <Typography variant="body2" color="textSecondary">
                            {step.description}
                          </Typography>
                        )}
                      </Box>
                      {/* Checkbox or Button to the right */}
                      {step.substeps && step.substeps.length > 0 ? (
                        step.completed ? (
                          showSubStepsForStep[index] ? (
                            <Button
                              size="small"
                              color="primary"
                              onClick={() => hideSubTasks(index)}
                            >
                              Hide Completed Tasks
                            </Button>
                          ) : (
                            <FormControlLabel
                              control={<Checkbox checked />}
                              label="Mark as completed"
                              onClick={() => showSubTasks(index)}
                            />
                          )
                        ) : null
                      ) : (
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={step.completed}
                              onChange={() => handleCompletionToggle(index)}
                            />
                          }
                          label="Mark as completed"
                        />
                      )}
                    </InlineContent>
                  </StepLabel>
                  {showSubStepsForStep[index] && step.substeps.length > 0 && (
                    <SubSteps
                      mainIndex={index}
                      substeps={step.substeps}
                      handleToggle={handleCompletionToggle}
                      activeSubStep={activeSubStep}
                    />
                  )}
                </Step>
              ))}
            </Stepper>
            {allStepsCompleted && (
              <Box textAlign="center" marginTop={4}>
                <Typography variant="h5" color="textSecondary" component="p">
                  All set! You've completed all steps.
                </Typography>
                <ActionButton
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={handleNavigateHome}
                >
                  Continue
                </ActionButton>
              </Box>
            )}
          </Container>
        </>
      )}
    </HeroContent>
  );
};

export default ChecklistWizard;
