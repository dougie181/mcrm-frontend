import React, { useEffect, useState, Suspense, lazy } from "react";
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
} from "@mui/material";
import CampaignWizardNavigation from "../Navigation/CampaignWizardNavigation";
import axiosInstance from "../../../services/axiosInstance";
import CustomEditor from "ckeditor5-custom-build";

const CKEditor = lazy(() => 
  import('@ckeditor/ckeditor5-react').then(module => ({ default: module.CKEditor }))
);

const TemplateSelection = ({ stepsData, setCurrentStep, id, stepNumber }) => {
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedTemplateHTML, setSelectedTemplateHTML] = useState("");
  const [templates, setTemplates] = useState([]);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

  //console.log("TemplateSelection called");
  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const templatesResponse = await axiosInstance.get("/email_templates/");
        setTemplates(templatesResponse.data);
  
        const response = await axiosInstance.get(`/campaigns/${id}`);
        const campaignData = response.data;
  
        if (campaignData.template_id) {
          const newTemplate = {
            template_id: 9999,
            template_name: "Existing Template",
            template_file: campaignData.template_file,
            description: "Existing Template",
          };
          
          setTemplates(currentTemplates => {
            const found = currentTemplates.find(template => template.template_id === 9999);
            if (!found) {
              return [...currentTemplates, newTemplate];
            } else {
              return currentTemplates;
            }
          });
  
          setSelectedTemplate(9999);  // Set to existing template
        } else {
          setSelectedTemplate("");
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };
  
    fetchCampaign();
  }, [id]);
  
  // useEffect to fetch HTML content whenever selectedTemplate changes
  useEffect(() => {

    const fetchTemplateHTML = async (templateId) => {
      try {
        const endpoint = templateId === 9999
          ? `/campaign_email_templates/template/${id}`
          : `/email_templates/${templateId}/html`;
        const response = await axiosInstance.get(endpoint);
        setSelectedTemplateHTML(response.data);
      } catch (error) {
        console.error("Failed to fetch template HTML:", error);
      }
    };

    if (selectedTemplate) {
      fetchTemplateHTML(selectedTemplate);
    }
  }, [selectedTemplate, id]); 

  const handleTemplateChange = (event) => {
    setSelectedTemplate(event.target.value);
  };

  const copyTemplate = async () => {
    try {
      await axiosInstance.post(`/campaigns/${id}/copy_template`, {
        template_id: selectedTemplate,
      });
    } catch (error) {
      console.error("Failed to copy template:", error);
    }
  };

  const saveCampaignStep = async () => {
    const newData = {
      status: "draft",
      step: stepNumber + 1,
    };

    if (id) {
      await axiosInstance.put(`/campaigns/${id}`, newData);
    } else {
      console.log("error: no campaign id");
    }
  };

  const saveCampaign = async () => {
    const newData = {
      template_id: selectedTemplate,
      status: "draft",
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
      // Fetch current campaign data
      const response = await axiosInstance.get(`/campaigns/${id}`);
      const campaignData = response.data;

      // Check if there's already a template assigned to the campaign
      // AND if the selected template is different from the current one
      // Do not display the dialog if the existing template has been chosen
      if (selectedTemplate !== 9999 && campaignData.template_id) {
        setOpenConfirmDialog(true);
      } else {
        proceedToNext();
      }
    } catch (error) {
      console.error("Failed to fetch campaign data:", error);
    }
  };

  const proceedToNext = async () => {
    try {
      if (selectedTemplate !== 9999) {
        await copyTemplate();
        await saveCampaign();
      } else {
        await saveCampaignStep();
      }
      
      setCurrentStep((prevStep) => prevStep + 1);
    } catch (error) {
      console.error("Failed to save campaign:", error);
    }
  };

  const handleDialogClose = () => {
    setOpenConfirmDialog(false);
  };

  const handleConfirm = () => {
    setOpenConfirmDialog(false);
    proceedToNext();
  };

  const handleBack = () => {
    setCurrentStep((prevStep) => prevStep - 1);
  };

  const handleProceedWithoutOverwrite = async () => {
    setOpenConfirmDialog(false);
    try {
      await saveCampaign();
      setCurrentStep((prevStep) => prevStep + 1);
    } catch (error) {
      console.error("Failed to save campaign:", error);
    }
  };

  const handleStepButtonClick = (step) => {
    //console.log("click", step);
    setCurrentStep(step);
  };

  return (
    <Container maxWidth="lg">
      {/* Confirm Dialog */}
      <Dialog
        open={openConfirmDialog}
        onClose={handleDialogClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Confirm</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            It looks like a template for this campaign already exists. Would you like to replace the existing template, or continue without making any changes?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleConfirm} color="primary" autoFocus>
            Replace
          </Button>
          <Button onClick={handleProceedWithoutOverwrite} color="secondary">
            Continue
          </Button>
        </DialogActions>
      </Dialog>

      <Box textAlign="center" my={4}>
        <CampaignWizardNavigation
          stepsData={stepsData}
          stepNumber={stepNumber}
          onClickBack={handleBack}
          onClickNext={handleNext}
          onStepClick={handleStepButtonClick}
          isNextDisabled={!selectedTemplate}
        />

        <Box sx={{ minWidth: 120, my: 2 }}>
          <FormControl fullWidth>
            <InputLabel id="template-select-label">Select Template</InputLabel>
            <Select
              labelId="template-select-label"
              id="template-select"
              value={selectedTemplate}
              onChange={handleTemplateChange}
              label="Select Template"
            >
              {templates.map((template) => (
                <MenuItem
                  key={template.template_id}
                  value={template.template_id}
                >
                  {template.template_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Display the selected HTML template , but not if the template is None (id === 1)*/}
        <Box my={2}>
          {selectedTemplate && templates && selectedTemplate !== 1 && (
            <Suspense fallback={<div>Loading...</div>}>
              <CKEditor
                editor={CustomEditor}
                data={selectedTemplateHTML}
                config={{
                  toolbar: [], // This will remove all the toolbar buttons
                }}
                onReady={(editor) => {
                  editor.enableReadOnlyMode( 'read_only_feature-id' );
                }}
              />
            </Suspense>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default TemplateSelection;
