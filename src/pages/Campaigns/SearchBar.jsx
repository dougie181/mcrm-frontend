import React from 'react';
import { Box, TextField, FormControlLabel } from '@mui/material';
import GreenSwitch from "../../components/Controls/GreenSwitch";

const SearchBar = ({ searchTerm, setSearchTerm, showFavorites, setShowFavorites }) => {
  return (
    <Box display="flex" alignItems="center" marginBottom={2}>
      <TextField
        label="Search by Name"
        variant="outlined"
        fullWidth
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <FormControlLabel
        control={
          <GreenSwitch
            checked={showFavorites}
            onChange={(e) => setShowFavorites(e.target.checked)}
            color="primary"
          />
        }
        label="Only show Favorites"
        style={{ marginLeft: "16px" }}
      />
    </Box>
  );
};

export default SearchBar;
