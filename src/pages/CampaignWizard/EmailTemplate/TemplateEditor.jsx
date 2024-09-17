import React, { useState, useCallback, useEffect, useRef, Suspense, lazy, forwardRef, useImperativeHandle } from "react";
import CustomEditor from "ckeditor5-custom-build";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Paper,
  Snackbar,
  Alert,
  CircularProgress,
  Backdrop,
  FormControlLabel,
  Switch,
  InputAdornment,
  Menu,
  MenuItem,
  useMediaQuery,
  IconButton
} from "@mui/material";
import { Check, Close } from '@mui/icons-material';
import axiosInstance from "../../../services/axiosInstance";
import beautify from "js-beautify";

const CKEditor = lazy(() =>
  import('@ckeditor/ckeditor5-react').then(module => ({ default: module.CKEditor }))
);

const DefaultEditorConfig = {
  placeholderConfig: {
    types: [],
  },
};

const CopyTemplateDialog = ({ open, handleClose, templateName, setTemplateName, handleCreate }) => {
  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Duplicate template and placeholder rules</DialogTitle>
      <DialogContent>
        <DialogContentText>Please enter the template name.</DialogContentText>
        <TextField
          autoFocus
          margin="dense"
          label="Template Name"
          type="text"
          fullWidth
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          Cancel
        </Button>
        <Button onClick={handleCreate} color="primary">
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const ValidationDialog = ({ open, handleClose, missingPlaceholders }) => {
  return (
    <Dialog
      open={open}
      onClose={handleClose}
    >
      <DialogTitle>Missing Placeholders</DialogTitle>
      <DialogContent>
        <DialogContentText>
          The following placeholders are missing or unavailable:
        </DialogContentText>
        <ul>
          {missingPlaceholders.map((placeholder, index) => (
            <li key={index}>{placeholder}</li>
          ))}
        </ul>
        <DialogContentText>
          Please remove them from the email content before proceeding.
        </DialogContentText>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const TemplateEditor = forwardRef(({
  campaignId,
  placeholderNames,
  onTemplateSaved,
  onPlaceholdersValidated,
  showPlaceholderEditor,
  autoSaveEnabled,
  setAutoSaveEnabled,
  autoSaveInterval,
  setAutoSaveInterval,
}, ref) => {
  const [id, setId] = useState(1);
  const [templateName, setTemplateName] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [hasChanged, setHasChanged] = useState(false);
  const [missingPlaceholders, setMissingPlaceholders] = useState([]);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [isValidationDialogOpen, setIsValidationDialogOpen] = useState(false);
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);
  const [alertSeverity, setAlertSeverity] = useState("success");
  const [isSaving, setIsSaving] = useState(false);
  const [contentLoaded, setContentLoaded] = useState(false);

  const editorRef = useRef(null);
  const contentRef = useRef("");
  const saveTimeoutRef = useRef(null);

  const [anchorEl, setAnchorEl] = useState(null);
  const [tempAutoSaveInterval, setTempAutoSaveInterval] = useState(autoSaveInterval);
  const [editingAutoSave, setEditingAutoSave] = useState(false);

  const isSmallScreen = useMediaQuery((theme) => theme.breakpoints.down('sm')) || showPlaceholderEditor;

  const EditorConfig = {
    ...DefaultEditorConfig,
    placeholderConfig: {
      types: placeholderNames,
    },
  };

  const handleDuplicateTemplate = async () => {
    try {
      await axiosInstance.post(
        `/campaigns/${campaignId}/copy_to_main_template`,
        {
          template_name: templateName,
          description: "Duplicated from campaign",
        }
      );
      setAlertMessage("Template duplicated successfully!");
      setAlertSeverity("success");
      setOpenSnackbar(true);
    } catch (error) {
      console.error("Failed to duplicate template", error);
      setAlertMessage("Failed to duplicate the template.");
      setAlertSeverity("error");
      setOpenSnackbar(true);
    }
    setIsCopyDialogOpen(false);
  };

  const validatePlaceholders = useCallback(() => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(contentRef.current, 'text/html');
    const placeholderElements = doc.querySelectorAll('span.placeholder');
    const extractedNames = Array.from(placeholderElements).map((el) =>
      el.textContent.replace(/[{}]/g, '')
    );

    const missing = extractedNames.filter(
      (name) => !placeholderNames.includes(name)
    );

    onPlaceholdersValidated(missing.length === 0);

    return missing;
  }, [placeholderNames, onPlaceholdersValidated]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const fetchHTML = async () => {
      try {
        const response = await axiosInstance.get(`/campaign_email_templates/template/${campaignId}`);
        contentRef.current = response.data;
        setContentLoaded(true);
      } catch (error) {
        console.error('Failed to fetch HTML', error);
      }
    };

    fetchHTML().then(() => {
      validatePlaceholders();
    });
  }, [campaignId, validatePlaceholders]);

  useEffect(() => {
    const currentContent = editorRef.current?.getData();
    contentRef.current = currentContent || "";
    setId((prevId) => prevId + 1);
  }, [placeholderNames]);

  const handleEditorChange = (event, editor) => {
    const newData = editor.getData();
    if (newData !== contentRef.current) {
      setHasChanged(true);
      onTemplateSaved(false);
      contentRef.current = newData;
  
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);  // Clear the existing timeout
      }
  
      if (autoSaveEnabled) {
        saveTimeoutRef.current = setTimeout(saveTemplate, autoSaveInterval * 1000);  // Set a new timeout
      }
    }
  };

  const saveTemplate = async () => {
    setIsSaving(true);
    try {
      const convertedContent = contentRef.current.replace(/&nbsp;/g, " ");

      const styledContent = beautify.html(convertedContent);
      await axiosInstance.put(
        `/campaign_email_templates/template/${campaignId}`,
        {
          html: styledContent,
        }
      );
      setHasChanged(false);
      onTemplateSaved(true);
      validatePlaceholders();
      setTimeout(() => {
        setIsSaving(false);
      }, 1000);
    } catch (error) {
      console.error("Failed to save HTML", error);
      setIsSaving(false);
    }
  };

  useImperativeHandle(ref, () => ({
    saveTemplate,
  }));

  const cleanupTagsHandler = () => {
    if (editorRef.current) {
      const currentContent = editorRef.current.getData();

      const parser = new DOMParser();
      const doc = parser.parseFromString(currentContent, 'text/html');

      const processNode = (node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.tagName === 'SPAN' && node.classList.contains('placeholder')) {
            return;
          }

          const stylesToKeep = ['line-height', 'margin', 'text-align', 'color', 'font-family', 'font-size'];
          let style = node.getAttribute('style');

          if (style) {
            const styleRules = style.split(';').reduce((acc, rule) => {
              const [property, value] = rule.split(':').map(part => part.trim());
              if (stylesToKeep.includes(property)) {
                acc[property] = value;
              }
              return acc;
            }, {});

            const newStyle = Object.entries(styleRules).map(([property, value]) => `${property}: ${value}`).join('; ');
            node.setAttribute('style', newStyle);
          }

          if (!node.classList.contains('placeholder')) {
            node.removeAttribute('class');
          }
        }
      };

      const walkTheDOM = (node, func) => {
        func(node);
        node = node.firstChild;
        while (node) {
          walkTheDOM(node, func);
          node = node.nextSibling;
        }
      };

      walkTheDOM(doc.body, processNode);

      const cleanedContent = Array.from(doc.body.childNodes).map(node => node.outerHTML).join('');

      editorRef.current.setData(cleanedContent);
      contentRef.current = cleanedContent;
    }
  };

  const onValidatePlaceholderHandler = () => {
    const missing = validatePlaceholders();
    if (missing.length > 0) {
      setMissingPlaceholders(missing);
      setIsValidationDialogOpen(true);
    } else {
      setAlertMessage("All placeholders are valid.");
      setAlertSeverity("success");
      setOpenSnackbar(true);
    }
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAutoSaveChange = () => {
    setAutoSaveInterval(tempAutoSaveInterval);
    setEditingAutoSave(false);
  };

  const handleCancelAutoSaveChange = () => {
    setTempAutoSaveInterval(autoSaveInterval);
    setEditingAutoSave(false);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Paper>
        <Box
          display="flex"
          justifyContent="space-between"
          m={2}
          pt={2}
          gap={2}
          mt={3}
        >
          {!isSmallScreen && (
            <Box display="flex" alignItems="center">
              <FormControlLabel
                control={
                  <Switch
                    checked={autoSaveEnabled}
                    onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                  />
                }
                label={autoSaveEnabled ? "Auto save every" : "Auto save off"}
              />
              {autoSaveEnabled && !editingAutoSave && (
                <Box display="flex" alignItems="center">
                  <TextField
                    type="number"
                    value={autoSaveInterval}
                    onClick={() => setEditingAutoSave(true)}
                    sx={{ width: 78, ml: 1 }}
                    inputProps={{ min: 1 }}
                    variant="standard"
                    InputProps={{
                      endAdornment: <InputAdornment position="end">sec</InputAdornment>
                    }}
                  />
                </Box>
              )}
              {autoSaveEnabled && editingAutoSave && (
                <Box display="flex" alignItems="center">
                  <TextField
                    type="number"
                    value={tempAutoSaveInterval}
                    onChange={(e) => setTempAutoSaveInterval(Number(e.target.value))}
                    sx={{ width: 78, ml: 1 }}
                    inputProps={{ min: 1 }}
                    variant="standard"
                    InputProps={{
                      endAdornment: <InputAdornment position="end">sec</InputAdornment>
                    }}
                  />
                  <IconButton onClick={handleAutoSaveChange}>
                    <Check />
                  </IconButton>
                  <IconButton onClick={handleCancelAutoSaveChange}>
                    <Close />
                  </IconButton>
                </Box>
              )}
            </Box>
          )}
          <Box display="flex" gap={2} ml="auto">
            {isSmallScreen ? (
              <>
                <Button
                  aria-controls="simple-menu"
                  aria-haspopup="true"
                  onClick={handleMenuClick}
                >
                  ...
                </Button>
                <Menu
                  id="simple-menu"
                  anchorEl={anchorEl}
                  keepMounted
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                >
                  <MenuItem onClick={() => { cleanupTagsHandler(); handleMenuClose(); }}>Cleanup tags</MenuItem>
                  <MenuItem onClick={() => { onValidatePlaceholderHandler(); handleMenuClose(); }}>Check placeholders</MenuItem>
                  <MenuItem onClick={() => { setIsCopyDialogOpen(true); handleMenuClose(); }}>Clone as new template</MenuItem>
                </Menu>
                <Button
                  onClick={saveTemplate}
                  variant="contained"
                  color="primary"
                  disabled={!hasChanged}
                >
                  Save
                </Button>
              </>
            ) : (
              <>
                <Button onClick={cleanupTagsHandler}>Cleanup tags</Button>
                <Button onClick={onValidatePlaceholderHandler}>Check placeholders</Button>
                <Button
                  onClick={() => setIsCopyDialogOpen(true)}
                  variant="contained"
                  color="secondary"
                >
                  Clone as new template
                </Button>
                <Button
                  onClick={saveTemplate}
                  variant="contained"
                  color="primary"
                  disabled={!hasChanged}
                >
                  Save
                </Button>
              </>
            )}
          </Box>
        </Box>
        <Suspense fallback={<div>Loading...</div>}>
          {contentLoaded && (
            <CKEditor
              id={`ckeditor-${id}`}
              editor={CustomEditor}
              data={contentRef.current}
              onInit={editor => {
                editorRef.current = editor;
                editor.setData(contentRef.current);
                setHasChanged(false);
                onTemplateSaved(true);
              }}
              config={EditorConfig}
              onChange={handleEditorChange}
              onBlur={(editor) => { }}
              onFocus={(editor) => { }}
            />
          )}
        </Suspense>
      </Paper>

      <ValidationDialog
        open={isValidationDialogOpen}
        handleClose={() => setIsValidationDialogOpen(false)}
        missingPlaceholders={missingPlaceholders}
      />

      <CopyTemplateDialog
        open={isCopyDialogOpen}
        handleClose={() => setIsCopyDialogOpen(false)}
        templateName={templateName}
        setTemplateName={setTemplateName}
        handleCreate={handleDuplicateTemplate}
      />

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: "top", horizontal: "left" }}
      >
        <Alert
          onClose={() => setOpenSnackbar(false)}
          severity={alertSeverity}
          sx={{ width: "100%" }}
        >
          {alertMessage}
        </Alert>
      </Snackbar>

      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isSaving}
      >
        <CircularProgress color="inherit" />
        <Box ml={2}>Saving...</Box>
      </Backdrop>
    </Box>
  );
});

export default TemplateEditor;
