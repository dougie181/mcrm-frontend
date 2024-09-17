import React, { useEffect, useState, useCallback} from "react";
import {
  Box,
  Typography,
  Button,
  CardContent,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Grid,
} from "@mui/material";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import { useSnackbar } from '../../context/SnackbarContext';
/*import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
*/
import axiosInstance from "../../services/axiosInstance";

const AttachmentsTable = ({ clientId }) => {
  const [attachments, setAttachments] = useState([]);
  const { showSnackbar } = useSnackbar();

  // Function to fetch the attachments
  const fetchAttachments = useCallback(async () => {
    try {
      const response = await axiosInstance.get(
        `client_attachments/${clientId}/attachments/`
      );
      setAttachments(response.data);
    } catch (error) {
      console.error("Error fetching attachments:", error);

      let errorMessage = "Error uploading attachments";
      if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error;
      }
      showSnackbar(errorMessage,"error");
    }
  }, [clientId, showSnackbar]);

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);

    // If the user canceled the upload dialog, files array will be empty.
    if (files.length === 0) {
      console.log("File upload was canceled");
      return; // Exit if no files were selected
    }
    const selectedFiles = files;
    console.log("files: ", selectedFiles);
    handleFileUpload(selectedFiles); // Upload files immediately after selection
  };

  const handleFileUpload = async (files) => {
    try {
      const formData = new FormData();

      // Check if any file is selected and it has an allowed extension
      files.forEach((file) => {
        if (file.name && allowedFile(file.name)) {
          formData.append("file", file);
          formData.append("size", file.size);
          formData.append("type", file.type);
        } else {
          showSnackbar(`Unsupported file type: ${file.name}`,"info");
          return;
        }
      });

      // If no valid files were added to the formData, don't make the API call
      if (!formData.has("file")) {
        console.log("No valid files to upload");
        return;
      }

      console.log("formData: ", formData);
      await axiosInstance.post(
        `/client_attachments/${clientId}/attachments/`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      showSnackbar("Files uploaded successfully","success");

      fetchAttachments(); // Fetch the updated attachments list
    } catch (error) {
      console.error("Error uploading files:", error);
      let errorMessage = "Error uploading attachments";
      errorMessage = error.response?.data?.error;

      showSnackbar(errorMessage, "error");
    }
  };

  // const handleDownloadAttachment = async (id) => {
  //   try {
  //     const response = await axiosInstance.get(
  //       `client_attachments/${clientId}/attachments/${id}`,
  //       {
  //         responseType: "arraybuffer", // Use 'arraybuffer' instead of 'blob'
  //       }
  //     );

  //     // Use the content-disposition header to determine the filename
  //     const contentDisposition = response.headers["content-disposition"];
  //     let filename = "file";
  //     if (contentDisposition) {
  //       const match = contentDisposition.match(/filename="(.+)"/);
  //       if (match && match.length > 1) filename = match[1];
  //     }

  //     // Create a Blob and URL for download
  //     const blob = new Blob([response.data], {
  //       type: response.headers["content-type"],
  //     });
  //     const url = URL.createObjectURL(blob);

  //     // Create and click a link to start the download
  //     const link = document.createElement("a");
  //     link.href = url;
  //     link.setAttribute("download", filename);
  //     document.body.appendChild(link);
  //     link.click();
  //   } catch (error) {
  //     console.error("Error downloading attachment:", error);
  //     let errorMessage = "Error uploading attachments";
  //     if (error.response && error.response.data && error.response.data.error) {
  //       errorMessage = error.response.data.error;
  //     }
  //     setSnackbarMessage(errorMessage);
  //     setSnackbarOpen(true);
  //   }
  // };

  const handleDeleteAttachment = async (index) => {
    try {
      const fileToDelete = attachments[index];
      await axiosInstance.delete(
        `client_attachments/${clientId}/attachments/${fileToDelete.id}`
      );

      // Remove the attachment from the local state
      const updatedAttachments = attachments.slice();
      updatedAttachments.splice(index, 1);
      setAttachments(updatedAttachments);
      fetchAttachments();
    } catch (error) {
      console.error("Error deleting attachment:", error);
      let errorMessage = "Error uploading attachments";
      errorMessage = error.response?.data?.error;
      showSnackbar(errorMessage, "error");
    }
  };

  // Call fetchAttachments when the component mounts
  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  // Corrected the condition in the allowedFile function
  const allowedFile = (filename) => {
    const ALLOWED_EXTENSIONS = [
      // List of all allowed extensions
      "jpg",
      "jpeg",
      "png",
      "gif",
      "tif",
      "tiff",
      "bmp",
      "ico",
      "svg",
      "heif",
      "bat",
      "bpg",
      "indd",
      "ai",
      "eps",
      "pdf",
      "doc",
      "docx",
      "odt",
      "txt",
      "rtf",
      "xls",
      "xlsx",
      "ods",
      "csv",
      "ppt",
      "pptx",
      "odp",
      "zip",
      "7z",
      "rar",
      "tar",
      "gz",
      "md",
      "yml",
      "yaml",
      "json",
      "xml",
      "csv",
      "tsv",
      "ics",
      "vcf",
      "epub",
    ];

    return (
      filename &&
      ALLOWED_EXTENSIONS.includes(filename.split(".").pop().toLowerCase())
    );
  };

  return (
    <CardContent>
      <Box my={1}>
        <Typography variant="h5" gutterBottom>
          Attachments
        </Typography>
        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Filename</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {attachments.slice().reverse().map((attachment, index) => {
                console.log("DateTime: ", attachment.date);
                const uploadDateTime = new Date(attachment.date); // Assuming this is the DateTime value from backend
                const uploadDate = uploadDateTime.toLocaleDateString('en-au');
                const uploadTime = uploadDateTime.toLocaleTimeString('en-au');
                return (
                  <TableRow key={index}>
                    <TableCell>{attachment.name}</TableCell>
                    <TableCell>{attachment.type}</TableCell>
                    <TableCell>{attachment.size}</TableCell>
                    <TableCell>{uploadDate}</TableCell>
                    <TableCell> {uploadTime} </TableCell>
                    <TableCell>
                      <a
                        href={`${axiosInstance.defaults.baseURL}/client_attachments/${clientId}/attachments/${attachment.id}`}
                        download
                      >
                        <IconButton>
                          <DownloadIcon />
                        </IconButton>
                      </a>
                      <IconButton onClick={() => handleDeleteAttachment(index)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>
        <Grid container justifyContent="flex-end">
          <input
            type="file"
            id="fileInput"
            multiple
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={() => document.getElementById("fileInput").click()}
          >
            Upload Attachment
          </Button>
        </Grid>
      </Box>
     
    </CardContent>
  );
};

export default AttachmentsTable;
