import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTheme } from "@mui/system";
import { Box, Paper, Grid, Button, Container } from "@mui/material";
import { Resizable } from "re-resizable";
import styles from "./CampaignEditor.module.css";
import axiosInstance from "../../../services/axiosInstance";
import CampaignWizardNavigation from "../Navigation/CampaignWizardNavigation";
import TemplateEditor from "../EmailTemplate/TemplateEditor";
import PlaceholderEditor from "../Placeholder/PlaceholderEditor";
import {
  UnsupportedPlaceholdersDialog,
  PlaceholderWarningDialog,
  SaveWarningDialog,
  ConfirmDeletePlaceholderDialog,
} from "./CampaignEditorDialogs";

const showPlaceholderEditorButtonText = "Show Placeholder Rules Editor <";
const hidePlaceholderEditorButtonText = "Hide Placeholder Rules Editor >";
const previousTemplateEditorWidth = "50%";

const CampaignEditor = ({ setCurrentStep, id, stepsData, stepNumber }) => {
  const theme = useTheme();
  const [template, setTemplate] = useState("");
  const [placeholders, setPlaceholders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [placeholderNames, setPlaceholderNames] = useState([]);
  const [unsupportedPlaceholders, setUnsupportedPlaceholders] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPlaceholder, setSelectedPlaceholder] = useState(null);
  const [arePlaceholdersValid, setArePlaceholdersValid] = useState(false);
  const [isTemplateSaved, setIsTemplateSaved] = useState(true);
  const [isPlaceholderDialogOpen, setIsPlaceholderDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [templateEditorWidth, setTemplateEditorWidth] = useState("100%");
  const [hasShownUnsupportedDialog, setHasShownUnsupportedDialog] =
    useState(false);
  const [showPlaceholderEditor, setShowPlaceholderEditor] = useState(false);
  
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [autoSaveInterval, setAutoSaveInterval] = useState(10);

  const templateEditorRef = useRef(null);

  useEffect(() => {
    const fetchPlaceholders = async () => {
      try {
        const {
          data: { supported, unsupported },
        } = await axiosInstance.get(`/placeholders/filtered/${id}`);
        setPlaceholders(supported);
        setUnsupportedPlaceholders(unsupported);
        setPlaceholderNames(
          supported.map((p) => p.name).sort((a, b) => a.localeCompare(b))
        );
        setSelectedPlaceholder(supported[0]);
      } catch (error) {
        console.error("Error fetching placeholders from server", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlaceholders();
  }, [id]);

  const createPlaceholder = useCallback(async (newPlaceholderName) => {
    try {
      const { data: newPlaceholder } = await axiosInstance.post(
        `/placeholders/create`,
        {
          name: newPlaceholderName,
          content_type: "static",
          value: "'Enter value here'",
        }
      );
      setPlaceholders((prev) => [...prev, newPlaceholder]);
      setPlaceholderNames((prev) =>
        [...prev, newPlaceholderName].sort((a, b) => a.localeCompare(b))
      );
      return { success: true, data: newPlaceholder };
    } catch (error) {
      console.error("Error creating new placeholder:", error);
      return {
        success: false,
        error:
          error.response?.data?.error ||
          "An error occurred while creating the placeholder.",
      };
    }
  }, []);

  const deletePlaceholder = useCallback(async () => {
    setIsDialogOpen(false);
    try {
      await axiosInstance.delete(`/placeholders/${selectedPlaceholder.id}`);
      setPlaceholders((prev) =>
        prev.filter((p) => p.id !== selectedPlaceholder.id)
      );
      setPlaceholderNames((prev) =>
        prev.filter((name) => name !== selectedPlaceholder.name)
      );
      setSelectedPlaceholder(placeholders[0]);
    } catch (error) {
      console.error("Error deleting placeholder:", error);
    }
  }, [selectedPlaceholder, placeholders]);

  const saveCampaign = useCallback(async () => {
    if (id) {
      try {
        await axiosInstance.put(`/campaigns/${id}`, { step: stepNumber + 1 });
      } catch (error) {
        console.error("Failed to save campaign:", error);
      }
    } else {
      console.log("Error: no campaign id");
    }
  }, [id, stepNumber]);

  const handleTemplateChange = useCallback((newTemplate) => {
    setTemplate(newTemplate);
  }, []);

  const handlePlaceholdersChange = useCallback((index, newRule) => {
    setPlaceholders((prev) => {
      const newPlaceholders = [...prev];
      newPlaceholders[index].rule = newRule;
      return newPlaceholders;
    });
  }, []);

  const handleNext = async () => {
    if (!arePlaceholdersValid) {
      setIsPlaceholderDialogOpen(true);
      return;
    }
    if (!isTemplateSaved) {
      setIsTemplateDialogOpen(true);
      return;
    }
    await saveCampaign();
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleStepButtonClick = (step) => {
    setCurrentStep(step);
  };

  const handleCloseUnsupportedDialog = () => {
    setHasShownUnsupportedDialog(true);
  };

  const saveTemplateBeforeToggle = async () => {
    if (templateEditorRef.current && !isTemplateSaved) {
      await templateEditorRef.current.saveTemplate();
    }
    setTemplateEditorWidth(
      showPlaceholderEditor ? "100%" : previousTemplateEditorWidth
    );
    setShowPlaceholderEditor(!showPlaceholderEditor);
  };

  const placeholderEditorWidth = `calc(100% - ${templateEditorWidth})`;

  return (
    <Container maxWidth="lg">
      <Box sx={{ flexGrow: 1, m: 3 }}>
        <CampaignWizardNavigation
          stepsData={stepsData}
          stepNumber={stepNumber}
          onClickBack={handleBack}
          onClickNext={handleNext}
          onStepClick={handleStepButtonClick}
        />

        <Grid container spacing={2} style={{ flexWrap: "nowrap" }}>
          {showPlaceholderEditor && (
            <>
              <Resizable
                enable={{ right: true }}
                size={{ width: templateEditorWidth, height: "auto" }}
                className={styles.resizableTemplateEditor}
                onResizeStop={(e, direction, ref, d) => {
                  const containerWidth = ref
                    .closest(".MuiGrid-container")
                    .getBoundingClientRect().width;
                  const newWidthPercent =
                    ((ref.offsetWidth + d.width) / containerWidth) * 100;
                  const adjustedWidth =
                    newWidthPercent > 70 ? 70 : newWidthPercent;
                  setTemplateEditorWidth(`${adjustedWidth}%`);
                }}
                minWidth="45%"
                maxWidth="70%"
              >
                <Paper
                  sx={{
                    p: 2,
                    mt: 2,
                    mr: 2,
                    ml: 2,
                    backgroundColor: theme.palette.grey[200],
                  }}
                >
                  <Box display="flex" justifyContent="flex-end">
                    <Button onClick={saveTemplateBeforeToggle}>
                      {hidePlaceholderEditorButtonText}
                    </Button>
                  </Box>
                  {!isLoading && (
                    <TemplateEditor
                      campaignId={id}
                      template={template}
                      onTemplateChange={handleTemplateChange}
                      placeholderNames={placeholderNames}
                      onTemplateSaved={setIsTemplateSaved}
                      onPlaceholdersValidated={setArePlaceholdersValid}
                      showPlaceholderEditor={showPlaceholderEditor} // Pass the state as a prop
                      autoSaveEnabled={autoSaveEnabled}
                      setAutoSaveEnabled={setAutoSaveEnabled}
                      autoSaveInterval={autoSaveInterval}
                      setAutoSaveInterval={setAutoSaveInterval}
                      ref={templateEditorRef}
                    />
                  )}
                </Paper>
              </Resizable>
              <Grid
                item
                style={{
                  flexGrow: 1,
                  flexShrink: 1,
                  flexBasis: placeholderEditorWidth,
                }}
              >
                <Paper sx={{ p: 2, backgroundColor: theme.palette.grey[200] }}>
                  {!isLoading && (
                    <PlaceholderEditor
                      id={id}
                      placeholders={placeholders}
                      onPlaceholdersChange={handlePlaceholdersChange}
                      onRuleCreate={createPlaceholder}
                      onRuleDelete={() => setIsDialogOpen(true)}
                      setSelectedPlaceholder={setSelectedPlaceholder}
                      selectedPlaceholder={selectedPlaceholder}
                    />
                  )}
                </Paper>
              </Grid>
            </>
          )}
          {!showPlaceholderEditor && (
            <Paper
              sx={{
                p: 2,
                mt: 2,
                mr: 0,
                ml: 2,
                backgroundColor: theme.palette.grey[200],
              }}
            >
              <Box display="flex" justifyContent="flex-end">
                <Button onClick={saveTemplateBeforeToggle}>
                 {showPlaceholderEditorButtonText} 
                </Button>
              </Box>
              {!isLoading && (
                <TemplateEditor
                  campaignId={id}
                  template={template}
                  onTemplateChange={handleTemplateChange}
                  placeholderNames={placeholderNames}
                  onTemplateSaved={setIsTemplateSaved}
                  onPlaceholdersValidated={setArePlaceholdersValid}
                  showPlaceholderEditor={showPlaceholderEditor} // Pass the state as a prop
                  autoSaveEnabled={autoSaveEnabled}
                  setAutoSaveEnabled={setAutoSaveEnabled}
                  autoSaveInterval={autoSaveInterval}
                  setAutoSaveInterval={setAutoSaveInterval}
                  ref={templateEditorRef}
                />
              )}
            </Paper>
          )}
        </Grid>

        <UnsupportedPlaceholdersDialog
          open={
            unsupportedPlaceholders.length > 0 && !hasShownUnsupportedDialog
          }
          handleClose={handleCloseUnsupportedDialog}
          unsupportedPlaceholders={unsupportedPlaceholders}
        />
        <ConfirmDeletePlaceholderDialog
          open={isDialogOpen}
          handleClose={() => setIsDialogOpen(false)}
          selectedPlaceholder={selectedPlaceholder}
          onDelete={deletePlaceholder}
        />
        <PlaceholderWarningDialog
          open={isPlaceholderDialogOpen}
          handleClose={() => setIsPlaceholderDialogOpen(false)}
        />
        <SaveWarningDialog
          open={isTemplateDialogOpen}
          handleClose={() => setIsTemplateDialogOpen(false)}
        />
      </Box>
    </Container>
  );
};

export default CampaignEditor;
