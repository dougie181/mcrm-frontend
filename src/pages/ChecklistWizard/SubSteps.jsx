import React from "react";
import {
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Link as MuiLink,
  Checkbox,
  FormControlLabel,
  Box,
} from "@mui/material";
import { styled } from "@mui/system";
import CustomStepIcon from "./CustomStepIcon";
import { Link as RouterLink } from 'react-router-dom';

const InlineContent = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "1fr auto", // One column for the description, one for the checkbox
  alignItems: "flex-start", // Align items to the start of the container
  gap: theme.spacing(2), // Adjust the gap between the columns
}));

const SubSteps = ({ mainIndex, substeps, handleToggle, activeSubStep }) => {
  //console.log("mainIndex: ", mainIndex, "substeps: ", substeps);

  return (
    <StepContent>
      <Stepper
        activeStep={activeSubStep}
        orientation="vertical"
        style={{ paddingLeft: 20 }}
      >
        {substeps.map((subStep, subIndex) => (
          <Step key={`${mainIndex}-${subIndex}`} completed={subStep.completed}>
            <StepLabel StepIconComponent={CustomStepIcon}>
              <InlineContent>
                <Box sx={{ overflow: "hidden" }}>
                  {" "}
                  {/* Ensure text wraps */}
                  <Typography>
                    {subStep.link ? (
                      <MuiLink component={RouterLink} to={subStep.link}>
                        {subStep.title}
                      </MuiLink>
                    ) : (
                      subStep.title
                    )}
                  </Typography>
                  {subStep.description && (
                    <Typography color="textSecondary" component="span">
                      <span
                        dangerouslySetInnerHTML={{
                          __html: subStep.description,
                        }}
                      />
                    </Typography>
                  )}
                </Box>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={subStep.completed}
                      onChange={() => handleToggle(mainIndex, subIndex)}
                    />
                  }
                  label="Mark as completed"
                />
              </InlineContent>
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </StepContent>
  );
};

export default SubSteps;
