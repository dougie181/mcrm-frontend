import React, { useState, useEffect, useCallback, Fragment } from "react";
import { Box, Container, Grid, Button } from "@mui/material";
import PlaceholderSelection from "./PlaceholderSelection";
import PlaceholderContent from "./PlaceholderContent";
import axiosInstance from "../../../services/axiosInstance";

const PlaceholderEditor = ({
  id,
  placeholders,
  onRuleCreate,
  onRuleDelete,
  selectedPlaceholder,
  setSelectedPlaceholder,
}) => {
  const [placeholderId, setPlaceholderId] = useState(null);
  const [tableData, setTableData] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [previousSelected, setPreviousSelected] = useState(null);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    //console.log("PlaceholderEditor useEffect called with id: ", id);
    const fetchTableData = async () => {
      try {
        const url = "/campaigns/columns/" + id;
        const response = await axiosInstance.get(url);
        setTableData(response.data);
      } catch (error) {
        console.error("Error fetching table data from server", error);
      }
    };
    fetchTableData();
  }, [id]);

  const handlePlaceholderClick = useCallback(
    (placeholder) => {
      setSelectedPlaceholder(placeholder);
      setPlaceholderId(placeholder.id);
    },
    [setSelectedPlaceholder]
  );

  const handleCreateModeToggle = () => {
    if (isCreateMode && previousSelected) {
      setSelectedPlaceholder(previousSelected);
      setPreviousSelected(null);
    } else if (!isCreateMode) {
      setPreviousSelected(selectedPlaceholder);
      setSelectedPlaceholder(null);
    }
    setIsCreateMode(!isCreateMode);
  };

  const handleRuleCreate = async (newRuleName) => {
    const response = await onRuleCreate(newRuleName);

    if (!response.success) {
      setCreateError(response.error); // Display the error message returned from the parent component
      // Keep the user in create mode so they can try again or adjust their input
      setIsCreateMode(true);
    } else {
      setIsCreateMode(false);
      setSelectedPlaceholder(response.data); // Assuming response.data is the new placeholder
      setCreateError(""); // Clear any previous errors
    }
  };

  const handleRuleDelete = () => {
    onRuleDelete(selectedPlaceholder.id);
  };

  return (
    <Container maxWidth="md">
      <Box textAlign="center" my={4}>
        <Box mb={2}>
          {createError && (
            <Box color="error.main" marginBottom={2}>
              {createError}
            </Box>
          )}
          {!isCreateMode && (
            <Fragment>
              <Button
                sx={{ marginRight: 2 }}
                variant="contained"
                onClick={handleCreateModeToggle}
              >
                Create
              </Button>
              <Button
                variant="contained"
                onClick={handleRuleDelete}
                disabled={!selectedPlaceholder}
              >
                Delete
              </Button>
            </Fragment>
          )}
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <PlaceholderSelection
              id={id}
              selectedPlaceholder={selectedPlaceholder}
              setSelectedPlaceholder={setSelectedPlaceholder}
              placeholders={placeholders}
              handlePlaceholderClick={handlePlaceholderClick}
              isScreenSmall={true}
              isCreateMode={isCreateMode}
              onRuleCreate={handleRuleCreate}
              onRuleDelete={handleRuleDelete}
              toggleCreateMode={handleCreateModeToggle}
            />
          </Grid>
          {!isCreateMode && selectedPlaceholder && (
            <Grid item xs={12}>
              <PlaceholderContent
                key={selectedPlaceholder.id}
                placeholder={selectedPlaceholder}
                placeholderId={placeholderId}
                tableData={tableData}
                isDirty={isDirty}
                setIsDirty={setIsDirty}
                isScreenSmall={true}
              />
            </Grid>
          )}
        </Grid>
      </Box>
    </Container>
  );
};

export default PlaceholderEditor;
