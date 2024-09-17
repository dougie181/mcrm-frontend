import React from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  Grid,
	CardContent,
} from "@mui/material";

const Comments = ({ clientId }) => {
  return (
		<CardContent>
    <Box my={1}>
      <Typography variant="h5" gutterBottom>
        Comments
      </Typography>
      <List>
        <ListItem>
          <Typography>Comment 1</Typography>
        </ListItem>
        <ListItem>
          <Typography>Comment 2</Typography>
        </ListItem>
      </List>
      <form>
        <TextField
          fullWidth
          multiline
          label="Add a comment"
          // Add the value and onChange handler for the new comment
        />
        <Grid container justifyContent="flex-end">
          <Button
            variant="contained"
            color="primary"
            // Add the onClick handler for submitting a new comment
          >
            Send comment
          </Button>
        </Grid>
      </form>
    </Box>
		</CardContent>
  );
};

export default Comments;
