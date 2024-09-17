import React, { useEffect, useState } from "react";
import axiosInstance from "../../services/axiosInstance";
import {
  Container,
  Paper,
  TextField,
  Button,
  Divider,
  Typography,
  Snackbar,
  Box,
} from "@mui/material";
import ParametersTable from "./ParametersTable";
import AddIcon from "@mui/icons-material/Add";
import IconButton from "@mui/material/IconButton";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { useParams, useNavigate } from "react-router-dom";
import { SampleQuery } from "./queries";
import CodeMirror from '@uiw/react-codemirror';
import { langs } from '@uiw/codemirror-extensions-langs';

const QueryBuilderTool = () => {
  const [initialSql, setInitialSql] = useState(SampleQuery);
  const [sqlText, setSqlText] = useState(SampleQuery);
  const [isSqlExpanded, setIsSqlExpanded] = useState(true);

  const [params, setParameters] = useState([]);
  const [initialParameters, setInitialParameters] = useState([]);

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const [isNewTemplate, setIsNewTemplate] = useState(true);

  const [showParameters, setShowParameters] = useState(false);
  const [parameterErrors, setParameterErrors] = useState([]);

  const [name, setQueryName] = useState("");
  const [initialName, setInitialName] = useState("");

  const [description, setQueryDescription] = useState("");
  const [initialDescription, setInitialDescription] = useState("");

  const [currentTemplateId, setCurrentTemplateId] = useState(null);

  const [formErrors, setFormErrors] = useState({});

  const navigate = useNavigate();

  const { templateId } = useParams();

  const hasSqlChanged = () => {
    return sqlText !== initialSql;
  };

  const haveParametersChanged = () => {
    return params !== initialParameters;
  };

  const haveNameOrDescriptionChanged = () => {
    return name !== initialName || description !== initialDescription;
  };

  useEffect(() => {
    setLoading(true);

    const fetchTemplateData = async (id) => {
      try {
        const response = await axiosInstance.get(`/queries/${id}`);
        //console.log("response.data: ", response.data);

        setQueryName(response.data.name);
        setInitialName(response.data.name);

        setQueryDescription(response.data.description);
        setInitialDescription(response.data.description);

        setSqlText(response.data.sql);
        setInitialSql(response.data.sql);

        const theParams = JSON.parse(response.data.params);
        //console.log("theParams: ", theParams);
        setParameters(theParams);
        setInitialParameters(theParams);

        setShowParameters(true);
        setLoading(false);
      } catch (error) {
        setLoading(false);
        setError(
          "Failed to fetch SQL Template data - " + error.response.data.message
        );
      }
    };

    if (templateId) {
      // this is an existing template that we're editing
      //console.log("retreiving the data for templateId: ", templateId);
      setIsNewTemplate(false);
      setCurrentTemplateId(currentTemplateId);
      fetchTemplateData(templateId);
    } else if (currentTemplateId) {
      // this is a new template that we're creating and already have a currentTemplateId because we've saved it already
      //console.log("retreiving the data for templateId: ", currentTemplateId);
      setIsNewTemplate(false);
      fetchTemplateData(currentTemplateId);
    } else {
      // this is a brand new template that we're creating
      //console.log("new template - no retrieval from database: ");
      setLoading(false);
      setIsNewTemplate(true);
      setInitialSql("");
    }
  }, [templateId, currentTemplateId]);

  const countNewLines = (str) => {
    return (str.match(/\n/g) || []).length + 1; // +1 to account for the first line
  };

  const expandedRows = countNewLines(sqlText);

  const handleParse = () => {
    // Regular expression to check for columns without aliases in the form table.column
    // Extract the SELECT part of the query and split into individual columns
    const selectRegex = /\bSELECT\b([\s\S]*?)\bFROM\b/i;
    const match = sqlText.match(selectRegex);
    if (match) {
      const selectItemsString = match[1];
  
      // Split the SELECT items correctly, ignoring commas inside parentheses
      const selectItems = [];
      let buffer = "";
      let insideParentheses = 0;
  
      for (let char of selectItemsString) {
        if (char === "(") insideParentheses++;
        if (char === ")") insideParentheses--;
        if (char === "," && insideParentheses === 0) {
          selectItems.push(buffer.trim());
          buffer = "";
        } else {
          buffer += char;
        }
      }
      if (buffer) {
        selectItems.push(buffer.trim());
      }
  
      //console.log("selectItems: ", selectItems);
  
      // Extract aliases and check for duplicates
      const aliasRegex = /\s+AS\s+['"`]?([\w\s.]+)['"`]?$/i;
      const aliases = selectItems.map((item) => {
        const aliasMatch = item.match(aliasRegex);
        return aliasMatch ? aliasMatch[1].trim().toLowerCase() : null;
      });
  
      //console.log("aliases: ", aliases);
  
      // Remove any aliases that are actually CAST AS aliases like 'AS TEXT', 'AS DATE' or 'AS INTEGER', 'AS REAL', 'AS NUMERIC', etc
      const validCastTypes = ['text', 'date', 'integer', 'real', 'numeric'];
      const finalAliases = aliases.filter(alias => {
        return alias && !validCastTypes.some(type => alias.includes(type));
      });
  
      //console.log("finalAliases: ", finalAliases);
  
      const aliasCounts = finalAliases.reduce((acc, alias) => {
        if (alias) {
          acc[alias] = (acc[alias] || 0) + 1;
        }
        return acc;
      }, {});
  
      const duplicateAliases = Object.entries(aliasCounts).filter(
        ([alias, count]) => count > 1
      );
  
      if (duplicateAliases.length > 0) {
        setSnackbarMessage(
          `Error: Duplicate aliases found: ${duplicateAliases
            .map(([alias]) => alias)
            .join(", ")}`
        );
        setSnackbarOpen(true);
        return; // Exit the function early to prevent parsing the SQL
      }
  
      // Check if each select item has an alias (only for items not using CAST or other expressions)
      const allItemsHaveAlias = selectItems.every(item => {
        // Check for 'AS', 'as' or an alias without 'AS' (by detecting the presence of double quotes or table.column syntax)
        const hasAlias = /\s+AS\s+/i.test(item);
        const isSimpleColumn = /^[\w.]+$/.test(item.split(/\s+/).pop());
        const usesWildcard = item.includes("*");
  
        // Adjusted logic to handle cases without aliases properly
        const hasAliasWithoutAS = !hasAlias && !usesWildcard && /^[\w.]+$/.test(item);
  
        const retValue = hasAlias || usesWildcard || !hasAliasWithoutAS;
  
        //console.log("item: ", item, "retValue: ", retValue);
  
        return retValue;
      });
  
      // TODO: Improve the warning message to show the column names that are missing aliases
      if (!allItemsHaveAlias) {
        setSnackbarMessage(
          'Warning: The query contains columns without proper aliases. Please use the format "table.column AS \'alias\'".'
        );
        setSnackbarOpen(true);
        return; // Exit the function early to prevent parsing the SQL
      }
    }
  
    // Check for empty square brackets
    const emptyBracketsRegex = /\[\s*\]/;
    if (emptyBracketsRegex.test(sqlText)) {
      setSnackbarMessage(
        "Error: Missing parameter in query. Empty square brackets found."
      );
      setSnackbarOpen(true);
      return; // Exit the function early to prevent parsing the SQL
    }
  
    const matches = sqlText.match(/\[([a-zA-Z0-9_]+)\]/g); // find the paramaters in the query denoted by square brackets
    const foundParameters = matches
      ? Array.from(
          new Set(matches.map((match) => match.slice(1, -1))) // Remove the square brackets
        )
      : [];
  
    if (foundParameters) {
      const updatedParameters = [];
  
      // Loop through the found params
      foundParameters.forEach((p) => {
        // Check if the parameter already exists
        const existingParam = params.find((param) => param.name === p);
  
        if (existingParam) {
          // If it exists, keep the existing configuration
          updatedParameters.push(existingParam);
        } else {
          // If it's a new parameter, add a default configuration
          updatedParameters.push({
            name: p,
            type: "text",
            options: [],
            label: "",
            description: "",
            source: "static",
            apiEndpoint: "",
          });
        }
      });
  
      setParameters(updatedParameters);
      setShowParameters(true);
  
      // now that we've just parsed the SQL, we want to save the initial state of the SQL and parameters
      setInitialSql(sqlText);
    } else {
      // Notify user if no params found
      setSnackbarMessage("No params found in the SQL.");
      setSnackbarOpen(true);
    }
  };  

  const validateForm = () => {
    const errors = {};
    if (!name.trim()) errors.name = "Query name is required.";
    if (!description.trim()) errors.description = "Query description is required.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0; // Returns true if no errors
  };

  const handleTypeChange = (index, type) => {
    const newParams = [...params];
    newParams[index].type = type;
    newParams[index].options = []; // Reset options when type changes
    newParams[index].value = ""; // Reset value when type changes
    if (type === "search") {
      newParams[index].source = "api"; // Automatically set source to API for search type
    }
    setParameters(newParams);
  };

  const handleInputChange = (index, field, value) => {
    const newParams = [...params];
    newParams[index][field] = value;
    if (field === "source" && value === "static") {
      newParams[index].apiEndpoint = ""; // Reset API endpoint when switching to static
    }
    setParameters(newParams);
  };

  const handleOperationChange = (index, value) => {
    const newParams = [...params];
    newParams[index].value = value;
    setParameters(newParams);
  };

  // function to check if options are a comma separated list of values
  const checkOptions = (options) => {
    if (options.length === 0) {
      return false;
    }
    for (let i = 0; i < options.length; i++) {
      if (options[i].trim().length === 0) {
        return false;
      }
    }
    return true;
  };

  // function to check if an api endpoint is valid
  const checkApiEndpoint = (apiEndpoint) => {
    if (apiEndpoint.trim().length === 0) {
      return false;
    }
    return true;
  };

  const validateParameters = () => {
    const errors = params.map((param) => {
      let error = {};
      // if (!param.label) error.label = "Label is required";
      if (!param.description) error.description = "Description is required";
      if (param.type === "dropdown" || param.type === "multi-select") {
        if (param.source === "static" && !checkOptions(param.options)) {
          error.options = "Options are required";
        } else if (
          param.source === "api" &&
          !checkApiEndpoint(param.apiEndpoint)
        ) {
          error.apiEndpoint = "API endpoint is required";
        }
      }
      return error;
    });

    return errors;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      setSnackbarMessage("Please fill all the required fields.");
      setSnackbarOpen(true);
      return; // Stop the save operation if validation fails
    }

    // check if there are any params in the SQL string this could be anything where
    // the where clause is compared to [] or ['param']
    const matches = sqlText.match(/\[([a-zA-Z0-9_]+)\]/g);
    if (matches && params.length === 0) {
      setSnackbarMessage("Please parse the SQL first.");
      setSnackbarOpen(true);
      return;
    }

    const errors = validateParameters();

    // Check if there are any errors
    if (errors.some((error) => Object.keys(error).length > 0)) {
      setParameterErrors(errors);
      return;
    } else {
      setParameterErrors([]);
    }

    // remove redundant param data and set the params.label to be the params.name for any that are missing a label
    params.forEach(param => {
      if(!param.label) {
        param.label = param.name;
      }
      if(param.source === 'static') {
        delete param.apiEndpoint;
      }
      if (param.source === 'api') {
        delete param.options;
      }
    });

    const data = {
      name,
      description,
      sql: sqlText,
      params: JSON.stringify(params),
    };

    try {
      const id = templateId ? templateId : currentTemplateId;

      if (!isNewTemplate) {
        // If currentTemplateId exists, it means we're updating an existing template
        await axiosInstance.put(`/queries/update/${id}`, data);

        setInitialSql(sqlText);
        setInitialParameters(params);
        setInitialDescription(description);
        setInitialName(name);

        setSnackbarMessage("Updated successfully!");
        setSnackbarOpen(true);
      } else {
        // If currentTemplateId doesn't exist, it means we're saving a new template
        const response = await axiosInstance.post("/queries/save", data);
        setCurrentTemplateId(response.data.id);
        setIsNewTemplate(false);
        setSnackbarMessage("Saved successfully!");
        setSnackbarOpen(true);
      }
    } catch (error) {
      setSnackbarMessage("Error saving data. " + error.response.data.message);
      setSnackbarOpen(true);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return loading ? (
    <div>Loading...</div>
  ) : error ? (
    <div>{error}</div>
  ) : (
    <Container maxWidth="lg">
      <Box mt={4} mb={2} display="flex" justifyContent="space-between">
        <Typography variant="h5">Create SQL Template</Typography>
        <Button variant="outlined" onClick={() => navigate("/query-builder")}>
          Back
        </Button>
      </Box>

      <Paper elevation={3} style={{ padding: "20px" }}>
        <Box mb={3}>
          <TextField
            label="Query Name"
            variant="outlined"
            fullWidth
            value={name}
            onChange={(e) => setQueryName(e.target.value)}
            error={!!formErrors.name}
            helperText={formErrors.name}
          />
        </Box>
        <Box mb={3}>
          <TextField
            label="Query Description"
            variant="outlined"
            fullWidth
            multiline
            rows={3}
            value={description}
            onChange={(e) => setQueryDescription(e.target.value)}
            error={!!formErrors.description}
            helperText={formErrors.description}
          />
        </Box>

        <Box mb={3}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6" gutterBottom>
              SQL Query
            </Typography>
            <IconButton onClick={() => setIsSqlExpanded(!isSqlExpanded)}>
              {isSqlExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </div>
          <CodeMirror
            value={sqlText}
            onChange={(value) => setSqlText(value)}
            height={isSqlExpanded ? "auto" : "200px"}
            
            extensions={[langs.sql()]}
          />
          {/* <TextField
            label="Insert SQL Query here..."
            multiline
            rows={isSqlExpanded ? expandedRows : "5"}
            variant="outlined"
            fullWidth
            value={sqlText}
            onChange={(e) => setSqlText(e.target.value)}
            InputProps={{ style: { overflowY: "auto" } }}
          /> */}
          <Box mt={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleParse}
              disabled={!hasSqlChanged()}
            >
              Parse
            </Button>
          </Box>
        </Box>

        {showParameters && (
          <div style={{ marginTop: "20px" }}>
            <Divider style={{ marginBottom: "20px" }} />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="h6" gutterBottom>
                Parameters
              </Typography>
            </div>
            <Paper>
              <ParametersTable
                params={params}
                parameterErrors={parameterErrors}
                handleInputChange={handleInputChange}
                handleTypeChange={handleTypeChange}
                handleOperationChange={handleOperationChange}
              />
            </Paper>
          </div>
        )}

        <Box mt={3}>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<AddIcon />}
            onClick={handleSave}
            disabled={
              !hasSqlChanged() &&
              !haveNameOrDescriptionChanged() &&
              !haveParametersChanged()
            }
          >
            {isNewTemplate ? "Save" : "Update"}
          </Button>
        </Box>
      </Paper>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbarMessage}
      />
    </Container>
  );
};

export default QueryBuilderTool;
