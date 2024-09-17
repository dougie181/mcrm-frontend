import React, { useState, useEffect } from "react";
import { Typography, Container, Button, Box } from "@mui/material";
import { Snackbar, Alert } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import axiosInstance from "../../services/axiosInstance";
import { useLocation } from "react-router-dom";


import {
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Card,
  CardContent,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const StartImport = () => {
  const [file, setFile] = useState(null);
  const [type, setType] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [description, setDescription] = useState("");
  const [types, setTypes] = useState([]);

  const navigate = useNavigate();
  const location = useLocation();

  const autoProcessFiles = false;

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const response = await axiosInstance.get("lookup_values/file_import_docs");
        setTypes(response.data);
        updateDropdown(response.data);
      } catch (error) {
        console.error("Error fetching types:", error);
      }
    };

    const updateDropdown = async (fetchedTypes) => {
      const searchParams = new URLSearchParams(location.search);
      const typeFromUrl = searchParams.get("type");

      const matchedType = fetchedTypes.find((t) => t.name === typeFromUrl);
      if (matchedType) {
        setType(matchedType.name);
        setDescription(matchedType.description);
      }
    };

    fetchTypes();
  }, [location.search]);

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
  };

  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      showSnackbar("Please select a file to upload.", "warning");
      return;
    }
  
    // Convert the current date to UTC using toISOString
    const dateToUTCStr = (date) => {
      return new Date(date).toISOString(); // UTC formatted date string
    };
  
    const formData = new FormData();
    formData.append("file", file);
    formData.append("status", "uploading");
    formData.append("source", "webApp");
    formData.append("type", type);
    
    // Send the date in UTC format
    formData.append("date", dateToUTCStr(new Date())); 
    
    let documentID = 0;
    try {
      const uploadResponse = await axiosInstance.post(
        "/import_history/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      documentID = uploadResponse.data.id;
      const importHistoryId = uploadResponse.data.id; // Assume you've returned this ID from the backend
      showSnackbar("File uploaded successfully!", "success");
      if (autoProcessFiles) {
        const processResponse = await axiosInstance.post(
          `/import_history/${importHistoryId}/process`
        );
        console.log("Processing response:", processResponse.data);
      }
      // Navigating back after successful upload.
      navigate(-1);
    } catch (error) {
      try {
        // Change the URL below to match your Flask API endpoint for deleting records
        const response = await axiosInstance.delete(
          `/import_history/${documentID}`
        );
  
        console.log("Delete response:", response.data);
      } catch (error) {
        let errorMessage = "Error deleting the file.";
        showSnackbar(errorMessage, "error");
      }
      // Clear the file input
      setFile(null);
  
      let errorMessage = "Error uploading and processing file.";
  
      // Check if there are specific error details from the server
      if (error.response && error.response.data && error.response.data.error) {
        errorMessage += ` Details: ${error.response.data.error}`;
      }
  
      showSnackbar(errorMessage, "error");
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setFile(event.dataTransfer.files[0]);
  };

  const handleTypeChange = (event) => {
    const selectedType = event.target.value;
    setType(selectedType);
    // Find and set the description for the selected type
    const typeInfo = types.find((type) => type.name === selectedType);
    setDescription(typeInfo ? typeInfo.description : "");
  };

  return (
    <Container maxWidth="lg">
      <Box>
        {/* Title section with Back icon */}
        <Box display="flex" alignItems="center" marginBottom={0} marginTop={2}>
          <Button variant="outlined" onClick={handleBackClick}>
            Back
          </Button>
        </Box>

        <Card>
          <CardContent>
            <Box>
              <Typography variant="h4" gutterBottom>
                Upload your file
              </Typography>
              <Typography variant="body1" gutterBottom>
                Please drag and drop or choose the Hub24 report file to upload
                your Clients.
              </Typography>
            </Box>
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
            >
              {/* Add the dropdown option for type of import doc */}
              <Box my={2}>
                <FormControl fullWidth style={{ minWidth: 350 }}>
                  <InputLabel id="type-select-label">Type</InputLabel>
                  <Select
                    labelId="type-select-label"
                    value={type}
                    onChange={handleTypeChange}
                    label="type"
                  >
                    <MenuItem value="">
                      <em>Select type of import document</em>
                    </MenuItem>
                    {types.map((type) => (
                      <MenuItem key={type.id} value={type.name}>
                        {type.display_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ width: "50%" }}>
                {description && ( // Display the description if it's not empty
                  <Typography variant="body2" style={{ marginBottom: 20, textAlign: "center" }}>
                    <span
                      dangerouslySetInnerHTML={{
                        __html: description,
                      }}
                    />
                  </Typography>
                )}
              </Box>
              <Box
                border="dashed 2px grey"
                borderRadius="10px"
                p={4}
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                textAlign="center"
                my={4}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {file ? (
                  <Typography variant="body1" gutterBottom>
                    Selected file: {file.name}
                  </Typography>
                ) : (
                  <>
                    <CloudUploadIcon fontSize="large" />
                    <Typography variant="body1" gutterBottom my={2}>
                      Drag and drop or choose a file
                    </Typography>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileChange}
                    />
                  </>
                )}
              </Box>

              {/* Update the Process file button to be disabled until a file is uploaded and a source is chosen */}
              <Button
                variant="contained"
                color="primary"
                onClick={handleUpload}
                disabled={!file || !type}
              >
                {autoProcessFiles ? "Process" : "Upload"}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default StartImport;
