import React, { Fragment, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Select,
  MenuItem,
  Input,
  IconButton, // <-- Added
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline"; // Create icon
import CancelIcon from "@mui/icons-material/Cancel"; // Cancel icon

const PlaceholderSelection = ({
  selectedPlaceholder,
  handlePlaceholderClick,
  placeholders,
  isScreenSmall,
  isCreateMode,
  onRuleCreate,
  toggleCreateMode,
}) => {
  const [newRuleName, setNewRuleName] = useState("");
  const [inputError, setInputError] = useState(""); // State for the input error message

  //console.log( "PlaceholderSelection called with selectedPlaceholder: ", selectedPlaceholder);

  const handleNewRuleNameChange = (event) => {
    setNewRuleName(event.target.value);
    setInputError(""); // Clear the error when the user types
  };

  const handleCreateRule = () => {
    // Check if the rule name is blank
    if (!newRuleName.trim()) {
      setInputError("Rule name cannot be blank.");
      return;
    }
    // Check for unique rule name
    const ruleExists = placeholders.some(
      (placeholder) => placeholder.name === newRuleName
    );
    if (ruleExists) {
      setInputError("Rule name must be unique.");
      return;
    }
    onRuleCreate(newRuleName);
    setNewRuleName(""); // Clear the new rule name
  };

  const renderList = () => (
    <List component="nav">
      {placeholders &&
        placeholders.map((placeholder, index) => (
          <Fragment key={placeholder.id}>
            <ListItem
              button
              selected={
                selectedPlaceholder?.name ===
                placeholder.name
              }
              onClick={() => handlePlaceholderClick(placeholder)}
            >
              <ListItemText primary={placeholder.name} />
            </ListItem>
            {index < placeholders.length - 1 && <Divider />}
          </Fragment>
        ))}
    </List>
  );

  const renderDropdown = () => (
    <Box sx={{ width: isScreenSmall ? "100%" : "auto" }}>
      {isCreateMode ? (
        <Box display="flex" alignItems="center"> {/* Flexbox to align items horizontally */}
          <Box flex={1} mr={1} flexDirection="column"> {/* Flex grow 1 to take up remaining space, margin-right for spacing */}
            <Input
              value={newRuleName}
              onChange={handleNewRuleNameChange}
              placeholder="New rule name"
              error={Boolean(inputError)}
            />
            {/* Error Message */}
            <Typography variant="body2" color="error">
              {inputError}
            </Typography>
          </Box>
          <IconButton onClick={handleCreateRule}>
            <AddCircleOutlineIcon />
          </IconButton>
          <IconButton
            onClick={() => {
              setNewRuleName("");
              setInputError("");
              toggleCreateMode();
            }}
          >
            <CancelIcon />
          </IconButton>
        </Box>
      ) : (
        <Select
          style={{ width: "100%" }}
          value={
            selectedPlaceholder ? selectedPlaceholder.name : ""
          }
          onChange={(e) => {
            const placeholder = placeholders.find(
              (pl) => pl.name === e.target.value
            );
            if (placeholder) {
              handlePlaceholderClick(placeholder);
            } else {
              handlePlaceholderClick(placeholders[0]);
            }
          }}
          fullWidth
        >
          {placeholders &&
            placeholders.map((placeholder) => (
              <MenuItem
                key={placeholder.id}
                value={placeholder.name}
              >
                {placeholder.name}
              </MenuItem>
            ))}
        </Select>
      )}
    </Box>
);


  return (
    <Box sx={{ width: "100%" }}>
      <Typography variant="h6" gutterBottom>
        Placeholder Rules
      </Typography>
      <Paper>{isScreenSmall ? renderDropdown() : renderList()}</Paper>
    </Box>
  );
};

export default PlaceholderSelection;
