import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Container,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  CircularProgress,
  Backdrop,
} from "@mui/material";
import CampaignWizardNavigation from "./Navigation/CampaignWizardNavigation";
import axiosInstance from "../../services/axiosInstance";
import { useSnackbar } from '../../context/SnackbarContext';

const Preview = ({ stepsData, setCurrentStep, id, stepNumber }) => {
  const [emailHtml, setEmailHtml] = useState("");
  const [components, setComponents] = useState({ headers: [], footers: [] });
  const [selectedHeader, setSelectedHeader] = useState(null);
  const [selectedFooter, setSelectedFooter] = useState(null);
  const [previewSize, setPreviewSize] = useState("desktop"); // 'mobile' or 'desktop'
  const [sending, setSending] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [attachments, setAttachments] = useState([]);
  const { showSnackbar } = useSnackbar();
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false); // State to track if data loading is complete

  useEffect(() => {
    // Fetch the email components (headers and footers) when the component mounts
    const fetchEmailComponents = async () => {
      try {
        const response = await axiosInstance.get("/email_components/");
        const headers = response.data.filter(
          (component) => component.type === "header"
        );
        const footers = response.data.filter(
          (component) => component.type === "footer"
        );
        return { headers, footers };
      } catch (error) {
        console.error("Error fetching email components:", error);
      }
    };

    const fetchCampaignData = async () => {
      if (id === null) {
        setEmailSubject("Test Email");
        return null;
      }
      const response = await axiosInstance.get(`/campaigns/${id}`);
      const campaignData = response.data;
      setEmailSubject(campaignData.subject || "Test Email");
    };

    const fetchCurrentComponents = async () => {
      try {
        const response = await axiosInstance.get(
          `/campaign_email_templates/${id}`
        );
        const { header_file, footer_file } = response.data;
        return { header_file, footer_file };
      } catch (error) {
        console.error("Error fetching current email components:", error);
      }
    };

    const fetchAttachments = async () => {
      try {
        const response = await axiosInstance.get(`/campaign_attachments/${id}/attachments`);
        setAttachments(response.data);
      } catch (error) {
        console.error("Error fetching attachments:", error);
      }
    };

    const initializeData = async () => {
      try {
        await fetchCampaignData();
        await fetchAttachments();
        const { header_file, footer_file } = await fetchCurrentComponents();
        const { headers, footers } = await fetchEmailComponents();

        setComponents({ headers, footers });

        if (header_file) {
          setSelectedHeader(
            headers.find((header) => header.file_name === header_file)
          );
        } else {
          const defaultHeader = headers.find((header) => header.default);
          setSelectedHeader(defaultHeader);
        }

        if (footer_file) {
          setSelectedFooter(
            footers.find((footer) => footer.file_name === footer_file)
          );
        } else {
          const defaultFooter = footers.find((footer) => footer.default);
          setSelectedFooter(defaultFooter);
        }

        setDataLoaded(true); // Mark data as loaded

      } catch (error) {
        console.error("Error initializing data:", error);
      }
    };

    initializeData();
  }, [id]);

  useEffect(() => {
    const fetchEmailHtml = async () => {
      try {
        const response = await axiosInstance.get(
          `/campaign_email_templates/full-template/${id}`
        );
        setEmailHtml(response.data);
      } catch (error) {
        console.error("Error fetching email preview:", error);
      }
    };

    if (selectedHeader && selectedFooter) {
      fetchEmailHtml();
    }
  }, [id, selectedHeader, selectedFooter]);

  useEffect(() => {
    if (dataLoaded) {
      updateEmailTemplateComponents(); // Call this once all data is loaded
    }
  }, [dataLoaded]); // This effect runs after all data has been loaded

  const handlePreviewSizeChange = (size) => {
    setPreviewSize(size);
  };

  const handleComponentChange = (event, type) => {
    const { value } = event.target;
    if (type === "header") {
      setSelectedHeader(
        components.headers.find((header) => header.component_id === value)
      );
    } else {
      setSelectedFooter(
        components.footers.find((footer) => footer.component_id === value)
      );
    }
    setIsButtonDisabled(false); // Enable button on input change
  };

  const updateEmailTemplateComponents = async () => {
    if (selectedHeader && selectedFooter) {
      try {
        await axiosInstance.put(`/campaign_email_templates/${id}`, {
          header_file: selectedHeader.file_name,
          footer_file: selectedFooter.file_name,
        });

        const response = await axiosInstance.get(
          `/campaign_email_templates/full-template/${id}`
        );
        setEmailHtml(response.data);
        setIsButtonDisabled(true); // Disable button after applying changes
      } catch (error) {
        console.error("Error updating email template components:", error);
      }
    }
  };

  const sendEmailHandler = async () => {
    setSending(true);

    const formData = new FormData();
    formData.append("to", "");
    formData.append("subject", emailSubject);
    formData.append("content", emailHtml);
    formData.append("test_email", true);
    formData.append("campaign_id", id);

    // Convert the campaign attachments into a structure understood by the backend API
    const attachmentsJson = JSON.stringify(
      attachments.map((attachment) => ({
        name: attachment.name,
        file_name: attachment.file_name,
        type: attachment.type, // assuming `type` is available and needed
      }))
    );

    formData.append("attachments", attachmentsJson);

    try {
      const response = await axiosInstance.post("/email", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      });

      if (response.status === 200 || response.status === 201) {
        showSnackbar("Email sent successfully!", "success");
      } else {
        showSnackbar("Error sending email. Please try again.", "error");
      }
    } catch (error) {
      console.log("error: ", error.response.data.details)
      showSnackbar("Failed to send email. - " + error.response?.data?.details, "error");
    } finally {
      setSending(false);
    }
  };

  const saveCampaign = async () => {
    const newData = {
      status: "ready",
      step: stepNumber + 1,
    };

    if (id) {
      await axiosInstance.put(`/campaigns/${id}`, newData);
    } else {
      console.log("error: no campaign id");
    }
  };

  const handleNext = async () => {
    try {
      await saveCampaign();
      setCurrentStep((prevStep) => prevStep + 1);
    } catch (error) {
      console.error("Failed to save campaign:", error);
    }
  };

  const handleBack = () => {
    setCurrentStep((prevStep) => prevStep - 1);
  };

  const handleStepButtonClick = (step) => {
    setCurrentStep(step);
  };

  const previewStyles = {
    height: "600px",
    width: previewSize === "mobile" ? "375px" : "100%", // 375px is a common width for mobile emails
    border: "1px solid #E0E0E0", // A light grey border to mimic an email client's borders
    boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)", // Soft shadow to lift the element off the page
    backgroundColor: "#FFF", // White background for the email content
    transition: "width 0.3s",
  };

  // Setting width based on the current state (desktop or mobile view)
  if (previewSize === "mobile") {
    previewStyles.width = "525px"; // typical width of a mobile device
  } else {
    previewStyles.width = "100%"; // full width for desktop view
  }

  return (
    <Container maxWidth="lg">
      <Backdrop open={sending} sx={{ zIndex: 1500 }}>
        <CircularProgress color="inherit" />
      </Backdrop>
      <Box textAlign="center" my={4}>
        <CampaignWizardNavigation
          stepsData={stepsData}
          stepNumber={stepNumber}
          onClickBack={handleBack}
          onClickNext={handleNext}
          onStepClick={handleStepButtonClick}
        />
        <Paper>
          <Box
            mt={2}
            mb={4}
            display="flex"
            justifyContent="center"
            alignItems="center"
          >
            <FormControl style={{ marginRight: "10px" }}>
              <InputLabel>Header</InputLabel>
              <Select
                label="Header"
                value={selectedHeader ? selectedHeader.component_id : ""}
                onChange={(event) => handleComponentChange(event, "header")}
              >
                {components.headers.map((header) => (
                  <MenuItem
                    key={header.component_id}
                    value={header.component_id}
                  >
                    {header.name}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                Select a header that matches your email's theme.
              </FormHelperText>
            </FormControl>
            <FormControl>
              <InputLabel>Footer</InputLabel>
              <Select
                label="Footer"
                value={selectedFooter ? selectedFooter.component_id : ""}
                onChange={(event) => handleComponentChange(event, "footer")}
              >
                {components.footers.map((footer) => (
                  <MenuItem
                    key={footer.component_id}
                    value={footer.component_id}
                  >
                    {footer.name}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                Choose a footer that contains your contact information.
              </FormHelperText>
            </FormControl>
            <Button
              variant="contained"
              onClick={updateEmailTemplateComponents}
              style={{ marginLeft: "10px" }}
              disabled={isButtonDisabled}
            >
              Apply & Preview
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={sendEmailHandler}
              style={{ marginLeft: "10px" }}
              disabled={sending}
            >
              {sending ? "Sending..." : "Send Test Email"}
            </Button>
          </Box>
          <Box mt={2} mb={0} display="flex" justifyContent="center">
            <Button
              variant="contained"
              onClick={() => handlePreviewSizeChange("desktop")}
              disabled={previewSize === "desktop"}
            >
              Desktop View
            </Button>
            <Button
              variant="contained"
              onClick={() => handlePreviewSizeChange("mobile")}
              style={{ marginLeft: "10px" }}
              disabled={previewSize === "mobile"}
            >
              Mobile View
            </Button>
          </Box>
          <Box p={2} display="flex" justifyContent="center">
            <iframe
              key={previewSize}
              title="Email Preview"
              srcDoc={emailHtml}
              style={previewStyles}
              sandbox="allow-same-origin allow-scripts"
            />
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Preview;