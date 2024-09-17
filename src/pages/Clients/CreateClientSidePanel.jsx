import React from "react";
import { Box, TextField, Button, IconButton } from "@mui/material";
import CancelIcon from "@mui/icons-material/Cancel";

const CreateClientSidePanel = ({ onClose }) => {
  const handleSubmit = () => {
    // Handle form submission here
  };

  return (
    <Box width="400px" height="100%" bgcolor="#fff" p={2}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        bgcolor="azure"
        p={1}
      >
        <h2>Create Client</h2>
        <IconButton edge="end" color="inherit" onClick={onClose} aria-label="cancel">
          <CancelIcon />
        </IconButton>
      </Box>
      <form onSubmit={handleSubmit}>
        {/* Add form fields here */}
        <TextField label="First Name" fullWidth />
        {/* ... */}
        <Box mt={2} display="flex" justifyContent="flex-end">
          <Button variant="contained" color="primary" type="submit">
            Create
          </Button>
          <Button variant="contained" onClick={onClose}>
            Cancel
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default CreateClientSidePanel;
