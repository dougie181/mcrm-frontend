import React, { useCallback, useState } from "react";
import {
  Button,
  Box,
  Typography,
  Snackbar,
  Container,
  Card,
  CardContent,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";
import { useDropzone } from "react-dropzone";
import CloudUploadIcon from "@mui/icons-material/CloudUpload"; // Import the icon

const QueryBuilderImport = () => {
  const navigate = useNavigate();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const onDrop = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles[0];
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          // Parse the JSON data
          const jsonData = JSON.parse(e.target.result);
  
          //console.log("jsonData:", jsonData);
          //console.log("JSON.stringify(jsonData): ", JSON.stringify(jsonData));
  
          // Make a POST request with the JSON object
          const response = await axiosInstance.post(
            "/queries/import",
            jsonData, // Send the JSON object directly
            {
              headers: {
                'Content-Type': 'application/json' // Set the Content-Type header
              }
            }
          );
  
          if (response.status === 201) {
            setSnackbarMessage("Template imported successfully!");
            setSnackbarOpen(true);
            setTimeout(() => {
              navigate("/query-builder");
            }, 2000); // Navigate back after 2 seconds
          }
        } catch (error) {
          console.error("Error reading or parsing the file:", error);
          setSnackbarMessage(
            "Error importing template. Please check the file format."
          );
          setSnackbarOpen(true);
        }
      };
      reader.readAsText(file);
    },
    [navigate]
  );
  

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    // accept: [".json", "application/json"],
    onDropAccepted: (files) => {
      // Handle accepted files
    },
    onDropRejected: (fileRejections) => {
      console.log("Rejected files:", fileRejections);
      // Handle rejected files
    },
  });

  //console.log("Accept prop:", [".json", "application/json"]);

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <Container maxWidth="md">
      <Box mt={4} mb={2} display="flex" justifyContent="space-between">
        <Typography variant="h5">Import SQL Template</Typography>
        <Button variant="outlined" onClick={() => navigate("/query-builder")}>
          Back
        </Button>
      </Box>
      <Card>
        <CardContent>
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
          >
            <Box my={2}>
              <Typography variant="body1" gutterBottom>
                Drag & drop your JSON file here or click to select one:
              </Typography>

              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                {...getRootProps()}
                mt={2}
                mb={4}
                style={{
                  border: "2px dashed #cccccc",
                  borderRadius: "4px",
                  padding: "20px",
                  textAlign: "center",
                }}
              >
                <input {...getInputProps()} />
                <CloudUploadIcon
                  style={{ fontSize: "2rem", marginBottom: "10px" }}
                />{" "}
                {/* Added the icon */}
                <Button variant="contained" color="primary" component="span">
                  Choose File
                </Button>
              </Box>
            </Box>
          </Box>
          <Snackbar
            open={snackbarOpen}
            autoHideDuration={6000}
            onClose={handleCloseSnackbar}
            message={snackbarMessage}
          />
        </CardContent>
      </Card>
    </Container>
  );
};

export default QueryBuilderImport;
