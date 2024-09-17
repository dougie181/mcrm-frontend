import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
} from "@mui/material";
import axiosInstance from "../../../services/axiosInstance";
import useSavePayload from "../../../hooks/useSavePayload";
import { useSnackbar } from '../../../context/SnackbarContext';
import PlaceholderButton from "../../../components/Placeholders/PlaceholderButton";

// This is the helper function that will set the payload.
const getPlaceholderData = (placeholder) => {
  let data;
  switch (placeholder.content_type) {
    case "static":
      data = { staticText: placeholder.dynamic_data || "" };
      break;
    case "list":
    case "table":
    case "database":
      data = {
        databaseTable: placeholder.table_name,
        databaseField: placeholder.field_name,
      };
      break;
    case "calculated":
      data = { calculatedValue: placeholder.dynamic_data };
      break;
    case "button":
      data = { buttonData: JSON.parse(placeholder.dynamic_data || "[]") };
      break;
    default:
      break;
  }
  return data;
};

const PlaceholderContent = ({
  placeholder,
  tableData,
  isDirty,
  setIsDirty,
}) => {
  const [contentType, setContentType] = useState("");
  const [staticText, setStaticText] = useState("");
  const [calculatedValue, setCalculatedValue] = useState("");
  const [databaseTable, setDatabaseTable] = useState("");
  const [databaseField, setDatabaseField] = useState("");
  const [buttonData, setButtonData] = useState([]);
  const [initialContent, setInitialContent] = useState({});
  const [placeholderTypes, setPlaceholderTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showSnackbar } = useSnackbar();
  const payload = useSavePayload(
    contentType,
    staticText,
    databaseTable,
    databaseField,
    calculatedValue,
    buttonData
  );

  useEffect(() => {
    setIsLoading(true);
    const fetchPlaceholderTypes = async () => {
      try {
        const response = await axiosInstance.get("/placeholders/types");
        setPlaceholderTypes(response.data);
      } catch (error) {
        console.error("Error fetching content types", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlaceholderTypes();
  }, []);

  useEffect(() => {
    const placeholderData = getPlaceholderData(placeholder);
    const initial = {
      contentType: placeholder.content_type,
      staticText: placeholderData.staticText || "",
      databaseTable: placeholderData.databaseTable || "",
      databaseField: placeholderData.databaseField || "",
      calculatedValue: placeholderData.calculatedValue || "",
      buttonData: placeholderData.buttonData || [],
    };
    setContentType(initial.contentType);
    setStaticText(initial.staticText);
    setDatabaseTable(initial.databaseTable);
    setDatabaseField(initial.databaseField);
    setCalculatedValue(initial.calculatedValue);
    setButtonData(initial.buttonData);

    setInitialContent(initial);
    setIsDirty(false);
  }, [setIsDirty, placeholder]);

  const handleUndo = () => {
    setContentType(initialContent.contentType);
    setStaticText(initialContent.staticText);
    setDatabaseTable(initialContent.databaseTable);
    setDatabaseField(initialContent.databaseField);
    setCalculatedValue(initialContent.calculatedValue);
    setButtonData(initialContent.buttonData);
    setIsDirty(false);
  };

  const handleContentTypeChange = (event) => {
    setContentType(event.target.value);
    setIsDirty(true);
  };

  const renderContentInput = () => {
    switch (contentType) {
      case "static":
        return (
          <TextField
            label="Static Text"
            fullWidth
            value={staticText}
            onChange={(event) => {
              setIsDirty(true);
              setStaticText(event.target.value);
            }}
          />
        );
      case "database":
      case "table":
      case "list":
        return (
          <>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} mb={2}>
                <FormControl fullWidth>
                  <InputLabel id="db-table-select-label">Database Table</InputLabel>
                  <Select
                    labelId="db-table-select-label"
                    id="db-table-select"
                    label="Database Table"
                    value={databaseTable}
                    onChange={(event) => {
                      setIsDirty(true);
                      const newTable = event.target.value;
                      setDatabaseTable(newTable);

                      if (tableData[newTable] && !tableData[newTable].includes(databaseField)) {
                        setDatabaseField(tableData[newTable][0] || "");
                      }
                    }}
                  >
                    {Object.keys(tableData).map((tableName) => (
                      <MenuItem key={tableName} value={tableName}>
                        {tableName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              {databaseTable && (
                <Grid item xs={12} sm={6} mb={2}>
                  <FormControl fullWidth>
                    <InputLabel id="db-field-select-label">Database Field</InputLabel>
                    <Select
                      labelId="db-field-select-label"
                      label="Database Field"
                      id="db-field-select"
                      value={databaseField}
                      onChange={(event) => {
                        setIsDirty(true);
                        setDatabaseField(event.target.value);
                      }}
                    >
                      {tableData[databaseTable] &&
                        tableData[databaseTable].map((fieldName) => (
                          <MenuItem key={fieldName} value={fieldName}>
                            {fieldName}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
            </Grid>
          </>
        );
      case "calculated":
        return (
          <TextField
            label="Calculated Value"
            fullWidth
            value={calculatedValue}
            onChange={(event) => {
              setIsDirty(true);
              setCalculatedValue(event.target.value);
            }}
          />
        );
      case "button":
        return (
          <PlaceholderButton
            buttonData={buttonData}
            setButtonData={setButtonData}
            setIsDirty={setIsDirty}
          />
        );
      default:
        return null;
    }
  };

  const handleSave = useCallback(async () => {
    // Validate button data
    const buttonNames = new Set();
    for (let button of buttonData) {
      if (!button.button_name || !button.text) {
        showSnackbar("Each button must have a name and text value.", "error");
        return;
      }
      if (buttonNames.has(button.button_name)) {
        showSnackbar("Each button name must be unique.", "error");
        return;
      }
      buttonNames.add(button.button_name);
    }

    try {
      await axiosInstance.put(
        `/placeholders/${placeholder.id}`,
        payload
      );
      showSnackbar("Changes saved successfully!", "success");
      setIsDirty(false);
    } catch (error) {
      console.error("Error saving changes", error);
      showSnackbar("Error saving changes, please try again.", "error");
    }
  }, [buttonData, payload, placeholder.id, setIsDirty, showSnackbar]);

  if (isLoading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box sx={{ width: "100%" }}>
      <Typography variant="h6" gutterBottom>
        Placeholder Content
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <FormControl fullWidth variant="outlined">
            <InputLabel>Content Type</InputLabel>
            <Select
              value={contentType}
              onChange={handleContentTypeChange}
              label="Content Type"
            >
              {placeholderTypes && placeholderTypes.map((option) => (
                <MenuItem key={option.name} value={option.name}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          {renderContentInput()}
        </Grid>
        <Grid item xs={12}>
          <Button
            sx={{ marginRight: 2 }}
            variant="contained"
            color="secondary"
            onClick={handleUndo}
            disabled={!isDirty}
          >
            Undo
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={!isDirty}
          >
            Save
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PlaceholderContent;
