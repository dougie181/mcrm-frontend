import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  CardContent,
  Grid,
} from "@mui/material";
import { styled } from "@mui/system";
import axiosInstance from "../../services/axiosInstance";

const ResizableTextField = styled(TextField)({
  "& textarea": {
    resize: "vertical",
    overflow: "auto",
    background: "inherit",
  },
});

const Notes = ({ clientId }) => {
  const [notesModified, setNotesModified] = useState(false);
  const [notes, setNotes] = useState([]);
  const [originalNotes, setOriginalNotes] = useState([]); // Store original notes from the backend

  const handleNotesUpdate = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.put(`/clients/${clientId}/notes`, { notes });
      // Update the client state to reflect the changes made on the server
      setOriginalNotes(notes); // Update original notes
      setNotesModified(false);
    } catch (error) {
      console.error("Error updating client data:", error);
    }
  };

  const handleCancel = () => {
    setNotes(originalNotes); // Revert to original notes
    setNotesModified(false);
  };

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const notesResponse = await axiosInstance.get(`/clients/${clientId}/notes`);
				if (notesResponse.data.notes) { // If notes are null, set to empty string (otherwise, the text field will be uncontrolled
					setNotes(notesResponse.data.notes);
					setOriginalNotes(notesResponse.data.notes); // Store original notes
				}
      } catch (error) {
        console.error("Error fetching client data:", error);
      }
    };

    fetchNotes();
  }, [clientId]);

  return (
    <CardContent>
      <Box my={1} paddingRight={2} paddingTop={2}>
        <Typography variant="h5" gutterBottom>
          Notes
        </Typography>
        <ResizableTextField
          multiline
          rows={4}
          fullWidth
          value={notes}
          onChange={(e) => {
            setNotesModified(true);
            setNotes(e.target.value);
          }}
        />
        <Grid container justifyContent="flex-end">
          {notesModified && (
            <Button onClick={handleCancel}>
              Cancel
            </Button>
          )}
          <Button
            variant="contained"
            color="success" // Make the button green
            onClick={handleNotesUpdate}
            disabled={!notesModified}
          >
            Save
          </Button>
        </Grid>
      </Box>
    </CardContent>
  );
};

export default Notes;
