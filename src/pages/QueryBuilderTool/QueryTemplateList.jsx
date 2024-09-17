import React, { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  Typography,
  Box,
  TableContainer,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import axiosInstance from "../../services/axiosInstance";
import { useNavigate } from "react-router-dom";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import FileDownload from "@mui/icons-material/FileDownload"; // Import the download icon

const QueryTemplateList = () => {
  const [templates, setTemplates] = useState([]);
  const navigate = useNavigate();
  const [openDialog, setOpenDialog] = useState(false);
  const [templateIdToDelete, setTemplateIdToDelete] = useState(null);

  useEffect(() => {
    // Fetch the templates from your backend
    axiosInstance
      .get("/queries/list")
      .then((response) => {
        setTemplates(response.data);
      })
      .catch((error) => {
        console.error("Error fetching templates:", error);
      });
  }, []);

  const showDeleteDialog = (templateId) => {
    setTemplateIdToDelete(templateId);
    setOpenDialog(true);
  };

  const confirmDelete = () => {
    handleDelete(templateIdToDelete);
    setOpenDialog(false);
    setTemplateIdToDelete(null);
  };

  const closeDialog = () => {
    setOpenDialog(false);
    setTemplateIdToDelete(null);
  };

  const handleEdit = (templateId) => {
    // Navigate to the edit page or open a modal to edit the template
    //console.log("Editing template with ID:", templateId);
    navigate(`/query-builder/${templateId}`);
  };

  const handleCreateNew = () => {
    // Navigate to the create new template page or open a modal
    //console.log("Creating a new template");
    navigate("/query-builder/new");
  };

  const handleDelete = (templateId) => {
    // Delete the template from your backend
    axiosInstance
      .delete(`/queries/${templateId}`)
      .then((response) => {
        console.log("Template deleted successfully");
        // Remove the template from the state
        setTemplates(
          templates.filter((template) => template.id !== templateId)
        );
      })
      .catch((error) => {
        console.error("Error deleting template:", error);
      });
  };

  const downloadTemplate = async (templateId) => {
    try {
      const response = await axiosInstance.get(`/queries/export/${templateId}`);
      const data = response.data;
      const jsonData = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonData], { type: "application/json" });
      const href = await URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      link.download = data.name + "_SQL_Template.json"; // You can name the file here
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exporting template:", error);
      // Handle errors, such as displaying a notification
    }
  };

  const handleImport = () => {
    // Navigate to the import template page
    navigate("/query-builder/import");
  };

  const handleView = (templateId) => {
    // Navigate to the view page or open a modal to view the template
    console.log("Viewing template with ID:", templateId);
    navigate(`/query-builder/view/${templateId}`);
  };

  return (
    <Container maxWidth="lg">
      <Box p={4}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          marginBottom={4}
        >
          <Typography variant="h4" gutterBottom>
            SQL Templates
          </Typography>
          <Box>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreateNew}
              style={{ marginRight: "10px" }}
            >
              Create New Template
            </Button>
            <Button variant="contained" onClick={handleImport}>
              Import Template
            </Button>
          </Box>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>{template.name}</TableCell>
                  <TableCell>{template.description}</TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Tooltip title="Edit">
                        <IconButton
                          color="primary"
                          onClick={() => handleEdit(template.id)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View">
                        <IconButton
                          color="primary"
                          onClick={() => handleView(template.id)}
                        >
                          <PlayCircleOutlineIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Export">
                        <IconButton
                          color="primary"
                          onClick={() => downloadTemplate(template.id)}
                        >
                          <FileDownload />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          color="error"
                          onClick={() => showDeleteDialog(template.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      <Dialog
        open={openDialog}
        onClose={closeDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Delete SQL Template"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this template? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmDelete} color="primary" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default QueryTemplateList;
