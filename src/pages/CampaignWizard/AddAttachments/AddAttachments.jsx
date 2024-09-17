import React, { useCallback, useState, useEffect } from "react";
import {
  Box,
  Typography,
  Container,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Link,
  IconButton,
} from "@mui/material";
import CampaignWizardNavigation from "../Navigation/CampaignWizardNavigation";
import { useDropzone } from "react-dropzone";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import DeleteIcon from "@mui/icons-material/Delete";
import axiosInstance from "../../../services/axiosInstance";
import { useSnackbar } from '../../../context/SnackbarContext';

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ENABLE_ONE_STEP_UPLOAD = true;

const AddAttachments = ({ stepsData, setCurrentStep, id, stepNumber }) => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [toBeUploadedFiles, setToBeUploadedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showSnackbar } = useSnackbar();

  const fetchAttachments = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await axiosInstance.get(
        `/campaign_attachments/${id}/attachments`
      );
      setUploadedFiles(res.data);
      
    } catch (err) {
        console.error(err);
        showSnackbar("An error occurred while fetching attachments. Please try again later.", "error");
    } finally {
        setIsLoading(false);
    }
  }, [id, showSnackbar]);

  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  const fileInputRef = React.createRef();

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
  
    files.forEach((file) => {
      const isDuplicate = [...uploadedFiles, ...toBeUploadedFiles].some(
        (f) => f.name === file.name
      );
  
      if (isDuplicate) {
        showSnackbar("A file with the same name has already been uploaded or is waiting to be uploaded","error");
        return; // Skip this file if it's a duplicate
      }
  
      if (file.size > MAX_FILE_SIZE) {
        showSnackbar("File is too large to send via email. Please select a smaller file.","error");
        return; // Skip this file if it's too large
      }
  
      // Directly proceed with the upload or queuing process
      if (ENABLE_ONE_STEP_UPLOAD) {
        uploadFile(file);
      } else {
        setToBeUploadedFiles((prevFiles) => [
          ...prevFiles,
          Object.assign(file, {
            preview: URL.createObjectURL(file),
          }),
        ]);
      }
    });
  };
  

  const uploadFile = useCallback(
    async (file) => {
      try {
        const formData = new FormData();
        formData.append("file", file);

        formData.append("file", file);
        formData.append("name", file.name);
        formData.append("size", file.size);
        formData.append("type", file.type);

        await axiosInstance.post(
          `/campaign_attachments/${id}/attachments/`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        setToBeUploadedFiles((prevFiles) =>
          prevFiles.filter((f) => f !== file)
        );

        fetchAttachments();
      } catch (err) {
          console.error(err);
          showSnackbar("An error occurred while uploading the file. Please try again later.", "error");
      }
    },
    [id, fetchAttachments, showSnackbar]
  );

  const deleteFile = async (fileId) => {
    try {
      await axiosInstance.delete(
        `/campaign_attachments/${id}/attachments/${fileId}`
      );
      setUploadedFiles((prevFiles) => prevFiles.filter((f) => f.id !== fileId));
    } catch (err) {
        console.error(err);
        showSnackbar("An error occurred while deleting the file. Please try again later.", "error");
    }
  };

  const onDrop = useCallback(
    (acceptedFiles) => {
      acceptedFiles.forEach((file) => {
        const isDuplicate = [...uploadedFiles, ...toBeUploadedFiles].some(
          (f) => f.name === file.name
        );

        if (isDuplicate) {
          showSnackbar("A file with the same name has already been uploaded or is waiting to be uploaded", "info"
          );
          return;
        }

        if (file.size > MAX_FILE_SIZE) {
          showSnackbar("File is too large to send via email. Please select a smaller file.", "error");
          return;
        }

        // If one-step upload is enabled, immediately upload the file
        if (ENABLE_ONE_STEP_UPLOAD) {
          uploadFile(file);
        } else {
          // If one-step upload is disabled, proceed with the two-step process
          setToBeUploadedFiles((prevFiles) => [
            ...prevFiles,
            Object.assign(file, {
              preview: URL.createObjectURL(file),
            }),
          ]);
        }
      });
    },
    [uploadedFiles, toBeUploadedFiles, uploadFile, showSnackbar]
  );

  const { getRootProps } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
  });

  const handleBack = () => {
    setCurrentStep((prevStep) => prevStep - 1);
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
    // Check if any files are still being uploaded.
    if (toBeUploadedFiles.length > 0) {
      showSnackbar("Please ensure you have uploaded all files before proceeding.", "info");
      return;
    }
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

  const handleRemove = (fileToRemove) => {
    setToBeUploadedFiles((files) =>
      files.filter((file) => file !== fileToRemove)
    );
  };

  const fileList = (files, isUploaded) => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Preview</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Size</TableCell>
            <TableCell>Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading && (
            <TableRow key="loading">
              <TableCell colSpan={4}>Loading...</TableCell>
            </TableRow>
          )}
          {!isLoading &&
            files.map((file) => (
              <TableRow key={file.name}>
                <TableCell>
                  {file.type?.startsWith("image/") ? (
                    <img
                      src={
                        isUploaded
                          ? `${import.meta.env.VITE_API_BASE_URL}/campaign_attachments/${id}/attachments/${file.id}/preview`
                          : file.preview
                      }
                      alt=""
                      style={{ height: 50 }}
                    />
                  ) : (
                    <InsertDriveFileIcon />
                  )}
                </TableCell>
                <TableCell>
                  <Link
                    href={
                      isUploaded
                        ? `${import.meta.env.VITE_API_BASE_URL}/campaign_attachments/${id}/attachments/${file.id}/preview`
                        : file.preview
                    }
                    target="_blank"
                    rel="noopener noreferrer" // Good practice for security when using target="_blank"
                  >
                    {file.name}
                  </Link>
                </TableCell>
                <TableCell>{file.size} bytes</TableCell>
                <TableCell>
                  {isUploaded ? (
                    <IconButton onClick={() => deleteFile(file.id)}>
                      <DeleteIcon />
                    </IconButton>
                  ) : (
                    <div>
                      <IconButton onClick={() => uploadFile(file)}>
                        <CloudUploadIcon />
                      </IconButton>
                      <IconButton onClick={() => handleRemove(file)}>
                        <DeleteIcon />
                      </IconButton>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Container maxWidth="lg">
      <Box textAlign="center" my={4}>
        <CampaignWizardNavigation
          stepsData={stepsData}
          stepNumber={stepNumber}
          onClickBack={handleBack}
          onClickNext={handleNext}
          onStepClick={handleStepButtonClick}
        />

        <Box mt={4}>
          <Paper>
            <Box p={2}>
              <Box
                {...getRootProps()}
                sx={{
                  height: 100,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px dashed gray",
                  borderRadius: 2,
                  mb: 2,
                }}
              >
                <Typography>Drag 'n' drop files here</Typography>
                <Button
                  variant="contained"
                  startIcon={<CloudUploadIcon />}
                  onClick={() => fileInputRef.current.click()} // Trigger file input dialog
                  sx={{ mt: 1 }}
                >
                  Or Upload Files
                </Button>

                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                  multiple // if you want to allow multiple file uploads
                />
              </Box>

              <Typography variant="h6" mt={2}>
                File to be included in the email
              </Typography>
              {uploadedFiles.length > 0 ? (
                fileList(uploadedFiles, true)
              ) : (
                <Typography variant="body1" mt={2}>
                  No uploaded files yet.
                </Typography>
              )}
              {!ENABLE_ONE_STEP_UPLOAD && (
                <>
                  <Typography variant="h6" mt={2}>
                    New files to be attachments - not included
                  </Typography>
                  {toBeUploadedFiles.length > 0 ? (
                    fileList(toBeUploadedFiles, false)
                  ) : (
                    <Typography variant="body1" mt={2}>
                      No files to be uploaded yet.
                    </Typography>
                  )}
                </>
              )}
            </Box>
          </Paper>
        </Box>
      </Box>
    </Container>
  );
};

export default AddAttachments;
