import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
	Container
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { useState, useEffect } from "react";
import axiosInstance from "../../services/axiosInstance"; // Import the instance here

const EmailTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [deleteId, setDeleteId] = useState(null);


  const fetchTemplates = async () => {
    try {
      const response = await axiosInstance.get("/email_templates/");
      const filteredTemplates = response.data.filter(
        (template) => template.template_name !== "None"
      );
      setTemplates(filteredTemplates);
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    }
  };

  useEffect(() => {
    // Fetch templates from the backend
    fetchTemplates();
  }, []);

  const handleEdit = (template) => {
    setEditingId(template.template_id);
    setEditName(template.template_name);
    setEditDescription(template.description);
  };

  const handleSave = async () => {
    try {
      await axiosInstance.put(`/email_templates/${editingId}`, {
        template_name: editName,
        description: editDescription,
      });
      // Refetch templates after renaming
      fetchTemplates();
      // Reset the editing state
      setEditingId(null);
      setEditName("");
      setEditDescription("");
    } catch (error) {
      console.error("Failed to rename template:", error);
    }
  };
  const handleDelete = (id) => {
		setDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
		console.log("handleDelete pressed for id: ", deleteId);
		try {
			console.log("deleting template with id: ", deleteId);
			await axiosInstance.delete(`/email_templates/${deleteId}`);
			// Refetch templates after deletion
			fetchTemplates();
			// Close the delete dialog and reset the deleteId
			setDeleteDialogOpen(false);
			setDeleteId(null);
		} catch (error) {
			console.error("Failed to delete template:", error);
		}
	};	

  return (
    <Container maxWidth="lg">
      <Box p={2}>
        <Typography variant="h4">Email Templates</Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Date Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {templates.map((template) =>
                editingId === template.template_id ? (
                  <TableRow key={template.template_id}>
                    <TableCell component="th" scope="row">
                      <TextField
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                      />
                    </TableCell>
                    <TableCell>{template.created_date}</TableCell>
                    <TableCell>
                      <Button onClick={handleSave} color="primary">
                        <CheckIcon />
                      </Button>
                      <Button
                        onClick={() => setEditingId(null)}
                        color="secondary"
                      >
                        <CloseIcon />
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow key={template.template_id}>
                    <TableCell component="th" scope="row">
                      {template.template_name}
                    </TableCell>
                    <TableCell>{template.description}</TableCell>
                    <TableCell>{template.created_date}</TableCell>
                    <TableCell>
                      <Button
                        onClick={() => handleEdit(template)}
                        color="primary"
                      >
                        <EditIcon />
                      </Button>
                      <Button
                        onClick={() => handleDelete(template.template_id)}
                        color="secondary"
                      >
                        <DeleteIcon />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
        >
          <DialogTitle>Delete Template</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete this template? This action cannot
              be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
              Cancel
            </Button>
            <Button onClick={handleConfirmDelete} color="secondary">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default EmailTemplates;
