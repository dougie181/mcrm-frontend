import React, { useState, useEffect, useRef } from "react";
import CampaignWizardNavigation from "../Navigation/CampaignWizardNavigation";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Typography,
  Container,
  Grid,
  FormControl,
  FormHelperText,
  InputLabel,
  OutlinedInput,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
} from "@mui/material";
import axiosInstance from "../../../services/axiosInstance";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";

const placeholders = [
  { value: "{{clients_preferredFirstName}}", label: "Preferred first name" },
  { value: "{{clients_contactPersonFirstName}}", label: "First name" },
  { value: "{{clients_contactPersonSurname}}", label: "Surname" },
  // add more placeholders as needed
];

const SelectClients = ({
  stepsData,
  setCurrentStep,
  id,
  setId,
  stepNumber,
}) => {
  const [campaignName, setCampaignName] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [validationError, setValidationError] = useState(null);
  const [validationSubjectError, setValidationSubjectError] = useState(null);
  const [emailSubjectCharCount, setEmailSubjectCharCount] = useState(0);
  const [selectedPlaceholder, setSelectedPlaceholder] = useState("");
  const [campaignType, setCampaignType] = useState("");
  const [bcc, setBCC] = useState(true);
  const [defaultCampaignSubject, setDefaultCampaignSubject] = useState("");
  const [campaignTypeOptions, setCampaignTypeOptions] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [campaignDescription, setCampaignDescription] = useState("");

  const navigate = useNavigate();
  const emailSubjectRef = useRef(null);

  useEffect(() => {
    const fetchDefaultSettings = async () => {
      const keys = ["email_subject_default", "campaign_type_default"];

      let subject = "";
      let from_email = "";
      let campaign_type = "";

      try {
        const response = await axiosInstance.post("/settings/get-settings", {
          keys,
        });
        const settings = response.data;
        subject = settings.email_subject_default.value;
        setDefaultCampaignSubject(() => subject);
        campaign_type = settings.campaign_type_default.value;
        setCampaignTypeOptions(settings.campaign_type_default.options || []);
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
      return { subject, from_email, campaign_type };
    };

    const fetchCampaignData = async (defaults) => {
      if (id === null) {
        setEmailSubject(defaults.subject);
        setBCC(true);
        setCampaignType(defaults.campaign_type);
        return null;
      }
      const response = await axiosInstance.get(`/campaigns/${id}`);
      const campaignData = response.data;

      // Change #333 - Duplicating campaign will have a name "New Campaign" so we need to clear the name field
      if (campaignData.name.trim().toLowerCase() == "New Campaign".toLowerCase()) {
        setCampaignName("");
      } else { 
        setCampaignName(campaignData.name);
      }

      setCampaignType(campaignData.type);

      // Use the default values if the specific fields are not found in the campaign data
      setEmailSubject(campaignData.subject || defaults.subject);
      setPreviewText(campaignData.preview_text || "");
      setBCC(campaignData.sendto_bcc === 1 || false);

      // Set the campaign description if it exists
      setCampaignDescription(campaignData.description || "");
    };

    // Fetch default settings first, then campaign data
    fetchDefaultSettings().then((defaults) => {
      fetchCampaignData(defaults);
    });
  }, [id]);

  const handleCampaignNameChange = (event) => {
    setCampaignName(event.target.value);
    setValidationError(null);  // Clear validation error as user starts typing
  };

  const checkCampaignNameExists = async (name, campaignId = null) => {
    try {
      const response = await axiosInstance.get(`/campaigns/check-name?name=${name}${campaignId ? `&campaign_id=${campaignId}` : ""}`);
      return response.data.exists;
    } catch (error) {
      console.error("Error checking campaign name:", error);
      return false;
    }
  };

  // Change #171 - Add a test if campaign Subject is not blank and not the default value :-)
  const validateCampaignSubject = async () => {
    if (emailSubject.trim() === "" || emailSubject === defaultCampaignSubject) {
      setValidationSubjectError(
        "Campaign subject cannot be blank or the default value."
      );
      return false;
    }
    setValidationSubjectError(null);
    return true;
  };

  // Change #333 - Add a test if campaign Name is "New Campaign"
  const validateCampaignName = async () => {
    const currentCampaignName = campaignName.trim().toLowerCase();
  
    if (currentCampaignName === "") {
      setValidationError("Campaign name cannot be blank. Please enter a campaign name.");
      return false;
    }
  
    if (currentCampaignName === "New Campaign".toLowerCase()) {
      setValidationError("Campaign name cannot be left as default. Please enter a new campaign name.");
      return false;
    }
  
    // Check if the campaign name already exists, but pass the current campaign ID to exclude it from the check
    const nameExists = await checkCampaignNameExists(campaignName, id);
    if (nameExists) {
      setValidationError("A campaign with this name already exists. Please choose a different name.");
      return false;
    }
  
    setValidationError(null);
    return true;
  };

  const handleNext = async () => {
    if (!bcc) {
      setOpenDialog(true);
      return;
    }
    proceedToNextStep();
  };

  const handleCancel = () => {
    navigate("/campaigns");
  };

  const handleStepButtonClick = (step) => {
    setCurrentStep(step);
  };

  const proceedToNextStep = async () => {
    // Validate the campaign name and subject before proceeding
    if (!(await validateCampaignName())) return;
    if (!(await validateCampaignSubject())) return;

    await saveCampaign();
    setCurrentStep((prevStep) => prevStep + 1);
  };

  const saveCampaign = async () => {
    const campaignData = {
      name: campaignName,
      status: "draft",
      step: stepNumber + 1,
      subject: emailSubject,
      preview_text: previewText,
      description: campaignDescription,
      sendto_bcc: bcc ? 1 : 0,
    };

    if (id) {
      await axiosInstance.put(`/campaigns/${id}`, campaignData);
    } else {
      const response = await axiosInstance.post("/campaigns/", campaignData);
      setId(response.data.id);
    }
  };

  const insertAtCursor = (myField, myValue) => {
    //IE Support
    if (document.selection) {
      myField.focus();
      let sel = document.selection.createRange();
      sel.text = myValue;
    }
    // Firefox and others
    else if (myField.selectionStart || myField.selectionStart === 0) {
      let startPos = myField.selectionStart;
      let endPos = myField.selectionEnd;
      myField.value =
        myField.value.substring(0, startPos) +
        myValue +
        myField.value.substring(endPos, myField.value.length);
      myField.selectionStart = startPos + myValue.length;
      myField.selectionEnd = startPos + myValue.length;
    } else {
      myField.value += myValue;
    }
  };

  const handleEmailSubjectChange = (event) => {
    const newSubject = event.target.value;
    if (newSubject.length <= 150) {
      setEmailSubject(newSubject);
      setEmailSubjectCharCount(newSubject.length);
    }
    setValidationSubjectError(null);
  };

  const handlePlaceholderInsert = (placeholder) => {
    const originalCursorPosition = emailSubjectRef.current.selectionStart;

    // Insert the placeholder at the cursor position
    insertAtCursor(emailSubjectRef.current, placeholder);

    // Update the email subject state
    handleEmailSubjectChange({
      target: { value: emailSubjectRef.current.value },
    });

    // Refocus on the subject field and set the cursor position
    setTimeout(() => {
      emailSubjectRef.current.focus();

      // Move the cursor forward by the length of the placeholder string
      const newPos = originalCursorPosition + placeholder.length;
      emailSubjectRef.current.selectionStart = newPos;
      emailSubjectRef.current.selectionEnd = newPos;
      setSelectedPlaceholder("");
    }, 0);
  };

  return (
    <Container maxWidth="lg">
      <Box textAlign="center" my={4}>
        <CampaignWizardNavigation
          stepsData={stepsData}
          stepNumber={stepNumber}
          onClickCancel={handleCancel}
          onClickNext={handleNext}
          onStepClick={handleStepButtonClick}
        />

        <Box mt={4} sx={{ width: "100%" }}>
          <Typography variant="h6">Campaign Information</Typography>
          <Grid mt={2} container spacing={2} alignItems="center">
            <Grid item xs={6}>
              <FormControl
                fullWidth
                variant="outlined"
                error={!!validationError}
              >
                <InputLabel htmlFor="campaign-name">Campaign Name</InputLabel>
                <OutlinedInput
                  id="campaign-name"
                  value={campaignName}
                  onChange={handleCampaignNameChange}
                  label="Campaign Name"
                />
                {validationError && (
                  <FormHelperText>{validationError}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={3}>
              <FormControl fullWidth>
                <InputLabel id="campaign-type-label">Campaign Type</InputLabel>
                <Select
                  labelId="campaign-type-label"
                  id="campaign-type-select"
                  value={campaignType}
                  label="Campaign Type"
                  onChange={(e) => setCampaignType(e.target.value)}
                >
                  {campaignTypeOptions.map((option) => (
                    <MenuItem key={option.key} value={option.key}>
                      {option.value}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={3}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={bcc}
                    onChange={(e) => setBCC(e.target.checked)}
                    name="bccID"
                  />
                }
                label="BCC external system"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth variant="outlined">
                <InputLabel htmlFor="campaign-description">
                  Campaign Description (Optional)
                </InputLabel>
                <OutlinedInput
                  id="campaign-description"
                  value={campaignDescription}
                  onChange={(event) =>
                    setCampaignDescription(event.target.value)
                  }
                  label="Campaign Description (Optional)"
                  multiline
                  rows={4}
                />
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={10}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel htmlFor="email-subject">
                      Email Subject
                    </InputLabel>
                    <OutlinedInput
                      id="email-subject"
                      value={emailSubject}
                      onChange={handleEmailSubjectChange}
                      label="Email Subject"
                      error={!!validationSubjectError}
                      inputRef={emailSubjectRef}
                    />
                    <FormHelperText
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      {validationSubjectError && (
                        <span>{validationSubjectError}</span>
                      )}
                      {!validationSubjectError && <span>&nbsp;</span>}
                      {150 - emailSubjectCharCount} characters remaining
                    </FormHelperText>
                  </FormControl>
                </Grid>
                <Grid item xs={2}>
                  <FormControl variant="outlined" fullWidth>
                    <InputLabel id="placeholders-label">
                      Insert Placeholder
                    </InputLabel>
                    <Select
                      labelId="placeholders-label"
                      label="Insert Placeholder"
                      id="placeholders"
                      value={selectedPlaceholder}
                      onChange={(e) => {
                        handlePlaceholderInsert(e.target.value);
                      }}
                    >
                      {placeholders.map((placeholder, index) => (
                        <MenuItem key={index} value={placeholder.value}>
                          {placeholder.label}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText style={{ textAlign: "right" }}>
                      &nbsp;
                    </FormHelperText>
                  </FormControl>
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth variant="outlined">
                <InputLabel htmlFor="email-preview-text">
                  Email Preview Text (Optional)
                </InputLabel>
                <OutlinedInput
                  id="email-preview-text"
                  value={previewText}
                  onChange={(event) => setPreviewText(event.target.value)}
                  label="Email Preview Text (optional)"
                  endAdornment={
                    previewText ? (
                      <IconButton
                        size="small"
                        onClick={() => setPreviewText("")}
                        edge="end"
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    ) : null
                  }
                />
              </FormControl>
            </Grid>
          </Grid>
        </Box>
      </Box>
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Proceed without BCC?</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            You have not selected BCC external system. Are you sure you want to
            proceed without it?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={() => {
              setOpenDialog(false);
              proceedToNextStep();
            }}
            autoFocus
          >
            Proceed
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SelectClients;
