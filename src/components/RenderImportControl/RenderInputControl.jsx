import React, { useEffect, useState } from "react";
import {
  TextField,
  FormControl,
  FormHelperText,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Typography,
  Chip,
  Autocomplete,
} from "@mui/material";
import debounce from "lodash/debounce";
import axiosInstance from "../../services/axiosInstance";

const renderInputField = ({
  param,
  index,
  setValues,
  values,
  error,
  clearErrorOnParam,
}) => {
  const [searchResults, setSearchResults] = useState([]);

  const errorProps = error
    ? {
        error: true,
        helperText: error,
      }
    : {};

  const clearErrorIfExist = (paramName) => {
    if (clearErrorOnParam) {
      clearErrorOnParam(paramName);
    }
  };

  const handleSearchChange = debounce(async (searchText) => {
    if (!searchText.trim()) return;
    try {
      const url = `${param.apiEndpoint}/${searchText}`;
      const response = await axiosInstance.get(url);
      setSearchResults(response.data);
      const formattedIds = `('${response.data.join("', '")}')`;
      //console.log("Formatted IDs: ", formattedIds);
      
      // Assuming the API returns an array of IDs that you'd store directly
      const paramName = `${param.name}_ids`;
      setValues((prevValues) => ({
        ...prevValues,
        [paramName]: formattedIds,
      }));
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, 500); // Debounce the API call

  useEffect(() => {
    // Clean up the debounce function on component unmount
    return () => handleSearchChange.cancel();
  }, []);

  // Render the description text for each field
  const descriptionText = param.description ? (
    <Typography variant="caption" display="block" gutterBottom>
      {param.description}
    </Typography>
  ) : null;

  switch (param.type) {
    case "numeric":
      return (
        <>
          {descriptionText}
          <TextField
            key={index}
            label={param.label}
            variant="outlined"
            type="number"
            inputProps={{ step: "0.01" }}
            fullWidth
            value={values[param.name] || ""}
            {...errorProps}
            onChange={(e) => {
              const newValues = { ...values };
              newValues[param.name] = e.target.value;
              clearErrorIfExist(param.name);
              setValues(newValues);
            }}
          />
        </>
      );

    case "integer":
      return (
        <>
          {descriptionText}
          <TextField
            key={index}
            label={param.label}
            variant="outlined"
            type="number"
            fullWidth
            value={values[param.name] || ""}
            {...errorProps}
            onChange={(e) => {
              const newValues = { ...values };
              newValues[param.name] = e.target.value;
              clearErrorIfExist(param.name);
              setValues(newValues);
            }}
          />
        </>
      );

    case "boolean":
      return (
        <>
          {descriptionText}

          <FormControlLabel
            control={
              <Checkbox
                checked={!!values[param.name]} // Ensure boolean value is used
                onChange={(e) => {
                  const newValues = { ...values };
                  newValues[param.name] = e.target.checked; // Directly use boolean value
                  clearErrorIfExist(param.name);
                  setValues(newValues);
                }}
              />
            }
            label={param.label || param.name} // Use the parameter's label or name as the label for the checkbox
          />
        </>
      );

    case "dropdown":
      if (!param.options || !Array.isArray(param.options)) {
        console.error(
          `param.options for ${param.label} is not an array or is undefined.`
        );
        return null; // or return a default component or an error message
      }
      return (
        <>
          {descriptionText}
          <FormControl variant="outlined" fullWidth error={!!error} key={index}>
            <InputLabel>{param.label}</InputLabel>
            <Select
              label={param.label}
              value={values[param.name] || ""}
              onChange={(e) => {
                const newValues = { ...values };
                newValues[param.name] = e.target.value;
                clearErrorIfExist(param.name);
                setValues(newValues);
              }}
            >
              {param.options.map((option, optIndex) => (
                <MenuItem key={optIndex} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
            {!!error && <FormHelperText>{error}</FormHelperText>}
          </FormControl>
        </>
      );

    case "autocomplete":
      return (
        <>
          {descriptionText}
          <Autocomplete
            options={param.options}
            getOptionLabel={(option) => option}
            renderInput={(params) => (
              <TextField
                {...params}
                {...errorProps}
                label={param.label}
                variant="outlined"
                fullWidth
              />
            )}
            value={values[param.name] || null} // Use null instead of an empty string
            onChange={(event, newValue) => {
              const newValues = { ...values };
              newValues[param.name] = newValue;
              clearErrorIfExist(param.name);
              setValues(newValues);
            }}
            isOptionEqualToValue={(option, value) => option === value}
          />
        </>
      );

    case "multi-select":
      return (
        <>
          {descriptionText}
          <FormControl variant="outlined" fullWidth error={!!error} key={index}>
            <InputLabel>{param.label}</InputLabel>
            <Select
              multiple
              label={param.label}
              value={values[param.name] || []} // Use an empty array for multi-select
              onChange={(e) => {
                const newValues = { ...values };
                newValues[param.name] = e.target.value;
                clearErrorIfExist(param.name);
                setValues(newValues);
              }}
              renderValue={(selected) => (
                <div>
                  {selected.map((value) => (
                    <Chip key={value} label={value} />
                  ))}
                </div>
              )}
            >
              {param.options.map((option, optIndex) => (
                <MenuItem key={optIndex} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
            {!!error && <FormHelperText>{error}</FormHelperText>}
          </FormControl>
        </>
      );

    case "date":
      return (
        <>
          {descriptionText}
          <TextField
            key={index}
            label={param.label}
            variant="outlined"
            type="date"
            fullWidth
            InputLabelProps={{
              shrink: true, // to make sure the label doesn't overlap with date input value
            }}
            value={values[param.name] || ""}
            {...errorProps}
            onChange={(e) => {
              const newValues = { ...values };
              newValues[param.name] = e.target.value;
              clearErrorIfExist(param.name);
              setValues(newValues);
            }}
          />
        </>
      );

    case "search":
      return (
        <>
          {descriptionText}
          <TextField
            key={index}
            label={param.label}
            variant="outlined"
            fullWidth
            {...errorProps}
            value={values[`${param.name}_param`] || ""}
            onChange={(e) => {
              const searchText = e.target.value;
              setValues((prevValues) => ({
                ...prevValues,
                [`${param.name}_param`]: searchText,
              }));
              //console.log("Search text:", searchText, "for param:", `${param.name}_param`, "values:", values);
              clearErrorIfExist(param.name);
              handleSearchChange(searchText);
              }
            }
          />
        </>
      );

    default:
      return (
        <>
          {descriptionText}
          <TextField
            key={index}
            label={param.label}
            variant="outlined"
            fullWidth
            value={values[param.name] || ""}
            {...errorProps}
            onChange={(e) => {
              const newValues = { ...values };
              newValues[param.name] = e.target.value;
              clearErrorIfExist(param.name);
              setValues(newValues);
            }}
          />
        </>
      );
  }
};

export default renderInputField;
