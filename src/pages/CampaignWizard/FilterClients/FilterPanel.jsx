import React, { useEffect, useState } from "react";
import {
  Grid,
  Box,
  Typography,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Checkbox,
  Autocomplete,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from "@mui/material";
import { Delete, Edit } from "@mui/icons-material";
import axiosInstance from "../../../services/axiosInstance";

// const listOfFilterTypes = [
//   {
//     value: "exclude_previous_campaigns",
//     label: "Exclude Previous Campaigns",
//   },
//   {
//     value: "exclude_column_value",
//     label: "Exclude Column Value",
//   },
//   {
//     value: "manual_exclusions",
//     label: "Manual Exclusions",
//   },
//   {
//     value: "manual_inclusions",
//     label: "Manual Inclusions",
//   },
// ];

const listOfFilterTypes = [
  {
    value: "exclude_previous_campaigns",
    label: "Exclude Previous Campaigns",
    type: "api",
    behaviour: "auto-complete",
    //behaviour: "multiple",
    params: {
      api_endpoint: "/campaigns/",
      key: "id",
      labelKey: ["name", "description"],
      queryTerm: {
        status: "completed",
        type: "ROA",
      },
    },
  },// {
    //   value: "exclude_column_value",
    //   label: "Exclude Column Value",
    // },
    // You can add other filter types here
];

const FilterPanel = ({
  newFilter,
  handleFilterChange,
  columns,
  handleAddFilter,
  filters,
  handleRemoveFilter,
}) => {
  const [apiOptions, setApiOptions] = useState({});
  const [localBehaviour, setLocalBehaviour] = useState(""); // Local state for temporary behaviour

  const truncateText = (text, maxLength) => {
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  useEffect(() => {
    const fetchDropDownData = async () => {
      for (const filterType of listOfFilterTypes) {
        if (filterType.type === "api") {
          try {
            const response = await axiosInstance.get(
              filterType.params.api_endpoint
            );
            console.log("api endpoint", filterType.params.api_endpoint); 
            // Filter campaigns that are completed and of type ROA
            const filteredData = response.data
              .filter((item) => {
                return Object.entries(filterType.params.queryTerm).every(
                  ([key, value]) => item[key] === value
                );
              })
              // Sort by start_date (most recent first)
              .sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
  
            // Join labelKey values, truncate combined string, and append start_date
            const options = filteredData.map((item) => {
              const combinedLabel = filterType.params.labelKey
                .map((key) => item[key])
                .join(" - ");
              const truncatedLabel = truncateText(combinedLabel, 70);
              return {
                value: item[filterType.params.key],
                label: `${truncatedLabel} (${new Date(item.start_date).toLocaleDateString()})`,
              };
            });
  
            setApiOptions((prev) => ({
              ...prev,
              [filterType.value]: options,
            }));
          } catch (error) {
            console.error(
              `Error fetching data for filter type ${filterType.value}:`,
              error
            );
          }
        }
      }
    };
  
    fetchDropDownData();
  }, []);

  useEffect(() => {
    // Determine behaviour dynamically based on selected filter type
    const selectedFilterType = listOfFilterTypes.find(
      (filter) => filter.value === newFilter.type
    );
    if (selectedFilterType) {
      setLocalBehaviour(selectedFilterType.behaviour);
    } else {
      setLocalBehaviour("");
    }
  }, [newFilter.type]); // Only update when newFilter.type changes

  // Helper function to check if the required fields for each filter type are filled
  const isAddFilterDisabled = () => {
    const { type, params } = newFilter;

    if (!type) return true;

    switch (type) {
      case "exclude_column_value":
        return !params.column || !params.operator || params.value === "";
      case "manual_exclusions":
      case "manual_inclusions":
        return !params.client_ids || params.client_ids.length === 0;
      case "exclude_previous_campaigns":
        return !params.campaign_ids || params.campaign_ids.length === 0;
      default:
        return true;
    }
  };

  const getFilterDescription = (filter) => {
    switch (filter.type) {
      case "exclude_previous_campaigns":
        return `Exclude campaigns: ${filter.params.campaign_ids.join(", ")}`;
      case "exclude_column_value":
        return `Exclude where ${filter.params.column} ${filter.params.operator} ${filter.params.value}`;
      case "manual_exclusions":
        return `Exclude clients: ${filter.params.client_ids.join(", ")}`;
      case "manual_inclusions":
        return `Include clients: ${filter.params.client_ids.join(", ")}`;
      default:
        return "Unknown filter";
    }
  };

  return (
    <Box>
      {/* Filter Controls Section */}
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12}>
          <FormControl fullWidth variant="outlined">
            <InputLabel>Select a filter type</InputLabel>
            <Select
              name="type"
              value={newFilter.type}
              onChange={handleFilterChange}
              label="Select a filter type"
            >
              {listOfFilterTypes.map((filterType) => (
                <MenuItem key={filterType.value} value={filterType.value}>
                  {filterType.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Exclude Column Value */}
        {newFilter.type === "exclude_column_value" && (
          <>
            <Grid item xs={4}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Column</InputLabel>
                <Select
                  name="params.column"
                  value={newFilter.params.column}
                  onChange={handleFilterChange}
                  label="Column"
                >
                  {columns.map((col) => (
                    <MenuItem key={col} value={col}>
                      {col}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Operator</InputLabel>
                <Select
                  name="params.operator"
                  value={newFilter.params.operator}
                  onChange={handleFilterChange}
                  label="Operator"
                >
                  <MenuItem value="==">==</MenuItem>
                  <MenuItem value="!=">!=</MenuItem>
                  <MenuItem value="<">&lt;</MenuItem>
                  <MenuItem value="<=">&lt;=</MenuItem>
                  <MenuItem value=">">&gt;</MenuItem>
                  <MenuItem value=">=">&gt;=</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <TextField
                name="params.value"
                label="Value"
                variant="outlined"
                fullWidth
                value={newFilter.params.value}
                onChange={handleFilterChange}
              />
            </Grid>
          </>
        )}

        {/* Manual Exclusions */}
        {newFilter.type === "manual_exclusions" && (
          <Grid item xs={12}>
            <TextField
              name="params.client_ids"
              label="Client IDs (comma-separated)"
              variant="outlined"
              fullWidth
              value={newFilter.params.client_ids}
              onChange={(e) =>
                handleFilterChange({
                  target: {
                    name: "params.client_ids",
                    value: e.target.value.split(",").map((id) => id.trim()),
                  },
                })
              }
            />
          </Grid>
        )}

        {/* Manual Inclusions */}
        {newFilter.type === "manual_inclusions" && (
          <Grid item xs={12}>
            <TextField
              name="params.client_ids"
              label="Client IDs (comma-separated)"
              variant="outlined"
              fullWidth
              value={newFilter.params.client_ids}
              onChange={(e) =>
                handleFilterChange({
                  target: {
                    name: "params.client_ids",
                    value: e.target.value.split(",").map((id) => id.trim()),
                  },
                })
              }
            />
          </Grid>
        )}

        {/* Exclude Previous Campaigns with multiple */}
        {newFilter.type === "exclude_previous_campaigns" && localBehaviour === "multiple" && (
          <Grid item xs={12}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Campaigns</InputLabel>
              <Select
                name="params.campaign_ids"
                multiple
                value={newFilter.params.campaign_ids || []}
                onChange={(e) =>
                  handleFilterChange({
                    target: {
                      name: "params.campaign_ids",
                      value: e.target.value,
                    },
                  })
                }
                renderValue={(selected) => selected.join(", ")}
                label="Campaigns"
              >
                {apiOptions["exclude_previous_campaigns"]?.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <Checkbox
                      checked={
                        newFilter.params.campaign_ids?.includes(option.value) || false
                      } // Ensure safe access with optional chaining
                    />
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}

        {/* Exclude Previous Campaigns with Autocomplete */}
        {newFilter.type === "exclude_previous_campaigns" &&
          localBehaviour === "auto-complete" && (
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={apiOptions["exclude_previous_campaigns"] || []}
                getOptionLabel={(option) => option.label}
                value={
                  apiOptions["exclude_previous_campaigns"]?.filter((option) =>
                    (newFilter.params.campaign_ids || []).includes(option.value)
                  ) || []
                }
                onChange={(event, newValue) => {
                  handleFilterChange({
                    target: {
                      name: "params.campaign_ids",
                      value: newValue.map((option) => option.value),
                    },
                  });
                }}
                renderInput={(params) => (
                  <TextField {...params} variant="outlined" label="Campaigns" />
                )}
              />
            </Grid>
          )}

        {/* Add Filter Button */}
        <Grid item xs={12}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddFilter}
            disabled={isAddFilterDisabled()}
          >
            Add Filter
          </Button>
        </Grid>
      </Grid>

      {/* Current Filters Section */}
      <Box mt={4}>
        <Typography variant="h6">Current Filters</Typography>
        <List>
          {filters.map((filter, index) => (
            <ListItem key={index}>
              <ListItemText primary={getFilterDescription(filter)} />
              <ListItemSecondaryAction>
                <IconButton edge="end" onClick={() => handleRemoveFilter(index)}>
                  <Delete />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  );
};

export default FilterPanel;