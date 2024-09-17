import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";

export const UnsupportedPlaceholdersDialog = ({
  open,
  handleClose,
  unsupportedPlaceholders,
}) => {
  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Unsupported Placeholders</DialogTitle>
      <DialogContent>
        <Typography variant="body1">
          The following placeholders are not supported in the current context
          based on the Query you have selected and therefore may not work as
          expected:
        </Typography>
        <ul>
          {unsupportedPlaceholders.map((placeholder, index) => (
            <li key={index}>{placeholder.name}</li>
          ))}
        </ul>
        <Typography variant="body1">
          Please confirm the query you have chosen is correct and if required,
          remove or replace them in the email template itself.
        </Typography>
        <Typography variant="body2">
          <b>Hint</b>: Use the <i>check placeholder</i> button below to validate
          placeholders.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Understood</Button>
      </DialogActions>
    </Dialog>
  );
};

export const PlaceholderWarningDialog = ({ open, handleClose }) => {
  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Invalid Placeholders</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Placeholders within the email are not valid. Please fix them or remove
          them from the email content before proceeding.
        </DialogContentText>
        <Typography variant="body2">
          <b>Hint</b>: Use the <i>check placeholders</i> button below for more
          details..
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export const SaveWarningDialog = ({ open, handleClose }) => {
  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Unsaved Changes</DialogTitle>
      <DialogContent>
        <DialogContentText>
          You must save any changes to the template before moving on.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export const ConfirmDeletePlaceholderDialog = ({
  open,
  handleClose,
  selectedPlaceholder,
  onDelete,
}) => {
  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Confirm Deletion</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {selectedPlaceholder
            ? `Are you sure you want to delete the placeholder named '${selectedPlaceholder.name}'? This action cannot be undone.`
            : "Are you sure you want to delete this placeholder? This action cannot be undone."}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={() => onDelete(selectedPlaceholder.id)}
          color="secondary"
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};