import {
  Box,
  Button,
  Typography,
  Stepper,
  Step,
  StepButton,
  Paper,
} from "@mui/material";
import { ArrowBack, ArrowForward } from "@mui/icons-material";

const CampaignWizardNavigation = ({
  onClickBack,
  onClickNext,
  onClickCancel,
  onClickProceed,
  onClickSave,
  onStepClick,
  stepNumber,
  stepsData,
  isNextDisabled,
}) => {
  const steps = stepsData.map((step) => step.name);
  const title = stepsData[stepNumber - 1]?.title;
  const subtitle = stepsData[stepNumber - 1]?.subtitle;

  const handleStepClick = (step) => () => {
    onStepClick(step);
  };

  return (
    <Paper elevation={3} sx={{ p: 2, mt: 4, mb: 2 }}>
      <Box textAlign="center">
        <Typography variant="h6" component="div">
          {title}
        </Typography>
        <Typography variant="subtitle2" color="textSecondary" component="div">
          {subtitle}
        </Typography>

        <Box mt={2}>
          <Stepper activeStep={stepNumber - 1} alternativeLabel>
            {steps.map((label, index) => (
              <Step key={index}>
                <StepButton
                  onClick={() => {
                    //console.log("Step Clicked:", index + 1);
                    handleStepClick(index + 1)();
                  }}
                  disabled={index + 1 >= stepNumber}
                  sx={{
                    '& .MuiStepLabel-label': {
                      color: index + 1 === stepNumber ? 'primary.main' : 'text.disabled',
                      fontWeight: index + 1 === stepNumber ? 'bold' : 'normal',
                    },
                  }}
                >
                  {(index < stepNumber) && stepsData[index].label}
                </StepButton>
              </Step>
            ))}
          </Stepper>
        </Box>

        <Box mt={2} display="flex" justifyContent="center">
          {onClickCancel && (
            <Button
              variant="outlined"
              color="error"
              sx={{ mr: 2 }}
              onClick={onClickCancel}
            >
              Cancel
            </Button>
          )}
          {onClickBack && (
            <Button
              variant="outlined"
              color="primary"
              onClick={onClickBack}
              sx={{ mr: 2 }}
            >
              <ArrowBack /> Back
            </Button>
          )}
          {onClickNext && (
            <Button
              variant="contained"
              color="primary"
              onClick={onClickNext}
              sx={{ mr: 2 }}
              disabled={isNextDisabled} // Add this line
            >
              Next <ArrowForward />
            </Button>
          )}
          {onClickSave && (
            <Button
              variant="contained"
              color="secondary"
              onClick={onClickSave}
              sx={{ mr: 2 }}
            >
              Save
            </Button>
          )}
          {onClickProceed && (
            <Button
              variant="contained"
              color="primary"
              onClick={onClickProceed}
              sx={{ mr: 2 }}
            >
              Proceed
            </Button>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default CampaignWizardNavigation;