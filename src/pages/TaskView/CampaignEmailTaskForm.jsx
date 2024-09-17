import React, { useState, useRef, useEffect, Suspense, lazy } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Box,
  TextField,
  Typography,
  Paper,
  Snackbar,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Checkbox,
  Backdrop,
  CircularProgress,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import axiosInstance from "../../services/axiosInstance";
import CustomEditor from "ckeditor5-custom-build";

const CKEditor = lazy(() => 
  import('@ckeditor/ckeditor5-react').then(module => ({ default: module.CKEditor }))
);

const EditorConfig = {
  toolbar: {
    items: [
      "selectAll",
      "|",
      "undo",
      "redo",
      "|",
      "heading",
      "|",
      "alignment",
      "outdent",
      "indent",
      "bold",
      "italic",
      "underline",
      "bulletedList",
      "numberedList",
    ],
  },
  language: "en-au",
};

const CampaignEmailTaskForm = ({
  snackbar,
  handleCloseSnackbar,
  emailData,
  setEmailData,
  showError,
  showSuccess,
  showWarning,
  loading
}) => {
  const [subjectError, setSubjectError] = useState("");
  const [toError, setToError] = useState("");
  const [ccError, setCcError] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const navigate = useNavigate();

  const editorRef = useRef(null); // to hold the editor instance
  const contentRef = useRef(""); // To hold the content for saving

  useEffect(() => {
    console.log("emailData: ", emailData)
    if (editorRef.current && emailData.preferredFirstName) {
      const initialData = `Dear ${emailData.preferredFirstName},`;
      editorRef.current.setData(initialData);
    }
  }, [emailData.preferredFirstName]);

  const handleCCChange = (e) => {
    setEmailData({ ...emailData, cc: e.target.value });
  };

  const handleBCCChange = (e) => {
    console.log("sendtoBCC: ", e.target.checked)
    setEmailData({ ...emailData, sendtoBCC: e.target.checked });
  };

  const handleSubjectChange = (e) => {
    setEmailData({ ...emailData, subject: e.target.value });
  };

  const handleEditorChange = (event, editor) => {
    const data = editor.getData();
    contentRef.current = data;
  };

  const handleFileChange = (event) => {
    setAttachments([...event.target.files]);
  };

  const handleToChange = (event) => {
    setEmailData({ ...emailData, to: event.target.value });
  };
  
  // Helper function to validate a single email address
  const isValidEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  // Function to validate all email addresses entered in the 'To' or 'Cc' field
  const isValidEmailField = (input) => {
    // // check if email fields have ";" to separate different email addresses?
    // if (!input.includes(";")) {
    //   // convert them to ,'s instead
    //   input = input.replace(/,/g, ";");
    // }

    const emails = input.split(",").map((email) => email.trim());
    for (const email of emails) {
      if (!isValidEmail(email)) {
        return false;
      }
    }
    return true;
  };


  // const handleCloseDialog = () => {
  //   setDialogOpen(false);
  //   const navigate_string=`/campaign-tasks?campaignId=${emailData.campaign_id}`;
  //   navigate(navigate_string);
  // };


  const handleUpdateTask = async () => {
    try {
      if (emailData.followup_count === undefined) {
        emailData.followup_count = 0;
      }
      //const response = await axiosInstance.put(`/tasks/campaign/${taskId}`, { response: responseValue });
      await axiosInstance.put(`/tasks/campaign/${emailData.task_id}`, {
        data : {
        //follow_up_count, "last_follow_up_date" 
        followup_count: emailData.followup_count + 1,
        last_followup_date: new Date().toISOString(),
      }});
      showSuccess("Task updated successfully.");
      navigate(-1);
    } catch (error) {
      showError("Failed to update task status.");
    }
  };

  const sendEmailHandler = async () => {
    console.log("sending email...")
    setSending(true);

    // Clear previous errors
    setSubjectError("");
    setToError("");
    setCcError("");

    // Validate the form to make sure all fields are filled in and are valid
    const errors = [];
    if (!emailData.to || !isValidEmailField(emailData.to)) {
      setToError("Please enter valid 'To' email address.");
      setSending(false);
      return;
    }

    if (!emailData.subject.trim()) {
      //errors.push("Subject cannot be empty.");
      setSubjectError("Subject cannot be empty.");
      setSending(false);
      return;
    }

    if (!contentRef.current.trim()) {
      errors.push("Email content cannot be empty.");
      setSending(false);
      return;
    }

    if (emailData.cc && !isValidEmailField(emailData.cc)) {
      errors.push("Please enter a valid 'CC' email address.");
      setCcError("Please enter a valid 'CC' email address.");
      setSending(false);
      return;
    }

    // If there are any errors, display them and stop the sending process
    if (errors.length > 0) {
      errors.forEach((error) => showWarning(error));
      setSending(false);
      return;
    }

    // Validate the form to make sure all fields are filled in
    if (emailData.to === "" || emailData.subject === "") {
      showWarning("Please fill in all fields.");
      setSending(false);
      return;
    }

    // Create a FormData object to hold email data and attachments
    const formData = new FormData();
    formData.append("client_id", emailData.client_id);
    formData.append("to", emailData.to);
    formData.append("subject", emailData.subject);
    formData.append("cc", emailData.cc);
    console.log("sendtoBCC: ", emailData.sendtoBCC)
    formData.append("sendtoBCC", emailData.sendtoBCC);

    // Append the email content
    formData.append("content", contentRef.current);

    // //BCC ID is not isBcc - it is a separate field
    // if (emailData.client_id && emailData.sendtoBCC) {
    //   formData.append("bcc", emailData.client_id);
    // }
    // in fact, the work sorted is not related to emails that are not linked to clients

    // Append attachments
    attachments.forEach((attachment, index) => {
      //console.log("attachment: ", attachment)
      formData.append(`attachments[${index}]`, attachment);
    });

    try {
      const response = await axiosInstance.post("/email", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      });

      if (response.status === 200 || response.status === 201) {
        // update the task status, incrementing the followup count and last followup date
        handleUpdateTask();
        showSuccess("Email sent successfully!");

        //setDialogOpen(true); // Open the dialog to confirm task completion
      } else {
        showError("Error sending email. Please try again.");
      }
    } catch (error) {
      // Extract the error message from the response and display it in the snackbar
      const errorMessage =
        error.response?.data?.error ||
        "Failed to send email due to an unexpected error.";
      showError(errorMessage);
    } finally {
      setSending(false);
    }

    
  };

  return (
    <>
      {/* Show circular progress both during loading and sending */}
      <Backdrop open={loading || sending} sx={{ zIndex: 1500 }}>
        <CircularProgress color="inherit" />
      </Backdrop>

      <Box p={4} display="flex" flexDirection="column">
        <Box display="flex" alignItems="center" marginBottom={3}>
          <Button
            startIcon={<ArrowBackIcon />}
            variant="contained"
            color="primary"
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
          <Typography variant="h5" style={{ marginLeft: "20px" }}>
            Email Editor
          </Typography>
        </Box>

        <Paper elevation={3} sx={{ p: 2, mt: 4, mb: 2 }}>
          <Box marginBottom={2}>
            <Typography variant="subtitle1">Subject:</Typography>
            <TextField
              fullWidth
              variant="outlined"
              value={emailData.subject || ""}
              onChange={handleSubjectChange}
              error={Boolean(subjectError)}
              helperText={subjectError}
            />
          </Box>

          <Box marginBottom={2}>
            <Typography variant="subtitle1">To:</Typography>
            <TextField
              fullWidth
              variant="outlined"
              value={emailData.to || ""}
              error={Boolean(toError)}
              onChange={handleToChange}
              helperText={toError}
            />
          </Box>

          <Box marginBottom={2}>
            <Typography variant="subtitle1">CC:</Typography>
            <TextField
              fullWidth
              variant="outlined"
              value={emailData.cc || ""}
              error={Boolean(ccError)}
              onChange={handleCCChange}
              helperText={ccError}
            />
          </Box>
          { emailData.client_id && (
          <Box marginBottom={2} display="flex" alignItems="center">
            <Checkbox
              checked={emailData.sendtoBCC} // controlled from state
              onChange={handleBCCChange}
            />
            <Typography variant="subtitle1">
              BCC client record
            </Typography>
          </Box>
          )}
          <Box marginBottom={2}>
            <Typography variant="subtitle1">Content:</Typography>

            <Box
              sx={{
                minHeight: 100,
                width: "100%",
                overflow: "auto",
                border: "0px solid #d9d9d9",
                borderRadius: "4px",
              }}
            >
              {/* Need a way to show errors here if CKEditor is blank */}
              <Suspense fallback={<div>Loading...</div>}>
                <CKEditor
                  id={`1`}
                  editor={CustomEditor}
                  data={emailData.content}
                  config={EditorConfig}
                  onReady={(editor) => {
                    //console.log("Editor is ready to use!", editor);
                    editorRef.current = editor;
                  }}
                  onChange={handleEditorChange}
                  onBlur={(editor) => {
                    //console.log("Blur.", editor);
                  }}
                  onFocus={(editor) => {
                    //console.log("Focus.", editor);
                  }}
                />
              </Suspense>
            </Box>
          </Box>

          <Box marginBottom={2}>
            <Typography variant="subtitle1">Attachments:</Typography>
            <ul>
              {Array.from(attachments).map((file, index) => (
                <li key={index}>{file.name}</li>
              ))}
            </ul>
            <Button variant="outlined" component="label">
              Attach document
              <input type="file" hidden onChange={handleFileChange} />
            </Button>
          </Box>

          <Box marginTop={2}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={sendEmailHandler}
            >
              Send
            </Button>
          </Box>
        </Paper>
      </Box>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default CampaignEmailTaskForm;
